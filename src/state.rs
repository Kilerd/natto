use serde::{Deserialize, Serialize};
use tracing::warn;



#[derive(Debug)]
pub struct Table {
    pub name: String,
    pub columns: Vec<Column>,
}

impl Table {
    pub fn has_pk_key(&self) -> bool {
        self.columns.iter().any(|c| c.primary_key)
    }

    pub fn find_pk_key(&self) -> Option<&Column> {
        self.columns.iter().find(|c| c.primary_key)
    }
}   


#[derive(Debug, Clone)]
pub struct Column {
    pub name: String,
    pub ttype:ColumnType,
    pub nullable: bool,
    pub default: Option<String>,
    pub primary_key: bool,
    pub foreign_key: bool,
    pub index: i32
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ColumnType {
    Boolean,
    String,
    Integer,
    Float,
}


impl ColumnType {
    pub fn from_str(s: &str) -> ColumnType   {
        match s {
            "boolean" => ColumnType::Boolean,
            "text" | "character varying" | "character" | "varchar" => ColumnType::String,
            "integer" => ColumnType::Integer,
            "float" | "double precision" | "real" | "double" => ColumnType::Float,
            _ => {
                warn!("unhandled column type: {}", s);
                unimplemented!()
            },
        }
    }
}
