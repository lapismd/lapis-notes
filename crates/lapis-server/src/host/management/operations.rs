use super::{Command, Entry, Management, name, storage, store};
use crate::host::{Host, Result, error};
use lapis_app_protocol::{ErrorCode, ManagedVault};
use std::sync::Arc;
use uuid::Uuid;

impl Management {
    pub(super) async fn execute(&self, host: Arc<Host>, command: Command) -> Result<ManagedVault> {
        match command {
            Command::Create(value) => self.create(host, name(value)?).await,
            Command::Rename(id, value) => {
                let mut vault = self.catalogue.get(id)?;
                vault.name = name(value)?;
                self.control.update_vault(&vault).await.map_err(store)?;
                self.catalogue.publish(vault.clone())?;
                Ok(vault)
            }
            Command::Archive(id) => self.archive(host, id).await,
            Command::Restore(id) => self.restore(host, id).await,
        }
    }
    async fn create(&self, host: Arc<Host>, name: String) -> Result<ManagedVault> {
        if self.catalogue.list()?.len() >= 20 {
            return Err(error(
                ErrorCode::Busy,
                "At most twenty vaults are supported",
            ));
        }
        let vault = ManagedVault {
            vault_id: Uuid::new_v4(),
            name,
            archived_at: None,
        };
        let parent = self.storage.try_clone().map_err(store)?;
        let id = vault.vault_id;
        let root = tokio::task::spawn_blocking(move || storage::create(&parent, id))
            .await
            .map_err(|_| error(ErrorCode::Io, "Vault storage outcome is unavailable"))?
            .map_err(store)?;
        // Keep provisional bytes after an uncertain catalogue write; never delete
        // a directory whose authoritative publication may have completed.
        self.control
            .insert_vault(&vault, true, root.physical_identity().map_err(store)?)
            .await
            .map_err(store)?;
        let admitted = root.try_clone().map_err(store)?;
        tokio::task::spawn_blocking(move || host.runtime.admit_root(id, admitted))
            .await
            .map_err(|_| error(ErrorCode::Io, "Vault admission outcome is unavailable"))?
            .map_err(|error| error.0)?;
        self.catalogue.insert(Entry {
            vault: vault.clone(),
            root,
            available: true,
        })?;
        Ok(vault)
    }
    async fn archive(&self, host: Arc<Host>, id: Uuid) -> Result<ManagedVault> {
        let mut vault = self.catalogue.get(id)?;
        if vault.archived_at.is_some() {
            return Ok(vault);
        }
        self.catalogue.available(id, false)?;
        let closed = tokio::task::spawn_blocking(move || {
            if host.runtime.get(id).is_ok() {
                host.close(id)
            } else {
                Ok(())
            }
        })
        .await
        .map_err(|_| error(ErrorCode::Io, "Vault closure outcome is unavailable"))?;
        if let Err(error) = closed {
            self.catalogue.available(id, true)?;
            return Err(error);
        }
        vault.archived_at = Some(crate::control::now_ms().map_err(store)?);
        self.control.update_vault(&vault).await.map_err(store)?;
        self.catalogue.publish(vault.clone())?;
        Ok(vault)
    }
    async fn restore(&self, host: Arc<Host>, id: Uuid) -> Result<ManagedVault> {
        let mut vault = self.catalogue.get(id)?;
        if vault.archived_at.is_none() {
            return Ok(vault);
        }
        let root = self.catalogue.root(id)?;
        tokio::task::spawn_blocking(move || host.runtime.admit_root(id, root))
            .await
            .map_err(|_| error(ErrorCode::Io, "Vault restoration outcome is unavailable"))?
            .map_err(|error| error.0)?;
        vault.archived_at = None;
        self.control.update_vault(&vault).await.map_err(store)?;
        self.catalogue.publish(vault.clone())?;
        Ok(vault)
    }
}
