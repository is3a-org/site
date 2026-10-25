import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import {
  base32Encode,
  generateHOTP,
  generateTOTP,
  hashBackupCode,
  verifyBackupCode,
  verifyTOTP,
} from "./totp";

const referenceSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("One-time password cryptography", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // RFC 4226 Appendix D: https://www.rfc-editor.org/rfc/rfc4226#appendix-D
  it.each([
    [0, "755224"],
    [1, "287082"],
    [2, "359152"],
    [3, "969429"],
    [4, "338314"],
    [5, "254676"],
    [6, "287922"],
    [7, "162583"],
    [8, "399871"],
    [9, "520489"],
  ] as const)("matches the reference HOTP value at counter %i", async (counter, expectedToken) => {
    expect(await generateHOTP(referenceSecret, counter)).toBe(expectedToken);
  });

  it("encodes the reference secret without changing its bytes", () => {
    const secretBytes = new TextEncoder().encode("12345678901234567890");

    expect(base32Encode(secretBytes)).toBe(referenceSecret);
    expect(new TextDecoder().decode(secretBytes)).toBe("12345678901234567890");
  });

  it("uses the configured TOTP digits and checks only the allowed clock drift", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(59_000);

    expect(await generateTOTP(referenceSecret, 30, 8)).toBe("94287082");
    expect(await verifyTOTP(referenceSecret, "287082", 0)).toBe(true);
    expect(await verifyTOTP(referenceSecret, "755224", 0)).toBe(false);
    expect(await verifyTOTP(referenceSecret, "755224", 1)).toBe(true);
    expect(await verifyTOTP(referenceSecret, "359152", 1)).toBe(true);
    expect(await verifyTOTP(referenceSecret, "969429", 1)).toBe(false);
  });

  it("verifies a salted backup code and rejects a different code", async () => {
    const storedHash = await hashBackupCode("ABCD1234");

    expect(storedHash).toMatch(/^[\da-f]{32}:100000:[\da-f]{64}$/);
    expect(await verifyBackupCode("ABCD1234", storedHash)).toBe(true);
    expect(await verifyBackupCode("WXYZ5678", storedHash)).toBe(false);
  });
});
