import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  createWriteStream,
} from "node:fs";
import { resolve, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

test(
  "actual native hosted provider finishes after client detach and retains its exact turn cold",
  { skip: process.env.LAPIS_SERVER_PROVIDER_TEST !== "1", timeout: 240000 },
  async (context) => {
    const agents = process.env.LAPIS_SERVER_TEST_AGENTS_CONFIG;
    assert.ok(
      agents,
      "Set an explicit operator-owned LAPIS_SERVER_TEST_AGENTS_CONFIG",
    );
    const binary = resolve(
      process.env.LAPIS_SERVER_TEST_BINARY ??
        ".local/rust-core-target/debug/lapis-server",
    );
    const target = process.env.LAPIS_SERVER_TEST_TARGET ?? "codex";
    const model = process.env.LAPIS_SERVER_TEST_MODEL ?? "gpt-5.6-sol";
    mkdirSync(resolve(".local"), { recursive: true });
    const root = mkdtempSync(resolve(".local/core-hosted-provider-"));
    const vault = join(root, "Vault"),
      profile = join(root, "profile");
    mkdirSync(vault);
    mkdirSync(profile);
    mkdirSync(join(root, "Other"));
    const ids = [randomUUID(), randomUUID()],
      token = randomBytes(32).toString("base64url");
    writeFileSync(
      join(root, "bootstrap-password"),
      randomBytes(32).toString("base64url"),
      { mode: 0o600 },
    );
    writeFileSync(
      join(root, "config.json"),
      JSON.stringify({
        vaults: ids.map((id, i) => ({
          id,
          name: i ? "Other" : "Vault",
          root: i ? join(root, "Other") : vault,
        })),
      }),
    );

    writeFileSync(join(vault, "Note.md"), "# Hosted provider qualification\n");
    const receipt = { root, stages: [] };
    function save(stage, facts = {}) {
      receipt.stages.push({ stage, at: new Date().toISOString(), ...facts });
      writeFileSync(
        join(root, "receipt.json"),
        JSON.stringify(receipt, null, 2),
      );
      console.log(stage, JSON.stringify(facts));
    }
    let child, exited, base;
    context.after(async () => {
      if (child?.exitCode === null && child.signalCode === null) await stop();
    });
    async function launch(name) {
      const env = { ...process.env };
      for (const k of Object.keys(env))
        if (k.startsWith("LAPIS_SERVER_")) delete env[k];
      Object.assign(env, {
        LAPIS_SERVER_TOKEN: token,
        LAPIS_SERVER_DATA_ROOT: profile,
        LAPIS_SERVER_BOOTSTRAP_USERNAME: "owner",
        LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE: join(root, "bootstrap-password"),
        LAPIS_SERVER_ORIGIN: "http://localhost:29999",
        LAPIS_SERVER_INSECURE_COOKIE: "1",
        LAPIS_SERVER_AGENTS_CONFIG: resolve(agents),
      });
      child = spawn(binary, [join(root, "config.json"), "127.0.0.1:0"], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const log = createWriteStream(join(root, `${name}.log`));
      let text = "";
      child.stdout.on("data", (b) => {
        text += String(b);
      });
      child.stdout.pipe(log, { end: false });
      child.stderr.pipe(log, { end: false });
      exited = new Promise((res, rej) => {
        child.once("error", rej);
        child.once("exit", (code, signal) => {
          log.end();
          res({ code, signal });
        });
      });
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        const m = /Lapis file service listening on ([^\s]+)/.exec(text);
        if (m) {
          base = `http://${m[1]}`;
          return;
        }
        if (child.exitCode !== null) throw Error("Server exited before ready");
        await delay(50);
      }
      throw Error("Server readiness timed out");
    }
    async function stop() {
      child.kill("SIGTERM");
      const timer = setTimeout(() => child.kill("SIGKILL"), 15000);
      try {
        assert.deepEqual(await exited, { code: 0, signal: null });
      } finally {
        clearTimeout(timer);
      }
    }
    async function request(method, path, body) {
      const response = await fetch(base + path, {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          "x-lapis-protocol": "3",
          ...(body ? { "content-type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      assert.ok(
        response.ok,
        `${method} ${path}: ${response.status} ${response.ok ? "" : await response.text()}`,
      );
      return response.status === 204 ? null : response.json();
    }
    const attach = (i) =>
      request("POST", `/api/v3/vaults/${ids[i]}/clients`, {
        protocol_version: 3,
      });
    const call = (c, command) =>
      request("POST", `/api/v3/clients/${c.client_id}/turns`, command);
    try {
      await launch("hosted-provider");
      const client = await attach(0);
      const requestId = randomUUID(),
        witness = `HOSTED-DETACH-${randomUUID()}`;
      const input = {
        request_id: requestId,
        target_id: target,
        scope_dir: "",
        context: null,
        prompt: `Return exactly the string ${witness}. Do not inspect files or use tools.`,
        options: {
          model,
          effort: null,
          mode: "read-only",
          max_duration_ms: 120000,
        },
      };
      const accepted = (await call(client, { kind: "submit", input })).record;
      assert.ok(["accepted", "running"].includes(accepted.phase));
      save("accepted", {
        requestId,
        conversationId: accepted.conversation_id,
        phase: accepted.phase,
      });
      await request("DELETE", `/api/v3/clients/${client.client_id}`);
      const journal = join(profile, "turns", ids[0], `${requestId}.json`);
      let record = JSON.parse(readFileSync(journal, "utf8"));
      assert.ok(["accepted", "running"].includes(record.phase));
      save("detached", { phase: record.phase });
      const deadline = Date.now() + 150000;
      while (
        ["accepted", "running"].includes(record.phase) &&
        Date.now() < deadline
      ) {
        await delay(250);
        record = JSON.parse(readFileSync(journal, "utf8"));
      }
      save("terminal-without-client", {
        phase: record.phase,
        failureCode: record.failure_code,
        output: record.output,
      });
      assert.equal(record.phase, "completed");
      assert.equal(record.output.trim(), witness);
      const next = await attach(0);
      assert.deepEqual(
        (await call(next, { kind: "read", request_id: requestId })).record,
        record,
      );
      const other = await attach(1);
      assert.equal(
        (await call(other, { kind: "read", request_id: requestId })).record,
        null,
      );
      const portable = join(
        vault,
        ".lapis/agents/sessions",
        record.conversation_id,
        "transcript.jsonl",
      );
      const hash = () =>
        createHash("sha256").update(readFileSync(portable)).digest("hex");
      const before = hash();
      await stop();
      save("clean-stop", { transcriptSha256: before });
      await launch("hosted-provider-cold");
      const cold = await attach(0);
      assert.deepEqual(
        (await call(cold, { kind: "read", request_id: requestId })).record,
        record,
      );
      assert.deepEqual(
        (await call(cold, { kind: "submit", input })).record,
        record,
      );
      await delay(1000);
      assert.equal(hash(), before);
      save("cold-retained-idempotent", {
        phase: record.phase,
        transcriptSha256: before,
      });
      await stop();
      save("complete");
    } catch (error) {
      save("failed", { error: String(error.stack ?? error) });
      throw error;
    }
  },
);
