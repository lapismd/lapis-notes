use lapis_app_protocol::indexing::*;
use serde_json::json;
use ts_rs::{Config, TS};

#[test]
fn indexing_declarations_round_trip_without_callbacks_or_host_roots() {
    let input = json!({"kind":"register_projection","contribution":{"projection_id":"docs/note","owner_plugin_id":"docs","schema_version":1.0,"configuration_hash":"opaque","path_prefix":"docs"}});
    let command: IndexingCommand = serde_json::from_value(input.clone()).unwrap();
    assert_eq!(serde_json::to_value(command).unwrap(), input);
    let mut callback = input;
    callback["contribution"]["project"] = json!("function(){}");
    assert!(serde_json::from_value::<IndexingCommand>(callback).is_err());
    assert!(
        serde_json::from_value::<IndexingCommand>(
            json!({"kind":"select_metadata","root":"/outside"})
        )
        .is_err()
    );
    let declarations = IndexingCommand::decl(&Config::default());
    for kind in [
        "select_metadata",
        "register_processor",
        "register_projection",
        "disable_projection",
        "refresh",
        "status",
    ] {
        assert!(declarations.contains(kind));
    }
}
