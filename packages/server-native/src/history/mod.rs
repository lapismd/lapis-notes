use std::sync::Arc;
mod admission;
mod source;

pub use admission::{Policy, SourceKind};
use jj_history_service::{Context, Error, History, Result, frames, wire};

/// Preserve the public version-one inner frame verbatim at the JS boundary.
pub async fn call(
    history: &Arc<History>,
    scope: &str,
    method: &str,
    frame: &str,
) -> Result<String> {
    let caller = Context {
        window: scope.into(),
        url: admission::ORIGIN.into(),
    };
    match method {
        "heads" => {
            let data: frames::Vault = wire::decode(frame)?;
            wire::encode(history.heads(&caller, &data.vault).await?)
        }
        "open" => {
            let data: frames::Open = wire::decode(frame)?;
            wire::encode(history.open(&caller, &data.vault, data.operation).await?)
        }
        "status" | "close" => {
            let data: frames::Selection = wire::decode(frame)?;
            if method == "close" {
                wire::encode(history.close(&caller, &data.vault, data.handle).await?)
            } else {
                wire::encode(history.status(&caller, &data.vault, data.handle).await?)
            }
        }
        "read" => {
            let data: frames::Read = wire::decode(frame)?;
            wire::encode(
                history
                    .read(&caller, &data.vault, data.handle, data.query)
                    .await?,
            )
        }
        "blame" => {
            let data: frames::Blame = wire::decode(frame)?;
            wire::encode(
                history
                    .blame(&caller, &data.vault, data.handle, data.query)
                    .await?,
            )
        }
        _ => Err(Error::Invalid),
    }
}
