use super::types::{MAX_RECORD_BYTES, MAX_RECORDS, TurnRecord, invalid};
use crate::vault::{VaultRoot, WriteOptions};
use cap_std::fs::MetadataExt;
use std::{
    fs::File,
    io::{self, Read},
    path::Path,
};
use uuid::Uuid;

pub(super) struct Storage {
    profile: VaultRoot,
    root: VaultRoot,
    lock: File,
    pub vault: Uuid,
    pub generation: Uuid,
}
impl Storage {
    pub fn open(directory: &Path, vault: Uuid, content: &VaultRoot) -> io::Result<Self> {
        if vault.is_nil()
            || !directory.is_absolute()
            || !std::fs::symlink_metadata(directory)?.is_dir()
        {
            return Err(invalid("Native turn storage requires a physical profile"));
        }
        content.verify_physical_root()?;
        let profile = VaultRoot::open(directory)?;
        if profile.path().starts_with(content.path()) {
            return Err(invalid(
                "Native turn authority must remain outside vault content",
            ));
        }
        let name = vault.to_string();
        match profile.mkdir(&name, false) {
            Ok(()) => {}
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {}
            Err(e) => return Err(e),
        }
        let root = profile.open_child(&name)?;
        profile.directory_handle()?.into_std_file().sync_all()?;
        match root.create_file(".owner.lock", &b""[..], &WriteOptions::default()) {
            Ok(()) => {}
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {}
            Err(e) => return Err(e),
        }
        let lock = root.open_file(".owner.lock")?.into_std();
        lock.try_lock().map_err(io::Error::from)?;
        let value = Self {
            profile,
            root,
            lock,
            vault,
            generation: Uuid::new_v4(),
        };
        value.verify()?;
        Ok(value)
    }
    pub fn verify(&self) -> io::Result<()> {
        use std::os::unix::fs::MetadataExt as _;
        self.profile.verify_physical_root()?;
        self.root.verify_physical_root()?;
        let current = self.root.entry_metadata(".owner.lock")?;
        let held = self.lock.metadata()?;
        if !current.is_file() || current.dev() != held.dev() || current.ino() != held.ino() {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Native turn writer changed",
            ));
        }
        Ok(())
    }
    pub fn ids(&self) -> io::Result<Vec<Uuid>> {
        self.verify()?;
        let mut ids = Vec::new();
        let directory = self.root.directory_handle()?;
        for (index, entry) in directory.entries()?.enumerate() {
            // Records, the writer lock and one interrupted temporary publication.
            if index >= MAX_RECORDS + 2 {
                return Err(invalid(
                    "Native turn journal exceeds its supported catalogue",
                ));
            }
            let entry = entry?;
            let name = entry
                .file_name()
                .into_string()
                .map_err(|_| invalid("Native turn filename is not UTF-8"))?;
            let Some(id) = name.strip_suffix(".json") else {
                continue;
            };
            if !entry.file_type()?.is_file() {
                return Err(invalid("Native turn record is not a regular file"));
            }
            let parsed =
                Uuid::parse_str(id).map_err(|_| invalid("Invalid native turn filename"))?;
            if parsed.get_version_num() != 4 || parsed.to_string() != id || ids.len() >= MAX_RECORDS
            {
                return Err(invalid(
                    "Native turn journal exceeds its supported catalogue",
                ));
            }
            ids.push(parsed);
        }
        ids.sort();
        Ok(ids)
    }
    pub fn read(&self, id: Uuid) -> io::Result<Option<(TurnRecord, Vec<u8>)>> {
        self.verify()?;
        let file = match self.root.open_file(&format!("{id}.json")) {
            Ok(file) => file,
            Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(e),
        };
        let mut bytes = Vec::new();
        file.take(MAX_RECORD_BYTES as u64 + 1)
            .read_to_end(&mut bytes)?;
        if bytes.len() > MAX_RECORD_BYTES {
            return Err(invalid("Native turn record exceeds its bound"));
        }
        let record: TurnRecord = serde_json::from_slice(&bytes)
            .map_err(|_| invalid("Native turn record is unreadable"))?;
        record.validate(self.vault, id)?;
        Ok(Some((record, bytes)))
    }
    pub fn write(&self, record: &TurnRecord, expected: Option<&[u8]>) -> io::Result<Vec<u8>> {
        self.verify()?;
        record.validate(self.vault, record.input.request_id)?;
        let bytes = serde_json::to_vec(record)
            .map_err(|_| invalid("Native turn record is not serializable"))?;
        if bytes.len() > MAX_RECORD_BYTES {
            return Err(invalid("Native turn record exceeds its bound"));
        }
        let path = format!("{}.json", record.input.request_id);
        match expected {
            Some(expected) => self.root.write_if_unchanged(
                &path,
                &bytes[..],
                Some(expected),
                &WriteOptions::default(),
            )?,
            None => self
                .root
                .create_file(&path, &bytes[..], &WriteOptions::default())?,
        }
        self.verify()?;
        Ok(bytes)
    }
}
