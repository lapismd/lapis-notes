#![forbid(unsafe_code)]
use std::{path::PathBuf, process::ExitCode};

#[tokio::main]
async fn main() -> ExitCode {
    let args: Vec<_> = std::env::args_os().skip(1).collect();
    if args.len() != 4 || args[0] != "--socket" || args[2] != "--data-root" {
        eprintln!("Usage: lapis-notes-native --socket ABSOLUTE_PATH --data-root ABSOLUTE_PATH");
        return ExitCode::FAILURE;
    }
    let socket = PathBuf::from(&args[1]);
    let root = PathBuf::from(&args[3]);
    if !socket.is_absolute() || !root.is_absolute() {
        eprintln!("Native paths must be absolute");
        return ExitCode::FAILURE;
    }
    match lapis_notes_native::ipc::serve(&socket, root).await {
        Ok(()) => ExitCode::SUCCESS,
        Err(_) => {
            eprintln!("Native companion stopped without successful completion");
            ExitCode::FAILURE
        }
    }
}
