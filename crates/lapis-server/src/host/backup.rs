use super::{Host, Principal, Result};
use uuid::Uuid;

impl Host {
    /// The configured application profile selects automatic backup. Explicit
    /// file-only profiles retain their existing unavailable-service boundary.
    pub async fn prepare_client(&self, client: Uuid, principal: Principal) -> Result<()> {
        let client = self.client(client, principal)?;
        if self.automatic_backup {
            client.start_backup().await.map_err(|error| error.0)?;
        }
        Ok(())
    }
}
