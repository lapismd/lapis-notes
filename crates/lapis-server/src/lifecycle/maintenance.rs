use crate::host::Host;
use std::{
    sync::Arc,
    time::{Duration, Instant},
};

pub struct Maintenance(tokio::task::JoinHandle<()>);
impl Maintenance {
    pub fn start(host: Arc<Host>) -> Self {
        Self(tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(30));
            loop {
                interval.tick().await;
                let host = host.clone();
                if !matches!(
                    tokio::task::spawn_blocking(move || host.expire_idle(Instant::now())).await,
                    Ok(Ok(_))
                ) {
                    eprintln!("Attachment maintenance stopped: host is unavailable");
                    return;
                }
            }
        }))
    }
    pub async fn stop(self) {
        self.0.abort();
        let _ = self.0.await;
    }
}
