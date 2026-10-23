use crate::config::Config;
use lapis_app_core::services::{Client, Runtime};
use lapis_app_protocol::{ClientDescriptor, ErrorCode, ManagedVault, Reply, Request, ServiceError};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};
use uuid::Uuid;

pub type Result<T> = std::result::Result<T, ServiceError>;

pub struct Host {
    runtime: Runtime,
    vaults: Vec<ManagedVault>,
    clients: Mutex<HashMap<Uuid, Arc<Client>>>,
}

pub fn error(code: ErrorCode, message: &str) -> ServiceError {
    ServiceError {
        code,
        message: message.into(),
    }
}

impl Host {
    pub fn new(config: Config) -> std::io::Result<Self> {
        config.validate()?;
        let runtime = Runtime::default();
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
            clients: Mutex::new(HashMap::new()),
        })
    }

    pub fn vaults(&self) -> &[ManagedVault] {
        &self.vaults
    }

    pub fn attach(&self, vault: Uuid) -> Result<ClientDescriptor> {
        let client = self
            .runtime
            .get(vault)
            .and_then(|owner| owner.attach())
            .map_err(|e| e.0)?;
        let descriptor = client.descriptor();
        self.clients
            .lock()
            .map_err(|_| error(ErrorCode::Closed, "Host is unavailable"))?
            .insert(descriptor.client_id, Arc::new(client));
        Ok(descriptor)
    }

    pub fn execute(&self, client: Uuid, request: Request) -> Result<Reply> {
        // Do not hold the attachment registry during file IO or service drain.
        let client = self
            .clients
            .lock()
            .map_err(|_| error(ErrorCode::Closed, "Host is unavailable"))?
            .get(&client)
            .cloned()
            .ok_or_else(|| {
                error(
                    ErrorCode::PermissionDenied,
                    "Client attachment is not valid",
                )
            })?;
        Ok(client.execute(request))
    }

    pub fn detach(&self, client: Uuid) -> Result<()> {
        self.clients
            .lock()
            .map_err(|_| error(ErrorCode::Closed, "Host is unavailable"))?
            .remove(&client)
            .ok_or_else(|| {
                error(
                    ErrorCode::PermissionDenied,
                    "Client attachment is not valid",
                )
            })?;
        Ok(())
    }

    pub fn close(&self, vault: Uuid) -> Result<()> {
        self.runtime.close_vault(vault).map_err(|e| e.0)?;
        self.clients
            .lock()
            .map_err(|_| error(ErrorCode::Closed, "Host is unavailable"))?
            .retain(|_, client| client.descriptor().vault_id != vault);
        Ok(())
    }

    pub fn shutdown(&self) -> Result<()> {
        self.runtime.shutdown().map_err(|e| e.0)?;
        self.clients
            .lock()
            .map_err(|_| error(ErrorCode::Closed, "Host is unavailable"))?
            .clear();
        Ok(())
    }
}
