//! Application admission/lifetime around the existing immutable History engine.
mod frames;
mod owner;
mod policy;
mod source;
#[cfg(test)]
mod tests;
use super::{Client, VaultService};
pub use jj_history_service::Error as HistoryError;
use jj_history_service::{Error, Result, wire};
pub(in crate::services) use owner::Owner;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum HistoryMethod {
    Heads,
    Open,
    Status,
    Read,
    Blame,
    Close,
}
impl Client {
    pub async fn read_history(&self, method: HistoryMethod, frame: String) -> Result<String> {
        if frame.len() > wire::MAX_REQUEST_BYTES {
            return Err(Error::Limit);
        }
        let vault = self.vault.clone();
        let client = self.id;
        let (owner, work) = tokio::task::spawn_blocking(move || {
            vault
                .lock()
                .map_err(|_| Error::Unavailable)?
                .require_client(client)
                .map_err(|_| Error::Denied)?;
            let work = vault.begin_work().map_err(|_| Error::Denied)?;
            let mut slot = vault
                .history_reader
                .lock()
                .map_err(|_| Error::Unavailable)?;
            if slot.is_none() {
                let cache = vault
                    .backup_storage
                    .as_ref()
                    .ok_or(Error::Denied)?
                    .history_cache(&vault)
                    .map_err(|_| Error::Denied)?;
                *slot = Some(Arc::new(Owner::start(Arc::downgrade(&vault), cache)?));
            }
            Ok((slot.as_ref().unwrap().clone(), work))
        })
        .await
        .map_err(|_| Error::Unavailable)??;
        owner.call(client, method, frame, work).await
    }
}
impl VaultService {
    pub(in crate::services) fn revoke_history_reader(&self, client: Uuid) -> super::Result<()> {
        let owner = self
            .history_reader
            .lock()
            .map_err(|_| super::Error::closed())?
            .clone();
        if let Some(owner) = owner {
            owner.revoke(client).map_err(failure)?;
        }
        Ok(())
    }
    pub(in crate::services) fn finish_history_reader(&self) -> super::Result<()> {
        let mut slot = self
            .history_reader
            .lock()
            .map_err(|_| super::Error::closed())?;
        if let Some(owner) = slot.as_ref() {
            owner.finish().map_err(failure)?;
        }
        *slot = None;
        Ok(())
    }
}
fn failure(_: Error) -> super::Error {
    super::Error::new(
        lapis_app_protocol::ErrorCode::Io,
        "Native History reader did not drain",
    )
}
