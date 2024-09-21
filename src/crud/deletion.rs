use crate::error::NattoError;
use crate::AppState;
use gotcha::tracing::{debug, warn};
use gotcha::{Json, Responder, State};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::JsonResponse;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct DeleteData {
    table: String,
    pk: Value,
}

pub async fn delete_data(
    data: State<AppState>,
    payload: Json<DeleteData>,
) -> Result<JsonResponse<bool>, NattoError> {
    let table_name = &payload.table;
    let primary_key_value = &payload.pk;

    // Find the table in the app state
    let Some(table) = data.tables.iter().find(|t| t.name == *table_name) else {
        return Err(NattoError::TableNotFound(table_name.to_string()));
    };
    // Find the primary key column from the table configuration
    let Some(primary_key) = table.find_pk_key() else {
        return Err(NattoError::TableDoesNotHavePrimaryKey(
            table_name.to_string(),
        ));
    };

    let query = format!(
        "DELETE FROM {} WHERE {} = $1 RETURNING *",
        table_name, primary_key.name
    );

    debug!("Query: {}, primary_key: {}", query, primary_key_value);
    Ok(JsonResponse::new(true))
}
