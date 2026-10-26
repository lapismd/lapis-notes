use serde::Serialize;
use std::fmt;

#[derive(Clone, Debug, Serialize)]
pub struct DailyDocumentError {
    name: &'static str,
    pub message: String,
}
impl DailyDocumentError {
    pub(super) fn new(message: impl Into<String>) -> Self {
        Self {
            name: "Error",
            message: message.into(),
        }
    }
}
impl fmt::Display for DailyDocumentError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.message)
    }
}
impl std::error::Error for DailyDocumentError {}
