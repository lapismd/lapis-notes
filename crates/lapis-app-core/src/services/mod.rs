//! One vault owns IO and admitted work; clients only hold scoped attachments.
mod backup;
mod byte_writes;
mod client;
mod database;
mod editors;
mod error;
mod files;
mod guards;
mod operations;
mod plugins;
mod protocol;
mod runtime;
mod state;
mod streams;
mod turns;
mod work;

pub use backup::BackupStorage;
pub use client::Client;
pub use database::DatabaseStorage;
pub use error::{Error, Result};
pub use runtime::Runtime;
pub use state::VaultService;
pub use streams::FileSnapshot;
pub use turns::{AgentPolicy, TurnStorage};
pub use work::Work;
