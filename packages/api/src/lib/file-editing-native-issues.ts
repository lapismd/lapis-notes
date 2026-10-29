import type {
  NativeEditingIssue,
  NativeRegisteredEditingSession,
} from "./native-editing-session";

export interface NativeEditingProblemIssue extends NativeEditingIssue {
  readonly registration: string;
}

type Entry = {
  path: string;
  session: NativeRegisteredEditingSession;
  retry(check: () => void): Promise<void>;
};

/** App-local failures remain visible even when native admission never succeeded. */
export class FileEditingNativeIssues {
  readonly #entries = new Map<string, Entry>();
  readonly #listeners = new Set<() => void>();

  get entries(): readonly NativeEditingProblemIssue[] {
    return [...this.#entries].flatMap(([registration, entry]) => {
      const issue = entry.session.issue;
      return issue ? [Object.freeze({ ...issue, registration })] : [];
    });
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    listener();
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /** @internal The editing registry owns registration and its guarded retry. */
  register(
    path: string,
    session: NativeRegisteredEditingSession,
    retry: Entry["retry"],
  ): () => void {
    const registration = crypto.randomUUID();
    this.#entries.set(registration, { path, session, retry });
    const stop = session.subscribe(() => this.#notify());
    this.#notify();
    return () => {
      stop();
      if (this.#entries.delete(registration)) this.#notify();
    };
  }

  retry(captured: NativeEditingProblemIssue): Promise<void> {
    try {
      const entry = this.#require(captured);
      return entry.retry(() => {
        this.#require(captured);
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  #require(captured: NativeEditingProblemIssue): Entry {
    const entry = this.#entries.get(captured.registration);
    const issue = entry?.session.issue;
    if (
      !entry ||
      entry.path !== captured.path ||
      !issue ||
      issue.id !== captured.id ||
      issue.path !== captured.path ||
      issue.phase !== captured.phase ||
      captured.status !== "failed" ||
      issue.status !== "failed"
    )
      throw new Error("Editing admission changed; refresh Problems");
    return entry;
  }

  #notify(): void {
    for (const listener of this.#listeners) {
      try {
        listener();
      } catch (error) {
        console.error("Editing admission subscriber failed", error);
      }
    }
  }
}
