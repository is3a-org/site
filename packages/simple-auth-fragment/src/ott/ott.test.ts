import { afterAll, assert, describe, expect, it } from "vitest";
import { authFragmentDefinition } from "..";
import { ottRoutesFactory } from "./ott";
import { userRoutesFactory } from "../user/user";
import { sessionRoutesFactory } from "../session/session";
import { createDatabaseFragmentForTest } from "@fragno-dev/test";

describe("OTT (One-Time Token)", async () => {
  const routes = [userRoutesFactory, sessionRoutesFactory, ottRoutesFactory] as const;

  const { fragment, test } = await createDatabaseFragmentForTest(authFragmentDefinition, routes, {
    adapter: { type: "drizzle-pglite" },
  });

  afterAll(async () => {
    await test.cleanup();
  });

  describe("Full OTT flow", async () => {
    let userId: string;
    let token: string;

    it("/sign-up - create user", async () => {
      const response = await fragment.callRoute("POST", "/sign-up", {
        body: {
          email: "ott-test@test.com",
          password: "password123",
        },
      });
      assert(response.type === "json");
      userId = response.data.userId;
    });

    describe("Email verification flow", () => {
      it("/ott/generate - generate email verification token", async () => {
        const response = await fragment.callRoute("POST", "/ott/generate", {
          body: {
            userId,
            type: "email_verification",
            durationMinutes: 15,
          },
        });
        assert(response.type === "json");
        expect(response.data.token).toMatch(/^[A-Z0-9]{8}$/);
        token = response.data.token;
      });

      it("/ott/validate - reject invalid token", async () => {
        const response = await fragment.callRoute("POST", "/ott/validate", {
          body: {
            userId,
            token: "INVALID1",
            type: "email_verification",
          },
        });
        assert(response.type === "error");
        expect(response.error.code).toBe("token_invalid");
      });

      it("/ott/validate - accept valid token", async () => {
        const response = await fragment.callRoute("POST", "/ott/validate", {
          body: {
            userId,
            token,
            type: "email_verification",
          },
        });
        assert(response.type === "json");
        expect(response.data.valid).toBe(true);
      });

      it("/ott/validate - fail to reuse token", async () => {
        const response = await fragment.callRoute("POST", "/ott/validate", {
          body: {
            userId,
            token,
            type: "email_verification",
          },
        });
        assert(response.type === "error");
        expect(response.error.code).toBe("token_invalid");
      });
    });

    describe("Password reset flow", () => {
      let resetToken: string;

      it("/ott/generate - generate password reset token", async () => {
        const response = await fragment.callRoute("POST", "/ott/generate", {
          body: {
            userId,
            type: "password_reset",
            durationMinutes: 10,
          },
        });
        assert(response.type === "json");
        resetToken = response.data.token;
      });

      it("/ott/validate - reject wrong token", async () => {
        const response = await fragment.callRoute("POST", "/ott/validate", {
          body: {
            userId,
            token: "WRONG123",
            type: "password_reset",
          },
        });
        assert(response.type === "error");
        expect(response.error.code).toBe("token_invalid");
      });

      it("/ott/invalidate - invalidate all password reset tokens", async () => {
        const response = await fragment.callRoute("POST", "/ott/invalidate", {
          body: {
            userId,
            type: "password_reset",
          },
        });
        assert(response.type === "json");
        expect(response.data.deletedCount).toBeGreaterThanOrEqual(0);
      });

      it("/ott/validate - fail after invalidation", async () => {
        const response = await fragment.callRoute("POST", "/ott/validate", {
          body: {
            userId,
            token: resetToken,
            type: "password_reset",
          },
        });
        assert(response.type === "error");
        expect(response.error.code).toBe("token_invalid");
      });
    });

    describe("Passwordless login flow", () => {
      let loginToken: string;

      it("/ott/generate - generate passwordless login token", async () => {
        const response = await fragment.callRoute("POST", "/ott/generate", {
          body: {
            userId,
            type: "passwordless_login",
            durationMinutes: 5,
          },
        });
        assert(response.type === "json");
        loginToken = response.data.token;
      });

      it("/ott/validate - accept valid login token", async () => {
        const response = await fragment.callRoute("POST", "/ott/validate", {
          body: {
            userId,
            token: loginToken,
            type: "passwordless_login",
          },
        });
        assert(response.type === "json");
        expect(response.data.valid).toBe(true);
      });
    });

    describe("Token expiry and cleanup", () => {
      it("/ott/generate - generate short-lived token", async () => {
        const response = await fragment.callRoute("POST", "/ott/generate", {
          body: {
            userId,
            type: "email_verification",
            durationMinutes: 1,
          },
        });
        assert(response.type === "json");
        token = response.data.token;
      });

      it("/ott/cleanup - clean up expired tokens", async () => {
        const response = await fragment.callRoute("POST", "/ott/cleanup", {
          body: {},
        });
        assert(response.type === "json");
        expect(response.data.deletedCount).toBeGreaterThanOrEqual(0);
      });
    });

    describe("Token replacement", () => {
      it("/ott/generate - first token", async () => {
        const response1 = await fragment.callRoute("POST", "/ott/generate", {
          body: {
            userId,
            type: "email_verification",
            durationMinutes: 15,
          },
        });
        assert(response1.type === "json");
        const token1 = response1.data.token;

        // Generate second token - should invalidate first
        const response2 = await fragment.callRoute("POST", "/ott/generate", {
          body: {
            userId,
            type: "email_verification",
            durationMinutes: 15,
          },
        });
        assert(response2.type === "json");
        const token2 = response2.data.token;

        // First token should be invalid
        const validateResponse = await fragment.callRoute("POST", "/ott/validate", {
          body: {
            userId,
            token: token1,
            type: "email_verification",
          },
        });

        assert(validateResponse.type === "error");
        expect(validateResponse.error.code).toBe("token_invalid");

        // Second token should be valid
        const validateResponse2 = await fragment.callRoute("POST", "/ott/validate", {
          body: {
            userId,
            token: token2,
            type: "email_verification",
          },
        });
        assert(validateResponse2.type === "json");
        expect(validateResponse2.data.valid).toBe(true);
      });
    });
  });
});
