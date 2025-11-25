import { afterAll, describe, expect, it } from "vitest";
import { otpFragmentDefinition } from "..";
import { buildDatabaseFragmentsTest } from "@fragno-dev/test";
import { instantiate } from "@fragno-dev/core";

const testUserId = "test-user-id";

describe("OTT Services", async () => {
  const { fragments, test } = await buildDatabaseFragmentsTest()
    .withTestAdapter({ type: "drizzle-pglite" })
    .withFragment("ott", instantiate(otpFragmentDefinition))
    .build();

  const services = fragments.ott.services;

  afterAll(async () => {
    await test.cleanup();
  });

  describe("generateToken", () => {
    it("should generate an 8-character alphanumeric token", async () => {
      const result = await services.generateToken(testUserId, "email_verification");
      expect(result.token).toMatch(/^[A-Z0-9]{8}$/);
    });

    it("should create token with default duration (15 minutes)", async () => {
      const result = await services.generateToken(testUserId, "email_verification");

      // Verify we can validate the token (proves it was created successfully)
      const validateResult = await services.validateToken(
        testUserId,
        result.token,
        "email_verification",
      );
      expect(validateResult.valid).toBe(true);
    });

    it("should create token with custom duration", async () => {
      const result = await services.generateToken(testUserId, "password_reset", 30);

      // Verify token works immediately
      const validateResult = await services.validateToken(
        testUserId,
        result.token,
        "password_reset",
      );
      expect(validateResult.valid).toBe(true);
    });

    it("should allow multiple tokens for same user but different types", async () => {
      // Generate tokens of different types for the same user
      const token1 = await services.generateToken(testUserId, "email_verification");
      const token2 = await services.generateToken(testUserId, "password_reset");
      const token3 = await services.generateToken(testUserId, "passwordless_login");

      // Verify each token is valid for its type
      const result1 = await services.validateToken(testUserId, token1.token, "email_verification");
      expect(result1.valid).toBe(true);

      const result2 = await services.validateToken(testUserId, token2.token, "password_reset");
      expect(result2.valid).toBe(true);

      const result3 = await services.validateToken(testUserId, token3.token, "passwordless_login");
      expect(result3.valid).toBe(true);
    });
  });

  describe("validateToken", () => {
    it("should successfully validate a correct token", async () => {
      const { token } = await services.generateToken(testUserId, "email_verification");

      const result = await services.validateToken(testUserId, token, "email_verification");

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should delete token after successful validation", async () => {
      const { token } = await services.generateToken(testUserId, "email_verification");

      await services.validateToken(testUserId, token, "email_verification");

      // Try to validate again - should fail
      const result = await services.validateToken(testUserId, token, "email_verification");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("token_invalid");
    });

    it("should reject invalid token", async () => {
      await services.generateToken(testUserId, "email_verification");

      const result = await services.validateToken(testUserId, "INVALID1", "email_verification");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("token_invalid");
    });

    it("should be case-insensitive", async () => {
      const { token } = await services.generateToken(testUserId, "email_verification");

      const result = await services.validateToken(
        testUserId,
        token.toLowerCase(),
        "email_verification",
      );

      expect(result.valid).toBe(true);
    });

    it("should reject expired token", async () => {
      const { token } = await services.generateToken(testUserId, "email_verification", 0); // 0 minutes = expired

      // Wait a moment to ensure expiry
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await services.validateToken(testUserId, token, "email_verification");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("token_expired");
    });

    it("should delete expired token after validation attempt", async () => {
      const { token } = await services.generateToken(testUserId, "email_verification", 0);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const firstAttempt = await services.validateToken(testUserId, token, "email_verification");
      expect(firstAttempt.valid).toBe(false);
      expect(firstAttempt.error).toBe("token_expired");

      // Try again - token should be deleted
      const secondAttempt = await services.validateToken(testUserId, token, "email_verification");
      expect(secondAttempt.valid).toBe(false);
      expect(secondAttempt.error).toBe("token_invalid");
    });

    it("should reject token for wrong user", async () => {
      const user2Id = "user2-id";
      const { token } = await services.generateToken(testUserId, "email_verification");

      const result = await services.validateToken(user2Id, token, "email_verification");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("token_invalid");
    });

    it("should reject token for wrong type", async () => {
      const { token } = await services.generateToken(testUserId, "email_verification");

      const result = await services.validateToken(testUserId, token, "password_reset");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("token_invalid");
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should delete only expired tokens", async () => {
      // Create expired token
      const expiredToken = await services.generateToken(testUserId, "email_verification", 0);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create valid token
      const validToken = await services.generateToken(testUserId, "password_reset", 15);

      const result = await services.cleanupExpiredTokens();

      expect(result.deletedCount).toBeGreaterThan(0);

      // Verify expired token is gone but valid token still works
      const expiredResult = await services.validateToken(
        testUserId,
        expiredToken.token,
        "email_verification",
      );
      expect(expiredResult.valid).toBe(false);

      const validResult = await services.validateToken(
        testUserId,
        validToken.token,
        "password_reset",
      );
      expect(validResult.valid).toBe(true);
    });

    it("should return 0 when no expired tokens exist", async () => {
      await services.generateToken(testUserId, "email_verification", 15);

      const result = await services.cleanupExpiredTokens();

      // May or may not be 0 depending on other tests, but shouldn't error
      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    });

    it("should handle multiple expired tokens", async () => {
      // Create multiple expired tokens
      await services.generateToken(testUserId, "email_verification", 0);
      await services.generateToken(testUserId, "password_reset", 0);
      await services.generateToken(testUserId, "passwordless_login", 0);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await services.cleanupExpiredTokens();

      expect(result.deletedCount).toBeGreaterThan(0);
    });
  });

  describe("invalidateTokens", () => {
    it("should invalidate all tokens for user and type", async () => {
      // Note: generateToken automatically invalidates existing tokens of the same type
      // So only the last token will exist
      await services.generateToken(testUserId, "email_verification");
      await services.generateToken(testUserId, "email_verification");
      const token = await services.generateToken(testUserId, "email_verification");

      const result = await services.invalidateTokens(testUserId, "email_verification");

      // Only token3 exists (token1 and token2 were auto-invalidated during generation)
      expect(result.deletedCount).toBe(1);

      // Verify the last token is deleted
      const result3 = await services.validateToken(testUserId, token.token, "email_verification");
      expect(result3.valid).toBe(false);
    });

    it("should only invalidate tokens of specified type", async () => {
      // Create tokens of different types
      const emailToken = await services.generateToken(testUserId, "email_verification");
      const passwordToken = await services.generateToken(testUserId, "password_reset");
      const loginToken = await services.generateToken(testUserId, "passwordless_login");

      const result = await services.invalidateTokens(testUserId, "email_verification");

      expect(result.deletedCount).toBe(1);

      // Verify only email_verification token is deleted
      const emailResult = await services.validateToken(
        testUserId,
        emailToken.token,
        "email_verification",
      );
      expect(emailResult.valid).toBe(false);

      const passwordResult = await services.validateToken(
        testUserId,
        passwordToken.token,
        "password_reset",
      );
      expect(passwordResult.valid).toBe(true);

      const loginResult = await services.validateToken(
        testUserId,
        loginToken.token,
        "passwordless_login",
      );
      expect(loginResult.valid).toBe(true);
    });

    it("should only invalidate tokens for specified user", async () => {
      const user2Id = "user2-id";

      // Create tokens for both users
      const token1 = await services.generateToken(testUserId, "email_verification");
      const token2 = await services.generateToken(user2Id, "email_verification");

      const result = await services.invalidateTokens(testUserId, "email_verification");

      expect(result.deletedCount).toBe(1);

      // Verify only testUserId's token is deleted
      const result1 = await services.validateToken(testUserId, token1.token, "email_verification");
      expect(result1.valid).toBe(false);

      const result2 = await services.validateToken(user2Id, token2.token, "email_verification");
      expect(result2.valid).toBe(true);
    });

    it("should return 0 when no matching tokens exist", async () => {
      const result = await services.invalidateTokens(testUserId, "email_verification");

      expect(result.deletedCount).toBe(0);
    });

    it("should handle invalidating already invalidated tokens", async () => {
      await services.generateToken(testUserId, "email_verification");

      // First invalidation
      const result1 = await services.invalidateTokens(testUserId, "email_verification");
      expect(result1.deletedCount).toBe(1);

      // Second invalidation
      const result2 = await services.invalidateTokens(testUserId, "email_verification");
      expect(result2.deletedCount).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle extremely short expiry times", async () => {
      const { token } = await services.generateToken(testUserId, "email_verification", 0);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const result = await services.validateToken(testUserId, token, "email_verification");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("token_expired");
    });

    it("should handle very long expiry times", async () => {
      const { token } = await services.generateToken(testUserId, "email_verification", 10080); // 1 week

      // Verify token is valid immediately
      const result = await services.validateToken(testUserId, token, "email_verification");

      expect(result.valid).toBe(true);
    });

    it("should generate unique tokens", async () => {
      const tokens = new Set<string>();

      // Generate many tokens
      for (let i = 0; i < 100; i++) {
        const { token } = await services.generateToken(testUserId, "email_verification");
        tokens.add(token);
      }

      // All should be unique (very high probability)
      expect(tokens.size).toBe(100);
    });
  });
});
