import { Drawer as DrawerPrimitive, type DrawerDirection } from "vaul-svelte";
import Content from "./drawer-content.svelte";
import Overlay from "./drawer-overlay.svelte";
import Header from "./drawer-header.svelte";
import Footer from "./drawer-footer.svelte";
import Title from "./drawer-title.svelte";
import Description from "./drawer-description.svelte";
import type { Direction } from "./drawer.shared";

const Root = DrawerPrimitive.Root;
const NestedRoot = DrawerPrimitive.NestedRoot;
const Trigger = DrawerPrimitive.Trigger;
const Portal = DrawerPrimitive.Portal;
const Close = DrawerPrimitive.Close;

export {
  Root,
  NestedRoot,
  Trigger,
  Portal,
  Close,
  Overlay,
  Content,
  Header,
  Footer,
  Title,
  Description,
  type Direction,
  type DrawerDirection,
  Root as Drawer,
  NestedRoot as DrawerNestedRoot,
  Trigger as DrawerTrigger,
  Portal as DrawerPortal,
  Close as DrawerClose,
  Overlay as DrawerOverlay,
  Content as DrawerContent,
  Header as DrawerHeader,
  Footer as DrawerFooter,
  Title as DrawerTitle,
  Description as DrawerDescription,
};
