#![forbid(unsafe_code)]

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

pub const PROTOCOL_MAJOR: u32 = 3;

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
#[ts(tag = "kind", rename_all = "snake_case")]
pub enum ExpectedVersion {
    Missing {},
    Version { version: String },
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
#[ts(tag = "kind", rename_all = "snake_case")]
pub enum VaultCommand {
    ReadText {
        path: String,
    },
    WriteText {
        path: String,
        text: String,
        expected: ExpectedVersion,
    },
    Status {},
    OpenEditor {
        path: String,
    },
    MarkDirty {
        editor_id: Uuid,
        revision: u32,
    },
    MarkSaved {
        editor_id: Uuid,
        revision: u32,
        version: String,
    },
    CloseEditor {
        editor_id: Uuid,
    },
    DiscardEditor {
        editor_id: Uuid,
    },
    RecoverEditor {
        editor_id: Uuid,
    },
    EditorClaims {},
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct Request {
    pub protocol_version: u32,
    pub request_id: Uuid,
    pub vault_id: Uuid,
    pub generation: Uuid,
    pub command: VaultCommand,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ClientDescriptor {
    pub client_id: Uuid,
    pub vault_id: Uuid,
    pub generation: Uuid,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize, Serialize, JsonSchema, TS)]
#[serde(rename_all = "snake_case")]
#[ts(rename_all = "snake_case")]
pub enum VaultPhase {
    Open,
    Closing,
    Closed,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct VaultStatus {
    pub vault_id: Uuid,
    pub generation: Uuid,
    pub phase: VaultPhase,
    pub clients: usize,
    pub work: usize,
    pub dirty_editors: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct EditorClaim {
    pub editor_id: Uuid,
    pub path: String,
    pub revision: u32,
    pub detached: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct TextSnapshot {
    pub path: String,
    pub text: String,
    pub version: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
#[ts(tag = "kind", rename_all = "snake_case")]
pub enum VaultValue {
    Text { snapshot: TextSnapshot },
    Written { version: String },
    Status { status: VaultStatus },
    Editor { editor_id: Uuid },
    Saved { cleared: bool },
    EditorClaims { claims: Vec<EditorClaim> },
    Done {},
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize, Serialize, JsonSchema, TS)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[ts(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    InvalidRequest,
    ProtocolMismatch,
    PermissionDenied,
    NotFound,
    Conflict,
    Busy,
    Closed,
    Io,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ServiceError {
    pub code: ErrorCode,
    pub message: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(tag = "status", rename_all = "snake_case", deny_unknown_fields)]
#[ts(tag = "status", rename_all = "snake_case")]
pub enum Outcome {
    Ok { value: VaultValue },
    Error { error: ServiceError },
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct Reply {
    pub protocol_version: u32,
    pub request_id: Uuid,
    pub outcome: Outcome,
}
