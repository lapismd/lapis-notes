mod docs;
mod manifest;
mod occurrences;
mod owner;
mod properties;
mod reconcile;
mod records;
mod search;
mod tasks;

use super::{Error, Result, VaultService};
use lapis_app_protocol::ErrorCode;
pub(super) use owner::Owner;
pub use search::SearchIndexingConfiguration;
use std::sync::Arc;

#[derive(Clone, Debug, Default)]
pub struct IndexingStatus {
    pub passes: u64,
    pub indexed: usize,
    pub deleted: usize,
    pub pending: usize,
    pub error: Option<String>,
}
impl VaultService {
    pub async fn start_markdown_indexing(self: &Arc<Self>) -> Result<()> {
        self.start_indexing(false, false, owner::Clock::default())
            .await
    }
    /// Hosts select this only after admitting the Tasks plugin capability.
    pub async fn set_task_occurrence_indexing(self: &Arc<Self>, enabled: bool) -> Result<()> {
        if enabled {
            return self
                .start_indexing(true, false, owner::Clock::default())
                .await;
        }
        let _work = self.begin_work()?;
        if let Some(owner) = self.indexing.lock().map_err(|_| unavailable())?.as_ref() {
            owner.select(Some(false), None);
        }
        Ok(())
    }
    async fn start_indexing(
        self: &Arc<Self>,
        occurrences: bool,
        documents: bool,
        clock: owner::Clock,
    ) -> Result<()> {
        let database = self.database().await?;
        // Never retain work across this gate: close drains accepted work while
        // holding it, and a concurrent start must observe the retired phase.
        let _close = self.close_gate.try_lock().map_err(|error| match error {
            std::sync::TryLockError::WouldBlock => Error::busy(),
            std::sync::TryLockError::Poisoned(_) => unavailable(),
        })?;
        let work = self.begin_work()?;
        let mut slot = self.indexing.lock().map_err(|_| unavailable())?;
        let root = {
            let state = self.lock()?;
            state.require_open()?;
            state.root.try_clone()?
        };
        if slot.is_none() {
            *slot = Some(Owner::start(
                Arc::downgrade(self),
                database,
                root,
                occurrences,
                documents,
                clock,
            )?);
        } else if (occurrences || documents)
            && let Some(owner) = slot.as_ref()
        {
            owner.select(occurrences.then_some(true), documents.then_some(true));
        }
        drop(work);
        Ok(())
    }
    pub fn indexing_status(&self) -> Result<IndexingStatus> {
        let slot = self.indexing.lock().map_err(|_| unavailable())?;
        let owner = slot.as_ref().ok_or_else(|| {
            Error::new(
                ErrorCode::Unsupported,
                "Native Markdown indexing is not selected",
            )
        })?;
        owner
            .status
            .lock()
            .map(|status| status.clone())
            .map_err(|_| unavailable())
    }
    pub(super) fn finish_indexing(&self) -> Result<()> {
        let mut slot = self.indexing.lock().map_err(|_| unavailable())?;
        if let Some(owner) = slot.take() {
            owner.finish()?;
        }
        Ok(())
    }
}
fn unavailable() -> Error {
    Error::new(ErrorCode::Io, "Native metadata index owner is unavailable")
}
