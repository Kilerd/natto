use crate::AppState;
use gotcha::tracing::{debug, warn};
use gotcha::{Json, Responder, State};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct RetrieveData {
    table: String,
    filter: Option<String>,
    limit: Option<i32>,
    offset: Option<i32>,
}

// #[debug_handler]
pub async fn retrieve_data(data: State<AppState>, payload: Json<RetrieveData>) -> impl Responder {
    let table_name = &payload.table;
    let limit = payload.limit.unwrap_or(10);
    let offset = payload.offset.unwrap_or(0);

    // Find the table in the app state
    let table = data.tables.iter().find(|t| t.name == *table_name);

    if let Some(table) = table {
        // Construct the column names for the SELECT statement
        let columns = table
            .columns
            .iter()
            .map(|col| col.name.as_str())
            .collect::<Vec<&str>>()
            .join(", ");

        // Construct the base SQL query
        let mut query = format!(
            "SELECT {} FROM {}",
            columns, table_name
        );

        // Add WHERE clause if filter is provided
        if let Some(filter_keyword) = &payload.filter {
            let filter_conditions: Vec<String> = table.columns
                .iter()
                .filter_map(|col| {
                    match col.ttype.as_str() {
                        "text" | "character varying" => 
                            Some(format!("{} ILIKE '%{}%'", col.name, filter_keyword)),
                        "integer" => {
                            filter_keyword.parse::<i32>().ok().map(|parsed_int| {
                                format!("{} = {}", col.name, parsed_int)
                            })
                        },
                        // Add more type-specific conditions as needed
                        _ => {
                            warn!("Unsupported column type for filtering: {}", col.ttype);
                            None // Skip unsupported types
                        },
                    }
                })
                .filter(|condition| !condition.is_empty())
                .collect();

            if !filter_conditions.is_empty() {
                query.push_str(" WHERE ");
                query.push_str(&filter_conditions.join(" OR "));
            }
        }

        // Add LIMIT and OFFSET
        query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

        debug!("Query: {}", query);
        match data.client.query(&query, &[]).await {
            Ok(rows) => {
                // Convert rows to a Vec of JSON objects
                let result: Vec<serde_json::Value> = rows
                    .iter()
                    .map(|row| {
                        let mut obj = serde_json::Map::new();
                        for (i, column) in table.columns.iter().enumerate() {
                            let value = match column.ttype.as_str() {
                                "integer" => serde_json::Value::Number(row.get::<_, i32>(i).into()),
                                "text" | "character varying" => {
                                    serde_json::Value::String(row.get::<_, String>(i))
                                }
                                // Add more type conversions as needed
                                _ => {
                                    warn!("Unsupported column type: {}", column.ttype);
                                    serde_json::Value::Null
                                }
                            };
                            obj.insert(column.name.clone(), value);
                        }
                        serde_json::Value::Object(obj)
                    })
                    .collect();

                Json(result).into_response()
            }
            Err(e) => Json(serde_json::json!({
                "error": format!("Failed to execute query: {}", e)
            }))
            .into_response(),
        }
    } else {
        Json(serde_json::json!({
            "error": format!("Table '{}' not found", table_name)
        }))
        .into_response()
    }

    // let query = "SELECT * FROM users";
    // let rows = client.query(query, &[]).await?;
    // for row in rows {
    // println!("User: {:?}", row);
    // }
}
