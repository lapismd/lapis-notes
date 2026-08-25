import { describe, expect, it, vi } from "vitest";

import { LGTM_IMAGE, runLgtm } from "./lgtm-command.mjs";

function container(overrides = {}) {
  return {
    Config: { Image: LGTM_IMAGE },
    State: { Running: true, Health: { Status: "healthy" } },
    NetworkSettings: {
      Ports: {
        "3000/tcp": [{ HostPort: "3000" }],
        "4317/tcp": [{ HostPort: "4317" }],
        "4318/tcp": [{ HostPort: "4318" }],
      },
    },
    ...overrides,
  };
}

describe("Grafana LGTM development command", () => {
  it("returns successfully when the expected container is healthy", () => {
    const runForeground = vi.fn();
    const log = vi.fn();
    const status = runLgtm({
      runCommand: () => JSON.stringify([container()]),
      runForeground,
      log,
    });

    expect(status).toBe(0);
    expect(runForeground).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      "Grafana LGTM is already running at http://localhost:3000",
    );
  });

  it("runs the local stack in the foreground when no container exists", () => {
    const missing = Object.assign(new Error("missing"), {
      status: 1,
      stderr: "Error: No such object: lgtm",
    });
    const runForeground = vi.fn(() => ({ status: 0 }));

    expect(
      runLgtm({
        runCommand: () => {
          throw missing;
        },
        runForeground,
      }),
    ).toBe(0);
    expect(runForeground).toHaveBeenCalledWith(
      "docker",
      [
        "run",
        "--name",
        "lgtm",
        "-p",
        "3000:3000",
        "-p",
        "4317:4317",
        "-p",
        "4318:4318",
        "--rm",
        LGTM_IMAGE,
      ],
      { stdio: "inherit" },
    );
  });

  it.each([
    ["wrong image", { Config: { Image: "grafana/grafana" } }],
    ["stopped", { State: { Running: false } }],
    [
      "wrong ports",
      { NetworkSettings: { Ports: { "3000/tcp": [{ HostPort: "3000" }] } } },
    ],
  ])("refuses an existing %s container", (_name, override) => {
    expect(() =>
      runLgtm({
        runCommand: () => JSON.stringify([container(override)]),
        runForeground: vi.fn(),
      }),
    ).toThrow("Refusing to replace it");
  });
});
