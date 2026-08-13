import {
  Notice,
  PluginSettingTab,
  Setting,
  type App,
  type ButtonComponent,
} from "@lapis-notes/api";
import type { SearchPlugin } from "./search-plugin";
import {
  CUSTOM_SEARCH_EMBEDDING_MODEL_OPTION,
  SEARCH_EMBEDDING_MODEL_OPTIONS,
  getSearchEmbeddingCustomOptionLabel,
  getSearchEmbeddingModelOptionValue,
  isPresetSearchEmbeddingModelId,
  type SearchPluginSettingsPatch,
} from "./search-settings";

export class SearchSettingsTab extends PluginSettingTab {
  private rebuilding = false;

  constructor(
    app: App,
    private readonly searchPlugin: SearchPlugin,
  ) {
    super(app, searchPlugin);
  }

  display(): void {
    const settings = this.searchPlugin.getSettings();
    const modelOption = getSearchEmbeddingModelOptionValue(
      settings.embeddings.modelId,
    );
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName("Semantic search provider")
      .setDesc(
        "Semantic search is disabled until you opt in to the local Transformers.js provider.",
      )
      .addDropdown((dropdown) => {
        dropdown
          .addOption("disabled", "Disabled")
          .addOption("transformers-js", "Transformers.js")
          .setValue(settings.embeddings.provider)
          .onChange((provider) => {
            void this.update({
              embeddings: {
                provider: provider as "disabled" | "transformers-js",
              },
            });
          });
      });

    new Setting(this.containerEl)
      .setName("Embedding model")
      .setDesc("Model used for local document and query vectors.")
      .addDropdown((dropdown) => {
        for (const modelId of SEARCH_EMBEDDING_MODEL_OPTIONS) {
          dropdown.addOption(modelId, modelId);
        }
        dropdown
          .addOption(
            CUSTOM_SEARCH_EMBEDDING_MODEL_OPTION,
            getSearchEmbeddingCustomOptionLabel(settings.embeddings.modelId),
          )
          .setValue(modelOption)
          .onChange((modelId) => {
            if (Array.isArray(modelId)) return;
            if (modelId === CUSTOM_SEARCH_EMBEDDING_MODEL_OPTION) {
              this.display();
              return;
            }
            void this.update({ embeddings: { modelId } });
          });
      });

    if (modelOption === CUSTOM_SEARCH_EMBEDDING_MODEL_OPTION) {
      new Setting(this.containerEl)
        .setName("Custom embedding model")
        .setDesc("Hugging Face model id used by Transformers.js.")
        .addText((text) => {
          text
            .setPlaceholder("org/model-name")
            .setValue(
              isPresetSearchEmbeddingModelId(settings.embeddings.modelId)
                ? ""
                : settings.embeddings.modelId,
            )
            .onChange((modelId) => {
              void this.update({ embeddings: { modelId } }, false);
            });
        });
    }

    new Setting(this.containerEl)
      .setName("Allow remote model downloads")
      .setDesc(
        "Allow the selected model files to download and cache on first semantic use. Note contents remain local.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(settings.embeddings.allowRemoteModels)
          .onChange((allowRemoteModels) => {
            void this.update({ embeddings: { allowRemoteModels } });
          });
      });

    new Setting(this.containerEl)
      .setName("Local model path")
      .setDesc("Optional host path for locally supplied model files.")
      .addText((text) => {
        text
          .setPlaceholder("/models/")
          .setValue(settings.embeddings.localModelPath)
          .onChange((localModelPath) => {
            void this.update({ embeddings: { localModelPath } }, false);
          });
      });

    new Setting(this.containerEl)
      .setName("Semantic index")
      .setDesc("Rebuild document chunks and embeddings using current settings.")
      .addButton((button) => {
        this.configureRebuildButton(button);
        button.onClick(() => void this.rebuild());
      });

    this.addSlider(
      "Chunk target size",
      "Approximate character target for each indexed chunk.",
      settings.chunking.targetChars,
      400,
      3000,
      50,
      (targetChars) => ({ chunking: { targetChars } }),
    );
    this.addSlider(
      "Breakpoint search window",
      "Distance searched for a stronger heading or paragraph boundary.",
      settings.chunking.breakpointWindowChars,
      80,
      1000,
      20,
      (breakpointWindowChars) => ({ chunking: { breakpointWindowChars } }),
    );
    this.addSlider(
      "Breakpoint decay",
      "How strongly distance from the ideal cutoff penalizes a boundary.",
      settings.chunking.breakpointDecay,
      0.1,
      1,
      0.05,
      (breakpointDecay) => ({ chunking: { breakpointDecay } }),
    );
    this.addSlider(
      "Result limit",
      "Maximum files returned for one query.",
      settings.query.resultLimit,
      10,
      300,
      10,
      (resultLimit) => ({ query: { resultLimit } }),
    );
    this.addSlider(
      "Snippet length",
      "Maximum characters shown around each match.",
      settings.query.snippetLength,
      80,
      400,
      20,
      (snippetLength) => ({ query: { snippetLength } }),
    );
  }

  private addSlider(
    name: string,
    description: string,
    value: number,
    min: number,
    max: number,
    step: number,
    patch: (value: number) => SearchPluginSettingsPatch,
  ): void {
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(description)
      .addSlider((slider) => {
        slider
          .setDynamicTooltip()
          .setLimits(min, max, step)
          .setValue(value)
          .onChange((next) => void this.update(patch(Number(next)), false));
      });
  }

  private async update(
    patch: SearchPluginSettingsPatch,
    redisplay = true,
  ): Promise<void> {
    await this.searchPlugin.updateSettings(patch);
    if (redisplay) this.display();
  }

  private configureRebuildButton(button: ButtonComponent): void {
    button.setCta();
    button
      .setButtonText(this.rebuilding ? "Rebuilding…" : "Rebuild embeddings")
      .setDisabled(this.rebuilding);
  }

  private async rebuild(): Promise<void> {
    if (this.rebuilding) return;
    this.rebuilding = true;
    this.display();
    try {
      const status = await this.searchPlugin.rebuildSemanticSearch();
      new Notice(
        `Semantic search refreshed (${status.readyChunkCount}/${status.chunkCount} ready)`,
      );
    } catch (error) {
      new Notice(
        `Semantic search refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.rebuilding = false;
      this.display();
    }
  }
}
