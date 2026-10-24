mod conditions;
mod ranges;
mod reads;
mod writes;

use super::{State, errors::Failure};
use axum::{
    extract::{Path, Request, State as AxumState},
    response::Response,
};
use uuid::Uuid;

pub(super) async fn read(
    AxumState(state): AxumState<State>,
    Path((client, path)): Path<(Uuid, String)>,
    request: Request,
) -> Result<Response, Failure> {
    reads::serve(state, client, path, request, false).await
}
pub(super) async fn resource(
    AxumState(state): AxumState<State>,
    Path((client, path)): Path<(Uuid, String)>,
    request: Request,
) -> Result<Response, Failure> {
    reads::serve(state, client, path, request, true).await
}
pub(super) async fn write(
    AxumState(state): AxumState<State>,
    Path((client, path)): Path<(Uuid, String)>,
    request: Request,
) -> Result<Response, Failure> {
    writes::receive(state, client, path, request).await
}
