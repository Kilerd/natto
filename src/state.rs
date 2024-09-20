

#[derive(Debug)]
pub struct Table {
    pub name: String,
    pub columns: Vec<Column>,
}

impl Table {
    pub fn has_pk_key(&self) -> bool {
        self.columns.iter().any(|c| c.primary_key)
    }
}   


#[derive(Debug, Clone)]
pub struct Column {
    pub name: String,
    pub ttype:String,
    pub nullable: bool,
    pub default: Option<String>,
    pub primary_key: bool,
    pub foreign_key: bool,
    pub index: i32
}
