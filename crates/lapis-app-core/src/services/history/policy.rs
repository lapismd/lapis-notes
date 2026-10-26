use super::source::Source;
use crate::services::{VaultService, Work};
use jj_history_service::{Admission, Context, Error, Result, local};
use jj_store_model::RepositoryId;
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    path::Path,
    sync::{Arc, Mutex, Weak},
};
use uuid::Uuid;

pub(super) const ORIGIN: &str = "lapis-core://repository";
#[derive(Clone)]
pub(super) struct Policy {
    vault: Weak<VaultService>,
    grants: Arc<Mutex<HashMap<Uuid, Source>>>,
}
impl Policy {
    pub fn new(vault: Weak<VaultService>) -> Self {
        Self {
            vault,
            grants: Arc::default(),
        }
    }
    pub fn vault(&self, client: Uuid, requested: &str) -> Result<Arc<VaultService>> {
        let vault = self.vault.upgrade().ok_or(Error::Denied)?;
        if requested != vault.id.to_string() {
            return Err(Error::Denied);
        }
        vault
            .lock()
            .map_err(|_| Error::Unavailable)?
            .require_client(client)
            .map_err(|_| Error::Denied)?;
        Ok(vault)
    }
    pub fn source(vault: &VaultService) -> Result<Option<Source>> {
        let native = vault
            .backup_storage
            .as_ref()
            .ok_or(Error::Denied)?
            .history_source(vault)
            .map_err(|_| Error::Denied)?;
        let physical = vault
            .lock()
            .map_err(|_| Error::Unavailable)?
            .root
            .physical_identity()
            .map_err(|_| Error::Denied)?;
        Source::existing(&native.binding, physical).map_err(|_| Error::Denied)
    }
    pub fn identity(vault: &VaultService) -> (RepositoryId, u64) {
        let mut hash = Sha256::new_with_prefix(b"lapis-managed-repository-v1\0");
        hash.update(vault.id.as_bytes());
        let digest: [u8; 32] = hash.finalize().into();
        (
            RepositoryId::new(digest[..16].try_into().unwrap()),
            u64::from_be_bytes(vault.generation.as_bytes()[..8].try_into().unwrap()).max(1),
        )
    }
    pub fn revoke(&self, client: Uuid) -> Result<()> {
        self.grants
            .lock()
            .map_err(|_| Error::Unavailable)?
            .remove(&client);
        Ok(())
    }
}
struct Access {
    policy: Policy,
    client: Uuid,
    vault: String,
    source: Source,
    identity: (RepositoryId, u64),
    _work: Work,
}
#[async_trait::async_trait]
impl Admission for Policy {
    async fn admit(&self, caller: &Context, requested: &str) -> Result<Arc<dyn local::Access>> {
        if caller.url != ORIGIN {
            return Err(Error::Denied);
        }
        let client = Uuid::parse_str(&caller.window).map_err(|_| Error::Denied)?;
        let policy = self.clone();
        let requested = requested.to_string();
        tokio::task::spawn_blocking(move || {
            let vault = policy.vault(client, &requested)?;
            let work = vault.begin_work().map_err(|_| Error::Denied)?;
            let source = Self::source(&vault)?.ok_or(Error::Unavailable)?;
            {
                let mut grants = policy.grants.lock().map_err(|_| Error::Unavailable)?;
                if let Some(previous) = grants.get(&client) {
                    if previous != &source {
                        return Err(Error::EpochChanged);
                    }
                } else {
                    if grants.len() >= 16 {
                        return Err(Error::Busy);
                    }
                    grants.insert(client, source.clone());
                }
            }
            Ok(Arc::new(Access {
                identity: Self::identity(&vault),
                policy,
                client,
                vault: requested,
                source,
                _work: work,
            }) as Arc<dyn local::Access>)
        })
        .await
        .map_err(|_| Error::Unavailable)?
    }
}
#[async_trait::async_trait]
impl local::Access for Access {
    fn repository(&self) -> RepositoryId {
        self.identity.0
    }
    fn generation(&self) -> u64 {
        self.identity.1
    }
    fn metadata_path(&self) -> &Path {
        &self.source.metadata
    }
    async fn authorize(&self) -> Result<()> {
        let policy = self.policy.clone();
        let client = self.client;
        let requested = self.vault.clone();
        let expected = self.source.clone();
        tokio::task::spawn_blocking(move || {
            let vault = policy.vault(client, &requested)?;
            expected.verify().map_err(|_| Error::EpochChanged)?;
            if Policy::source(&vault)?.as_ref() != Some(&expected) {
                return Err(Error::EpochChanged);
            }
            policy.vault(client, &requested)?;
            Ok(())
        })
        .await
        .map_err(|_| Error::Unavailable)?
    }
}
