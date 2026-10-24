use super::{ReadAction, ReadValue};
use crate::database::{MAX_BYTES, engine, invalid, store::Store};
use crate::services::{Error, Result};
use lapis_app_protocol::{
    ErrorCode,
    database::projections::{ProjectionDefinition, ProjectionVisibility},
};

impl Store {
    pub async fn read_projection(&self, action: ReadAction) -> Result<ReadValue> {
        match action {
            ReadAction::Get(id, row, reader) => self
                .projection_row(&id, &row, reader.as_deref())
                .await
                .map(ReadValue::Row),
            ReadAction::Query(id, query, reader) => self
                .query_projection(&id, query, reader.as_deref())
                .await
                .map(ReadValue::Query),
            ReadAction::Related(query, reader) => self
                .query_related(query, reader.as_deref())
                .await
                .map(ReadValue::Query),
        }
    }
    pub(super) async fn projection_row(
        &self,
        id: &str,
        row_id: &str,
        reader: Option<&str>,
    ) -> Result<Option<serde_json::Value>> {
        let definition = self.readable_projection(id, reader).await?;
        let mut rows=self.connection.query("SELECT r.data_json FROM index_projection_rows r INNER JOIN index_projection_sources s ON s.projection_id=r.projection_id AND s.source_path=r.source_path LEFT JOIN files f ON f.path=r.source_path WHERE r.projection_id=? AND (r.row_id=? OR r.source_path=? OR json_extract(r.data_json,'$.documentId')=? OR json_extract(r.data_json,'$.id')=?) AND s.status='ready' AND s.schema_version=? AND s.config_hash=? AND (f.path IS NULL OR (f.hash=s.source_hash AND f.deleted=0)) LIMIT 1",turso::params![id,row_id,row_id,row_id,row_id,definition.schema_version,definition.config_hash]).await.map_err(engine)?;
        let Some(row) = rows.next().await.map_err(engine)? else {
            return Ok(None);
        };
        let data = row.get::<String>(0).map_err(engine)?;
        if data.len() >= MAX_BYTES {
            return Err(invalid("Projection row exceeds 32 MiB"));
        }
        // Match the retained provider's explicit parseJson(data, null) boundary.
        Ok(serde_json::from_str(&data)
            .ok()
            .filter(|v| !matches!(v, serde_json::Value::Null)))
    }
    pub(super) async fn readable_projection(
        &self,
        id: &str,
        reader: Option<&str>,
    ) -> Result<ProjectionDefinition> {
        let definition = self.projection_definition(id).await?;
        if matches!(definition.visibility, ProjectionVisibility::Private)
            && reader.filter(|r| !r.is_empty()) != Some(definition.owner_plugin_id.as_str())
        {
            return Err(Error::new(
                ErrorCode::PermissionDenied,
                "Projection is private",
            ));
        }
        Ok(definition)
    }
}
