use super::HistoryIndexStatus;
use crate::services::VaultService;
use jj_vault::search::{NativeHistory, indexed};
use std::{
    sync::{Arc, Mutex, Weak, mpsc},
    time::{Duration, Instant},
};

pub(super) fn run(
    vault: Weak<VaultService>,
    source: NativeHistory,
    mut backup: tokio::sync::watch::Receiver<jj_vault::Status>,
    stop: mpsc::Receiver<()>,
    progress: Arc<Mutex<HistoryIndexStatus>>,
) {
    let mut due = Instant::now();
    loop {
        match stop.try_recv() {
            Ok(()) | Err(mpsc::TryRecvError::Disconnected) => return,
            Err(mpsc::TryRecvError::Empty) => {}
        }
        if backup.has_changed().unwrap_or(false) {
            backup.borrow_and_update();
            due = Instant::now();
        }
        if Instant::now() >= due {
            let result = step(&vault, &source);
            let Ok(mut state) = progress.lock() else {
                return;
            };
            state.passes = state.passes.saturating_add(1);
            match result {
                Ok(status) => {
                    state.source = Some(status);
                    state.error = None;
                }
                Err(error) => state.error = Some(error),
            }
            let delay = if state.error.is_some() {
                Duration::from_secs(5)
            } else if state.source.as_ref().is_some_and(|status| status.complete) {
                Duration::from_secs(60)
            } else {
                Duration::from_millis(30)
            };
            due = Instant::now() + delay;
        }
        // Bounded polling observes backup publication without an executor,
        // second worker, writer lease or dependence on renderer receivers.
        let delay = due
            .saturating_duration_since(Instant::now())
            .min(Duration::from_millis(250));
        match stop.recv_timeout(delay) {
            Ok(()) | Err(mpsc::RecvTimeoutError::Disconnected) => return,
            Err(mpsc::RecvTimeoutError::Timeout) => {}
        }
    }
}
fn step(vault: &Weak<VaultService>, source: &NativeHistory) -> Result<indexed::Status, String> {
    let vault = vault.upgrade().ok_or("Vault service is closed")?;
    let _work = vault.begin_work().map_err(|error| error.to_string())?;
    {
        let state = vault.lock().map_err(|error| error.to_string())?;
        state
            .root
            .verify_physical_root()
            .map_err(|error| error.to_string())?;
        vault
            .backup_storage
            .as_ref()
            .ok_or("History storage is not selected")?
            .validate_vault(&state.root)
            .map_err(|error| error.to_string())?;
    }
    // The immutable engine takes only its disposable-index lock. In
    // particular, never retain the vault/file/backup mutation gate here.
    let status = source.index_step()?;
    let state = vault.lock().map_err(|error| error.to_string())?;
    state
        .root
        .verify_physical_root()
        .map_err(|error| error.to_string())?;
    Ok(status)
}
