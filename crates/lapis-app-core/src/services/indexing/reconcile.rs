use super::{IndexingStatus, records};
use crate::{
    database::Database,
    services::{Error, Result, VaultService},
    vault::VaultRoot,
};
use lapis_app_protocol::{ErrorCode, database::indexed::queries::ManifestQuery};
use std::sync::{
    Weak,
    atomic::{AtomicBool, Ordering},
};

pub(super) async fn run(
    vault: &Weak<VaultService>,
    database: &Database,
    root: &VaultRoot,
    stop: &AtomicBool,
) -> IndexingStatus {
    let mut status = IndexingStatus::default();
    if let Err(error) = process(vault, database, root, stop, &mut status).await {
        status.error = Some(error.to_string());
    }
    status
}
async fn process(
    vault: &Weak<VaultService>,
    database: &Database,
    root: &VaultRoot,
    stop: &AtomicBool,
    status: &mut IndexingStatus,
) -> Result<()> {
    let vault = vault.upgrade().ok_or_else(Error::closed)?;
    let work = vault.begin_work()?;
    let declared = match root.read_text(".lapis/types.json") {
        Ok(text) => serde_json::from_str::<serde_json::Value>(&text).map_err(|_| {
            Error::new(
                ErrorCode::InvalidRequest,
                "Property type configuration is invalid",
            )
        })?["types"]
            .as_object()
            .cloned()
            .unwrap_or_default(),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Default::default(),
        Err(error) => return Err(error.into()),
    };
    let mut directories = vec![String::new()];
    let mut files = Vec::new();
    let mut bytes = 0usize;
    let mut entries = 0usize;
    while let Some(directory) = directories.pop() {
        if stop.load(Ordering::Acquire) || work.cancellation_requested() {
            return Ok(());
        }
        root.verify_physical_root()?;
        let listing = root.list(&directory)?;
        entries = entries
            .saturating_add(listing.folders.len())
            .saturating_add(listing.files.len());
        if entries > 100_000 {
            return Err(Error::new(
                ErrorCode::InvalidRequest,
                "Native metadata manifest exceeds bounds",
            ));
        }
        let child = |name: String| {
            if directory.is_empty() {
                name
            } else {
                format!("{directory}/{name}")
            }
        };
        directories.extend(
            listing
                .folders
                .into_iter()
                .filter(|name| !name.starts_with('.'))
                .map(child),
        );
        for name in listing
            .files
            .into_iter()
            .filter(|name| !name.starts_with('.'))
        {
            let path = child(name);
            bytes = bytes.saturating_add(path.len());
            if files.len() >= 100_000 || bytes > 32 * 1024 * 1024 {
                return Err(Error::new(
                    ErrorCode::InvalidRequest,
                    "Native metadata manifest exceeds bounds",
                ));
            }
            files.push(path);
        }
    }
    files.sort();
    let mut after = None;
    loop {
        let page = database
            .list_indexed_file_manifest(ManifestQuery {
                after,
                limit: Some(500),
                ..Default::default()
            })
            .await?;
        for row in page.rows {
            if stop.load(Ordering::Acquire) || work.cancellation_requested() {
                return Ok(());
            }
            // Other registered processors retain their own derived records.
            if records::markdown(&row.path) && files.binary_search(&row.path).is_err() {
                root.verify_physical_root()?;
                // A path created after enumeration is not an absent source.
                if root.stat(&row.path)?.is_none() {
                    database.delete_indexed_file(&row.path).await?;
                    status.deleted += 1;
                }
            }
        }
        after = page.next_cursor;
        if after.is_none() {
            break;
        }
    }
    for path in files.iter().filter(|path| records::markdown(path)) {
        if stop.load(Ordering::Acquire) || work.cancellation_requested() {
            return Ok(());
        }
        root.verify_physical_root()?;
        let Some(before) = root.stat(path)? else {
            continue;
        };
        let text = match root.read_text(path) {
            Ok(text) => text,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
            Err(error) => return Err(error.into()),
        };
        let record = records::record(path, &before, &text, &files, &declared);
        root.verify_physical_root()?;
        let Some(after) = root.stat(path)? else {
            continue;
        };
        if before.mtime != after.mtime || before.size != after.size {
            status.pending += 1;
            continue;
        }
        // External writers need not advance size or timestamp. Verify the
        // bytes again after parsing, then let watcher/periodic repair cover
        // edits racing the final derived-database publication.
        match root.read_text(path) {
            Ok(current) if current == text => {}
            Ok(_) => {
                status.pending += 1;
                continue;
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
            Err(error) => return Err(error.into()),
        }
        let existing = database.get_indexed_file(path).await?;
        let same = existing.as_ref().is_some_and(|row| {
            row.file.hash == record.file.hash
                && row.file.mtime == record.file.mtime
                && row.file.size == record.file.size
                && row.metadata.as_ref().is_some_and(|metadata| {
                    metadata.parser_version == record.metadata.parser_version
                })
                && serde_json::to_value(&row.links).ok() == serde_json::to_value(&record.links).ok()
                && serde_json::to_value(&row.properties).ok()
                    == serde_json::to_value(&record.properties).ok()
        });
        if !same {
            database.upsert_indexed_metadata(record).await?;
            status.indexed += 1;
        }
    }
    Ok(())
}
