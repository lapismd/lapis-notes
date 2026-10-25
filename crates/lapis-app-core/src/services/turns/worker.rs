use super::{Capture, DispatchClaim, Job, Owner, Result, conversation::Conversation};
use crate::turns::TurnOutcome;
use lapis_app_protocol::VaultPhase;
use lapis_app_protocol::turns::TurnRecord;
use std::{
    sync::{Arc, TryLockError, atomic::Ordering},
    time::Duration,
};
use uuid::Uuid;

pub(super) fn spawn(
    owner: Arc<Owner>,
    job: Arc<Job>,
    record: TurnRecord,
    claim: DispatchClaim,
    selected: super::launch::Selected,
) {
    let monitor = job.clone();
    owner.storage.runtime.spawn(async move {
        while !monitor.done.load(Ordering::Acquire) {
            let closing = match monitor.work.vault.state.try_lock() {
                Ok(state) => state.phase != VaultPhase::Open,
                Err(TryLockError::WouldBlock) => false,
                Err(TryLockError::Poisoned(_)) => true,
            };
            if closing {
                monitor.cancel.send_replace(true);
                return;
            }
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    });
    let work_owner = owner.clone();
    let work_job = job.clone();
    let id = record.input.request_id;
    let task = owner
        .storage
        .runtime
        .spawn(async move { run(work_owner, work_job, record, claim, selected).await });
    let runtime = owner.storage.runtime.clone();
    runtime.spawn(async move {
        if task.await.is_err() {
            job.cancel.send_replace(true);
            let session = job.session.lock().ok().and_then(|session| session.clone());
            let clean = match session {
                Some(session) => session.close().await.is_ok(),
                None => false,
            };
            let failed_owner = owner.clone();
            let failed_job = job.clone();
            if tokio::task::spawn_blocking(move || {
                let persisted = failed_owner.data().is_ok_and(|mut data| {
                    data.journal.interrupt(id, "native_owner_failed").is_ok()
                });
                retire(&failed_owner, &failed_job, id, clean && persisted);
            })
            .await
            .is_err()
            {
                owner.fault(&job);
            }
        }
    });
}
async fn run(
    owner: Arc<Owner>,
    job: Arc<Job>,
    record: TurnRecord,
    claim: DispatchClaim,
    mut selected: super::launch::Selected,
) {
    let prepare_owner = owner.clone();
    let prepare_job = job.clone();
    let prepare_record = record.clone();
    let history = selected.history.take();
    let initialized = tokio::task::spawn_blocking(move || -> Result<bool> {
        let running = prepare_owner.data()?.journal.claim(claim)?;
        let conversation = Conversation::create(&prepare_job.work, &prepare_record, history).ok();
        let available = conversation.is_some();
        *prepare_job.capture.lock().map_err(|_| super::failure())? = Some(Capture {
            running,
            conversation,
        });
        Ok(available)
    })
    .await;
    let ready = match initialized {
        Ok(Ok(ready)) => ready,
        _ => {
            owner.fault(&job);
            return;
        }
    };
    let result = if ready {
        super::execution::execute(owner.clone(), job.clone(), record.clone(), selected).await
    } else {
        Err("conversation_preparation_failed")
    };
    let uncertain_startup = result.as_ref().err().is_some_and(|code| {
        matches!(
            *code,
            "startup_cleanup_unknown" | "cleanup_unknown" | "submission_unknown"
        )
    });
    let mut outcome = match result {
        Ok(outcome) => outcome,
        Err(code) if job.dispatched.load(Ordering::Acquire) || uncertain_startup => {
            TurnOutcome::Unknown(code.into())
        }
        Err(_) if *job.cancel.borrow() => TurnOutcome::Cancelled,
        Err(code) => TurnOutcome::Failed(code.into()),
    };
    let session = job.session.lock().ok().and_then(|session| session.clone());
    let clean = match session {
        Some(session) => session.close().await.is_ok(),
        None => !uncertain_startup,
    };
    if !clean {
        outcome = TurnOutcome::Unknown("cleanup_unknown".into());
    }
    let final_owner = owner.clone();
    let final_job = job.clone();
    if tokio::task::spawn_blocking(move || {
        finish(
            &final_owner,
            &final_job,
            record.input.request_id,
            outcome,
            clean,
        )
    })
    .await
    .is_err()
    {
        owner.fault(&job);
    }
}
fn finish(owner: &Owner, job: &Job, id: Uuid, mut outcome: TurnOutcome, clean: bool) {
    let Ok(mut capture) = job.capture.lock() else {
        owner.fault(job);
        return;
    };
    let Some(capture) = capture.as_mut() else {
        owner.fault(job);
        return;
    };
    if let Some(conversation) = &mut capture.conversation
        && conversation.finish(&job.work, &outcome).is_err()
    {
        outcome = TurnOutcome::Unknown("portable_publication_failed".into());
    }
    let confirmed = owner.data().is_ok_and(|mut data| {
        if data.journal.finish(&mut capture.running, outcome).is_err() || !clean {
            return false;
        }
        // A reader of the terminal record can immediately submit its follow-up.
        data.jobs.remove(&id);
        job.done.store(true, Ordering::Release);
        owner.changed.notify_all();
        true
    });
    if !confirmed {
        owner.fault(job);
    }
}
fn retire(owner: &Owner, job: &Job, id: Uuid, confirmed: bool) {
    if confirmed && let Ok(mut data) = owner.data() {
        data.jobs.remove(&id);
        job.done.store(true, Ordering::Release);
        owner.changed.notify_all();
        return;
    }
    owner.fault(job);
}
