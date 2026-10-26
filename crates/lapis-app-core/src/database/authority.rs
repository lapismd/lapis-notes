//! Client-generated writes are fenced before native selection, never by caller lifetime.
#[cfg(test)]
mod tests;
use super::Database;
use crate::services::{Error, Result};
use lapis_app_protocol::{
    ErrorCode,
    database::call::{DatabaseCall, DatabaseMethod, DatabaseValue},
};
use std::collections::BTreeSet;

#[derive(Default)]
pub(super) struct Authority {
    metadata: bool,
    projections: BTreeSet<String>,
}
impl Database {
    pub(crate) async fn claim_native_metadata(&self) {
        // Fair exclusive acquisition drains every previously admitted complete
        // generated call, including a multi-stage call whose waiter detached.
        self.authority.write().await.metadata = true;
    }
    pub(crate) async fn claim_native_projection(&self, id: &str) {
        self.authority.write().await.projections.insert(id.into());
    }
    pub(crate) async fn release_native_projection(&self, id: &str) {
        self.authority.write().await.projections.remove(id);
    }
    pub(crate) async fn call_from_client(&self, request: DatabaseCall) -> Result<DatabaseValue> {
        if !Authority::generated(&request) {
            return self.call(request).await;
        }
        let guard = self.authority.clone().read_owned().await;
        if guard.rejects(&request) {
            return Err(Error::new(
                ErrorCode::PermissionDenied,
                "Generated index writes belong to the selected native service",
            ));
        }
        let database = self.clone();
        // A dropped response must not release authority while an accepted
        // facade is still submitting its later publication stages.
        tokio::spawn(async move {
            let _authority = guard;
            database.call(request).await
        })
        .await
        .map_err(|_| {
            Error::new(
                ErrorCode::Io,
                "Database outcome is unavailable; do not retry",
            )
        })?
    }
}
impl Authority {
    fn generated(call: &DatabaseCall) -> bool {
        use DatabaseMethod::*;
        match call.method {
            UpsertIndexedFile | DeleteIndexedFile | RenameIndexedFile | SaveMetadataSnapshot
            | UpsertTaskProjection | DeleteTaskProjection => true,
            RegisterProjectionDefinition
            | ReplaceProjectionSource
            | MarkProjectionSourceError
            | UnregisterProjectionDefinition
            | DeleteProjectionSource => Self::projection(call)
                .is_some_and(|id| matches!(id, "tasks/task" | "tasks/occurrence" | "docs/note")),
            SetMeta | TransactMeta => Self::checkpoint(call),
            _ => false,
        }
    }
    fn first(call: &DatabaseCall) -> Option<&serde_json::Value> {
        match call.args.first() {
            Some(DatabaseValue::Value { value }) => Some(value),
            _ => None,
        }
    }
    fn projection(call: &DatabaseCall) -> Option<&str> {
        use DatabaseMethod::*;
        let first = Self::first(call)?;
        match call.method {
            RegisterProjectionDefinition | ReplaceProjectionSource | MarkProjectionSourceError => {
                first
                    .get("projectionId")
                    .and_then(serde_json::Value::as_str)
            }
            UnregisterProjectionDefinition | DeleteProjectionSource => first.as_str(),
            _ => None,
        }
    }
    fn checkpoint(call: &DatabaseCall) -> bool {
        use DatabaseMethod::*;
        let Some(first) = Self::first(call) else {
            return false;
        };
        let reserved = |key: &str| key == "metadata-cache.reconcile-checkpoint.v1";
        match call.method {
            SetMeta => first.as_str().is_some_and(reserved),
            TransactMeta => first["mutations"].as_array().is_some_and(|mutations| {
                mutations
                    .iter()
                    .any(|mutation| mutation["key"].as_str().is_some_and(reserved))
            }),
            _ => false,
        }
    }
    fn rejects(&self, call: &DatabaseCall) -> bool {
        use DatabaseMethod::*;
        if self.metadata
            && matches!(
                call.method,
                UpsertIndexedFile | DeleteIndexedFile | RenameIndexedFile | SaveMetadataSnapshot
            )
        {
            return true;
        }
        if matches!(call.method, UpsertTaskProjection | DeleteTaskProjection)
            && self.projections.contains("tasks/task")
        {
            return true;
        }
        Self::projection(call).is_some_and(|id| self.projections.contains(id))
            || self.metadata && Self::checkpoint(call)
    }
}
