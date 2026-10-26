//! Source-qualified daily policy; persistence stays with the admitted vault writer.
mod error;
mod format;
mod macros;
mod policy;
mod registry;
mod tokens;

pub use error::DailyDocumentError;
pub use format::{DailyFormatContext, format_daily_document_filename};
pub use policy::{
    DailyDocumentCandidate, DailyDocumentPlan, DailyDocumentSettings, plan_daily_document,
};
pub use registry::{
    DailyDocumentProviderInfo, DailyDocumentProviderRegistry, DailyDocumentRegistration,
    DailyProviderChange,
};
