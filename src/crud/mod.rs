use axum::Json;
use gotcha::Responder;
use serde::Serialize;

pub(crate) mod creation;
pub(crate) mod deletion;
pub(crate) mod retrieval;
mod update;

pub(crate)  mod table_list;


#[derive(Debug, Serialize)]
pub(crate) struct JsonResponse<T: Serialize> {
    pub(crate) data: T,
}

impl<T: Serialize>  JsonResponse<T> {
    fn new  (data: T) -> Self {
        JsonResponse { data }
    }
}


impl<T: Serialize> Responder for JsonResponse<T> {
    fn into_response(self) -> axum::response::Response {
        Json(self).into_response()
    }
}

