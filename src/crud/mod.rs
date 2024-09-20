use serde::Serialize;

pub(crate) mod creation;
pub(crate) mod deletion;
pub(crate) mod retrieval;
mod update;

pub(crate)  mod table_list;


#[derive(Debug, Serialize)]
pub(crate) struct Response<T: Serialize> {
    pub(crate) data: T,
}

