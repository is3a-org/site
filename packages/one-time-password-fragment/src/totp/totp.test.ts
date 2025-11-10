import { afterAll, assert, describe, expect, it } from "vitest";
import { otpFragmentDefinition } from "..";
import { ottRoutesFactory } from "../ott/ott";
import { totpRoutesFactory } from "./totp";
import { createDatabaseFragmentForTest } from "@fragno-dev/test";

describe("TOTP (Time-based One-Time Password)", async () => {
  const { fragment, test } = await createDatabaseFragmentForTest(
    {
      definition: otpFragmentDefinition,
      routes: [ottRoutesFactory, totpRoutesFactory],
    },
    {
      adapter: { type: "drizzle-pglite" },
    },
  );

  afterAll(async () => {
    await test.cleanup();
  });

  describe("Full TOTP flow", async () => {
    let userId: string;
    let backupCodes: string[];

    // Use a test user ID for this flow
    userId = "totp-test-user";

    it("/totp/status - check TOTP not enabled initially", async () => {
      const response = await fragment.callRoute("GET", "/totp/status", {
        query: { userId },
      });
      assert(response.type === "json");
      expect(response.data.enabled).toBe(false);
    });

    it("/totp/enable - enable TOTP for user", async () => {
      const response = await fragment.callRoute("POST", "/totp/enable", {
        body: { userId },
      });
      assert(response.type === "json");
      expect(response.data).toMatchObject({
        secret: expect.any(String),
        qrCodeUrl: expect.stringContaining("otpauth://totp/"),
        backupCodes: expect.any(Array),
      });
      expect(response.data.backupCodes).toHaveLength(10);

      backupCodes = response.data.backupCodes;
    });

    it("/totp/status - check TOTP enabled after setup", async () => {
      const response = await fragment.callRoute("GET", "/totp/status", {
        query: { userId },
      });
      assert(response.type === "json");
      expect(response.data.enabled).toBe(true);
    });

    it("/totp/enable - fail when already enabled", async () => {
      const response = await fragment.callRoute("POST", "/totp/enable", {
        body: { userId },
      });
      assert(response.type === "error");
      expect(response.error.code).toBe("totp_already_enabled");
    });

    it("/totp/verify - reject invalid TOTP code", async () => {
      const response = await fragment.callRoute("POST", "/totp/verify", {
        body: { userId, code: "000000" },
      });
      assert(response.type === "error");
      expect(response.error.code).toBe("totp_invalid_code");
    });

    it("/totp/verify-backup - verify backup code", async () => {
      const backupCode = backupCodes[0];
      const response = await fragment.callRoute("POST", "/totp/verify-backup", {
        body: { userId, code: backupCode },
      });
      assert(response.type === "json");
      expect(response.data.valid).toBe(true);
    });

    it("/totp/verify-backup - fail to reuse same backup code", async () => {
      const backupCode = backupCodes[0];
      const response = await fragment.callRoute("POST", "/totp/verify-backup", {
        body: { userId, code: backupCode },
      });
      assert(response.type === "error");
      expect(response.error.code).toBe("backup_code_invalid");
    });

    it("/totp/verify-backup - verify another backup code", async () => {
      const backupCode = backupCodes[1];
      const response = await fragment.callRoute("POST", "/totp/verify-backup", {
        body: { userId, code: backupCode },
      });
      assert(response.type === "json");
      expect(response.data.valid).toBe(true);
    });

    it("/totp/disable - disable TOTP for user", async () => {
      const response = await fragment.callRoute("POST", "/totp/disable", {
        body: { userId },
      });
      assert(response.type === "json");
      expect(response.data.success).toBe(true);
    });

    it("/totp/status - check TOTP disabled after removal", async () => {
      const response = await fragment.callRoute("GET", "/totp/status", {
        query: { userId },
      });
      assert(response.type === "json");
      expect(response.data.enabled).toBe(false);
    });

    it("/totp/disable - fail when not enabled", async () => {
      const response = await fragment.callRoute("POST", "/totp/disable", {
        body: { userId },
      });
      assert(response.type === "error");
      expect(response.error.code).toBe("totp_not_enabled");
    });
  });
});
