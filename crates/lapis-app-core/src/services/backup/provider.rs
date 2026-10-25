use super::super::VaultService;
use jj_vault::{Capture, NativeRepository, Repository};
use lapis_app_protocol::VaultPhase;
use std::sync::Weak;

/// The engine runs on its own native worker, under the same physical-root/file
/// gate as service writes. Notification callbacks never acquire that gate.
pub(super) struct Provider {
    pub native: NativeRepository,
    pub vault: Weak<VaultService>,
}
impl Repository for Provider {
    fn recover_ai_history(&mut self) -> std::result::Result<(), String> {
        self.with_native(|native| native.recover_ai_history())
    }
    fn capture(&mut self) -> std::result::Result<Capture, String> {
        self.with_native(|native| native.capture())
    }
}
impl Provider {
    fn with_native<T>(
        &mut self,
        action: impl FnOnce(&mut NativeRepository) -> std::result::Result<T, String>,
    ) -> std::result::Result<T, String> {
        let vault = self.vault.upgrade().ok_or("Vault service is closed")?;
        let state = vault.lock().map_err(|error| error.to_string())?;
        if state.phase == VaultPhase::Closed {
            return Err("Vault service is closed".into());
        }
        state
            .root
            .verify_physical_root()
            .map_err(|error| error.to_string())?;
        vault
            .backup_storage
            .as_ref()
            .ok_or("Native history storage is not selected")?
            .validate_vault(&state.root)
            .map_err(|error| error.to_string())?;
        self.native
            .binding
            .relink()
            .map_err(|error| error.to_string())?;
        action(&mut self.native)
    }
}
