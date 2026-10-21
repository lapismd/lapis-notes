use super::protocol::{self, Action, MAX_FRAME_BYTES, Request};
use crate::history::Policy;
use jj_history_service::{Config, History};
use std::sync::Arc;
use std::{
    io,
    os::unix::fs::PermissionsExt,
    path::{Path, PathBuf},
    time::Duration,
};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    net::{UnixListener, UnixStream},
};

struct Socket(PathBuf);
impl Drop for Socket {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}

/// Serve one supervised parent. Losing that connection retires all its scopes.
pub async fn serve(socket: &Path, root: PathBuf) -> io::Result<()> {
    let parent = socket
        .parent()
        .ok_or_else(|| io::Error::other("Missing socket directory"))?;
    let mode = std::fs::symlink_metadata(parent)?;
    if !mode.is_dir() || mode.file_type().is_symlink() || mode.permissions().mode() & 0o077 != 0 {
        return Err(io::Error::other("Socket directory must be private"));
    }
    let policy = Policy::new(root.clone()).map_err(|_| io::Error::other("Invalid native root"))?;
    let history = History::new(
        policy.clone(),
        root.join("history-cache"),
        Config::default(),
    )
    .map_err(|_| io::Error::other("Cannot start history service"))?;
    let listener = UnixListener::bind(socket)?;
    let _socket = Socket(socket.into());
    std::fs::set_permissions(socket, std::fs::Permissions::from_mode(0o600))?;
    let result = async {
        let (stream, _) =
            tokio::time::timeout(Duration::from_secs(10), listener.accept()).await??;
        drop(listener);
        connected(stream, &policy, &history).await
    }
    .await;
    let drained = history
        .shutdown()
        .await
        .map_err(|_| io::Error::other("History shutdown failed"));
    result.and(drained)
}
async fn connected(stream: UnixStream, policy: &Policy, history: &Arc<History>) -> io::Result<()> {
    let (read, mut write) = stream.into_split();
    let mut input = BufReader::new(read);
    let mut termination =
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())?;
    loop {
        let line = tokio::select! {
            line = read_frame(&mut input) => line?,
            _ = termination.recv() => return Ok(()),
            _ = tokio::signal::ctrl_c() => return Ok(()),
        };
        let Some(line) = line else {
            return Ok(());
        };
        let request: Request =
            serde_json::from_slice(&line).map_err(|_| io::Error::other("Invalid IPC frame"))?;
        let shutdown =
            matches!(&request.action, Action::Shutdown) && request.version == protocol::VERSION;
        let response = protocol::dispatch(request, policy, history).await;
        let encoded = serde_json::to_vec(&response)?;
        // Inner output is already bounded by jj-history-service. Escaping is at most 6x.
        if encoded.len() > 100 * 1024 * 1024 {
            return Err(io::Error::other("IPC response limit"));
        }
        write.write_all(&encoded).await?;
        write.write_all(b"\n").await?;
        write.flush().await?;
        if shutdown {
            return Ok(());
        }
    }
}
async fn read_frame(
    input: &mut BufReader<tokio::net::unix::OwnedReadHalf>,
) -> io::Result<Option<Vec<u8>>> {
    let mut frame = Vec::new();
    loop {
        let bytes = input.fill_buf().await?;
        if bytes.is_empty() {
            return if frame.is_empty() {
                Ok(None)
            } else {
                Err(io::Error::other("Incomplete IPC frame"))
            };
        }
        let end = bytes.iter().position(|byte| *byte == b'\n').map(|p| p + 1);
        let length = end.unwrap_or(bytes.len());
        if frame.len() + length > MAX_FRAME_BYTES {
            return Err(io::Error::other("IPC request limit"));
        }
        frame.extend_from_slice(&bytes[..length]);
        input.consume(length);
        if end.is_some() {
            return Ok(Some(frame));
        }
    }
}
