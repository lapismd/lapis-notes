use super::{OnnxEncoder, unavailable};
use crate::services::Result;
use lapis_app_protocol::database::search::embedding::SearchEmbeddingProviderConfig;
use std::{path::PathBuf, sync::Arc};

/// Registered by native installation/cache policy, never deserialized from IPC.
#[derive(Clone)]
pub struct OnnxModelAssets {
    pub model_id: String,
    pub revision: String,
    pub dtype: String,
    pub model: PathBuf,
    pub tokenizer: PathBuf,
    pub tokenizer_config: PathBuf,
}
#[derive(Clone, Default)]
pub struct NativeEmbeddingHost {
    runtime: Option<PathBuf>,
    models: Arc<Vec<OnnxModelAssets>>,
}
impl NativeEmbeddingHost {
    pub fn new(runtime: PathBuf, models: Vec<OnnxModelAssets>) -> Self {
        Self {
            runtime: Some(runtime),
            models: Arc::new(models),
        }
    }
    pub(crate) fn open(&self, config: &SearchEmbeddingProviderConfig) -> Result<OnnxEncoder> {
        let runtime = self
            .runtime
            .as_ref()
            .ok_or_else(|| unavailable("Native ONNX runtime is not admitted"))?;
        let model = self
            .models
            .iter()
            .find(|model| {
                Some(model.model_id.as_str()) == config.model_id.as_deref()
                    && config
                        .revision
                        .as_ref()
                        .is_none_or(|revision| revision == &model.revision)
                    && config.dtype.as_deref().unwrap_or("q8") == model.dtype
            })
            .ok_or_else(|| unavailable("Native embedding model is not admitted"))?;
        OnnxEncoder::open(
            runtime,
            &model.model,
            &model.tokenizer,
            &model.tokenizer_config,
            config.normalize.unwrap_or(true),
        )
    }
}
