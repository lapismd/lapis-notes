import { describe, expect, it } from "vitest";

import {
  CSRF_HEADER_NAME,
  SESSION_COOKIE_NAME,
  assertCsrf,
  hashPassword,
  parseCookie,
  sessionCookie,
  verifyPassword,
} from "./auth.ts";

describe("server authentication primitives", () => {
  it("hashes passwords with the pinned scrypt work factors", async () => {
    const encoded = await hashPassword("correct horse battery staple");
    expect(encoded).toMatch(/^scrypt\$131072\$8\$1\$/u);
    await expect(
      verifyPassword("correct horse battery staple", encoded),
    ).resolves.toBe(true);
    await expect(
      verifyPassword("incorrect horse battery staple", encoded),
    ).resolves.toBe(false);
  }, 30_000);

  it("sets the required host-only cookie attributes", () => {
    const cookie = sessionCookie("opaque");
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=opaque`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(parseCookie(cookie, SESSION_COOKIE_NAME)).toBe("opaque");
  });

  it("requires both the configured Origin and session CSRF token", () => {
    const request = new Request("https://lapis.example/api/trpc", {
      method: "POST",
      headers: {
        origin: "https://lapis.example",
        [CSRF_HEADER_NAME]: "csrf-secret",
      },
    });
    expect(() =>
      assertCsrf(
        request,
        {
          id: "session",
          userId: "user",
          username: "owner",
          csrfToken: "csrf-secret",
          createdAt: 1,
          lastSeenAt: 1,
          expiresAt: 2,
        },
        "https://lapis.example",
      ),
    ).not.toThrow();
  });
});
