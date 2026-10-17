import {
  App,
  type AppStateProperties,
  type PluginHostRestrictions,
} from "@lapis-notes/api";

const unavailablePlugins: PluginHostRestrictions = { example: "desktop-only" };
const properties: AppStateProperties = {
  version: "host-policy-contract",
  markdownRenderer: async () => undefined,
  unavailablePlugins,
};
const app = new App(properties);
const reasons = app.pluginDistribution.getCompatibility?.("example")?.reasons;
// @ts-expect-error Host policy is not a renderer-safe public App property.
app.props.unavailablePlugins;
void reasons;
