import type { App } from "./context.svelte";
import type { Editor } from "./editor.svelte";
import { EventDispatcher } from "./events";
import type { TFile } from "./storage/fs";
import { resolveApplication } from "./application-compatibility";

/**
 * Mod = Cmd on MacOS and Ctrl on other OS Ctrl = Ctrl key for every OS Meta =
 * Cmd on MacOS and Win key on other OS
 *
 * @public
 */
export type Modifier = "Mod" | "Ctrl" | "Meta" | "Shift" | "Alt";

export interface Hotkey {
  /** @public */
  modifiers: Modifier[];
  /** @public */
  key: string;
}

export interface Command {
  /**
   * Globally unique ID to identify this command.
   *
   * @public
   */
  id: string;
  /**
   * Human friendly name for searching.
   *
   * @public
   */
  name: string;
  /**
   * Human-friendly command title without source prefixes.
   *
   * @public
   */
  title?: string;
  /**
   * Optional command category used by declarative contribution surfaces.
   *
   * @public
   */
  category?: string;
  /**
   * Icon ID to be used in the toolbar.
   *
   * @public
   */
  icon?: string;
  /**
   * Plugin ID that owns this command.
   *
   * @public
   */
  sourcePlugin?: string;
  /**
   * Activation event used to wake deferred command implementations.
   *
   * @public
   */
  activationEvent?: string;
  /**
   * Optional structured argument schema for declarative callers.
   *
   * @public
   */
  argumentSchema?: Record<string, unknown>;
  /**
   * Declarative context expression that must evaluate truthy before the command
   * is visible or executable.
   *
   * @public
   */
  when?: string;

  mobileOnly?: boolean;
  /**
   * Whether holding the hotkey should repeatedly trigger this command.
   *
   * @defaultValue false
   * @public
   */
  repeatable?: boolean;

  /**
   * Simple callback, triggered globally.
   *
   * @example
   *   ```ts
   *   this.addCommand({
   *     id: 'print-greeting-to-console',
   *     name: 'Print greeting to console',
   *     callback: () => {
   *       console.log('Hey, you!');
   *     },
   *   });
   *   ```;
   *
   * @public
   */
  callback?: (...args: any[]) => any;

  /**
   * Complex callback, overrides the simple callback. Used to 'check' whether
   * your command can be performed in the current circumstances. For example, if
   * your command requires the active focused pane to be a MarkdownView, then
   * you should only return true if the condition is satisfied. Returning false
   * or undefined causes the command to be hidden from the command palette.
   *
   * @example
   *   ```ts
   *   this.addCommand({
   *     id: 'example-command',
   *     name: 'Example command',
   *     checkCallback: (checking: boolean) => {
   *       const value = getRequiredValue();
   *
   *       if (value) {
   *         if (!checking) {
   *           doCommand(value);
   *         }
   *         return true;
   *       }
   *
   *       return false;
   *     }
   *   });
   *   ```;
   *
   * @param checking - Whether the command palette is just 'checking' if your
   *   command should show right now. If checking is true, then this function
   *   should not perform any action. If checking is false, then this function
   *   should perform the action.
   * @returns Whether this command can be executed at the moment.
   * @public
   */
  checkCallback?: (checking: boolean) => boolean | void;

  /**
   * A command callback that is only triggered when the user is in an editor.
   * Overrides `callback` and `checkCallback`
   *
   * @example
   *   ```ts
   *   this.addCommand({
   *   id: 'example-command',
   *   name: 'Example command',
   *   editorCallback: (editor: Editor, view: MarkdownView) => {
   *   const sel = editor.getSelection();
   *
   *   console.log(`You have selected: ${sel}`);
   *   }
   *   });
   *   ```
   *
   * @public
   */
  editorCallback?: (editor: Editor, ctx: any) => any;

  /**
   * A command callback that is only triggered when the user is in an editor.
   * Overrides `editorCallback`, `callback` and `checkCallback`
   *
   * @example
   *   ```ts
   *   this.addCommand({
   *     id: 'example-command',
   *     name: 'Example command',
   *     editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
   *       const value = getRequiredValue();
   *
   *       if (value) {
   *         if (!checking) {
   *           doCommand(value);
   *         }
   *
   *         return true;
   *       }
   *
   *       return false;
   *     }
   *   });
   *   ```;
   *
   * @public
   */
  editorCheckCallback?: (
    checking: boolean,
    editor: Editor,
    ctx: any,
  ) => boolean | void;

