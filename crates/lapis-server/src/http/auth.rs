use super::{State, VERSION_HEADER, errors::Failure};
use axum::{
    extract::{Request, State as AxumState},
    middleware::Next,
    response::{IntoResponse, Response},
};
use lapis_app_protocol::ErrorCode;
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;

pub(super) async fn authorize(
    AxumState(state): AxumState<State>,
    request: Request,
    next: Next,
) -> Response {
    let headers = request.headers();
    let token = headers
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));
    let valid = token.is_some_and(|token| {
        let digest: [u8; 32] = Sha256::digest(token.as_bytes()).into();
        bool::from(digest.ct_eq(&state.token_hash))
    });
    if !valid {
        return Failure::unauthorized().into_response();
    }
    if headers
        .get("origin")
        .is_some_and(|value| value.as_bytes() != state.origin.as_bytes())
    {
        return Failure::new(ErrorCode::PermissionDenied, "Origin is not admitted").into_response();
    }
    if headers
        .get(VERSION_HEADER)
        .is_none_or(|value| value.as_bytes() != b"3")
    {
        return Failure::new(
            ErrorCode::ProtocolMismatch,
            "Reload the matching application client",
        )
        .into_response();
    }
    let mut response = next.run(request).await;
    response
        .headers_mut()
        .insert("cache-control", "no-store".parse().unwrap());
    response
        .headers_mut()
        .insert("x-content-type-options", "nosniff".parse().unwrap());
    response
}
