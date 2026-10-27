//! Captured logical attribution is data; installed native targets retain authority.
use crate::turns::TurnInput;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use ts_rs::TS;
use uuid::Uuid;

pub const PARTICIPANT_REQUEST_LIMIT: usize = 2 * 1024 * 1024;
pub const PARTICIPANT_RECORD_LIMIT: usize = 8 * 1024 * 1024;
#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ParticipantMessageInput {
    pub acceptance_id: Uuid,
    #[ts(type = "unknown")]
    pub user: Value,
    #[ts(type = "unknown")]
    pub dispatch: Value,
    pub turns: Vec<TurnInput>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize, Serialize, JsonSchema, TS)]
#[serde(rename_all = "snake_case")]
#[ts(rename_all = "snake_case")]
pub enum ParticipantState {
    Pending,
    Started,
    Completed,
    Rejected,
    Unknown,
    NotSent,
    Cancelled,
}
#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ParticipantDelivery {
    pub delivery_id: String,
    pub request_id: Uuid,
    pub agent_binding_id: Uuid,
    pub session_id: Uuid,
    pub state: ParticipantState,
    pub outcome_published: bool,
}
#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ParticipantMessage {
    pub schema_version: u32,
    pub vault_id: Uuid,
    pub acceptance_id: Uuid,
    pub conversation_id: Uuid,
    pub input: ParticipantMessageInput,
    pub deliveries: Vec<ParticipantDelivery>,
    pub recovered: bool,
}
#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
#[ts(tag = "kind", rename_all = "snake_case")]
pub enum ParticipantCommand {
    Accept {
        input: Box<ParticipantMessageInput>,
    },
    Read {
        acceptance_id: Uuid,
    },
    Stop {
        acceptance_id: Uuid,
    },
    Cancel {
        acceptance_id: Uuid,
        request_id: Uuid,
    },
}
#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema, TS)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
#[ts(tag = "kind", rename_all = "snake_case")]
pub enum ParticipantValue {
    Message {
        message: Option<Box<ParticipantMessage>>,
    },
    StopRequested {
        accepted: bool,
    },
    CancelRequested {
        accepted: bool,
    },
}
