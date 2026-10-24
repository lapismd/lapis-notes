use super::{MetaTransaction, encoded, engine, invalid, store::Store};
use crate::services::Result;

impl Store {
    pub async fn transact(&mut self, transaction: MetaTransaction) -> Result<bool> {
        self.connection
            .execute("BEGIN IMMEDIATE", ())
            .await
            .map_err(engine)?;
        let result = self.apply(transaction).await;
        match result {
            Ok(true) => {
                if let Err(error) = self.connection.execute("COMMIT", ()).await {
                    self.rollback().await?;
                    return Err(engine(error));
                }
                Ok(true)
            }
            other => {
                self.rollback().await?;
                other
            }
        }
    }
    async fn rollback(&mut self) -> Result<()> {
        if let Err(error) = self.connection.execute("ROLLBACK", ()).await {
            self.poisoned = true;
            return Err(engine(error));
        }
        Ok(())
    }
    async fn apply(&self, transaction: MetaTransaction) -> Result<bool> {
        for check in transaction.checks {
            let value = self.get(&check.key).await?;
            if check.exists.is_some_and(|exists| exists != value.is_some()) {
                return Ok(false);
            }
            if let Some(expected) = check.value
                && value.as_ref().map(encoded).transpose()? != Some(encoded(&expected)?)
            {
                return Ok(false);
            }
        }
        if transaction.mutations.is_empty() {
            return Ok(true);
        }
        for mutation in transaction.mutations {
            if mutation.delete || mutation.value.is_none() {
                self.connection
                    .execute("DELETE FROM app_meta WHERE key=?", [mutation.key.as_str()])
                    .await
                    .map_err(engine)?;
            } else if let Some(value) = mutation.value {
                let json = String::from_utf8(encoded(&value)?)
                    .map_err(|_| invalid("Invalid metadata JSON"))?;
                self.connection.execute("INSERT INTO app_meta(key,value_json) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json", turso::params![mutation.key,json]).await.map_err(engine)?;
            }
        }
        if self.connection.execute("UPDATE app_revision SET revision=revision+1 WHERE id=1 AND revision<9007199254740991", ()).await.map_err(engine)? != 1 {
            return Err(invalid("Application database revision is exhausted"));
        }
        let revision = self.revision().await? as i64;
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|_| invalid("Invalid application database clock"))?
            .as_millis();
        let now = i64::try_from(now).map_err(|_| invalid("Invalid application database clock"))?;
        self.connection.execute("INSERT INTO app_changes(revision,domains_json,paths_json,renamed_json,committed_at) VALUES(?,'[\"meta\"]','[]','null',?)", turso::params![revision,now]).await.map_err(engine)?;
        Ok(true)
    }
}