  /**
   * Sets the default hotkey. It is recommended for plugins to avoid setting
   * default hotkeys if possible, to avoid conflicting hotkeys with one that's
   * set by the user, even though customized hotkeys have higher priority.
   *
   * @public
   */
  hotkeys?: Hotkey[];
}

export interface CommandMetadata {
  id: string;
  label: string;
  title: string;
  category?: string;
  icon?: string;
  hotkeys?: Hotkey[];
  sourcePlugin?: string;
  activationEvent?: string;
  argumentSchema?: Record<string, unknown>;
  when?: string;
}

export interface HotkeyAssignment {
  command: Command;
  commandId: string;
  defaultHotkeys: Hotkey[];
  hotkeys: Hotkey[];
  customized: boolean;
}

export interface HotkeyConflict {
  hotkey: Hotkey;
  hotkeyId: string;
  commandIds: string[];
}

interface CommandExecutionContext {
  editor?: Editor;
  view?: any;
}

const HOTKEYS_PATH = "/.obsidian/hotkeys.json";
const MODIFIER_ORDER: Modifier[] = ["Mod", "Ctrl", "Meta", "Alt", "Shift"];
const WORKSPACE_ROOT_COMMAND_HOST_ID = "root";

function isModifierValue(value: unknown): value is Modifier {
  return (
    value === "Mod" ||
    value === "Ctrl" ||
    value === "Meta" ||
    value === "Shift" ||
    value === "Alt"
  );
}

function normalizeStoredHotkey(hotkey: Hotkey): Hotkey {
  const modifiers = Array.from(
    new Set(hotkey.modifiers.filter(isModifierValue)),
  ).sort((a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b));

  return {
    modifiers,
    key: hotkey.key.length === 1 ? hotkey.key.toUpperCase() : hotkey.key,
  };
}

function parseHotkey(value: unknown): Hotkey | null {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as Hotkey).modifiers) ||
    typeof (value as Hotkey).key !== "string" ||
    !(value as Hotkey).key.trim()
  ) {
    return null;
  }

  return normalizeStoredHotkey({
    modifiers: (value as Hotkey).modifiers.filter(isModifierValue),
    key: (value as Hotkey).key.trim(),
  });
}

function getPlatformMod(): Extract<Modifier, "Ctrl" | "Meta"> {
  const navigatorLike = globalThis.navigator as
    | (Navigator & { userAgentData?: { platform?: string } })
    | undefined;
  const platform =
    navigatorLike?.userAgentData?.platform ?? navigatorLike?.platform ?? "";
  return /mac/i.test(platform) ? "Meta" : "Ctrl";
}

function normalizeHotkey(hotkey: Hotkey): Hotkey {
  return {
    ...hotkey,
    modifiers: hotkey.modifiers.map((modifier) =>
      modifier === "Mod" ? getPlatformMod() : modifier,
    ),
  };
}

function keyId(hotkey: Hotkey): string {
  const normalized = normalizeHotkey(hotkey);
  const parts: string[] = [];
  parts.push(...normalized.modifiers.slice().sort());

  if (normalized.key) {
    parts.push(
      normalized.key.length === 1
        ? normalized.key.toUpperCase()
        : normalized.key,
    );
  }
  return parts.join("+");
}

export function getHotkeyId(hotkey: Hotkey): string {
  return keyId(hotkey);
}

