use crate::AppState;
use gotcha::tracing::{debug, warn};
use gotcha::{Json, Responder, State};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct DeleteData {
    table: String,
    pk: Value,
}

pub async fn delete_data(data: State<AppState>, payload: Json<DeleteData>) -> impl Responder {
    let table_name = &payload.table;
    let primary_key = &payload.pk;

    // Find the table in the app state
    let table = match data.tables.iter().find(|t| t.name == *table_name) {
        Some(t) => t,
        None => {
            return Json(serde_json::json!({
                "error": format!("Table '{}' not found", table_name)
            }))
            .into_response()
        }
    };
    // Find the primary key column from the table configuration
    let primary_key = match table.columns.iter().find(|col| col.primary_key == true) {
        Some(col) => &col.name,
        None => {
            return Json(serde_json::json!({
                "error": format!("No primary key found for table '{}'", table_name)
            }))
            .into_response();
        }
    };

    let query = format!("DELETE FROM {} WHERE {} = $1 RETURNING *", table_name, primary_key);

    debug!("Query: {}", query);
    match data.client.query(&query, &[&primary_key]).await {
        Ok(rows) => {
            if rows.is_empty() {
                Json(serde_json::json!({
                    "message": format!("No row found with id {} in table {}", primary_key, table_name)
                }))
                .into_response()
            } else {
                Json(serde_json::json!({
                    "message": format!("Successfully deleted row with id {} from table {}", primary_key, table_name)
                }))
                .into_response()
            }
        }
        Err(e) => Json(serde_json::json!({
            "error": format!("Failed to execute delete query: {}", e)
        }))
        .into_response(),
    }
}
