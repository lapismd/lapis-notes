use super::{encoded, engine, invalid, store::Store};
use crate::services::Result;
use lapis_app_protocol::database::changes::{ChangeDomain, ChangeSet};

pub(super) fn now_ms() -> Result<i64> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|_| invalid("Invalid application database clock"))?
        .as_millis();
    i64::try_from(now).map_err(|_| invalid("Invalid application database clock"))
}
impl Store {
    pub async fn journal(&self, domain: ChangeDomain, paths: Vec<String>) -> Result<ChangeSet> {
        self.journal_domains(vec![domain], paths).await
    }
    pub(super) async fn journal_domains(
        &self,
        domains: Vec<ChangeDomain>,
        paths: Vec<String>,
    ) -> Result<ChangeSet> {
        if self.connection.execute("UPDATE app_revision SET revision=revision+1 WHERE id=1 AND revision<9007199254740991", ()).await.map_err(engine)? != 1 {
            return Err(invalid("Application database revision is exhausted"));
        }
        let revision = self.revision().await?;
        let mut change = ChangeSet {
            revision,
            domains,
            paths,
            renamed: None,
            reset: None,
            committed_at: now_ms()?,
        };
        if change.paths.len() > 500 || encoded(&change.paths)?.len() > 64 * 1024 {
            change.paths.clear();
            change.reset = Some(true);
        }
        encoded(&change)?;
        self.connection.execute("INSERT INTO app_changes(revision,domains_json,paths_json,renamed_json,committed_at) VALUES(?,?,?,'null',?)", turso::params![revision as i64,serde_json::to_string(&change.domains).map_err(|_| invalid("Invalid change domain"))?,serde_json::to_string(&change.paths).map_err(|_| invalid("Invalid change paths"))?,change.committed_at]).await.map_err(engine)?;
        Ok(change)
    }
}
