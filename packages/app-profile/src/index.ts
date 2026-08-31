import * as LapisApiHostModule from "@lapis-notes/api";
import {
  RendererImportMapPluginDependencyResolver,
  type ImplicitRendererEsmHostModule,
  type PluginDependencyResolverFactory,
  type PluginProfile,
} from "@lapis-notes/api";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import * as MarkdownEmbedHostModule from "@lapis-notes/markdown/embed";
import markdownStyles from "@lapis-notes/markdown/styles.css?inline";
import { SearchPlugin } from "@lapis-notes/search";
import searchStyles from "@lapis-notes/search/styles.css?inline";
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import sourceEditorStyles from "@lapis-notes/source-editor/styles.css?inline";
import { registerPluginManagementSettings } from "@lapis-notes/workspace";
import * as SvelteHostModule from "svelte";
// @ts-ignore Svelte does not type this entry in every consumer program.
import * as SvelteInternalClientHostModule from "svelte/internal/client";
// @ts-ignore Svelte does not type this entry in every consumer program.
import * as SvelteDiscloseVersionHostModule from "svelte/internal/disclose-version";

export const registerNotesPluginSettings = registerPluginManagementSettings;

const implicitNotesRendererHostModules = {
  svelte: SvelteHostModule,
  "svelte/internal/client": SvelteInternalClientHostModule,
  "svelte/internal/disclose-version": SvelteDiscloseVersionHostModule,
} as const satisfies Record<ImplicitRendererEsmHostModule, unknown>;

export const notesPluginHostModules = {
  "@lapis-notes/api": LapisApiHostModule,
  "@lapis-notes/markdown/embed": MarkdownEmbedHostModule,
  ...implicitNotesRendererHostModules,
} as const;

export const createNotesPluginDependencyResolver: PluginDependencyResolverFactory =
  (dependencies) => {
    Object.assign(dependencies, notesPluginHostModules);
    return new RendererImportMapPluginDependencyResolver(dependencies);
  };

/**
 * The application-owned default plugin profile shared by every Lapis Notes host.
 *
 * Plugins remain optional so a user can disable each one. CSS is registered as
 * lifecycle-owned text instead of being imported by either host globally.
 */
export const notesPluginProfile = [
  {
    plugin: SourceEditorPlugin,
    required: false,
    enabledByDefault: true,
    styles: sourceEditorStyles,
  },
  {
    plugin: MarkdownPlugin,
    required: false,
    enabledByDefault: true,
    styles: markdownStyles,
  },
  {
    plugin: FileExplorerPlugin,
    required: false,
    enabledByDefault: true,
  },
  {
    plugin: SearchPlugin,
    required: false,
    enabledByDefault: true,
    styles: searchStyles,
  },
] as const satisfies PluginProfile;
