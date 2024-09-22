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
    let DeleteData { table, pk } = payload.0;
    let table_name = &table;

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

    let primary_key_value = primary_key.ttype.convert_to_sql_value(pk)?;
    let query = format!(
        "DELETE FROM {} WHERE {} = $1 RETURNING *",
        table_name, primary_key.name
    );

    debug!("Query: {}, primary_key: {:?}", query, primary_key_value);
    let rows = data.client.query(&query, &[&*primary_key_value]).await?;
    if rows.is_empty() {
        return Ok(JsonResponse::new(false));
    }
    Ok(JsonResponse::new(true))
}
