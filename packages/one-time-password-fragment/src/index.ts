import { defineFragment, instantiate } from "@fragno-dev/core";
import { createClientBuilder, type FragnoPublicClientConfig } from "@fragno-dev/core/client";
import { withDatabase, type FragnoPublicConfigWithDatabase } from "@fragno-dev/db";
import { otpSchema } from "./schema";
import { ottRoutesFactory, type OttConfig, OttType } from "./ott/ott";
import { totpRoutesFactory, type TotpConfig } from "./totp/totp";
import { generateToken } from "./ott/ott";
import {
  base32Encode,
  generateBackupCode,
  hashBackupCode,
  verifyBackupCode,
  verifyTOTP,
} from "./totp/totp";

export interface OtpFragmentConfig extends OttConfig, TotpConfig {
  issuer?: string;
}

export const otpFragmentDefinition = defineFragment<OtpFragmentConfig>("one-time-password")
  .extend(withDatabase(otpSchema, "one-time-password-db"))
  .providesBaseService(({ defineService, config }) => {
    return defineService({
      // OTT services
      generateToken: async function (userId: string, type: OttType, durationMinutes: number = 15) {
        // First, retrieve existing tokens to delete
        const uow = this.uow(otpSchema).find("one_time_token", (b) =>
          b.whereIndex("idx_ott_user_type", (eb) =>
            eb.and(eb("userId", "=", userId), eb("type", "=", type)),
          ),
        );
        const [existingTokens] = await uow.retrievalPhase;

        // Delete existing tokens
        for (const existingToken of existingTokens) {
          uow.delete("one_time_token", existingToken.id);
        }

        // Generate new token (stored in uppercase for case-insensitive lookups)
        const token = generateToken();
        const now = Date.now();
        const expiresAt = new Date(now + durationMinutes * 60 * 1000).toISOString();

        uow.create("one_time_token", {
          userId,
          token: token.toUpperCase(),
          type,
          // @ts-expect-error TS2322
          expiresAt,
        });

        // Wait for the handler to run executeMutate()
        await uow.mutationPhase;

        return { token };
      },

      getAll: async function () {
        const uow = this.uow(otpSchema).find("one_time_token", (b) =>
          b.whereIndex("primary", () => true),
        );
        const [tokens] = await uow.retrievalPhase;
        return tokens;
      },

      validateToken: async function (userId: string, tokenString: string, type: OttType) {
        // Normalize token for case-insensitive comparison
        const normalizedToken = tokenString.toUpperCase();

        // Query by userId and type (efficient index query)
        const uow = this.uow(otpSchema).find("one_time_token", (b) =>
          b.whereIndex("idx_ott_user_type", (eb) =>
            eb.and(eb("userId", "=", userId), eb("type", "=", type)),
          ),
        );
        const [tokens] = await uow.retrievalPhase;

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
          uow.delete("one_time_token", token.id);
          await uow.mutationPhase;
          return {
            valid: false,
            error: "token_expired" as const,
          };
        }

        // Token is valid - delete it (one-time use)
        uow.delete("one_time_token", token.id);
        await uow.mutationPhase;
        return {
          valid: true,
        };
      },

      cleanupExpiredTokens: async function () {
        const now = new Date();

        // Schedule retrieval to count expired tokens
        const uow = this.uow(otpSchema).find("one_time_token", (b) =>
          b.whereIndex("idx_expires_at", (eb) => eb("expiresAt", "<", now)),
        );
        const [expiredTokens] = await uow.retrievalPhase;

        // Schedule deletion
        for (const expiredToken of expiredTokens) {
          uow.delete("one_time_token", expiredToken.id);
        }

        // Wait for mutation phase
        await uow.mutationPhase;

        return { deletedCount: expiredTokens.length };
      },

      invalidateTokens: async function (userId: string, type: OttType) {
        // Schedule retrieval to count tokens
        const uow = this.uow(otpSchema).find("one_time_token", (b) =>
          b.whereIndex("idx_ott_user_type", (eb) =>
            eb.and(eb("userId", "=", userId), eb("type", "=", type)),
          ),
        );
        const [tokens] = await uow.retrievalPhase;

        // Schedule deletion
        for (const token of tokens) {
          uow.delete("one_time_token", token.id);
        }

        // Wait for mutation phase
        await uow.mutationPhase;

        return { deletedCount: tokens.length };
      },

      // TOTP services
      enableTotp: async function (userId: string) {
        // Check if TOTP is already enabled
        const uow = this.uow(otpSchema).findFirst("totp_secret", (b) =>
          b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
        );
        const [existing] = await uow.retrievalPhase;

        if (existing) {
          throw new Error("TOTP already enabled for this user");
        }

        // Generate secret (20 random bytes)
        const secretBytes = crypto.getRandomValues(new Uint8Array(20));
        const secret = base32Encode(secretBytes);

        // Generate 10 backup codes
        const backupCodes: string[] = [];
        for (let i = 0; i < 10; i++) {
          backupCodes.push(generateBackupCode());
        }

        // Hash backup codes before storing
        const hashedBackupCodes = await Promise.all(
          backupCodes.map((code) => hashBackupCode(code)),
        );

        // Store in database
        uow.create("totp_secret", {
          userId,
          secret,
          backupCodes: JSON.stringify(hashedBackupCodes),
        });

        // Generate QR code URL
        const issuer = config?.issuer || "SimpleAuth";
        const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(userId)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

        return {
          uow,
          secret,
          qrCodeUrl,
          backupCodes, // Return unhashed codes for user to save
        };
      },

      verifyTotp: async function (userId: string, code: string) {
        const uow = this.uow(otpSchema).findFirst("totp_secret", (b) =>
          b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
        );
        const [totpRecord] = await uow.retrievalPhase;

        if (!totpRecord) {
          return { valid: false };
        }

        const valid = await verifyTOTP(totpRecord.secret, code, 1);
        return { valid };
      },

      verifyBackupCode: async function (userId: string, code: string) {
        const uow = this.uow(otpSchema).findFirst("totp_secret", (b) =>
          b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
        );
        const [totpRecord] = await uow.retrievalPhase;

        if (!totpRecord) {
          return { valid: false };
        }

        const backupCodes: string[] = JSON.parse(totpRecord.backupCodes);

        // Check each backup code
        for (let i = 0; i < backupCodes.length; i++) {
          const isValid = await verifyBackupCode(code.toUpperCase(), backupCodes[i]);
          if (isValid) {
            // Remove the used backup code - delete and recreate
            backupCodes.splice(i, 1);
            uow.delete("totp_secret", totpRecord.id);
            uow.create("totp_secret", {
              userId: totpRecord.userId,
              secret: totpRecord.secret,
              backupCodes: JSON.stringify(backupCodes),
            });
            // Wait for mutation phase
            return { valid: true };
          }
        }

        return { valid: false };
      },

      disableTotp: async function (userId: string) {
        const uow = this.uow(otpSchema).findFirst("totp_secret", (b) =>
          b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
        );
        const [totpRecord] = await uow.retrievalPhase;

        if (!totpRecord) {
          return false;
        }

        uow.delete("totp_secret", totpRecord.id);
        // Wait for mutation phase
        return true;
      },

      getTotpStatus: async function (userId: string) {
        const uow = this.uow(otpSchema).findFirst("totp_secret", (b) =>
          b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
        );
        const [totpRecord] = await uow.retrievalPhase;
        console.log("totpRecord", totpRecord);
        return {
          enabled: !!totpRecord,
        };
      },
    });
  })
  .build();

