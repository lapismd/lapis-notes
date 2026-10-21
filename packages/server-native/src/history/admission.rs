use super::source::Source;
use jj_history_service::{Admission, Context, Error, Result, local};
use jj_store_model::RepositoryId;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};
use uuid::Uuid;

pub(super) const ORIGIN: &str = "lapis-server://private";
#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SourceKind {
    Original,
    Backup,
}
type Grants = HashMap<(String, String), Arc<Grant>>;
#[derive(Clone)]
pub struct Policy {
    root: PathBuf,
    grants: Arc<Mutex<Grants>>,
}
struct Grant {
    source: Source,
    boundary: PathBuf,
    generation: u64,
    repository: RepositoryId,
}
impl Policy {
    pub fn new(root: PathBuf) -> Result<Self> {
        if !root.is_absolute() || root.canonicalize().ok().as_ref() != Some(&root) {
            return Err(Error::Denied);
        }
        Ok(Self {
            root,
            grants: Arc::default(),
        })
    }
    /// Called only by the trusted private host, never from a history read frame.
    pub fn bind(&self, scope: &str, vault: &str, generation: u64, kind: SourceKind) -> Result<()> {
        if scope.is_empty()
            || scope.len() > 256
            || scope.chars().any(char::is_control)
            || generation == 0
        {
            return Err(Error::Denied);
        }
        let id = Uuid::parse_str(vault).map_err(|_| Error::Denied)?;
        if id.to_string() != vault {
            return Err(Error::Denied);
        }
        let parent = self.root.join("vaults").join(vault);
        let root = parent.join("content");
        if root.canonicalize().ok().as_ref() != Some(&root) {
            return Err(Error::Denied);
        }
        let source = match kind {
            SourceKind::Original => Source::capture(&root),
            SourceKind::Backup => Source::external(&root, &parent.join("history")),
        }
        .map_err(|_| Error::Denied)?;
        if !source.contained(&parent) {
            return Err(Error::Denied);
        }
        let mut grants = self.grants.lock().map_err(|_| Error::Unavailable)?;
        let key = (scope.into(), vault.into());
        if let Some(previous) = grants.get(&key) {
            // Rebinding cannot silently revive a replaced physical source or old handles.
            if previous.source != source || previous.generation != generation {
                return Err(Error::EpochChanged);
            }
            return Ok(());
        }
        if grants.len() >= 64 {
            return Err(Error::Busy);
        }
        let mut hash = Sha256::new_with_prefix(b"lapis-notes-hosted-history-v1\0");
        hash.update(id.as_bytes());
        hash.update(match kind {
            SourceKind::Original => b"original".as_slice(),
            SourceKind::Backup => b"backup".as_slice(),
        });
        let identity: [u8; 32] = hash.finalize().into();
        grants.insert(
            key,
            Arc::new(Grant {
                source,
                boundary: parent,
                generation,
                repository: RepositoryId::new(identity[..16].try_into().unwrap()),
            }),
        );
        Ok(())
    }
    pub fn revoke(&self, scope: &str) -> Result<()> {
        self.grants
            .lock()
            .map_err(|_| Error::Unavailable)?
            .retain(|(s, _), _| s != scope);
        Ok(())
    }
}
struct Access {
    policy: Policy,
    key: (String, String),
    grant: Arc<Grant>,
}
#[async_trait::async_trait]
impl Admission for Policy {
    async fn admit(&self, caller: &Context, vault: &str) -> Result<Arc<dyn local::Access>> {
        if caller.url != ORIGIN {
            return Err(Error::Denied);
        }
        let key = (caller.window.clone(), vault.into());
        let grant = self
            .grants
            .lock()
            .map_err(|_| Error::Unavailable)?
            .get(&key)
            .cloned()
            .ok_or(Error::Denied)?;
        Ok(Arc::new(Access {
            policy: self.clone(),
            key,
            grant,
        }))
    }
}
#[async_trait::async_trait]
impl local::Access for Access {
    fn repository(&self) -> RepositoryId {
        self.grant.repository
    }
    fn generation(&self) -> u64 {
        self.grant.generation
    }
    fn metadata_path(&self) -> &Path {
        &self.grant.source.metadata
    }
    async fn authorize(&self) -> Result<()> {
        let live = self
            .policy
            .grants
            .lock()
            .map_err(|_| Error::Unavailable)?
            .get(&self.key)
            .cloned()
            .ok_or(Error::Denied)?;
        if !Arc::ptr_eq(&live, &self.grant) {
            return Err(Error::EpochChanged);
        }
        let source = self.grant.source.clone();
        let boundary = self.grant.boundary.clone();
        tokio::task::spawn_blocking(move || {
            source.verify()?;
            if !source.contained(&boundary) {
                return Err(std::io::Error::other("Managed source escaped its boundary"));
            }
            Ok(())
        })
        .await
        .map_err(|_| Error::Unavailable)?
        .map_err(|_| Error::Denied)
    }
}
