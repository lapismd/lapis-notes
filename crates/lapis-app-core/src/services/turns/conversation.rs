use super::{Result, Work};
use crate::turns::{TurnOutcome, TurnRecord};
use lapis_app_protocol::ExpectedVersion;
use serde_json::{Value, json};
use uuid::Uuid;

pub(super) struct Conversation {
    directory: String,
    metadata: Value,
    metadata_version: String,
    user: Value,
    assistant: Value,
    transcript_version: String,
}
fn timestamp(ms: u64) -> String {
    chrono::DateTime::from_timestamp_millis(ms as i64)
        .expect("validated native timestamp")
        .to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}
fn line(value: &Value) -> String {
    format!("{value}\n")
}
impl Conversation {
    pub fn create(work: &Work, record: &TurnRecord) -> Result<Self> {
        let parent = [record.input.scope_dir.as_str(), ".lapis/agents/sessions"]
            .into_iter()
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join("/");
        let directory = format!("{parent}/{}", record.conversation_id);
        {
            let state = work.vault.lock()?;
            state.root.verify_physical_root()?;
            super::super::guards::write(&state, &parent, None, true)?;
            let mut containing = state.root.directory_handle()?;
            let mut path = String::new();
            for part in directory.split('/') {
                if !path.is_empty() {
                    path.push('/');
                }
                path.push_str(part);
                match state.root.mkdir(&path, false) {
                    Ok(()) => {}
                    Err(error)
                        if error.kind() == std::io::ErrorKind::AlreadyExists
                            && path != directory => {}
                    Err(error) => return Err(error.into()),
                }
                containing.into_std_file().sync_all()?;
                containing = state.root.open_directory(&path)?;
            }
            containing.into_std_file().sync_all()?;
        }
        let binding = Uuid::new_v4().to_string();
        let created = timestamp(record.accepted_at_ms);
        let metadata = json!({ "schemaVersion":3, "id":record.conversation_id,
            "createdAt":created, "updatedAt":created, "status":"active", "activeAgentBindingId":binding });
        let user = json!({"schemaVersion":3, "id":record.input.request_id, "type":"message",
            "createdAt":created, "role":"user", "text":record.input.prompt,
            "provenance":{"originClass":"owner","sourceKind":"user-message"}});
        let assistant = json!({"schemaVersion":3, "id":Uuid::new_v4(), "type":"message",
            "createdAt":created, "parentId":record.input.request_id, "agentBindingId":binding,
            "role":"assistant", "text":"", "provenance":{"originClass":"agent","sourceKind":"assistant-message"}});
        let metadata_version = work.write_text(
            &format!("{directory}/metadata.yaml"),
            &line(&metadata),
            &ExpectedVersion::Missing {},
        )?;
        let agent = json!({"schemaVersion":3, "id":binding, "type":"binding.created", "createdAt":created,
            "runtime":"acp", "agent":record.input.target_id});
        work.write_text(
            &format!("{directory}/agents.jsonl"),
            &line(&agent),
            &ExpectedVersion::Missing {},
        )?;
        let transcript_version = work.write_text(
            &format!("{directory}/transcript.jsonl"),
            &line(&user),
            &ExpectedVersion::Missing {},
        )?;
        Ok(Self {
            directory,
            metadata,
            metadata_version,
            user,
            assistant,
            transcript_version,
        })
    }
    pub fn progress(&mut self, work: &Work, output: &str) -> Result<()> {
        self.assistant["text"] = json!(output);
        self.write_transcript(work, None)
    }
    fn write_transcript(&mut self, work: &Work, terminal: Option<Value>) -> Result<()> {
        let mut text = line(&self.user);
        if self.assistant["text"]
            .as_str()
            .is_some_and(|s| !s.is_empty())
        {
            text.push_str(&line(&self.assistant));
        }
        if let Some(terminal) = terminal {
            text.push_str(&line(&terminal));
        }
        self.transcript_version = work.write_text(
            &format!("{}/transcript.jsonl", self.directory),
            &text,
            &ExpectedVersion::Version {
                version: self.transcript_version.clone(),
            },
        )?;
        Ok(())
    }
    pub fn finish(&mut self, work: &Work, outcome: &TurnOutcome) -> Result<()> {
        let time = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let terminal = match outcome {
            TurnOutcome::Completed(_) => None,
            TurnOutcome::Cancelled => Some(json!({"schemaVersion":3, "id":Uuid::new_v4(),
                "type":"cancelled", "createdAt":time, "text":"Native turn cancelled"})),
            TurnOutcome::Failed(code) | TurnOutcome::Unknown(code) => {
                Some(json!({"schemaVersion":3,
                "id":Uuid::new_v4(), "type":"error", "createdAt":time, "message":code, "retryable":false}))
            }
        };
        self.write_transcript(work, terminal)?;
        self.metadata["updatedAt"] = json!(time);
        self.metadata_version = work.write_text(
            &format!("{}/metadata.yaml", self.directory),
            &line(&self.metadata),
            &ExpectedVersion::Version {
                version: self.metadata_version.clone(),
            },
        )?;
        Ok(())
    }
}
