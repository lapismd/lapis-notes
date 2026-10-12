import BookmarkIcon from "@lucide/svelte/icons/bookmark";
import FileCodeIcon from "@lucide/svelte/icons/file-code-2";
import FileTextIcon from "@lucide/svelte/icons/file-text";
import HistoryIcon from "@lucide/svelte/icons/history";
import ListChecksIcon from "@lucide/svelte/icons/list-checks";
import NetworkIcon from "@lucide/svelte/icons/network";
import PackageIcon from "@lucide/svelte/icons/package";
import PresentationIcon from "@lucide/svelte/icons/presentation";
import SearchIcon from "@lucide/svelte/icons/search";
import SparklesIcon from "@lucide/svelte/icons/sparkles";
import SpellCheckIcon from "@lucide/svelte/icons/spell-check-2";
import TableIcon from "@lucide/svelte/icons/table-2";
import WholeWordIcon from "@lucide/svelte/icons/whole-word";
import type { Component } from "svelte";

const registryPluginIcons: Record<string, Component> = {
  bookmark: BookmarkIcon,
  "file-code-2": FileCodeIcon,
  "file-text": FileTextIcon,
  history: HistoryIcon,
  "list-checks": ListChecksIcon,
  network: NetworkIcon,
  package: PackageIcon,
  presentation: PresentationIcon,
  search: SearchIcon,
  sparkles: SparklesIcon,
  "spell-check-2": SpellCheckIcon,
  "table-2": TableIcon,
  "whole-word": WholeWordIcon,
};

export function registryPluginIcon(value: string | undefined): Component {
  return registryPluginIcons[value?.toLocaleLowerCase() ?? ""] ?? PackageIcon;
}