export function createOtpFragment(
  config: OtpFragmentConfig = {},
  fragnoConfig: FragnoPublicConfigWithDatabase,
) {
  return instantiate(otpFragmentDefinition)
    .withConfig(config)
    .withOptions(fragnoConfig)
    .withRoutes([ottRoutesFactory, totpRoutesFactory])
    .build();
}

export function createOtpFragmentClients(fragnoConfig: FragnoPublicClientConfig) {
  const b = createClientBuilder(otpFragmentDefinition, fragnoConfig, [
    ottRoutesFactory,
    totpRoutesFactory,
  ]);

  return {
    // OTT hooks
    useGenerateToken: b.createMutator("POST", "/ott/generate"),
    useValidateToken: b.createMutator("POST", "/ott/validate"),
    useCleanupTokens: b.createMutator("POST", "/ott/cleanup"),
    useInvalidateTokens: b.createMutator("POST", "/ott/invalidate"),

    // TOTP hooks
    useEnableTotp: b.createMutator("POST", "/totp/enable"),
    useVerifyTotp: b.createMutator("POST", "/totp/verify"),
    useVerifyBackupCode: b.createMutator("POST", "/totp/verify-backup"),
    useDisableTotp: b.createMutator("POST", "/totp/disable"),
    useTotpStatus: b.createHook("/totp/status"),
  };
}

export type { FragnoRouteConfig } from "@fragno-dev/core/api";
export { OttType } from "./ott/ott";
export type { OttType as OttTypeValue } from "./ott/ott";
