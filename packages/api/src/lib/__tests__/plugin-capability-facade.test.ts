import { describe, expect, it } from "vitest";

import {
  createHostedPluginCapabilityFacade,
  HOSTED_PLUGIN_CAPABILITIES,
  type HostedPluginCapabilityBroker,
  type HostedPluginCapabilityRequest,
} from "../plugin-capability-facade";

describe("hosted plugin capability facade", () => {
  it("maps facade calls to structured broker requests", async () => {
    const requests: HostedPluginCapabilityRequest[] = [];
    const broker: HostedPluginCapabilityBroker = {
      async invoke<T>(request: HostedPluginCapabilityRequest): Promise<T> {
        requests.push(request);
        if (request.action === "exists") {
          return true as T;
        }
        if (request.action === "list") {
          return { files: ["Note.md"], folders: ["Folder"] } as T;
        }
        if (request.action === "load") {
          return { enabled: true } as T;
        }
        return undefined as T;
      },
    };

    const facade = createHostedPluginCapabilityFacade({
      pluginId: "sample-plugin",
      broker,
    });

    await expect(facade.vault.exists("Note.md")).resolves.toBe(true);
    await expect(facade.vault.list()).resolves.toEqual({
      files: ["Note.md"],
      folders: ["Folder"],
    });
    await expect(facade.pluginData.load()).resolves.toEqual({
      enabled: true,
    });
    await facade.commands.register({
      id: "open-panel",
      name: "Open panel",
      icon: "panel-right",
    });
    await facade.notices.show("Saved", { timeoutMs: 1500 });
    await facade.settings.registerSurface({ id: "main", title: "Settings" });
    await facade.metadata.query({ tag: "task", limit: 5 });
    await facade.events.subscribe("vault:modify", { pathPrefix: "Notes" });
    await facade.logging.warn("A structured warning", { code: "W_SAMPLE" });

    expect(requests).toEqual([
      {
        pluginId: "sample-plugin",
        capability: "vault:read",
        action: "exists",
        payload: { path: "Note.md" },
      },
      {
        pluginId: "sample-plugin",
        capability: "vault:read",
        action: "list",
        payload: { path: "/" },
      },
      {
        pluginId: "sample-plugin",
        capability: "plugin:data",
        action: "load",
        payload: {},
      },
      {
        pluginId: "sample-plugin",
        capability: "commands",
        action: "register",
        payload: {
          command: {
            id: "open-panel",
            name: "Open panel",
            icon: "panel-right",
          },
        },
      },
      {
        pluginId: "sample-plugin",
        capability: "notices",
        action: "show",
        payload: { message: "Saved", timeoutMs: 1500 },
      },
      {
        pluginId: "sample-plugin",
        capability: "settings",
        action: "register-surface",
        payload: { surface: { id: "main", title: "Settings" } },
      },
      {
        pluginId: "sample-plugin",
        capability: "metadata:query",
        action: "query",
        payload: { query: { tag: "task", limit: 5 } },
      },
      {
        pluginId: "sample-plugin",
        capability: "events",
        action: "subscribe",
        payload: { event: "vault:modify", options: { pathPrefix: "Notes" } },
      },
      {
        pluginId: "sample-plugin",
        capability: "logging",
        action: "log",
        payload: {
          level: "warn",
          message: "A structured warning",
          data: { code: "W_SAMPLE" },
        },
      },
    ]);
  });

  it("advertises the initial background-safe capability set", () => {
    expect(HOSTED_PLUGIN_CAPABILITIES).toEqual([
      "vault:read",
      "vault:write",
      "plugin:data",
      "commands",
      "notices",
      "settings",
      "metadata:query",
      "events",
      "logging",
    ]);
  });
});
