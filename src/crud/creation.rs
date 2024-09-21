use crate::crud::JsonResponse;
use crate::error::NattoError;
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
pub async fn create_data(data: State<AppState>, payload: Json<CreateData>) -> Result<JsonResponse<bool>, NattoError> {
    let table_name = &payload.table;
    let values = &payload.values;

    // Find the table in the app state
    let Some(table) = data.tables.iter().find(|t| t.name == *table_name) else {
        return Err(NattoError::TableNotFound(table_name.to_string()));
    };


    let column_names = table
        .columns
        .iter()
        .enumerate()
        .filter_map(|(i, column)| {
            if let Some(value) = values.get(&column.name).cloned() {
                trace!("column name constructer column: {:?} value: {:?}", &column.name, &value);
                Some(column.name.clone())
            } else {
                None
            }
        })
        .collect_vec();

    let param_placeholders = column_names.iter()
        .enumerate()
        .map(|(i, column)| {
            format!("${}", i + 1)
        })
        .collect_vec();
    
    if column_names.is_empty() {
        return Err(NattoError::NoValidColumnsProvidedForInsertion);
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
    let rows = ret.await?;
    trace!("creation return rows: {:?}", &rows);
    Ok(JsonResponse::new(true))
    
}
