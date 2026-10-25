import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { readServerEnvironmentVariable } from "./server-environment";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server environment variables", () => {
  it("normalizes a missing variable to an empty string", () => {
    vi.stubEnv("IS3A_TEST_ENVIRONMENT_VALUE", "");
    Reflect.deleteProperty(process.env, "IS3A_TEST_ENVIRONMENT_VALUE");

    expect(readServerEnvironmentVariable("IS3A_TEST_ENVIRONMENT_VALUE")).toBe("");
  });

  it("preserves empty and configured values without trimming", () => {
    vi.stubEnv("IS3A_TEST_ENVIRONMENT_VALUE", "");
    expect(readServerEnvironmentVariable("IS3A_TEST_ENVIRONMENT_VALUE")).toBe("");

    vi.stubEnv("IS3A_TEST_ENVIRONMENT_VALUE", " configured value ");
    expect(readServerEnvironmentVariable("IS3A_TEST_ENVIRONMENT_VALUE")).toBe(" configured value ");
  });
});
