import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  createDesktopLogger,
  type DesktopLogSink,
  normalizeDesktopLogLevel,
} from "./desktop-logging";

function createSink(): DesktopLogSink {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe("Deno desktop logging", () => {
  it("defaults to info and suppresses routine debug traces", () => {
    const sink = createSink();
    const logger = createDesktopLogger({ sink });

    logger.debug("invoke");
    logger.info("ready");
    logger.warn("degraded");
    logger.error("failed");

    expect(logger.level).toBe("info");
    expect(sink.debug).not.toHaveBeenCalled();
    expect(sink.info).toHaveBeenCalledWith("ready");
    expect(sink.warn).toHaveBeenCalledWith("degraded");
    expect(sink.error).toHaveBeenCalledWith("failed");
  });

  it("enables invocation traces only at debug level", () => {
    const sink = createSink();
    const logger = createDesktopLogger({ level: "DEBUG", sink });

    logger.debug("invoke desktop_file_read");

    expect(logger.level).toBe("debug");
    expect(sink.debug).toHaveBeenCalledWith("invoke desktop_file_read");
  });

  it("supports quieter warning, error, and silent thresholds", () => {
    const warnSink = createSink();
    const warnLogger = createDesktopLogger({ level: "warn", sink: warnSink });
    warnLogger.info("ready");
    warnLogger.warn("degraded");
    warnLogger.error("failed");
    expect(warnSink.info).not.toHaveBeenCalled();
    expect(warnSink.warn).toHaveBeenCalledOnce();
    expect(warnSink.error).toHaveBeenCalledOnce();

    const silentSink = createSink();
    const silentLogger = createDesktopLogger({
      level: "silent",
      sink: silentSink,
    });
    silentLogger.debug("invoke");
    silentLogger.info("ready");
    silentLogger.warn("degraded");
    silentLogger.error("failed");
    expect(silentSink.debug).not.toHaveBeenCalled();
    expect(silentSink.info).not.toHaveBeenCalled();
    expect(silentSink.warn).not.toHaveBeenCalled();
    expect(silentSink.error).not.toHaveBeenCalled();
  });

  it("falls back to info for missing or invalid configuration", () => {
    expect(normalizeDesktopLogLevel(undefined)).toBe("info");
    expect(normalizeDesktopLogLevel("verbose")).toBe("info");
    expect(normalizeDesktopLogLevel(" ERROR ")).toBe("error");
  });

  it("keeps native invocation logging debug-only and payload-free", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");

    expect(source).toContain(
      "desktopLog.debug(`[desktop] invoke ${command}`)",
    );
    expect(source).not.toContain("console.log(`[desktop] invoke ${command}`)");
    expect(source).not.toContain("JSON.stringify(payload)");
  });
});
