//! The backup owner retains derived work; clients retain no scheduler lease.
#[cfg(test)]
mod tests;
mod worker;

use crate::services::{Error, Result, VaultService};
use jj_vault::search::{NativeHistory, indexed};
use lapis_app_protocol::ErrorCode;
use std::{
    sync::{Arc, Mutex, Weak, mpsc},
    thread,
};

#[derive(Clone, Debug, Default)]
pub struct HistoryIndexStatus {
    pub passes: u64,
    pub source: Option<indexed::Status>,
    pub error: Option<String>,
}
pub(super) struct Owner {
    pub status: Arc<Mutex<HistoryIndexStatus>>,
    stop: mpsc::SyncSender<()>,
    thread: Mutex<Option<thread::JoinHandle<()>>>,
}
impl Owner {
    pub fn start(
        vault: Weak<VaultService>,
        source: NativeHistory,
        backup: tokio::sync::watch::Receiver<jj_vault::Status>,
    ) -> Result<Self> {
        let (stop, receiver) = mpsc::sync_channel(1);
        let status = Arc::new(Mutex::new(HistoryIndexStatus::default()));
        let progress = status.clone();
        let thread = thread::Builder::new()
            .name("lapis-history-index".into())
            .spawn(move || worker::run(vault, source, backup, receiver, progress))
            .map_err(|_| unavailable())?;
        Ok(Self {
            status,
            stop,
            thread: Mutex::new(Some(thread)),
        })
    }
    pub fn finish(&self) -> Result<()> {
        let _ = self.stop.try_send(());
        let mut slot = self.thread.lock().map_err(|_| unavailable())?;
        if let Some(worker) = slot.take() {
            // Releasing the last upgraded vault Arc can drop this owner on
            // its own worker. Stop is signalled; the current batch will return.
            if worker.thread().id() == thread::current().id() {
                return Ok(());
            }
            if worker.join().is_err() {
                self.status.lock().map_err(|_| unavailable())?.error =
                    Some("Native History index worker stopped".into());
                return Err(unavailable());
            }
        }
        Ok(())
    }
    #[cfg(test)]
    pub(super) fn is_finished(&self) -> bool {
        self.thread.lock().unwrap().is_none()
    }
}
impl VaultService {
    /// Read cached progress only; this never admits capture or index work.
    pub fn history_indexing_status(&self) -> Result<HistoryIndexStatus> {
        let state = self.lock()?;
        state.require_open()?;
        state.root.verify_physical_root()?;
        self.backup_storage
            .as_ref()
            .ok_or_else(not_selected)?
            .validate_vault(&state.root)?;
        drop(state);
        let slot = self.backup.lock().map_err(|_| unavailable())?;
        let owner = slot.as_ref().ok_or_else(not_selected)?;
        let index = owner.history.as_ref().ok_or_else(not_selected)?;
        index
            .status
            .lock()
            .map(|status| status.clone())
            .map_err(|_| unavailable())
    }
}
fn not_selected() -> Error {
    Error::new(
        ErrorCode::Unsupported,
        "Native History indexing is not selected",
    )
}
impl Drop for Owner {
    fn drop(&mut self) {
        let _ = self.finish();
    }
}
fn unavailable() -> Error {
    Error::new(ErrorCode::Io, "Native History index owner is unavailable")
}
