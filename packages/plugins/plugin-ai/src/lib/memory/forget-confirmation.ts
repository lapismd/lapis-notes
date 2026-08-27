import { Modal, Setting, type App } from "@lapis-notes/api";
import type { MemoryForgetPreview } from "./types";

export function confirmForgetDerivedMemory(
  app: App,
  preview: MemoryForgetPreview,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (confirmed: boolean) => {
      if (settled) return;
      settled = true;
      resolve(confirmed);
      modal.close();
    };
    const modal = new (class extends Modal {
      override onOpen(): void {
        this.setTitle("Forget derived conversation memory");
        const document = this.contentEl.ownerDocument;
        const description = document.createElement("p");
        description.textContent = [
          `Remove ${preview.episodeRefs.length} episodic reference${preview.episodeRefs.length === 1 ? "" : "s"}`,
          `${preview.candidateIds.length} candidate${preview.candidateIds.length === 1 ? "" : "s"}`,
          `and retract ${preview.memoryIds.length} curated record${preview.memoryIds.length === 1 ? "" : "s"}.`,
          "The immutable conversation transcript is not deleted.",
        ].join(", ");
        this.contentEl.replaceChildren(description);
        new Setting(this.contentEl)
          .addButton((button) => {
            button.setButtonText("Cancel").onClick(() => finish(false));
          })
          .addButton((button) => {
            button
              .setWarning()
              .setButtonText("Forget derived memory")
              .onClick(() => finish(true));
          });
      }

      override onClose(): void {
        if (!settled) {
          settled = true;
          resolve(false);
        }
        this.contentEl.replaceChildren();
      }
    })(app);
    modal.open();
  });
}
