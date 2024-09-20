use crate::state::ColumnType;
use crate::AppState;
use gotcha::tracing::{debug, warn};
use gotcha::{debug_handler, Json, Responder, State};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use itertools::Itertools;
use tokio_postgres::types::ToSql;
use tracing::trace;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct CreateData {
    table: String,
    values: Value,
}
#[debug_handler]
pub async fn create_data(data: State<AppState>, payload: Json<CreateData>) -> impl Responder {
    let table_name = &payload.table;
    let values = &payload.values;

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

    let column_names = table
        .columns
        .iter()
        .enumerate()
        .filter_map(|(i, column)| {
            if let Some(value) = values.get(&column.name).cloned() {
                Some(column.name.clone())
            } else {
                None
            }
        })
        .collect_vec();

    let param_placeholders = table
        .columns
        .iter()
        .enumerate()
        .filter_map(|(i, column)| {
            if let Some(value) = values.get(&column.name).cloned() {
                Some(format!("${}", i + 1))
            } else {
                None
            }
        })
        .collect_vec();
    if column_names.is_empty() {
        return Json(serde_json::json!({
            "error": "No valid columns provided for insertion"
        }))
        .into_response();
    }

    // Construct the SQL query
    let query = format!(
        "INSERT INTO {} ({}) VALUES ({}) RETURNING *",
        table_name,
        column_names.iter().join(", "),
        param_placeholders.iter().join(", ")
    );
    let params: Vec<Box<dyn tokio_postgres::types::ToSql + Send + Sync>> = table
        .columns
        .iter()
        .enumerate()
        .filter_map(|(i, column)| {
            trace!("Column: {:?} {:?}", &column.name, &column.ttype);
            if let Some(value) = values.get(&column.name).cloned() {
                trace!("value: {:?}", &value);
                match column.ttype {
                    ColumnType::Integer => {
                        if let Some(v) = value.as_i64() {
                            let int_value = v as i32;
                            Some(Box::new(int_value)
                                as Box<dyn tokio_postgres::types::ToSql + Send + Sync>)
                        } else {
                            None
                        }
                    }
                    ColumnType::String => {
                        if let Some(v) = value.as_str() {
                            Some(Box::new(v.to_string())
                                as Box<dyn tokio_postgres::types::ToSql + Send + Sync>)
                        } else {
                            None
                        }
                    },
                    ColumnType::Float => {
                        if let Some(v) = value.as_f64() {
                            Some(Box::new(v as f32)
                                as Box<dyn tokio_postgres::types::ToSql + Send + Sync>)
                        } else {
                            None
                        }
                    }
                    ColumnType::Boolean => {
                        if let Some(v) = value.as_bool() {
                            Some(Box::new(v)
                                as Box<dyn tokio_postgres::types::ToSql + Send + Sync>)
                        } else {
                            None
                        }
                    }
                    // Add more type conversions as needed
                    _ => {
                        warn!("Unsupported column type on create: {:?}", column.ttype);
                        None
                    }
                }
            } else {
                None
            }
        })
        .collect_vec();


    debug!("Query: {}", query);
    debug!("Params: {:?}", &params);
    let param_refs: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = params
        .iter()
        .map(|x| x.as_ref() as &(dyn ToSql + Sync))
        .collect();

    let ret = data.client.query(&query, &param_refs[..]);
    match ret.await {
        Ok(rows) => {
            // if let Some(row) = rows.get(0) {
            //     let result: serde_json::Value = table
            //         .columns
            //         .iter()
            //         .enumerate()
            //         .map(|(i, column)| {
            //             let value = match column.ttype.as_str() {
            //                 "integer" => serde_json::Value::Number(row.get::<_, i32>(i).into()),
            //                 "text" | "character varying" => {
            //                     serde_json::Value::String(row.get::<_, String>(i))
            //                 }
            //                 // Add more type conversions as needed
            //                 _ => {
            //                     warn!("Unsupported column type: {}", column.ttype);
            //                     serde_json::Value::Null
            //                 }
            //             };
            //             (column.name.clone(), value)
            //         })
            //         .collect();

            //     Json(serde_json::json!({
            //         "message": "Data inserted successfully",
            //         "data": result
            //     }))
            //     .into_response()
            // } else {
            //     Json(serde_json::json!({
            //         "error": "No data returned after insertion"
            //     }))
            //     .into_response()
            // }

            Json(serde_json::json!({
                "ok": true
            }))
            .into_response()
        }
        Err(e) => Json(serde_json::json!({
            "error": format!("Failed to execute query: {}", e)
        }))
        .into_response(),
    }
}
