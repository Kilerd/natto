use std::str::FromStr;

use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::{Number, Value};
use tracing::{trace, warn};

use crate::error::NattoError;



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
    Numeric,
    Float,
}


impl ColumnType {
    pub fn from_str(s: &str) -> ColumnType   {
        match s {
            "boolean" => ColumnType::Boolean,
            "text" | "character varying" | "character" | "varchar" => ColumnType::String,
            "integer" => ColumnType::Integer,
            "float" | "double precision" | "double" | "real" => ColumnType::Float,
            "numeric" | "decimal" => ColumnType::Numeric,
            _ => {
                warn!("unhandled column type: {}", s);
                unimplemented!()
            },
        }
    }


    pub fn convert_to_sql_value(&self, value: Value) -> Result<Box<dyn tokio_postgres::types::ToSql + Send + Sync>, NattoError> {
        match self {
            ColumnType::Integer => {
                let Some(v) = value.as_i64() else { 
                    return Err(NattoError::ConversionError(format!("failed to convert value to integer: {}", value)));

                };
                let int_value = v as i32;
                Ok(Box::new(int_value))
            }
            ColumnType::String => {
                let Some(v) = value.as_str() else { 
                    return Err(NattoError::ConversionError(format!("failed to convert value to string: {}", value)));
                };
                Ok(Box::new(v.to_string()))
            }
            ColumnType::Float => {
                let Some(v) = value.as_f64() else { 
                    return Err(NattoError::ConversionError(format!("failed to convert value to float: {}", value)));
                };
                Ok(Box::new(v as f32))
            }
            ColumnType::Boolean => {
                let Some(v) = value.as_bool() else { 
                    return Err(NattoError::ConversionError(format!("failed to convert value to boolean: {}", value)));
                };
                Ok(Box::new(v))
            }
            ColumnType::Numeric => {
                let v = value.as_str().and_then(|it| Decimal::from_str(it).ok());
                let Some(v) = v else {
                    return Err(NattoError::ConversionError(format!("failed to convert value to real: {}", value)));
                };
                Ok(Box::new(v))
            },
        }

    }
    pub fn convert_to_json_value(&self, row: &tokio_postgres::Row, idx: usize) -> Result<Value, NattoError> {
        match self {
            ColumnType::Boolean => {
                let value = row.try_get::<_, bool>(idx)?;
                Ok(Value::Bool(value))
            },
            ColumnType::String => {
                let value = row.try_get::<_, String>(idx)?;
                Ok(Value::String(value))
            },
            ColumnType::Integer => {
                let value = row.try_get::<_, i32>(idx)?;
                Ok(Value::Number(value.into()))
            },
            ColumnType::Float => {
                let value = row.try_get::<_, f32>(idx)?;
                Ok(Value::Number(Number::from_f64(value as f64).expect("can't convert f32 to json number")))
            },
            ColumnType::Numeric => {
                let value = row.try_get::<_, Decimal>(idx)?;
                Ok(Value::String(value.to_string()))
            },
        }
    }
}
