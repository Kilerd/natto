use std::sync::Arc;

use axum::http::HeaderValue;
use gotcha::{axum::{http::Method, routing::MethodFilter, }, GotchaApp, };
use state::{Column, ColumnType, Table};
use tokio_postgres::{Client, NoTls};
use tracing::{info, debug};
use tracing_subscriber;
use tower_http::cors::CorsLayer;

mod crud;

pub(crate)  mod state;


#[derive(Clone)]
pub(crate)  struct AppState {
    client: Arc<Client>,
    tables: Arc<Vec<Table>>
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {

    tracing_subscriber::fmt::init();

    let (client, connection) = tokio_postgres::connect("postgresql://postgres:password@192.168.100.129/natto?connect_timeout=10", NoTls).await?;


    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    info!("Connected to database");
    
    // Query to retrieve all tables and their schemas in the public schema
    let query = "
        SELECT 
            distinct table_name
        FROM 
            information_schema.columns
        WHERE 
            table_schema = 'public'
        GROUP BY 
            table_name
        ORDER BY 
            table_name;
    ";

    info!("retrieving table names");
    // Execute the query
    let rows = client.query(query, &[]).await.expect("cannot run query");

    // Collect all tables into a vector
    let tables: Vec<String> = rows.iter().map(|row| row.get(0)).collect();

    // Print the results
    for table_name in &tables {
        debug!("table found in public schema: {}", table_name);
    }




    let mut tables_info: Vec<Table> = Vec::new();

    for table_name in &tables {
        let column_query = "
            SELECT 
                column_name, 
                data_type,
                is_nullable,
                column_default,
                ordinal_position,
                (SELECT EXISTS (
                    SELECT 1 FROM information_schema.key_column_usage 
                    WHERE table_name = c.table_name AND column_name = c.column_name AND constraint_name LIKE '%pkey'
                )) as is_primary_key,
                (SELECT EXISTS (
                    SELECT 1 FROM information_schema.key_column_usage 
                    WHERE table_name = c.table_name AND column_name = c.column_name AND constraint_name LIKE '%fkey'
                )) as is_foreign_key
            FROM 
                information_schema.columns c
            WHERE 
                table_schema = 'public' AND table_name = $1
            ORDER BY 
                ordinal_position;
        ";

        let column_rows = client.query(column_query, &[table_name]).await.expect("Failed to fetch column information");

        let columns: Vec<Column> = column_rows.iter().map(|row| Column {
            name: row.get("column_name"),
            ttype: ColumnType::from_str(row.get("data_type")),
            nullable: row.get::<_, String>("is_nullable") == "YES",
            default: row.get("column_default"),
            primary_key: row.get("is_primary_key"),
            foreign_key: row.get("is_foreign_key"),
            index: row.get("ordinal_position"),
        }).collect();

        tables_info.push(Table {
            name: table_name.clone(),
            columns,
        });
    }
    info!("Tables info: {:?}", &tables_info);

    let app_state = AppState {
        client: Arc::new(client),
        tables: Arc::new(tables_info)
    };


    info!("start web server on http://127.0.0.1:8000");
    GotchaApp::new()
    .get("/tables", crud::table_list::get_all_tables)
        .post("/retrieve", crud::retrieval::retrieve_data)
        .post("/create", crud::creation::create_data)
        .post("/delete", crud::deletion::delete_data)
        .layer(CorsLayer::permissive())
        .data(app_state)
        .done()
        .serve("127.0.0.1", 8000).await;
    Ok(())
}