export class CommandManager extends EventDispatcher<{
  register: [command: Command];
  unregister: [command: Command];
  executed: [command: Command];
  "hotkeys-updated": [
    event: {
      commandId?: string;
      hotkeys: Record<string, Hotkey[]>;
    },
  ];
}> {
  open: boolean = $state(false);
  openHostId: string = $state(WORKSPACE_ROOT_COMMAND_HOST_ID);

  readonly commands: Record<string, Command> = $state({});
  readonly editorCommands: Record<string, Command> = $state({});
  readonly bindings: Record<string, Command[]> = $state({});
  readonly hotkeyOverrides: Record<string, Hotkey[]> = $state({});

  constructor(readonly app: App) {
    super();
  }

  private currentHostId(): string {
    return (
      this.app.workspace?.getFocusedCommandHostId?.() ??
      WORKSPACE_ROOT_COMMAND_HOST_ID
    );
  }

  isOpenForHost(hostId: string): boolean {
    return this.open && this.openHostId === hostId;
  }

  private resolveExecutionContext(
    hostId: string = this.currentHostId(),
  ): CommandExecutionContext {
    const activeLeaf =
      this.app.workspace?.getCommandHostLeaf?.(hostId) ??
      this.app.workspace?.activeLeaf;
    const view = activeLeaf?.view as { editor?: Editor } | undefined;
    return {
      view,
      editor: view?.editor,
    };
  }

  private hasExecutableHandler(command: Command): boolean {
    return Boolean(
      command.callback ||
        command.checkCallback ||
        command.editorCallback ||
        command.editorCheckCallback,
    );
  }

  private toCommandMetadata(command: Command): CommandMetadata {
    return {
      id: command.id,
      label: command.name,
      title: command.title ?? command.name,
      category: command.category,
      icon: command.icon,
      hotkeys: this.getEffectiveHotkeys(command.id),
      sourcePlugin: command.sourcePlugin,
      activationEvent: command.activationEvent,
      argumentSchema: command.argumentSchema,
      when: command.when,
    };
  }

  private hasHotkeyOverride(commandId: string): boolean {
    return Object.hasOwn(this.hotkeyOverrides, commandId);
  }

  private bindCommandHotkeys(command: Command): void {
    if (!this.hasExecutableHandler(command)) {
      return;
    }

    for (const key of this.getEffectiveHotkeys(command.id)) {
      const id = keyId(key);
      this.bindings[id] ||= [];
      this.bindings[id].push(command);
    }
  }

  private rebuildBindings(): void {
    for (const id of Object.keys(this.bindings)) {
      delete this.bindings[id];
    }

    for (const command of this.getAllCommands()) {
      this.bindCommandHotkeys(command);
    }
  }

  private readHotkeyOverrideFile(): TFile | null {
    return (
      (this.app.vault?.getFileByPath?.(HOTKEYS_PATH) as TFile | null) ?? null
    );
  }

  private normalizeOverrides(value: unknown): Record<string, Hotkey[]> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    const overrides: Record<string, Hotkey[]> = {};
    for (const [commandId, hotkeys] of Object.entries(value)) {
      if (!Array.isArray(hotkeys)) {
        continue;
      }

      const parsed = hotkeys
        .map((hotkey) => parseHotkey(hotkey))
        .filter((hotkey): hotkey is Hotkey => Boolean(hotkey));

      overrides[commandId] = this.dedupeHotkeys(parsed);
    }

    return overrides;
  }

  private dedupeHotkeys(hotkeys: Hotkey[]): Hotkey[] {
    const seen = new Set<string>();
    const deduped: Hotkey[] = [];
    for (const hotkey of hotkeys.map(normalizeStoredHotkey)) {
      const id = keyId(hotkey);
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      deduped.push(hotkey);
    }
    return deduped;
  }

  async loadHotkeys(): Promise<void> {
    const file = this.readHotkeyOverrideFile();
    if (!file) {
      this.replaceHotkeyOverrides({});
      return;
    }

    try {
      const raw = await this.app.vault.read(file);
      this.replaceHotkeyOverrides(this.normalizeOverrides(JSON.parse(raw)));
    } catch (error) {
      console.warn(
        "Unable to load hotkeys.json; ignoring custom hotkeys",
        error,
      );
      this.replaceHotkeyOverrides({});
    }
  }

  async saveHotkeys(): Promise<void> {
    const data = JSON.stringify(this.hotkeyOverrides, null, 2);
    const file = this.readHotkeyOverrideFile();
    if (file) {
      await this.app.vault.modify(file, data);
      return;
    }

    await this.app.vault.mkpath("/.obsidian");
    await this.app.vault.create(HOTKEYS_PATH, data);
  }

  private replaceHotkeyOverrides(overrides: Record<string, Hotkey[]>): void {
    for (const id of Object.keys(this.hotkeyOverrides)) {
      delete this.hotkeyOverrides[id];
    }
    for (const [id, hotkeys] of Object.entries(overrides)) {
      this.hotkeyOverrides[id] = this.dedupeHotkeys(hotkeys);
    }
    this.rebuildBindings();
    this.emit("hotkeys-updated", {
      hotkeys: this.hotkeyOverrides,
    });
  }

  getDefaultHotkeys(commandId: string): Hotkey[] {
    return [...(this.commands[commandId]?.hotkeys ?? [])].map(
      normalizeStoredHotkey,
    );
  }

  getEffectiveHotkeys(commandId: string): Hotkey[] {
    if (this.hasHotkeyOverride(commandId)) {
      return [...this.hotkeyOverrides[commandId]];
    }
    return this.getDefaultHotkeys(commandId);
  }

  isHotkeyCustomized(commandId: string): boolean {
    return this.hasHotkeyOverride(commandId);
  }

  async setHotkeys(commandId: string, hotkeys: Hotkey[]): Promise<void> {
    this.hotkeyOverrides[commandId] = this.dedupeHotkeys(hotkeys);
    this.rebuildBindings();
    this.emit("hotkeys-updated", {
      commandId,
      hotkeys: this.hotkeyOverrides,
    });
    await this.saveHotkeys();
  }

  async addHotkey(commandId: string, hotkey: Hotkey): Promise<void> {
    await this.setHotkeys(commandId, [
      ...this.getEffectiveHotkeys(commandId),
      hotkey,
    ]);
  }

  async removeHotkey(commandId: string, hotkey: Hotkey): Promise<void> {
    const removeId = keyId(hotkey);
    await this.setHotkeys(
      commandId,
      this.getEffectiveHotkeys(commandId).filter(
        (candidate) => keyId(candidate) !== removeId,
      ),
    );
  }

  async resetHotkeys(commandId: string): Promise<void> {
    delete this.hotkeyOverrides[commandId];
    this.rebuildBindings();
    this.emit("hotkeys-updated", {
      commandId,
      hotkeys: this.hotkeyOverrides,
    });
    await this.saveHotkeys();
  }

  getHotkeyAssignments(): HotkeyAssignment[] {
    return this.getAllCommands().map((command) => ({
      command,
      commandId: command.id,
      defaultHotkeys: this.getDefaultHotkeys(command.id),
      hotkeys: this.getEffectiveHotkeys(command.id),
      customized: this.isHotkeyCustomized(command.id),
    }));
  }

  getHotkeyConflicts(): HotkeyConflict[] {
    const byHotkey = new Map<
      string,
      { hotkey: Hotkey; commandIds: string[] }
    >();
    for (const assignment of this.getHotkeyAssignments()) {
      for (const hotkey of assignment.hotkeys) {
        const id = keyId(hotkey);
        const existing = byHotkey.get(id);
        if (existing) {
          existing.commandIds.push(assignment.commandId);
        } else {
          byHotkey.set(id, {
            hotkey,
            commandIds: [assignment.commandId],
          });
        }
      }
    }

    return Array.from(byHotkey.entries())
      .filter(([, conflict]) => conflict.commandIds.length > 1)
      .map(([hotkeyId, conflict]) => ({
        hotkeyId,
        hotkey: conflict.hotkey,
        commandIds: conflict.commandIds,
      }));
  }

  registerCommand(command: Command) {
    if (!this.commands[command.id]) {
      this.commands[command.id] = command;
      if (
        !this.editorCommands[command.id] &&
        (command.editorCallback || command.editorCheckCallback)
      ) {
        this.editorCommands[command.id] = command;
      }
      this.bindCommandHotkeys(command);
      this.emit("register", command);
    }
  }

  unregisterCommand(id: string): boolean {
    const cmd = this.commands[id];
    if (cmd) {
      delete this.commands[id];
      if (
        (cmd.editorCallback || cmd.editorCheckCallback) &&
        this.editorCommands[id]
      ) {
        delete this.editorCommands[id];
      }
      this.rebuildBindings();
      this.emit("unregister", cmd);
      return true;
    }
    return false;
  }

  getCommand(id: string): Command | undefined {
    return this.commands[id];
  }

  getCommandMetadata(id: string): CommandMetadata | undefined {
    const command = this.getCommand(id);
    return command ? this.toCommandMetadata(command) : undefined;
  }

  isCommandAvailable(
    id: string,
    hostId: string = this.currentHostId(),
  ): boolean {
    const command = this.getCommand(id);
    if (!command) {
      return false;
    }

    const context = this.resolveExecutionContext(hostId);

    if (!this.app.contextKeys.evaluate(command.when)) {
      return false;
    }

    if (command.editorCheckCallback) {
      return Boolean(
        context.editor &&
          command.editorCheckCallback(true, context.editor, context.view),
      );
    }

    if (command.checkCallback) {
      return Boolean(command.checkCallback(true));
    }

    if (command.editorCallback) {
      return Boolean(context.editor);
    }

    return Boolean(command.callback);
  }

  getAvailableCommands(hostId: string = this.currentHostId()): Command[] {
    return this.getAllCommands().filter((command) =>
      this.isCommandAvailable(command.id, hostId),
    );
  }

  getAvailableCommandMetadata(
    hostId: string = this.currentHostId(),
  ): CommandMetadata[] {
    return this.getAvailableCommands(hostId).map((command) =>
      this.toCommandMetadata(command),
    );
  }

  private async executeCommandWithHost<T>(
    id: string,
    hostId: string,
    ...rest: any[]
  ): Promise<T> {
    const command = this.commands[id];
    if (!command) {
      return Promise.reject(new Error(`Invalid command: '${id}'`));
    }

    const context = this.resolveExecutionContext(hostId);
    let response: T;

    if (!this.app.contextKeys.evaluate(command.when)) {
      return Promise.reject(new Error(`Command unavailable: '${id}'`));
    }

    if (command.editorCheckCallback) {
      if (
        !context.editor ||
        !command.editorCheckCallback(true, context.editor, context.view)
      ) {
        return Promise.reject(new Error(`Command unavailable: '${id}'`));
      }
      response = (await command.editorCheckCallback(
        false,
        context.editor,
        context.view,
      )) as T;
    } else if (command.checkCallback) {
      if (!command.checkCallback(true)) {
        return Promise.reject(new Error(`Command unavailable: '${id}'`));
      }
      response = (await command.checkCallback(false)) as T;
    } else if (command.editorCallback) {
      if (!context.editor) {
        return Promise.reject(new Error(`Command unavailable: '${id}'`));
      }
      response = (await command.editorCallback(
        context.editor,
        context.view,
      )) as T;
    } else if (command.callback) {
      response = (await command.callback(...rest)) as T;
    } else {
      return Promise.reject(new Error(`Command unavailable: '${id}'`));
    }

    this.emit("executed", command);
    return response;
  }

  async executeCommand<T>(id: string, ...rest: any[]): Promise<T> {
    return this.executeCommandWithHost(id, this.currentHostId(), ...rest);
  }

  async executeCommandForHost<T>(
    id: string,
    hostId: string,
    ...rest: any[]
  ): Promise<T> {
    return this.executeCommandWithHost(id, hostId, ...rest);
  }

  show(hostId: string = this.currentHostId()) {
    this.openHostId = hostId;
    this.open = true;
  }

  hide(hostId?: string) {
    if (hostId && this.openHostId !== hostId) {
      return;
    }
    this.open = false;
  }

  toggle(hostId: string = this.currentHostId()) {
    if (this.isOpenForHost(hostId)) {
      this.hide(hostId);
      return;
    }

    this.show(hostId);
  }

  commandsFor(key: Hotkey) {
    const id = keyId(key);
    return this.bindings[id] || [];
  }

  getAllCommands(): Command[] {
    return Array.from(Object.values(this.commands));
  }

  getAllCommandMetadata(): CommandMetadata[] {
    return this.getAllCommands().map((command) =>
      this.toCommandMetadata(command),
    );
  }
}

