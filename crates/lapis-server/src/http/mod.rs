mod auth;
mod errors;
mod files;
mod routes;

use crate::host::Host;
use axum::{
    Router,
    extract::DefaultBodyLimit,
    middleware,
    routing::{delete, get, post},
};
use sha2::{Digest, Sha256};
use std::sync::Arc;

pub const JSON_LIMIT: usize = 2 * 1024 * 1024;
pub const VERSION_HEADER: &str = "x-lapis-protocol";

#[derive(Clone)]
struct State {
    host: Arc<Host>,
    token_hash: [u8; 32],
    origin: String,
}

pub fn router(host: Arc<Host>, token: &str, origin: &str) -> std::io::Result<Router> {
    if token.len() < 32 || token.bytes().any(|b| !b.is_ascii_graphic()) {
        return Err(std::io::Error::other(
            "Owner token requires at least 32 non-whitespace ASCII characters",
        ));
    }
    let uri: axum::http::Uri = origin
        .parse()
        .map_err(|_| std::io::Error::other("Invalid public origin"))?;
    if !matches!(uri.scheme_str(), Some("http" | "https"))
        || uri.authority().is_none()
        || uri
            .path_and_query()
            .is_some_and(|path| path.as_str() != "/")
        || origin.ends_with('/')
        || origin.contains('@')
    {
        return Err(std::io::Error::other(
            "Configure an exact HTTP(S) public origin",
        ));
    }
    let state = State {
        host,
        token_hash: Sha256::digest(token.as_bytes()).into(),
        origin: origin.into(),
    };
    Ok(Router::new()
        .route("/api/v3/vaults", get(routes::vaults))
        .route("/api/v3/vaults/{vault}/clients", post(routes::attach))
        .route("/api/v3/vaults/{vault}", delete(routes::close))
        .route("/api/v3/clients/{client}/commands", post(routes::execute))
        .route(
            "/api/v3/clients/{client}/heartbeat",
            post(routes::heartbeat),
        )
        .route("/api/v3/clients/{client}", delete(routes::detach))
        .route(
            "/api/v3/clients/{client}/files/{*path}",
            get(files::read).put(files::write),
        )
        .route(
            "/api/v3/clients/{client}/resources/{*path}",
            get(files::resource),
        )
        .layer(DefaultBodyLimit::max(JSON_LIMIT))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth::authorize,
        ))
        .with_state(state))
}
