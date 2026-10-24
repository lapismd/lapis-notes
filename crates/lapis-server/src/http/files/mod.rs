mod conditions;
mod ranges;
mod reads;
mod writes;

use super::{State, errors::Failure};
use crate::host::Principal;
use axum::Extension;
use axum::{
    extract::{Path, Request, State as AxumState},
    response::Response,
};
use uuid::Uuid;

pub(super) async fn read(
    AxumState(state): AxumState<State>,
    Path((client, path)): Path<(Uuid, String)>,
    Extension(principal): Extension<Principal>,
    request: Request,
) -> Result<Response, Failure> {
    reads::serve(state, client, path, principal, request, false).await
}
pub(super) async fn resource(
    AxumState(state): AxumState<State>,
    Path((client, path)): Path<(Uuid, String)>,
    Extension(principal): Extension<Principal>,
    request: Request,
) -> Result<Response, Failure> {
    reads::serve(state, client, path, principal, request, true).await
}
pub(super) async fn write(
    AxumState(state): AxumState<State>,
    Path((client, path)): Path<(Uuid, String)>,
    Extension(principal): Extension<Principal>,
    request: Request,
) -> Result<Response, Failure> {
    writes::receive(state, client, path, principal, request).await
}
