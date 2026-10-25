mod definition;
mod publication;
mod snapshot;
#[cfg(test)]
mod tests;

use crate::{database::Database, services::Result, vault::VaultRoot};
use std::{
    collections::HashSet,
    sync::atomic::{AtomicBool, Ordering},
};

pub(super) async fn run(
    database: &Database,
    root: &VaultRoot,
    files: &[String],
    stop: &AtomicBool,
    selected: &AtomicBool,
    today: &str,
) -> Result<usize> {
    if stop.load(Ordering::Acquire) || !selected.load(Ordering::Acquire) {
        return Ok(0);
    }
    definition::register(database).await?;
    let snapshot = match snapshot::Snapshot::prepare(root, files, stop) {
        Ok(snapshot) => snapshot,
        Err(error) if error.code() == lapis_app_protocol::ErrorCode::NotFound => return Ok(1),
        Err(error) => return Err(error),
    };
    if !snapshot.unchanged(root, files, stop)? {
        return Ok(usize::from(!stop.load(Ordering::Acquire)));
    }
    let paths: HashSet<_> = snapshot
        .documents
        .iter()
        .map(|doc| doc.path.as_str())
        .collect();
    for path in files.iter().filter(|path| super::records::markdown(path)) {
        if stop.load(Ordering::Acquire) || !selected.load(Ordering::Acquire) {
            return Ok(0);
        }
        if !paths.contains(path.as_str()) {
            publication::prune(database, path).await?;
        }
    }
    for doc in &snapshot.documents {
        if stop.load(Ordering::Acquire) || !selected.load(Ordering::Acquire) {
            return Ok(0);
        }
        root.verify_physical_root()?;
        match root.read_text(&doc.path) {
            Ok(current) if current == doc.raw => {}
            Ok(_) => return Ok(1),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(1),
            Err(error) => return Err(error.into()),
        }
        publication::publish(database, doc, snapshot.structures.get(&doc.path), today).await?;
    }
    Ok(0)
}
