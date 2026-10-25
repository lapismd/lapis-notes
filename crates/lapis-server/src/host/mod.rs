mod attachments;
mod backup;
mod database;

use crate::config::Config;
use lapis_app_core::services::{Client, Runtime};
use lapis_app_protocol::{ClientDescriptor, ErrorCode, ManagedVault, Reply, Request, ServiceError};
use std::{
    sync::Arc,
    time::{Duration, Instant},
};
use uuid::Uuid;

pub type Result<T> = std::result::Result<T, ServiceError>;
pub const CLIENT_IDLE_TIMEOUT: Duration = Duration::from_secs(5 * 60);

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Principal {
    Token,
    Session(Uuid),
}

pub struct Host {
    runtime: Runtime,
    vaults: Vec<ManagedVault>,
    clients: attachments::Attachments,
    automatic_backup: bool,
}

pub fn error(code: ErrorCode, message: &str) -> ServiceError {
    ServiceError {
        code,
        message: message.into(),
    }
}

impl Host {
    pub fn new(config: Config) -> std::io::Result<Self> {
        Self::with_runtime(config, Runtime::default())
    }
    fn with_runtime(config: Config, runtime: Runtime) -> std::io::Result<Self> {
        config.validate()?;
        let mut vaults = Vec::new();
        for vault in config.vaults {
            runtime
                .admit(vault.id, &vault.root)
                .map_err(std::io::Error::other)?;
            vaults.push(ManagedVault {
                vault_id: vault.id,
                name: vault.name,
            });
        }
        Ok(Self {
            runtime,
            vaults,
            clients: attachments::Attachments::default(),
            automatic_backup: false,
        })
    }

    pub fn vaults(&self) -> &[ManagedVault] {
        &self.vaults
    }

    pub fn attach(&self, vault: Uuid, principal: Principal) -> Result<ClientDescriptor> {
        self.expire_idle(Instant::now())?;
        let client = self
            .runtime
            .get(vault)
            .and_then(|owner| owner.attach())
            .map_err(|e| e.0)?;
        let descriptor = client.descriptor();
        self.clients.insert(Arc::new(client), principal)?;
        Ok(descriptor)
    }

    pub fn execute(&self, client: Uuid, principal: Principal, request: Request) -> Result<Reply> {
        // Do not hold the attachment registry during file IO or service drain.
        let client = self.client(client, principal)?;
        Ok(client.execute(request))
    }

    pub fn detach(&self, client: Uuid, principal: Principal) -> Result<()> {
        self.expire_idle(Instant::now())?;
        self.clients.remove(client, principal)
    }

    pub fn heartbeat(&self, client: Uuid, principal: Principal) -> Result<()> {
        self.client(client, principal)?;
        Ok(())
    }

    pub fn expire_idle(&self, now: Instant) -> Result<usize> {
        self.clients.expire(now)
    }

    pub(super) fn client(&self, id: Uuid, principal: Principal) -> Result<Arc<Client>> {
        self.clients.get(id, principal)
    }

    pub fn detach_principal(&self, principal: Principal) -> Result<()> {
        self.clients.retire_principal(principal)
    }

    pub fn close(&self, vault: Uuid) -> Result<()> {
        self.runtime.close_vault(vault).map_err(|e| e.0)?;
        self.clients.retire(Some(vault))?;
        Ok(())
    }

    pub fn shutdown(&self) -> Result<()> {
        self.runtime.shutdown().map_err(|e| e.0)?;
        self.clients.retire(None)?;
        Ok(())
    }
}
