use super::{Error, Result, state::State};
use crate::vault::{MAX_FILE_BYTES, WriteOptions};
use lapis_app_protocol::{ErrorCode, ExpectedVersion, TextSnapshot};
use sha2::{Digest, Sha256};
use std::io;

pub(super) fn read(state: &State, path: &str) -> Result<TextSnapshot> {
    state.root.verify_physical_root()?;
    let text = state.root.read_text(path)?;
    let version = format!("{:x}", Sha256::digest(text.as_bytes()));
    Ok(TextSnapshot {
        path: path.into(),
        text,
        version,
    })
}
pub(super) fn write(
    state: &State,
    path: &str,
    text: &str,
    expected: &ExpectedVersion,
    writer: Option<uuid::Uuid>,
) -> Result<String> {
    state.root.verify_physical_root()?;
    if text.len() as u64 > MAX_FILE_BYTES {
        return Err(Error::new(
            ErrorCode::InvalidRequest,
            "Text exceeds the file limit",
        ));
    }
    let target = state.root.entry_metadata(path).ok();
    let blocked = state.editors.values().any(|editor| {
        if !editor.dirty || (!editor.detached && Some(editor.client) == writer) {
            return false;
        }
        use cap_std::fs::MetadataExt;
        editor.path == path
            || target.as_ref().is_some_and(|target| {
                state.root.entry_metadata(&editor.path).is_ok_and(|source| {
                    source.dev() == target.dev() && source.ino() == target.ino()
                })
            })
    });
    if blocked {
        return Err(Error::busy());
    }
    match expected {
        ExpectedVersion::Missing {} => {
            state
                .root
                .create_file(path, text.as_bytes(), &WriteOptions::default())?
        }
        ExpectedVersion::Version { version } => {
            if version.len() != 64
                || !version
                    .bytes()
                    .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
            {
                return Err(Error::new(
                    ErrorCode::InvalidRequest,
                    "Invalid content version",
                ));
            }
            let bytes = state.root.read(path).map_err(|error| {
                if error.kind() == io::ErrorKind::NotFound {
                    Error::new(ErrorCode::Conflict, "File was removed")
                } else {
                    error.into()
                }
            })?;
            if format!("{:x}", Sha256::digest(&bytes)) != *version {
                return Err(Error::new(
                    ErrorCode::Conflict,
                    "File changed since it was read",
                ));
            }
            state.root.write_if_unchanged(
                path,
                text.as_bytes(),
                Some(&bytes),
                &WriteOptions::default(),
            )?;
        }
    }
    Ok(format!("{:x}", Sha256::digest(text.as_bytes())))
}
