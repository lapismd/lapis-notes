mod commands;
mod conversation;
mod execution;
mod launch;
mod storage;
mod worker;
use super::{Client, Error, Result, VaultService, Work};
use crate::turns::{Admission, DispatchClaim, RunningTurn, TurnJournal};
use lapis_ai_service::{ExecutionSession, runtime::SessionRequest};
use lapis_app_protocol::{
    ErrorCode,
    turns::{TurnInput, TurnRecord, TurnSummary},
};
use std::{
    collections::HashMap,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
};
pub use storage::{AgentPolicy, TurnStorage};
use tokio::sync::watch;
use uuid::Uuid;

pub(super) struct Owner {
    data: Mutex<Data>,
    failed: AtomicBool,
    storage: Arc<TurnStorage>,
}
struct Data {
    journal: TurnJournal,
    jobs: HashMap<Uuid, Arc<Job>>,
}
struct Job {
    work: Arc<Work>,
    cancel: watch::Sender<bool>,
    done: AtomicBool,
    dispatched: AtomicBool,
    session: Mutex<Option<Arc<dyn ExecutionSession>>>,
    capture: Mutex<Option<Capture>>,
}
struct Capture {
    running: RunningTurn,
    conversation: Option<conversation::Conversation>,
}
impl Owner {
    fn fault(&self, job: &Job) {
        self.failed.store(true, Ordering::Release);
        job.done.store(true, Ordering::Release);
        let _state = job
            .work
            .vault
            .state
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        job.work.vault.changed.notify_all();
    }
    fn data(&self) -> Result<std::sync::MutexGuard<'_, Data>> {
        self.data.lock().map_err(|_| failure())
    }
}
fn failure() -> Error {
    Error::new(ErrorCode::Io, "Native turn service is unavailable")
}
impl Client {
    fn turn_owner(&self) -> Result<(Arc<Owner>, Work)> {
        self.vault.lock()?.require_client(self.id)?;
        let work = self.vault.begin_work()?;
        let storage = self
            .vault
            .turn_storage
            .as_ref()
            .ok_or_else(|| Error::new(ErrorCode::Unsupported, "Native turns are not selected"))?
            .clone();
        let root = self.vault.lock()?.root.try_clone()?;
        storage.validate_vault(&root)?;
        let mut slot = self.vault.turns.lock().map_err(|_| failure())?;
        let owner = match slot.as_ref() {
            Some(owner) => owner.clone(),
            None => {
                let journal = TurnJournal::open(storage.root.path(), self.vault.id, &root)?;
                let owner = Arc::new(Owner {
                    data: Mutex::new(Data {
                        journal,
                        jobs: HashMap::new(),
                    }),
                    failed: AtomicBool::new(false),
                    storage,
                });
                *slot = Some(owner.clone());
                owner
            }
        };
        Ok((owner, work))
    }
    pub fn turn(&self, id: Uuid) -> Result<Option<TurnRecord>> {
        let (owner, _work) = self.turn_owner()?;
        Ok(owner.data()?.journal.read(id)?)
    }
    pub fn turns(&self) -> Result<Vec<TurnSummary>> {
        let (owner, _work) = self.turn_owner()?;
        Ok(owner.data()?.journal.list()?)
    }
    /// Durable acceptance is synchronous; the native runtime owns the task.
    pub fn submit_turn(&self, input: TurnInput) -> Result<TurnRecord> {
        let input = crate::turns::normalize(input)?;
        let (owner, work) = self.turn_owner()?;
        let mut data = owner.data()?;
        if data.journal.read(input.request_id)?.is_some() {
            return match data.journal.accept(input)? {
                Admission::Existing(record) => Ok(record),
                Admission::Fresh { .. } => Err(failure()),
            };
        }
        if owner.failed.load(Ordering::Acquire) || !data.jobs.is_empty() {
            return Err(Error::busy());
        }
        let prompt = SessionRequest::Prompt {
            text: input.prompt.clone(),
            context: input.context.clone(),
            max_duration_ms: input.options.max_duration_ms,
        };
        prompt
            .validate(&input.request_id.to_string())
            .map_err(|_| {
                Error::new(
                    ErrorCode::InvalidRequest,
                    "Native prompt exceeds runtime limits",
                )
            })?;
        let selected = launch::select(&owner, &work, &input)?;
        let Admission::Fresh { record, claim } = data.journal.accept(input)? else {
            return Err(failure());
        };
        let job = Arc::new(Job {
            work: Arc::new(work),
            cancel: watch::channel(false).0,
            done: AtomicBool::new(false),
            dispatched: AtomicBool::new(false),
            session: Mutex::new(None),
            capture: Mutex::new(None),
        });
        data.jobs.insert(record.input.request_id, job.clone());
        drop(data);
        worker::spawn(owner, job, record.clone(), claim, selected);
        Ok(record)
    }
}
impl VaultService {
    pub(in crate::services) fn retire_turns(&self) -> Result<()> {
        let mut slot = self.turns.lock().map_err(|_| failure())?;
        if let Some(owner) = slot.as_ref() {
            owner.data()?.journal.retire()?;
        }
        slot.take();
        Ok(())
    }
    pub(in crate::services) fn turns_failed(&self) -> bool {
        self.turns.lock().map_or(true, |owner| {
            owner
                .as_ref()
                .is_some_and(|owner| owner.failed.load(Ordering::Acquire))
        })
    }
}
