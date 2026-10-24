use super::{Error, Result, state::State};
use crate::vault::{MAX_FILE_BYTES, WriteOptions};
use lapis_app_protocol::{ErrorCode, ExpectedVersion, TextSnapshot};
use sha2::{Digest, Sha256};

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
    super::byte_writes::write(
        state,
        path,
        text.as_bytes(),
        Some(expected),
        &WriteOptions::default(),
        writer,
    )
}
