use axum::{http::StatusCode, Json};
use gotcha::Responder;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use tracing::warn;

#[derive(thiserror::Error, Debug)]
pub enum NattoError {
    #[error("No Valid Columns Provided For Insertion")]
    NoValidColumnsProvidedForInsertion,

    #[error("Table NotFound: {0}")]
    TableNotFound(String),

    
    #[error("Table Does Not Have PrimaryKey: {0}")]
    TableDoesNotHavePrimaryKey(String),

    #[error("Sql Execution Error: {0}")]
    SqlExecutionError(#[from] tokio_postgres::Error),

    #[error("Conversion Error: {0}")]
    ConversionError(String),
}

impl NattoError {
    fn status_code(&self) -> StatusCode {
        match self {
            NattoError::NoValidColumnsProvidedForInsertion => StatusCode::BAD_REQUEST,
            NattoError::SqlExecutionError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            NattoError::TableNotFound(_) => StatusCode::NOT_FOUND,
            NattoError::TableDoesNotHavePrimaryKey(_) => StatusCode::BAD_REQUEST,
            NattoError::ConversionError(_) => StatusCode::BAD_REQUEST,
        }
    }
    fn log(&self) {
        warn!("Natto Error: {}", self);
    }
}

#[derive(Serialize)]
struct ErrorResponse<T: Serialize> {
    error: T,
}

impl Responder for NattoError {
    fn into_response(self) -> axum::response::Response {
        self.log();
        let status_code = self.status_code();
        (
            status_code,
            Json(ErrorResponse {
                error: self.to_string(),
            }),
        )
            .into_response()
    }
}