export interface KeymapInfo {
  /** @public */
  modifiers: string | null;
  /** @public */
  key: string | null;
}

export interface KeymapContext extends KeymapInfo {
  /**
   * Interpreted virtual key.
   *
   * @public
   */
  vkey: string;
}

export interface KeymapEventHandler extends KeymapInfo {
  /** @public */
  scope: Scope;
}

/**
 * Return `false` to automatically preventDefault
 *
 * @public
 */
export type KeymapEventListener = (
  evt: KeyboardEvent,
  ctx: KeymapContext,
) => false | any;

type KeyBinding = KeymapEventHandler & { handler: KeymapEventListener };

export type UserEvent = MouseEvent | KeyboardEvent | TouchEvent | PointerEvent;

export class Keymap {
  private scopes: Scope[] = [];

  constructor(defaultScope?: Scope) {
    if (defaultScope) {
      this.scopes.push(defaultScope);
    }
  }

  pushScope(scope: Scope): void {
    if (!this.scopes.includes(scope)) {
      this.scopes.push(scope);
    }
  }

  popScope(scope: Scope): void {
    this.scopes = this.scopes.filter((item) => item !== scope);
  }

  handleAdditionalScopes(event: KeyboardEvent): boolean {
    for (let i = this.scopes.length - 1; i >= 1; i--) {
      if (this.scopes[i].handleEvent(event)) {
        return true;
      }
    }
    return false;
  }

