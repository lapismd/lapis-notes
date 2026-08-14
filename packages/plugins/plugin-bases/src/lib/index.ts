import "./bases-view/functions";
import { BasesPlugin } from "./bases-plugin";
import "./styles.css";

export { BasesPlugin };
export { default as BasesViewSurface } from "./bases-view-surface.svelte";
export {
  BasesViewType,
  parseBasesDocument,
  serializeBasesDocument,
} from "./bases-view";
export type {
  AnyBasesView,
  BasesDocument,
  BasesViewBase,
  CardsView,
  CustomBasesView,
  FilterLine,
  Filters,
  ListView,
  MapView,
  SortColumn,
  TableView,
} from "./bases-view/models";
export type { BasesViewRegistration } from "./bases-view/bases.svelte";
export default BasesPlugin;
