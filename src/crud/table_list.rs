use std::collections::HashMap;

use gotcha::{ Responder, State, Json};
use serde::{Deserialize, Serialize};
use crate::{error::NattoError, state::ColumnType, AppState};
use serde_json::json;

use super::{JsonResponse};

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct TableResponse {
    name: String,
    has_pk_key: bool,
    columns: Vec<ColumnResponse>    
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct ColumnResponse     {
    name: String,
    r#type: ColumnType,
    primary_key: bool,

}   

pub async fn get_all_tables(app_state: State<AppState>) -> Result<JsonResponse<HashMap<String, TableResponse>>, NattoError> {
    let tables = app_state.tables.clone();
    
    let table_info: HashMap<String, TableResponse> = tables.iter().map(|table| {
        (
            table.name.clone(),
            TableResponse {
                name: table.name.clone(),
                has_pk_key: table.has_pk_key(),
                columns: table.columns.iter().map(|column| ColumnResponse {
                    name: column.name.clone(),
                    r#type: column.ttype.clone(),
                    primary_key: column.primary_key,
                }).collect(),
            }
        )
    }).collect();
    
    
    Ok(JsonResponse::new(table_info))
}



