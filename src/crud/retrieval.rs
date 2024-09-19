use crate::AppState;
use gotcha::tracing::{debug, warn};
use gotcha::{Json, Responder, State};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct RetrieveData {
    table: String,

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

        // Construct the SQL query
        let query = format!(
            "SELECT {} FROM {} LIMIT {} OFFSET {}",
            columns, table_name, limit, offset
        );

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
