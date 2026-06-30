import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLoginUrl } from "./const";

describe("getLoginUrl", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_OAUTH_PORTAL_URL", "");
    vi.stubEnv("VITE_APP_ID", "");
    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          origin: "http://localhost:3000",
        },
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a local callback fallback when OAuth configuration is missing", () => {
    const loginUrl = getLoginUrl();

    expect(loginUrl).toContain("/api/oauth/callback");
    expect(loginUrl).toContain("code=demo");
    expect(loginUrl).toContain("state=dev");
  });
});
