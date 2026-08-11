import Button from "./ButtonDemo.svelte?raw";
import Command from "./CommandDemo.svelte?raw";
import ConfirmDialog from "./ConfirmDialogDemo.svelte?raw";
import ContextMenu from "./ContextMenuDemo.svelte?raw";
import DateSetting from "./DateSettingDemo.svelte?raw";
import Drawer from "./DrawerDemo.svelte?raw";
import DropdownMenu from "./DropdownMenuDemo.svelte?raw";
import Helpers from "./HelpersDemo.svelte?raw";
import Input from "./InputDemo.svelte?raw";
import Modal from "./ModalDemo.svelte?raw";
import Popover from "./PopoverDemo.svelte?raw";
import Progress from "./ProgressDemo.svelte?raw";
import ScrollArea from "./ScrollAreaDemo.svelte?raw";
import Search from "./SearchDemo.svelte?raw";
import Select from "./SelectDemo.svelte?raw";
import SidebarCustom from "./SidebarCustomDemo.svelte?raw";
import Slider from "./SliderDemo.svelte?raw";
import Switch from "./SwitchDemo.svelte?raw";
import Table from "./TableDemo.svelte?raw";
import TableDnd from "./TableDndDemo.svelte?raw";
import Textarea from "./TextareaDemo.svelte?raw";
import ToggleGroup from "./ToggleGroupDemo.svelte?raw";
import Tooltip from "./TooltipDemo.svelte?raw";

const sources: Record<string, string> = {
  "api-button": Button,
  "api-command": Command,
  "api-confirm-dialog": ConfirmDialog,
  "api-context-menu": ContextMenu,
  "api-date-setting": DateSetting,
  "api-drawer": Drawer,
  "api-dropdown-menu": DropdownMenu,
  "api-helpers": Helpers,
  "api-input": Input,
  "api-modal": Modal,
  "api-popover": Popover,
  "api-progress": Progress,
  "api-scroll-area": ScrollArea,
  "api-search": Search,
  "api-select": Select,
  "api-sidebar-custom": SidebarCustom,
  "api-slider": Slider,
  "api-switch": Switch,
  "api-table": Table,
  "api-table-dnd": TableDnd,
  "api-textarea": Textarea,
  "api-toggle-group": ToggleGroup,
  "api-tooltip": Tooltip,
};

export function apiExampleSource(catalogId: string): string {
  const source = sources[catalogId];
  if (!source) throw new Error(`Missing API example source for ${catalogId}`);
  return source;
}
