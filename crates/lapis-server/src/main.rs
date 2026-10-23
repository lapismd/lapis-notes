#![forbid(unsafe_code)]

use lapis_server::{config::Config, host::Host, http, lifecycle::Shutdown};
use std::{net::SocketAddr, sync::Arc};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args().skip(1);
    let config_path = args
        .next()
        .ok_or("Usage: lapis-server <config.json> [listen-address]")?;
    let address: SocketAddr = args
        .next()
        .unwrap_or_else(|| "127.0.0.1:8787".into())
        .parse()?;
    if args.next().is_some() {
        return Err("Unexpected server argument".into());
    }
    let config: Config = serde_json::from_slice(&std::fs::read(config_path)?)?;
    let token = std::env::var("LAPIS_SERVER_TOKEN")
        .map_err(|_| "Set LAPIS_SERVER_TOKEN to a private owner token")?;
    let origin =
        std::env::var("LAPIS_SERVER_ORIGIN").unwrap_or_else(|_| format!("http://{address}"));
    let host = Arc::new(Host::new(config)?);
    let listener = tokio::net::TcpListener::bind(address).await?;
    let origin = if address.port() == 0 && std::env::var_os("LAPIS_SERVER_ORIGIN").is_none() {
        format!("http://{}", listener.local_addr()?)
    } else {
        origin
    };
    let router = http::router(host.clone(), &token, &origin)?;
    let shutdown = Shutdown::new()?;
    println!("Lapis file service listening on {}", listener.local_addr()?);
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown.wait(host))
        .await?;
    Ok(())
}
