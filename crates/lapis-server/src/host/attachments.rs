use super::{CLIENT_IDLE_TIMEOUT, Result, error};
use lapis_app_core::services::Client;
use lapis_app_protocol::ErrorCode;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex, MutexGuard},
    time::Instant,
};
use uuid::Uuid;

struct Attachment {
    client: Arc<Client>,
    last_seen: Instant,
}
#[derive(Default)]
pub(super) struct Attachments(Mutex<HashMap<Uuid, Attachment>>);

impl Attachments {
    fn lock(&self) -> Result<MutexGuard<'_, HashMap<Uuid, Attachment>>> {
        self.0
            .lock()
            .map_err(|_| error(ErrorCode::Closed, "Host is unavailable"))
    }
    pub fn insert(&self, client: Arc<Client>) -> Result<()> {
        self.lock()?.insert(
            client.descriptor().client_id,
            Attachment {
                client,
                last_seen: Instant::now(),
            },
        );
        Ok(())
    }
    pub fn get(&self, id: Uuid) -> Result<Arc<Client>> {
        let now = Instant::now();
        self.expire(now)?;
        let mut clients = self.lock()?;
        let entry = clients.get_mut(&id).ok_or_else(denied)?;
        entry.last_seen = entry.last_seen.max(now);
        Ok(entry.client.clone())
    }
    pub fn remove(&self, id: Uuid) -> Result<()> {
        // Release native clients outside the registry lock: their Drop marks
        // dirty claims detached under the shared vault's own lock.
        let client = { self.lock()?.remove(&id).ok_or_else(denied)? };
        drop(client);
        Ok(())
    }
    pub fn expire(&self, now: Instant) -> Result<usize> {
        let retired = {
            let mut clients = self.lock()?;
            let ids: Vec<_> = clients
                .iter()
                .filter(|(_, entry)| {
                    now.saturating_duration_since(entry.last_seen) >= CLIENT_IDLE_TIMEOUT
                })
                .map(|(id, _)| *id)
                .collect();
            ids.into_iter()
                .filter_map(|id| clients.remove(&id))
                .collect::<Vec<_>>()
        };
        let count = retired.len();
        drop(retired);
        Ok(count)
    }
    pub fn retire(&self, vault: Option<Uuid>) -> Result<()> {
        let retired = {
            let mut clients = self.lock()?;
            let ids: Vec<_> = clients
                .iter()
                .filter(|(_, entry)| {
                    vault.is_none_or(|id| entry.client.descriptor().vault_id == id)
                })
                .map(|(id, _)| *id)
                .collect();
            ids.into_iter()
                .filter_map(|id| clients.remove(&id))
                .collect::<Vec<_>>()
        };
        drop(retired);
        Ok(())
    }
}
fn denied() -> lapis_app_protocol::ServiceError {
    error(
        ErrorCode::PermissionDenied,
        "Client attachment is not valid",
    )
}
