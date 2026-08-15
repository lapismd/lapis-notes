/**
 * Curated entry point for the public plugin API reference published on
 * lapis.md.
 *
 * Keep this list focused on the supported plugin-author surface rather than the
 * package's full internal export barrel.
 */

export {
  App,
  createDefaultAppSafeModeState,
  RenderContext,
  SecretStorage,
} from "./context.svelte";
export type {
  AppSafeModeFailure,
  AppSafeModeState,
  AppStateProperties,
} from "./context.svelte";
export {
  getApplicationCompatibility,
  installApplicationCompatibility,
  resolveApplication,
} from "./application-compatibility";
export {
  provideApplicationState,
  useApplicationState,
} from "./application-state.svelte";

export { Plugin, resolvePluginDataPath } from "./plugin";
export type {
  PluginManifest,
  PluginRuntimeOptions,
  PluginSource,
} from "./plugin";
export type {
  LapisExtensionContributions,
  LapisExtensionKind,
  LapisExtensionManifest,
  LapisExtensionPermission,
  LapisExtensionRuntimeHost,
  LapisPluginClassification,
} from "./lapis-extension";
export { PluginManager } from "./plugin-manager";
export { AppUrlService } from "./app-url";
export { FileManager } from "./file-manager";
export {
  AppSettings,
  ButtonComponent,
  DropdownComponent,
  Modal,
  PluginSettingTab,
  ProgressBarComponent,
  SearchComponent,
  Setting,
  SliderComponent,
  TextAreaComponent,
  TextComponent,
  ToggleComponent,
} from "./settings.svelte";
export { Menu, MenuItem, MenuSeparator } from "./menu.svelte";

export { CommandManager, Keymap, Scope } from "./command.svelte";
export type {
  Command,
  Hotkey,
  HotkeyAssignment,
  HotkeyConflict,
  KeymapContext,
  KeymapEventHandler,
  KeymapInfo,
} from "./command.svelte";

export {
  Component,
  FileView,
  ItemView,
  TextFileView,
  View,
} from "./view.svelte";
export type { ViewState, ViewStateResult } from "./view.svelte";
export {
  Notice,
  Workspace,
  WorkspaceLeaf,
  WorkspaceSidebarGroup,
  WorkspaceSidedock,
  WorkspaceSplit,
  WorkspaceTabs,
} from "./workspace.svelte";
export type { OpenViewState, WorkspaceHintTarget } from "./workspace.svelte";

export {
  AbstractInputSuggest,
  EditorSuggest,
  FuzzySuggestModal,
  PopoverSuggest,
  SuggestModal,
} from "./suggest";
export type { EditorSuggestContext, EditorSuggestTriggerInfo } from "./suggest";
export { Editor } from "./editor.svelte";
export type {
  EditorChange,
  EditorPosition,
  EditorRange,
  EditorRangeOrCaret,
  EditorScrollInfo,
  EditorSelection,
  EditorSelectionOrCaret,
  EditorTransaction,
  MarkdownFileInfo,
} from "./editor.svelte";
export { MarkdownRenderChild } from "./markdown";
export type {
  MarkdownDirectiveRenderer,
  MarkdownPostProcessor,
  MarkdownPostProcessorContext,
  MarkdownViewMenuItemProvider,
} from "./markdown";

export { MetadataCache } from "./cache.svelte";
export type { CachedMetadata } from "./cache.svelte";
export { TAbstractFile, TFile, TFolder, Vault } from "./storage";
export type {
  DataAdapter,
  VaultAdapter,
  VaultAdapterCapabilities,
  VaultIdentityAdapter,
  VaultProfile,
  VaultProfileDemoMetadata,
  VaultSession,
} from "./storage";
export { normalizePath } from "./storage/path";

export { addIcon } from "./icons/index";

export {
  NotificationManager,
  NotificationProgressHandle,
} from "./notifications";
export type {
  NotifyOptions,
  NotificationProgressOptions,
  NotificationProgressReport,
  NotificationProgressSnapshot,
  NotificationProgressToken,
} from "./notifications";
export { EventDispatcher } from "./events";
export { LanguageServiceManager } from "./language-service";
export type {
  LanguageServiceCompletionItem,
  LanguageServiceDiagnostic,
  LanguageServiceHover,
  LanguageServiceLocation,
  LanguageServiceProvider,
  LanguageServiceProviderCapabilities,
  LanguageServiceProviderMetadata,
} from "./language-service";
