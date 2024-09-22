use crate::error::NattoError;
use crate::state::ColumnType;
use crate::AppState;
use gotcha::tracing::{debug, warn};
use gotcha::{Json, Responder, State};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use tokio_postgres::Column;

use super::JsonResponse;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct RetrieveData {
    table: String,
    filter: Option<String>,
    limit: Option<i32>,
    offset: Option<i32>,
}

// #[debug_handler]
pub async fn retrieve_data(
    data: State<AppState>,
    payload: Json<RetrieveData>,
) -> Result<JsonResponse<Vec<serde_json::Value>>, NattoError> {
    let table_name = &payload.table;
    let limit = payload.limit.unwrap_or(10);
    let offset = payload.offset.unwrap_or(0);

    // Find the table in the app state
    let table = data.tables.iter().find(|t| t.name == *table_name);

    let Some(table) = table else {
        return Err(NattoError::TableNotFound(table_name.to_string()));
    };
    // Construct the column names for the SELECT statement
    let columns = table
        .columns
        .iter()
        .map(|col| col.name.as_str())
        .collect::<Vec<&str>>()
        .join(", ");

    // Construct the base SQL query
    let mut query = format!("SELECT {} FROM {}", columns, table_name);

    // Add WHERE clause if filter is provided
    if let Some(filter_keyword) = &payload.filter {
        let filter_conditions: Vec<String> = table
            .columns
            .iter()
            .filter_map(|col| {
                match col.ttype {
                    ColumnType::String => {
                        Some(format!("{} ILIKE '%{}%'", col.name, filter_keyword))
                    }
                    ColumnType::Integer => filter_keyword
                        .parse::<i32>()
                        .ok()
                        .map(|parsed_int| format!("{} = {}", col.name, parsed_int)),
                    ColumnType::Float => filter_keyword
                        .parse::<f64>()
                        .ok()
                        .map(|parsed_float| format!("{} = {}", col.name, parsed_float)),
                    _ => {
                        warn!("Unsupported column type for filtering: {:?}", col.ttype);
                        None // Skip unsupported types
                    }
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
    let rows = data.client.query(&query, &[]).await?;
    // Convert rows to a Vec of JSON objects
    
    let mut result: Vec<Value> = Vec::new();
    for row in rows.iter() {
        let mut obj = Map::new();
        for (i, column) in table.columns.iter().enumerate() {
            let value = column.ttype.convert_to_json_value(row, i)?;
            obj.insert(column.name.clone(), value);
        }
        result.push(Value::Object(obj));
    }

    Ok(JsonResponse::new(result))
}
