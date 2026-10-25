use super::{Job, Owner};
use crate::{turns::TurnRecord, vault::VaultRoot};
use lapis_ai_service::{Launch, SessionBinding, runtime::SessionProcessor};

pub(super) struct Prepared {
    pub scope: VaultRoot,
    pub launch: Launch,
    pub binding: SessionBinding,
    pub processor: Option<Box<dyn SessionProcessor>>,
}
pub(super) fn prepare(
    owner: &Owner,
    job: &Job,
    record: &TurnRecord,
) -> Result<Prepared, &'static str> {
    let scope = {
        let state = job
            .work
            .vault
            .lock()
            .map_err(|_| "native_scope_unavailable")?;
        if record.input.scope_dir.is_empty() {
            state.root.try_clone()
        } else {
            state.root.open_child(&record.input.scope_dir)
        }
    }
    .map_err(|_| "native_scope_unavailable")?;
    let launch = owner
        .storage
        .policy
        .resolve(job.work.vault.id, &scope, &record.input.target_id)
        .map_err(|e| e.0)?;
    if launch.directory != scope.path()
        || launch.prepared.directory != scope.path()
        || !launch.prepared.arguments.is_empty()
        || launch.resume.is_some()
    {
        return Err("native_launch_scope_mismatch");
    }
    scope
        .verify_physical_root()
        .map_err(|_| "native_scope_changed")?;
    let binding = SessionBinding {
        session_id: uuid::Uuid::new_v4().to_string(),
        request_id: record.input.request_id.to_string(),
        target_id: record.input.target_id.clone(),
        admission: job.work.vault.generation.to_string(),
    };
    let processor = owner
        .storage
        .policy
        .processor(job.work.vault.id, &binding)
        .map_err(|e| e.0)?;
    Ok(Prepared {
        scope,
        launch,
        binding,
        processor,
    })
}
