use gotcha::{ Responder, State, Json};
use crate::AppState;
use serde_json::json;

pub async fn get_all_tables(app_state: State<AppState>) -> impl Responder {
    let tables = app_state.tables.clone();
    
    let table_names: Vec<String> = tables.iter().map(|table| table.name.clone()).collect();
    
    let response = json!({
        "data": table_names
    });
    Json(response).into_response()
}



