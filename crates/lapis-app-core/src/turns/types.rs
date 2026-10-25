use serde::{Deserialize, Serialize};
use std::io;
use uuid::Uuid;

pub const MAX_PROMPT_BYTES: usize = 1024 * 1024;
pub const MAX_OUTPUT_BYTES: usize = 4 * 1024 * 1024;
pub const MAX_RECORD_BYTES: usize = 8 * 1024 * 1024;
pub const MAX_RECORDS: usize = 4096;

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct TurnInput {
    pub request_id: Uuid,
    pub target_id: String,
    pub scope_dir: String,
    pub prompt: String,
    pub context: Option<String>,
}

impl TurnInput {
    pub(super) fn normalize(mut self) -> io::Result<Self> {
        if self.request_id.get_version_num() != 4
            || self.target_id.trim().is_empty()
            || self.target_id.len() > 256
            || self.target_id.chars().any(char::is_control)
            || self.prompt.trim().is_empty()
            || self.prompt.len() > MAX_PROMPT_BYTES
            || self
                .context
                .as_ref()
                .is_some_and(|s| s.len() > MAX_PROMPT_BYTES)
        {
            return Err(invalid("Invalid native turn input"));
        }
        let raw = self.scope_dir.trim().replace('\\', "/");
        self.scope_dir = if matches!(raw.as_str(), "" | "." | "/") {
            String::new()
        } else {
            let scope = raw.strip_prefix("./").unwrap_or(&raw).trim_end_matches('/');
            if scope.len() > 4096
                || scope.contains([':', '\0'])
                || scope
                    .split('/')
                    .any(|part| matches!(part, "" | "." | ".." | ".lapis"))
            {
                return Err(invalid("Invalid native conversation scope"));
            }
            scope.into()
        };
        Ok(self)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum TurnPhase {
    Accepted,
    Running,
    Completed,
    Failed,
    Cancelled,
    Interrupted,
    Unknown,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct TurnRecord {
    pub schema_version: u32,
    pub vault_id: Uuid,
    pub conversation_id: Uuid,
    pub input: TurnInput,
    pub phase: TurnPhase,
    pub accepted_at_ms: u64,
    pub updated_at_ms: u64,
    pub output: Option<String>,
    pub failure_code: Option<String>,
}
impl TurnRecord {
    pub(super) fn validate(&self, vault: Uuid, id: Uuid) -> io::Result<()> {
        if self.schema_version != 1
            || self.vault_id != vault
            || self.vault_id.is_nil()
            || self.input.request_id != id
            || self.conversation_id.get_version_num() != 4
            || self.input.clone().normalize()? != self.input
            || self.updated_at_ms < self.accepted_at_ms
            || self.updated_at_ms > 253_402_300_799_999
            || self
                .output
                .as_ref()
                .is_some_and(|s| s.len() > MAX_OUTPUT_BYTES)
            || self
                .failure_code
                .as_ref()
                .is_some_and(|s| s.is_empty() || s.len() > 256 || s.chars().any(char::is_control))
            || (self.phase == TurnPhase::Completed && self.output.is_none())
            || match self.phase {
                TurnPhase::Accepted => self.output.is_some() || self.failure_code.is_some(),
                TurnPhase::Running | TurnPhase::Completed | TurnPhase::Cancelled => {
                    self.failure_code.is_some()
                }
                TurnPhase::Failed | TurnPhase::Interrupted | TurnPhase::Unknown => {
                    self.failure_code.is_none()
                }
            }
        {
            return Err(invalid("Invalid native turn record"));
        }
        Ok(())
    }
}

pub enum TurnOutcome {
    Completed(String),
    Failed(String),
    Cancelled,
    Unknown(String),
}

/// Metadata-only native query; prompts, context and response bodies stay on read.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TurnSummary {
    pub request_id: Uuid,
    pub conversation_id: Uuid,
    pub target_id: String,
    pub scope_dir: String,
    pub phase: TurnPhase,
    pub accepted_at_ms: u64,
    pub updated_at_ms: u64,
    pub failure_code: Option<String>,
}
impl From<TurnRecord> for TurnSummary {
    fn from(record: TurnRecord) -> Self {
        Self {
            request_id: record.input.request_id,
            conversation_id: record.conversation_id,
            target_id: record.input.target_id,
            scope_dir: record.input.scope_dir,
            phase: record.phase,
            accepted_at_ms: record.accepted_at_ms,
            updated_at_ms: record.updated_at_ms,
            failure_code: record.failure_code,
        }
    }
}

pub(super) fn invalid(message: &'static str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, message)
}
pub(super) fn now() -> io::Result<u64> {
    u64::try_from(
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|_| invalid("Native clock is unavailable"))?
            .as_millis(),
    )
    .map_err(|_| invalid("Native clock exceeds its bound"))
}
