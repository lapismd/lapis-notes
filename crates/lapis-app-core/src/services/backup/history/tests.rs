use super::*;
use std::time::Duration;

#[test]
fn last_owner_dropped_on_its_worker_signals_stop_without_joining_itself() {
    // A batch can hold the final upgraded vault Arc after its Runtime is
    // abandoned. Its final release then drops the index owner on this worker.
    let (publish, receive) = mpsc::sync_channel::<Owner>(1);
    let (retired, complete) = mpsc::sync_channel(1);
    let (stop, stopped) = mpsc::sync_channel(1);
    let worker = thread::spawn(move || {
        drop(receive.recv().unwrap());
        retired.send(()).unwrap();
    });
    publish
        .send(Owner {
            status: Arc::new(Mutex::new(HistoryIndexStatus::default())),
            stop,
            backup: Arc::new(Mutex::new(None)),
            requested: Arc::new(AtomicBool::new(false)),
            thread: Mutex::new(Some(worker)),
        })
        .unwrap_or_else(|_| panic!("worker must receive its final owner"));
    stopped.recv_timeout(Duration::from_secs(2)).unwrap();
    complete
        .recv_timeout(Duration::from_secs(2))
        .expect("owner must not join its own thread");
}
