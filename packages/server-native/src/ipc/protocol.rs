use crate::history::{self, Policy, SourceKind};
use jj_history_service::{Error, History, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

pub const VERSION: u32 = 1;
pub const MAX_FRAME_BYTES: usize = 1024 * 1024;

#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Request {
    pub version: u32,
    pub id: String,
    pub action: Action,
}
#[derive(Deserialize, Serialize)]
#[serde(tag = "method", rename_all = "snake_case", deny_unknown_fields)]
pub enum Action {
    Ping,
    Bind {
        scope: String,
        vault: String,
        generation: u64,
        source: SourceKind,
    },
    History {
        scope: String,
        operation: String,
        frame: String,
    },
    Revoke {
        scope: String,
    },
    Shutdown,
}
#[derive(Serialize)]
pub struct Response {
    pub version: u32,
    pub id: String,
    pub frame: Option<String>,
    pub error: Option<Error>,
}
pub(super) async fn dispatch(
    request: Request,
    policy: &Policy,
    history: &Arc<History>,
) -> Response {
    let result = if request.version != VERSION || request.id.is_empty() || request.id.len() > 128 {
        Err(Error::Invalid)
    } else {
        run(request.action, policy, history).await
    };
    let (frame, error) = match result {
        Ok(frame) => (Some(frame), None),
        Err(error) => (None, Some(error)),
    };
    Response {
        version: VERSION,
        id: request.id,
        frame,
        error,
    }
}
async fn run(action: Action, policy: &Policy, history: &Arc<History>) -> Result<String> {
    match action {
        Action::Ping => Ok("ready".into()),
        Action::Bind {
            scope,
            vault,
            generation,
            source,
        } => {
            let policy = policy.clone();
            tokio::task::spawn_blocking(move || policy.bind(&scope, &vault, generation, source))
                .await
                .map_err(|_| Error::Unavailable)??;
            Ok("bound".into())
        }
        Action::History {
            scope,
            operation,
            frame,
        } => history::call(history, &scope, &operation, &frame).await,
        Action::Revoke { scope } => {
            policy.revoke(&scope)?;
            history.revoke(&scope).await?;
            Ok("revoked".into())
        }
        Action::Shutdown => {
            history.shutdown().await?;
            Ok("closed".into())
        }
    }
}
