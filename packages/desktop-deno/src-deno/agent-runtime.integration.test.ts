import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect, it } from "vitest";
import { ControllerClient } from "@lapismd/ai-controller/client";
import {
  ControllerRuntime,
  type AgentEvent,
} from "@lapismd/ai-controller/runtime";
import { ManagedControllerProcess } from "@lapismd/ai-controller/managed";
import { DenoAgentRuntimeHost } from "./agent-runtime";

it.skipIf(!process.env.LAPIS_AI_CONTROLLER_BIN)(
  "round trips an app tool through the compiled controller, ACP and MCP shim",
  async () => {
    const root = await mkdtemp(join(tmpdir(), "lapis-desktop-controller-"));
    const workspace = join(root, "vault");
    await mkdir(workspace);
    const fixture = join(root, "agent.mjs");
    await writeFile(
      fixture,
      `import { createInterface } from 'node:readline';
import { spawn } from 'node:child_process';
const send = value => process.stdout.write(JSON.stringify(value) + '\\n');
let servers = [];
async function tool() {
  const server = servers[0];
  const child = spawn(server.command, server.args, { env: { ...process.env, ...Object.fromEntries((server.env ?? []).map(item => [item.name, item.value])) }, stdio: ['pipe', 'pipe', 'inherit'] });
  const pending = new Map(); let next = 0;
  const reader = createInterface({ input: child.stdout });
  reader.on('line', line => { const frame = JSON.parse(line); if (frame.id !== undefined) pending.get(frame.id)?.(frame); });
  const call = (method, params) => new Promise((resolve, reject) => { const id = ++next; pending.set(id, frame => frame.error ? reject(Error(frame.error.message)) : resolve(frame.result)); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\\n'); });
  try {
    await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'desktop-fixture', version: '1' } });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\\n');
    return await call('tools/call', { name: 'read_note', arguments: { path: 'Notes/hello.md' } });
  } finally { child.kill(); reader.close(); }
}
for await (const line of createInterface({ input: process.stdin })) {
  const request = JSON.parse(line); if (request.id === undefined) continue;
  let result = {};
  if (request.method === 'initialize') result = { protocolVersion: 1, agentCapabilities: { loadSession: true, mcpCapabilities: { http: true } }, authMethods: [] };
  if (request.method === 'session/new' || request.method === 'session/load') { servers = request.params.mcpServers; result = { sessionId: 'fixture-session' }; }
  if (request.method === 'session/prompt') {
    const result = await tool();
    send({ jsonrpc: '2.0', method: 'session/update', params: { sessionId: request.params.sessionId, update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: result.content[0].text } } } });
    send({ jsonrpc: '2.0', id: request.id, result: { stopReason: 'end_turn' } }); continue;
  }
  send({ jsonrpc: '2.0', id: request.id, result });
}`,
    );
    const registry = join(root, "agents.json");
    await writeFile(
      registry,
      JSON.stringify({
        agents: [
          {
            id: "fixture",
            label: "Fixture",
            enabled: true,
            command: [process.execPath, fixture],
            mcpTransport: "stdio",
          },
        ],
      }),
    );
    const host = new DenoAgentRuntimeHost({
      dataDirectory: root,
      env: { ...process.env, HOME: root },
      start: (options) =>
        ManagedControllerProcess.start({ ...options, agentConfig: registry }),
    });
    let client: ControllerClient | undefined;
    try {
      const descriptor = await host.handle("desktop_ai_controller_connection", {
        workspace,
      });
      client = new ControllerClient(descriptor);
      let calls = 0;
      const unregister = await client.registerEndpoint({
        id: "lapis.test-tools",
        tools: [
          {
            name: "read_note",
            description: "Read an authorized note",
            effect: "read",
            inputSchema: {
              type: "object",
              properties: { path: { type: "string" } },
              required: ["path"],
            },
          },
        ],
        handle: async (request) => {
          expect(request.operation).toBe("tool.execute");
          calls++;
          return {
            content: [{ type: "text", text: "desktop-controller-app-tool-ok" }],
          };
        },
      });
      const runtime = new ControllerRuntime({
        id: "fixture",
        client,
        provider: () => "fixture",
        workspace: () => descriptor.workspace,
        prepare: async () => ({ thread: { toolEndpoint: "lapis.test-tools" } }),
      });
      const session = await runtime.start({ prompt: "" });
      const events: AgentEvent[] = [];
      const pump = (async () => {
        for await (const event of session.events()) events.push(event);
      })();
      try {
        await session.send("Read the note");
        await expect
          .poll(() => events.at(-1)?.type, { timeout: 20_000 })
          .toBe("completed");
        expect(
          events
            .filter((event) => event.type === "text")
            .map((event) => event.text)
            .join(""),
        ).toBe("desktop-controller-app-tool-ok");
        expect(calls).toBe(1);
        const snapshot = await client.snapshot(session.id);
        expect(snapshot.turns[0]?.state).toBe("completed");
      } finally {
        await session.close();
        await pump;
        await unregister();
      }
    } finally {
      client?.dispose();
      await host.shutdown();
      await rm(root, { recursive: true, force: true });
    }
  },
  45_000,
);
