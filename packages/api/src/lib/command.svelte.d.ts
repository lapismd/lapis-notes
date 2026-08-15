import type { App } from "./context.svelte";
import type { Editor } from "./editor.svelte";
import { EventDispatcher } from "./events";
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
    editorCheckCallback?: (checking: boolean, editor: Editor, ctx: any) => boolean | void;
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
export declare function getHotkeyId(hotkey: Hotkey): string;
export declare class CommandManager extends EventDispatcher<{
    register: [command: Command];
    unregister: [command: Command];
    executed: [command: Command];
    "hotkeys-updated": [
        event: {
            commandId?: string;
            hotkeys: Record<string, Hotkey[]>;
        }
    ];
}> {
    readonly app: App;
    open: boolean;
    openHostId: string;
    readonly commands: Record<string, Command>;
    readonly editorCommands: Record<string, Command>;
    readonly bindings: Record<string, Command[]>;
    readonly hotkeyOverrides: Record<string, Hotkey[]>;
    constructor(app: App);
    private currentHostId;
    isOpenForHost(hostId: string): boolean;
    private resolveExecutionContext;
    private hasExecutableHandler;
    private toCommandMetadata;
    private hasHotkeyOverride;
    private bindCommandHotkeys;
    private rebuildBindings;
    private readHotkeyOverrideFile;
    private normalizeOverrides;
    private dedupeHotkeys;
    loadHotkeys(): Promise<void>;
    saveHotkeys(): Promise<void>;
    private replaceHotkeyOverrides;
    getDefaultHotkeys(commandId: string): Hotkey[];
    getEffectiveHotkeys(commandId: string): Hotkey[];
    isHotkeyCustomized(commandId: string): boolean;
    setHotkeys(commandId: string, hotkeys: Hotkey[]): Promise<void>;
    addHotkey(commandId: string, hotkey: Hotkey): Promise<void>;
    removeHotkey(commandId: string, hotkey: Hotkey): Promise<void>;
    resetHotkeys(commandId: string): Promise<void>;
    getHotkeyAssignments(): HotkeyAssignment[];
    getHotkeyConflicts(): HotkeyConflict[];
    registerCommand(command: Command): void;
    unregisterCommand(id: string): boolean;
    getCommand(id: string): Command | undefined;
    getCommandMetadata(id: string): CommandMetadata | undefined;
    isCommandAvailable(id: string, hostId?: string): boolean;
    getAvailableCommands(hostId?: string): Command[];
    getAvailableCommandMetadata(hostId?: string): CommandMetadata[];
    private executeCommandWithHost;
    executeCommand<T>(id: string, ...rest: any[]): Promise<T>;
    executeCommandForHost<T>(id: string, hostId: string, ...rest: any[]): Promise<T>;
    show(hostId?: string): void;
    hide(hostId?: string): void;
    toggle(hostId?: string): void;
    commandsFor(key: Hotkey): Command[];
    getAllCommands(): Command[];
    getAllCommandMetadata(): CommandMetadata[];
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
export type KeymapEventListener = (evt: KeyboardEvent, ctx: KeymapContext) => false | any;
export type UserEvent = MouseEvent | KeyboardEvent | TouchEvent | PointerEvent;
export declare class Keymap {
    private scopes;
    constructor(defaultScope?: Scope);
    pushScope(scope: Scope): void;
    popScope(scope: Scope): void;
    handleAdditionalScopes(event: KeyboardEvent): boolean;
    handleEvent(event: KeyboardEvent): boolean;
    static isModifier(evt: KeyboardEvent, modifier: Modifier): boolean;
    static isModEvent(evt: MouseEvent | KeyboardEvent): boolean;
}
export declare class Scope {
    private keyBindings;
    private isMacOS;
    private readonly application;
    /** @public */
    constructor(parent?: Scope, application?: App);
    get keys(): MapIterator<string>;
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
    register(modifiers: Modifier[] | null, key: string | null, func: KeymapEventListener): KeymapEventHandler;
    /**
     * Remove an existing keymap event handler.
     *
     * @public
     */
    unregister(handler: KeymapEventHandler): void;
    handleEvent(event: KeyboardEvent): boolean;
    private getId;
}
