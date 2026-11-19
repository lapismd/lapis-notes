import type {
  CliDownload,
  CliInstallationStatus,
  CliSettingsHost,
} from "./cli-settings";
import { preferredCliDownloadUrl } from "./cli-download";

export class CliSettingsState {
  readonly host: CliSettingsHost;

  status = $state<CliInstallationStatus>();
  downloads = $state<CliDownload[]>([]);
  selectedDownloadUrl = $state("");
  busy = $state(false);
  error = $state("");
  setupOpen = $state(false);
  removeOpen = $state(false);
  shell = $state<"none" | "bash" | "zsh">("none");
  removePath = $state(false);

  #started = false;
  #disposed = false;

  constructor(host: CliSettingsHost) {
    this.host = host;
  }

  get selectedDownload(): CliDownload | undefined {
    return this.downloads.find(
      (download) => download.url === this.selectedDownloadUrl,
    );
  }

  start(): void {
    if (this.#started || this.#disposed) return;
    this.#started = true;
    void this.run(() => this.refresh(), false);
  }

  dispose(): void {
    this.#disposed = true;
  }

  async refresh(): Promise<void> {
    const [status, downloads] = await Promise.all([
      this.host.installation?.status(),
      this.host.downloads?.(),
    ]);
    if (this.#disposed) return;
    this.status = status;
    this.downloads = downloads ?? [];
    if (
      !this.downloads.some(
        (download) => download.url === this.selectedDownloadUrl,
      )
    ) {
      this.selectedDownloadUrl = preferredCliDownloadUrl(this.downloads);
    }
  }

  async run(
    action: () => Promise<void>,
    refreshAfter = true,
  ): Promise<boolean> {
    if (this.busy || this.#disposed) return false;
    this.busy = true;
    this.error = "";
    try {
      await action();
      if (refreshAfter) await this.refresh();
      return true;
    } catch (failure) {
      if (!this.#disposed) {
        this.error =
          failure instanceof Error ? failure.message : String(failure);
        if (refreshAfter) await this.refresh().catch(() => {});
      }
      return false;
    } finally {
      if (!this.#disposed) this.busy = false;
    }
  }
}