  handleEvent(event: KeyboardEvent): boolean {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].handleEvent(event)) {
        return true;
      }
    }
    return false;
  }

  static isModifier(evt: KeyboardEvent, modifier: Modifier): boolean {
    switch (modifier) {
      case "Mod":
        return Keymap.isModEvent(evt);
      case "Ctrl":
        return evt.ctrlKey;
      case "Meta":
        return evt.metaKey;
      case "Shift":
        return evt.shiftKey;
      case "Alt":
        return evt.altKey;
    }
  }

  static isModEvent(evt: MouseEvent | KeyboardEvent): boolean {
    return navigator.platform.toLowerCase().includes("mac")
      ? evt.metaKey
      : evt.ctrlKey;
  }
}

export class Scope {
  private keyBindings: Map<string, KeyBinding[]> = new Map();
  private isMacOS: boolean = false;
  private readonly application?: App;

  /** @public */
  constructor(parent?: Scope, application?: App) {
    this.application = application ?? parent?.application;
    if (parent) {
      for (const [key, value] of parent.keyBindings.entries()) {
        const handlers = value.map((h) => ({ ...h, scope: this }));
        this.keyBindings.set(key, handlers);
      }
    }
  }

  get keys() {
    return this.keyBindings.keys();
  }

  /**
   * Add a keymap event handler to this scope.
   *
   * @param modifiers - `Mod`, `Ctrl`, `Meta`, `Shift`, or `Alt`. `Mod`
   *   translates to `Meta` on macOS and `Ctrl` otherwise. Pass `null` to
   *   capture all events matching the `key`, regardless of modifiers.
   * @param key - Keycode from
   *   https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key%5FValues
   * @param func - The callback that will be called when a user triggers the
   *   keybind.
   * @public
   */
  register(
    modifiers: Modifier[] | null,
    key: string | null,
    func: KeymapEventListener,
  ): KeymapEventHandler {
    const binding: KeymapEventHandler = {
      modifiers: modifiers?.sort().join("+") ?? "",
      key,
      scope: this,
    };
    const id = this.getId(binding);
    if (!this.keyBindings.has(id)) {
      this.keyBindings.set(id, []);
    }
    this.keyBindings.get(id)!.push({ ...binding, handler: func });
    return binding;
  }

