use super::{State, errors::Failure};
use axum::{
    Json,
    extract::{Path, State as AxumState, rejection::JsonRejection},
    http::StatusCode,
};
use lapis_app_protocol::{
    AttachClient, ClientDescriptor, ErrorCode, ManagedVault, Outcome, Reply, Request,
};
use uuid::Uuid;

async fn blocking<T: Send + 'static>(
    action: impl FnOnce() -> crate::host::Result<T> + Send + 'static,
) -> Result<T, Failure> {
    tokio::task::spawn_blocking(action)
        .await
        .map_err(|_| Failure::new(ErrorCode::Io, "Host operation did not complete"))?
        .map_err(Into::into)
}
fn body<T>(body: Result<Json<T>, JsonRejection>) -> Result<T, Failure> {
    body.map(|Json(value)| value).map_err(|rejection| {
        Failure(
            rejection.status(),
            crate::host::error(ErrorCode::InvalidRequest, "Invalid command body"),
        )
    })
}
pub(super) async fn vaults(AxumState(state): AxumState<State>) -> Json<Vec<ManagedVault>> {
    Json(state.host.vaults().to_vec())
}
pub(super) async fn attach(
    AxumState(state): AxumState<State>,
    Path(vault): Path<Uuid>,
    input: Result<Json<AttachClient>, JsonRejection>,
) -> Result<Json<ClientDescriptor>, Failure> {
    if body(input)?.protocol_version != lapis_app_protocol::PROTOCOL_MAJOR {
        return Err(Failure::new(
            ErrorCode::ProtocolMismatch,
            "Reload the matching application client",
        ));
    }
    blocking(move || state.host.attach(vault)).await.map(Json)
}
pub(super) async fn execute(
    AxumState(state): AxumState<State>,
    Path(client): Path<Uuid>,
    input: Result<Json<Request>, JsonRejection>,
) -> Result<(StatusCode, Json<Reply>), Failure> {
    let request = body(input)?;
    let reply = blocking(move || state.host.execute(client, request)).await?;
    let status = match &reply.outcome {
        Outcome::Ok { .. } => StatusCode::OK,
        Outcome::Error { error } => Failure::from(error.clone()).0,
    };
    Ok((status, Json(reply)))
}
pub(super) async fn detach(
    AxumState(state): AxumState<State>,
    Path(client): Path<Uuid>,
) -> Result<StatusCode, Failure> {
    blocking(move || state.host.detach(client)).await?;
    Ok(StatusCode::NO_CONTENT)
}
pub(super) async fn heartbeat(
    AxumState(state): AxumState<State>,
    Path(client): Path<Uuid>,
) -> Result<StatusCode, Failure> {
    blocking(move || state.host.heartbeat(client)).await?;
    Ok(StatusCode::NO_CONTENT)
}
pub(super) async fn close(
    AxumState(state): AxumState<State>,
    Path(vault): Path<Uuid>,
) -> Result<StatusCode, Failure> {
    blocking(move || state.host.close(vault)).await?;
    Ok(StatusCode::NO_CONTENT)
}
