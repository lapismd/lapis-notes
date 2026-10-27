import { expect, test } from "@playwright/test";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { join, resolve } from "node:path";
import { RustServerRuntime, unusedLoopbackPort } from "./rust-server-runtime";

test("native queue controls preserve cancellation and require explicit cold resume in the retained chat screen", async ({
  page,
}, testInfo) => {
  const repository = resolve("../..");
  const root = await mkdtemp(join(repository, ".local/rust-queue-browser-"));
  const password = randomBytes(32).toString("base64url");
  const origin = `http://localhost:${await unusedLoopbackPort()}`;
  const helper = join(root, "peer.py"),
    log = join(root, "worker.jsonl"),
    release = join(root, "release");
  await copyFile(
    join(
      repository,
      "crates/lapis-app-core/tests/support/native_queue/peer.py",
    ),
    helper,
  );
  await chmod(helper, 0o700);
  const agents = join(root, "agents.json");
  await writeFile(
    agents,
    JSON.stringify([
      {
        id: "opaque-fixture",
        label: "Display name",
        default_mode: "plan",
        executable: helper,
        environment: { LOG: log, RELEASE: release },
        queue_selection: {
          recipient: {
            id: "writer",
            label: "Writer",
            token: "jj-store-agent:777269746572;",
          },
          target: { id: "writer", agent: "local", thinking: "default" },
        },
      },
    ]),
  );
  const service = new RustServerRuntime(
    root,
    repository,
    origin,
    password,
    agents,
  );
  await mkdir(join(service.vault, ".lapis"), { recursive: true });
  await writeFile(
    join(service.vault, ".lapis/core-plugins.json"),
    JSON.stringify({ disabled: [], enabled: ["ai"] }),
  );
  const frames = async () =>
    (await readFile(log, "utf8"))
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  await service.start();
  try {
    await page.goto(origin);
    await page.getByLabel("Username").fill("owner");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page
      .getByRole("button", { name: "Open Rust vault", exact: true })
      .click();
    await page.getByRole("button", { name: "Open Chat", exact: true }).click();
    const chat = page.locator('[data-native-chat="true"]:visible');
    const editor = chat.getByRole("textbox", { name: "Message", exact: true });
    await editor.fill("held-first");
    await chat
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect
      .poll(
        async () => (await frames()).filter((f) => f.type === "prompt").length,
      )
      .toBe(1);
    await editor.fill("Cancelled before dispatch");
    await chat
      .getByRole("button", { name: "Queue message", exact: true })
      .click();
    const queue = chat.getByRole("region", {
      name: "Queued messages",
      exact: true,
    });
    await expect(queue).toContainText("Cancelled before dispatch");
    await queue
      .getByRole("button", {
        name: "Cancel queued message for Writer",
        exact: true,
      })
      .click();
    await expect(queue).toHaveCount(0);
    await editor.fill("After explicit cold resume");
    await chat
      .getByRole("button", { name: "Queue message", exact: true })
      .click();
    await expect(queue).toContainText("After explicit cold resume");
    await chat
      .getByRole("button", { name: "Pause queue", exact: true })
      .click();
    await expect(
      chat.getByRole("button", { name: "Resume queue", exact: true }),
    ).toBeVisible();
    await writeFile(release, "release");
    await expect(
      chat.getByRole("button", { name: "Stop agent", exact: true }),
    ).toHaveCount(0);
    await page.reload();
    await page
      .getByRole("button", { name: "Open Rust vault", exact: true })
      .click();
    await expect(queue).toContainText("After explicit cold resume");
    expect((await frames()).filter((f) => f.type === "prompt")).toHaveLength(1);
    await service.restart();
    await page.reload();
    await page
      .getByRole("button", { name: "Open Rust vault", exact: true })
      .click();
    await expect(queue).toContainText("After explicit cold resume");
    await expect(
      chat.getByRole("button", { name: "Resume queue", exact: true }),
    ).toBeVisible();
    expect((await frames()).filter((f) => f.type === "prompt")).toHaveLength(1);
    await chat
      .getByRole("button", { name: "Resume queue", exact: true })
      .click();
    await expect(chat).toContainText("reply café 📝");
    await expect(queue).toHaveCount(0);
    expect(
      (await frames()).filter((f) => f.type === "prompt").map((f) => f.text),
    ).toEqual(["held-first", "After explicit cold resume"]);
    const conversations = await readdir(
      join(service.vault, ".lapis/agents/sessions"),
    );
    expect(conversations).toHaveLength(1);
    const stored = JSON.parse(
      await readFile(
        join(
          root,
          "profile/turns/queues",
          service.vaultId,
          conversations[0] + ".json",
        ),
        "utf8",
      ),
    );
    expect(stored.entries.map((entry: any) => entry.phase)).toEqual([
      "cancelled",
      "completed",
    ]);
    const transcript = (
      await readFile(
        join(
          service.vault,
          ".lapis/agents/sessions",
          conversations[0],
          "transcript.jsonl",
        ),
        "utf8",
      )
    )
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const capture = stored.entries[1].input.capture;
    expect(transcript.find((entry) => entry.id === capture.user.id)).toEqual(
      capture.user,
    );
    expect(
      transcript.find(
        (entry) =>
          entry.type === "queue.outcome" && entry.queued.id === capture.id,
      ),
    ).toMatchObject({
      parentId: capture.user.id,
      outcome: "completed",
      queued: capture,
    });
    expect(
      new Set([
        stored.entries[1].input.acceptance_id,
        stored.entries[1].request_id,
        capture.id,
        capture.user.id,
      ]).size,
    ).toBe(4);
    expect(
      (await frames()).filter((f) => f.type === "configure").map((f) => f.mode),
    ).toEqual(["plan", "plan"]);
    for (const configuration of (await frames()).filter(
      (f) => f.type === "configure",
    ))
      expect(configuration).not.toHaveProperty("effort");
  } catch (error) {
    await testInfo.attach("Rust queue host log", {
      body: service.logs,
      contentType: "text/plain",
    });
    throw error;
  } finally {
    await writeFile(release, "release");
    await service.stop();
  }
});
