import { defineRoute, defineRoutes } from "@fragno-dev/core";
import type { AbstractQuery } from "@fragno-dev/db/query";
import { otpSchema } from "../schema";
import { z } from "zod";
import type { otpFragmentDefinition } from "..";

export interface OttConfig {
  sendEmail?: (params: { to: string; subject: string; body: string }) => Promise<void>;
}

// Token type enum
export const OttType = z.enum(["email_verification", "password_reset", "passwordless_login"]);
export type OttType = z.infer<typeof OttType>;

// Generate 8-character alphanumeric token
function generateToken(): string {
  let token = "";

  // Convert to base64url-safe characters
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.getRandomValues(new Uint8Array(1))[0] % chars.length;
    token += chars[randomIndex];
  }

  return token;
}

export function createOttServices(orm: AbstractQuery<typeof otpSchema>) {
  return {
    generateToken: async (userId: string, type: OttType, durationMinutes: number = 15) => {
      // Invalidate any existing tokens of the same type for this user
      await orm.deleteMany("one_time_token", (b) =>
        b.whereIndex("idx_ott_user_type", (eb) =>
          eb.and(eb("userId", "=", userId), eb("type", "=", type)),
        ),
      );

      // Generate new token (stored in uppercase for case-insensitive lookups)
      const token = generateToken();
      const now = Date.now();
      const expiresAt = new Date(now + durationMinutes * 60 * 1000);

      await orm.create("one_time_token", {
        userId,
        token: token.toUpperCase(),
        type,
        expiresAt,
      });

      return { token };
    },

    getAll: async () => {
      return await orm.find("one_time_token", (b) => b.whereIndex("primary", () => true));
    },

    validateToken: async (userId: string, tokenString: string, type: OttType) => {
      // Normalize token for case-insensitive comparison
      const normalizedToken = tokenString.toUpperCase();

      // Query by userId and type (efficient index query)
      const tokens = await orm.find("one_time_token", (b) =>
        b.whereIndex("idx_ott_user_type", (eb) =>
          eb.and(eb("userId", "=", userId), eb("type", "=", type)),
        ),
      );

      // Filter by token in memory
      const token = tokens.find((t) => t.token === normalizedToken);

      // No token found
      if (!token) {
        return {
          valid: false,
          error: "token_invalid" as const,
        };
      }

      // Database returns timestamp strings without timezone - treat as UTC
      const tokenExpiresAt = new Date(token.expiresAt + "Z");

      // Check expiry
      const now = new Date();
      if (tokenExpiresAt.getTime() < now.getTime()) {
        await orm.delete("one_time_token", token.id);
        return {
          valid: false,
          error: "token_expired" as const,
        };
      }

      // Token is valid - delete it (one-time use)
      await orm.delete("one_time_token", token.id);
      return {
        valid: true,
      };
    },

    cleanupExpiredTokens: async () => {
      const now = new Date();
      // First, find all expired tokens to count them
      const expiredTokens = await orm.find("one_time_token", (b) =>
        b.whereIndex("idx_expires_at", (eb) => eb("expiresAt", "<", now)),
      );

      // Then delete them
      await orm.deleteMany("one_time_token", (b) =>
        b.whereIndex("idx_expires_at", (eb) => eb("expiresAt", "<", now)),
      );

      return { deletedCount: expiredTokens.length };
    },

    invalidateTokens: async (userId: string, type: OttType) => {
      // First, find all matching tokens to count them
      const tokens = await orm.find("one_time_token", (b) =>
        b.whereIndex("idx_ott_user_type", (eb) =>
          eb.and(eb("userId", "=", userId), eb("type", "=", type)),
        ),
      );

      // Then delete them
      await orm.deleteMany("one_time_token", (b) =>
        b.whereIndex("idx_ott_user_type", (eb) =>
          eb.and(eb("userId", "=", userId), eb("type", "=", type)),
        ),
      );

      return { deletedCount: tokens.length };
    },
  };
}

export const ottRoutesFactory = defineRoutes<typeof otpFragmentDefinition>().create(
  ({ services }) => {
    return [
      defineRoute({
        method: "POST",
        path: "/ott/generate",
        inputSchema: z.object({
          userId: z.string(),
          type: OttType,
          durationMinutes: z.number().int().positive().optional().default(15),
        }),
        outputSchema: z.object({
          token: z.string(),
        }),
        errorCodes: [],
        handler: async ({ input }, { json }) => {
          const { userId, type, durationMinutes } = await input.valid();

          const result = await services.generateToken(userId, type, durationMinutes);
          return json(result);
        },
      }),

      defineRoute({
        method: "POST",
        path: "/ott/validate",
        inputSchema: z.object({
          userId: z.string(),
          token: z.string().length(8),
          type: OttType,
        }),
        outputSchema: z.object({
          valid: z.boolean(),
        }),
        errorCodes: ["token_expired", "token_invalid"],
        handler: async ({ input }, { json, error }) => {
          const { userId, token, type } = await input.valid();

          const result = await services.validateToken(userId, token, type);

          if (!result.valid && result.error) {
            const errorMessages = {
              token_expired: "Token has expired",
              token_invalid: "Invalid token",
            } as const;

            const statusCodes = {
              token_expired: 410,
              token_invalid: 401,
            } as const;

            return error(
              {
                message: errorMessages[result.error],
                code: result.error,
              },
              statusCodes[result.error],
            );
          }

          return json({ valid: true });
        },
      }),

      defineRoute({
        method: "POST",
        path: "/ott/cleanup",
        inputSchema: z.object({}).optional(),
        outputSchema: z.object({
          deletedCount: z.number(),
        }),
        errorCodes: [],
        handler: async (_, { json }) => {
          const result = await services.cleanupExpiredTokens();
          return json(result);
        },
      }),

      defineRoute({
        method: "POST",
        path: "/ott/invalidate",
        inputSchema: z.object({
          userId: z.string(),
          type: OttType,
        }),
        outputSchema: z.object({
          deletedCount: z.number(),
        }),
        errorCodes: [],
        handler: async ({ input }, { json }) => {
          const { userId, type } = await input.valid();

          const result = await services.invalidateTokens(userId, type);
          return json(result);
        },
      }),
    ];
  },
);
