//! One vault owns IO and admitted work; clients only hold scoped attachments.
mod client;
mod editors;
mod error;
mod operations;
mod protocol;
mod runtime;
mod state;
mod work;

pub use client::Client;
pub use error::{Error, Result};
pub use runtime::Runtime;
pub use state::VaultService;
pub use work::Work;
