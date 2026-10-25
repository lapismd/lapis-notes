use super::{IndexingStatus, reconcile};
use crate::{
    database::Database,
    services::{Error, Result, VaultService},
    vault::VaultRoot,
};
use lapis_app_protocol::ErrorCode;
use notify::{EventKind, RecursiveMode, Watcher};
use std::{
    sync::{
        Arc, Mutex, Weak,
        atomic::{AtomicBool, Ordering},
        mpsc,
    },
    thread,
    time::Duration,
};

pub(in crate::services) struct Owner {
    stop: Arc<AtomicBool>,
    signal: mpsc::SyncSender<()>,
    thread: Mutex<Option<thread::JoinHandle<()>>>,
    pub status: Arc<Mutex<IndexingStatus>>,
    occurrences: Arc<AtomicBool>,
}
fn failure() -> Error {
    Error::new(ErrorCode::Io, "Native metadata index owner is unavailable")
}
impl Owner {
    pub(super) fn start(
        vault: Weak<VaultService>,
        database: Database,
        root: VaultRoot,
        occurrences: bool,
    ) -> Result<Self> {
        let (signal, changes) = mpsc::sync_channel(1);
        let watched = root.path().to_owned();
        let notify = signal.clone();
        let mut watcher =
            notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
                let changed = match event {
                    Err(_) => true,
                    Ok(event) if matches!(event.kind, EventKind::Access(_)) => false,
                    Ok(event) => {
                        event.paths.is_empty()
                            || event.paths.iter().any(|path| {
                                path.strip_prefix(&watched).is_ok_and(|relative| {
                                    relative.to_str() == Some(".lapis/types.json")
                                        || !relative.components().any(|part| {
                                            part.as_os_str().to_string_lossy().starts_with('.')
                                        })
                                })
                            })
                    }
                };
                if changed {
                    let _ = notify.try_send(());
                }
            })
            .map_err(|_| failure())?;
        watcher
            .watch(root.path(), RecursiveMode::Recursive)
            .map_err(|_| failure())?;
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .map_err(|_| failure())?;
        let stop = Arc::new(AtomicBool::new(false));
        let cancelled = stop.clone();
        let status = Arc::new(Mutex::new(IndexingStatus::default()));
        let progress = status.clone();
        let retry = signal.clone();
        let occurrences = Arc::new(AtomicBool::new(occurrences));
        let selected = occurrences.clone();
        let worker = thread::Builder::new()
            .name("lapis-metadata".into())
            .spawn(move || {
                let _watcher = watcher;
                loop {
                    if cancelled.load(Ordering::Acquire) {
                        break;
                    }
                    let result = runtime.block_on(reconcile::run(
                        &vault, &database, &root, &cancelled, &selected,
                    ));
                    let mut current = progress.lock().unwrap_or_else(|error| error.into_inner());
                    current.passes = current.passes.saturating_add(1);
                    current.indexed = current.indexed.saturating_add(result.indexed);
                    current.deleted = current.deleted.saturating_add(result.deleted);
                    current.pending = result.pending;
                    current.error = result.error;
                    drop(current);
                    if result.pending > 0 {
                        let _ = retry.try_send(());
                    }
                    if cancelled.load(Ordering::Acquire)
                        || changes
                            .recv_timeout(Duration::from_secs(30))
                            .is_err_and(|error| {
                                matches!(error, mpsc::RecvTimeoutError::Disconnected)
                            })
                    {
                        break;
                    }
                    // Coalesce a burst into one full pass; watcher loss is repaired by timeout.
                    while changes.try_recv().is_ok() {}
                }
            })
            .map_err(|_| failure())?;
        Ok(Self {
            stop,
            signal,
            thread: Mutex::new(Some(worker)),
            status,
            occurrences,
        })
    }
    pub(super) fn select_occurrences(&self, enabled: bool) {
        self.occurrences.store(enabled, Ordering::Release);
        let _ = self.signal.try_send(());
    }
    pub(super) fn finish(&self) -> Result<()> {
        self.stop.store(true, Ordering::Release);
        let _ = self.signal.try_send(());
        if let Some(worker) = self.thread.lock().map_err(|_| failure())?.take()
            && worker.thread().id() != thread::current().id()
        {
            worker.join().map_err(|_| failure())?;
        }
        Ok(())
    }
}
impl Drop for Owner {
    fn drop(&mut self) {
        let _ = self.finish();
    }
}
