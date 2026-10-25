mod checksum;
mod envelope;
mod manifest;
mod source;
#[cfg(test)]
mod tests;

use crate::{
    database::Database,
    services::{Error, Result, VaultService},
    vault::VaultRoot,
};
use lapis_app_protocol::database::indexed::queries::ManifestQuery;
use lapis_plugin_services::markdown::PARSER_VERSION;
use std::sync::{
    Arc, Weak,
    atomic::{AtomicBool, Ordering},
};

impl VaultService {
    /// Select the native Markdown Search source; other providers and host defaults stay separate.
    pub async fn start_search_indexing(self: &Arc<Self>) -> Result<()> {
        self.start_markdown_indexing().await?;
        let _work = self.begin_work()?;
        let slot = self.indexing.lock().map_err(|_| super::unavailable())?;
        if let Some(owner) = slot.as_ref() {
            owner.select_search(true);
        }
        Ok(())
    }
    /// Fence new Search source admissions; accepted database work retains its drain contract.
    pub fn stop_search_indexing(self: &Arc<Self>) -> Result<()> {
        let _work = self.begin_work()?;
        let slot = self.indexing.lock().map_err(|_| super::unavailable())?;
        if let Some(owner) = slot.as_ref() {
            owner.select_search(false);
        }
        Ok(())
    }
}

pub(super) async fn run(
    vault: &Weak<VaultService>,
    database: &Database,
    root: &VaultRoot,
    stop: &AtomicBool,
    selected: &AtomicBool,
) -> Result<usize> {
    if stop.load(Ordering::Acquire) || !selected.load(Ordering::Acquire) {
        return Ok(0);
    }
    let vault = vault.upgrade().ok_or_else(Error::closed)?;
    let work = vault.begin_work()?;
    let cancelled = || {
        stop.load(Ordering::Acquire)
            || !selected.load(Ordering::Acquire)
            || work.cancellation_requested()
    };
    let Some(files) = super::manifest::collect(root, cancelled)? else {
        return Ok(0);
    };
    let Some(mut search) = manifest::collect(database, cancelled).await? else {
        return Ok(0);
    };
    let mut after = None;
    let mut pending = 0usize;
    let mut failure = None;
    loop {
        if cancelled() {
            return Ok(pending);
        }
        let page = database
            .list_indexed_file_manifest(ManifestQuery {
                after,
                limit: Some(500),
                ..Default::default()
            })
            .await?;
        for file in page.rows {
            if cancelled() {
                return Ok(pending);
            }
            if !super::records::markdown(&file.path) || files.binary_search(&file.path).is_err() {
                continue;
            }
            let existing = search.remove(&file.path);
            if existing
                .as_ref()
                .is_some_and(|row| row.source_provider_id.as_deref() != Some(envelope::PROVIDER))
            {
                continue;
            }
            if file.parser_version.as_deref() != Some(PARSER_VERSION) {
                continue;
            }
            if existing
                .as_ref()
                .is_some_and(|row| source::unchanged(&file, row))
            {
                continue;
            }
            match source::publish(database, root, &file, cancelled).await {
                Ok(count) => pending = pending.saturating_add(count),
                Err(error) => {
                    failure.get_or_insert(error);
                }
            }
        }
        after = page.next_cursor;
        if after.is_none() {
            break;
        }
    }
    for row in search
        .into_values()
        .filter(|row| row.source_provider_id.as_deref() == Some(envelope::PROVIDER))
    {
        if cancelled() {
            return Ok(pending);
        }
        if files.binary_search(&row.path).is_ok() && super::records::markdown(&row.path) {
            continue;
        }
        root.verify_physical_root()?;
        // A visible file created after enumeration must wait for the next pass.
        let hidden = row.path.split('/').any(|part| part.starts_with('.'));
        if !hidden && super::records::markdown(&row.path) && root.stat(&row.path)?.is_some() {
            pending = pending.saturating_add(1);
            continue;
        }
        database.delete_search_document(&row.path).await?;
    }
    failure.map_or(Ok(pending), Err)
}