  /**
   * Remove an existing keymap event handler.
   *
   * @public
   */
  unregister(handler: KeymapEventHandler): void {
    const id = this.getId(handler);
    let handlers = this.keyBindings.get(id);
    if (!handlers) {
      return;
    }
    handlers = handlers.filter((binding) => {
      !(binding.modifiers === handler.modifiers && binding.key === handler.key);
    });
    handlers.length == 0
      ? this.keyBindings.delete(id)
      : this.keyBindings.set(id, handlers);
  }

  handleEvent(event: KeyboardEvent): boolean {
    const hotkey: Hotkey = { modifiers: [], key: "" };
    if (event.ctrlKey) hotkey.modifiers.push("Ctrl");
    if (event.altKey) hotkey.modifiers.push("Alt");
    if (event.shiftKey) hotkey.modifiers.push("Shift");
    if (event.metaKey) hotkey.modifiers.push("Meta");

    const key = event.key;
    if (
      key !== "Control" &&
      key !== "Alt" &&
      key !== "Shift" &&
      key !== "Meta"
    ) {
      hotkey.key = key;
    }
    const handlerIds = [
      keyId(hotkey),
      keyId({ modifiers: hotkey.modifiers, key: "" }),
      keyId({ modifiers: [], key: hotkey.key }),
      keyId({ modifiers: [], key: "" }),
    ];
    const handlers = handlerIds.flatMap((id) => this.keyBindings.get(id) || []);
    if (handlers.length) {
      for (const handler of handlers) {
        const response = handler.handler(event, { ...handler, vkey: "" });
        if (response === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (event.defaultPrevented) {
          return true;
        }
      }
    }

    const application = resolveApplication(this.application);
    const commands = application.commands.commandsFor(hotkey);
    for (const command of commands) {
      if (!application.commands.isCommandAvailable(command.id)) {
        continue;
      }
      void application.commands
        .executeCommand(command.id)
        .catch((error: unknown) => {
          console.warn(
            `Unable to execute command hotkey: ${command.id}`,
            error,
          );
        });
      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    return false;
  }

  private getId(handler: KeymapEventHandler): string {
    return keyId({
      modifiers: (handler.modifiers || "").split("+") as Modifier[],
      key: handler.key || "",
    });
  }
}
