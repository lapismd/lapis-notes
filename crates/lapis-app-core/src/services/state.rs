use super::{DatabaseStorage, Error, Result};
use crate::database::Database;
use crate::vault::VaultRoot;
use lapis_app_protocol::{ErrorCode, VaultPhase, VaultStatus};
use std::{
    collections::{HashMap, HashSet},
    sync::{Arc, Condvar, Mutex, MutexGuard},
};
use uuid::Uuid;

pub struct VaultService {
    pub(super) id: Uuid,
    pub(super) generation: Uuid,
    pub(super) state: Mutex<State>,
    pub(super) changed: Condvar,
    pub(super) storage: Option<Arc<DatabaseStorage>>,
    pub(super) database_open: tokio::sync::Mutex<()>,
    pub(super) backup_storage: Option<Arc<super::BackupStorage>>,
    pub(super) backup: Mutex<Option<Arc<super::backup::Owner>>>,
    pub(super) close_gate: Mutex<()>,
}
pub(super) struct Editor {
    pub client: Uuid,
    pub path: String,
    pub dirty: bool,
    pub revision: u32,
    pub detached: bool,
}
pub(super) struct State {
    pub root: VaultRoot,
    pub phase: VaultPhase,
    pub clients: HashSet<Uuid>,
    pub work: usize,
    pub editors: HashMap<Uuid, Editor>,
    pub database: Option<Database>,
    pub database_starting: bool,
    pub database_error: Option<lapis_app_protocol::ServiceError>,
    pub backup_pending: bool,
}
impl State {
    pub fn require_open(&self) -> Result<()> {
        if self.phase != VaultPhase::Open {
            return Err(Error::closed());
        }
        Ok(())
    }
    pub fn require_client(&self, id: Uuid) -> Result<()> {
        self.require_open()?;
        if !self.clients.contains(&id) {
            return Err(Error::denied());
        }
        Ok(())
    }
    pub fn dirty(&self, path: Option<&str>) -> bool {
        self.editors
            .values()
            .any(|e| e.dirty && path.is_none_or(|path| e.path == path))
    }
    pub fn begin_close(&mut self) {
        if let Some(database) = &self.database {
            database.fence();
        }
        self.phase = VaultPhase::Closing;
        self.advance_close();
    }
    pub fn advance_close(&mut self) {
        if self.phase == VaultPhase::Closing
            && self.work == 0
            && self.database.is_none()
            && !self.database_starting
            && !self.backup_pending
        {
            self.phase = VaultPhase::Closed;
        }
    }
}
impl VaultService {
    pub(super) fn new(id: Uuid, root: VaultRoot, storage: Option<Arc<DatabaseStorage>>) -> Self {
        Self {
            id,
            generation: Uuid::new_v4(),
            state: Mutex::new(State {
                root,
                phase: VaultPhase::Open,
                clients: HashSet::new(),
                work: 0,
                editors: HashMap::new(),
                database: None,
                database_starting: false,
                database_error: None,
                backup_pending: false,
            }),
            changed: Condvar::new(),
            storage,
            database_open: tokio::sync::Mutex::new(()),
            backup_storage: None,
            backup: Mutex::new(None),
            close_gate: Mutex::new(()),
        }
    }
    pub fn id(&self) -> Uuid {
        self.id
    }
    pub(super) fn lock(&self) -> Result<MutexGuard<'_, State>> {
        self.state
            .lock()
            .map_err(|_| Error::new(ErrorCode::Io, "Vault state is unavailable"))
    }
    pub fn status(&self) -> Result<VaultStatus> {
        let state = self.lock()?;
        Ok(VaultStatus {
            vault_id: self.id,
            generation: self.generation,
            phase: state.phase,
            clients: state.clients.len(),
            work: state.work,
            dirty_editors: state.editors.values().filter(|e| e.dirty).count(),
        })
    }
    /// Blocking drain; async hosts call this outside their worker executor.
    pub fn close(&self) -> Result<()> {
        let _close = self.close_gate.lock().map_err(|_| Error::closed())?;
        if self.backup_storage.is_some() {
            self.finish_backup()?;
        }
        let mut state = self.lock()?;
        if state.dirty(None) {
            return Err(Error::busy());
        }
        state.begin_close();
        while state.phase != VaultPhase::Closed {
            state = self
                .changed
                .wait(state)
                .map_err(|_| Error::new(ErrorCode::Io, "Vault drain is unavailable"))?;
        }
        match state.database_error.clone() {
            Some(error) => Err(Error(error)),
            None => Ok(()),
        }
    }
}
