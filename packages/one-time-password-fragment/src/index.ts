import type { NonGetHTTPMethod } from "@fragno-dev/core/api";
import {
  createClientBuilder,
  type ExtractNonGetRoutePaths,
  type ExtractRouteByPath,
  type FragnoClientHookData,
  type FragnoClientMutatorData,
  type FragnoPublicClientConfig,
} from "@fragno-dev/core/client";
import type { RoutesWithInternal } from "@fragno-dev/core/fragment-instantiator";
import type {
  ExtractFragmentDeps,
  ExtractFragmentHandlerThisContext,
  ExtractFragmentServices,
  ExtractFragmentServiceThisContext,
  FlattenRouteFactories,
} from "@fragno-dev/core/route";
import { z } from "zod";

import { defineFragment, instantiate, type FragnoInstantiatedFragment } from "@fragno-dev/core";
import { withDatabase, type FragnoPublicConfigWithDatabase } from "@fragno-dev/db";

import { generateToken, ottRoutesFactory, type OttConfig, type OttType } from "./ott/ott";
import { otpSchema } from "./schema";
import {
  totpRoutesFactory,
  type TotpConfig,
  base32Encode,
  verifyBackupCode,
  verifyTOTP,
} from "./totp/totp";

export interface OtpFragmentConfig extends OttConfig, TotpConfig {
  issuer?: string;
}

const backupCodeStorageSchema = z.array(z.string());

export const otpFragmentDefinition = defineFragment<OtpFragmentConfig>("one-time-password")
  .extend(withDatabase(otpSchema))
  .providesBaseService(({ defineService, config }) => {
    return defineService({
      // OTT services
      generateToken: function (userId: string, type: OttType, durationMinutes = 15) {
        return this.serviceTx(otpSchema)
          .retrieve((uow) =>
            uow.find("one_time_token", (b) =>
              b.whereIndex("idx_ott_user_type", (eb) =>
                eb.and(eb("userId", "=", userId), eb("type", "=", type)),
              ),
            ),
          )
          .mutate(({ uow, retrieveResult: [existingTokens] }) => {
            for (const existingToken of existingTokens) {
              uow.delete("one_time_token", existingToken.id);
            }

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

            return { token };
          })
          .build();
      },

      getAll: function () {
        return this.serviceTx(otpSchema)
          .retrieve((uow) => uow.find("one_time_token", (b) => b.whereIndex("primary", () => true)))
          .build();
      },

      validateToken: function (userId: string, tokenString: string, type: OttType) {
        const normalizedToken = tokenString.toUpperCase();

        return this.serviceTx(otpSchema)
          .retrieve((uow) =>
            uow.find("one_time_token", (b) =>
              b.whereIndex("idx_ott_user_type", (eb) =>
                eb.and(eb("userId", "=", userId), eb("type", "=", type)),
              ),
            ),
          )
          .mutate(({ uow, retrieveResult: [tokens] }) => {
            const token = tokens.find((t) => t.token === normalizedToken);

            if (!token) {
              return {
                valid: false,
                error: "token_invalid" as const,
              };
            }

            // Check expiry
            const now = new Date();

            if (token.expiresAt.getTime() < now.getTime()) {
              uow.delete("one_time_token", token.id);
              return {
                valid: false,
                error: "token_expired" as const,
              };
            }

            uow.delete("one_time_token", token.id);
            return {
              valid: true,
            };
          })
          .build();
      },

      cleanupExpiredTokens: function () {
        const now = new Date();

        return this.serviceTx(otpSchema)
          .retrieve((uow) =>
            uow.find("one_time_token", (b) =>
              b.whereIndex("idx_expires_at", (eb) => eb("expiresAt", "<", now)),
            ),
          )
          .mutate(({ uow, retrieveResult: [expiredTokens] }) => {
            for (const expiredToken of expiredTokens) {
              uow.delete("one_time_token", expiredToken.id);
            }

            return { deletedCount: expiredTokens.length };
          })
          .build();
      },

      invalidateTokens: function (userId: string, type: OttType) {
        return this.serviceTx(otpSchema)
          .retrieve((uow) =>
            uow.find("one_time_token", (b) =>
              b.whereIndex("idx_ott_user_type", (eb) =>
                eb.and(eb("userId", "=", userId), eb("type", "=", type)),
              ),
            ),
          )
          .mutate(({ uow, retrieveResult: [tokens] }) => {
            for (const token of tokens) {
              uow.delete("one_time_token", token.id);
            }

            return { deletedCount: tokens.length };
          })
          .build();
      },

      // TOTP services
      enableTotp: function (userId: string, hashedBackupCodes: readonly string[]) {
        const secretBytes = crypto.getRandomValues(new Uint8Array(20));
        const secret = base32Encode(secretBytes);

        const issuer =
          config.issuer === undefined || config.issuer === "" ? "SimpleAuth" : config.issuer;
        const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(userId)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

        return this.serviceTx(otpSchema)
          .retrieve((uow) =>
            uow.findFirst("totp_secret", (b) =>
              b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
            ),
          )
          .mutate(({ uow, retrieveResult: [existing] }) => {
            if (existing) {
              throw new Error("TOTP already enabled for this user");
            }

            uow.create("totp_secret", {
              userId,
              secret,
              backupCodes: JSON.stringify(hashedBackupCodes),
            });

            return {
              secret,
              qrCodeUrl,
            };
          })
          .build();
      },

      verifyTotp: function (userId: string, code: string) {
        return this.serviceTx(otpSchema)
          .retrieve((uow) =>
            uow.findFirst("totp_secret", (b) =>
              b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
            ),
          )
          .transformRetrieve(async ([totpRecord]) => {
            if (!totpRecord) {
              return { valid: false };
            }

            const valid = await verifyTOTP(totpRecord.secret, code, 1);
            return { valid };
          })
          .build();
      },

      consumeBackupCode: function (userId: string, code: string) {
        return this.serviceTx(otpSchema)
          .retrieve((uow) =>
            uow.findFirst("totp_secret", (b) =>
              b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
            ),
          )
          .transformRetrieve(async ([totpRecord]) => {
            if (!totpRecord) {
              return { matched: false as const };
            }

            const backupCodes = backupCodeStorageSchema.parse(JSON.parse(totpRecord.backupCodes));

            for (let i = 0; i < backupCodes.length; i++) {
              const isValid = await verifyBackupCode(code.toUpperCase(), backupCodes[i]);
              if (isValid) {
                const nextBackupCodes = [...backupCodes];
                nextBackupCodes.splice(i, 1);
                return { matched: true as const, totpRecord, nextBackupCodes };
              }
            }

            return { matched: false as const };
          })
          .mutate(({ uow, retrieveResult: match }) => {
            if (!match.matched) {
              return { valid: false };
            }

            // The version check fails the transaction if another request consumed a code since
            // the retrieve, so a backup code can only be used once.
            uow.update("totp_secret", match.totpRecord.id, (b) =>
              b.set({ backupCodes: JSON.stringify(match.nextBackupCodes) }).check(),
            );

            return { valid: true };
          })
          .build();
      },

      disableTotp: function (userId: string) {
        return this.serviceTx(otpSchema)
          .retrieve((uow) =>
            uow.findFirst("totp_secret", (b) =>
              b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
            ),
          )
          .mutate(({ uow, retrieveResult: [totpRecord] }) => {
            if (!totpRecord) {
              return false;
            }

            uow.delete("totp_secret", totpRecord.id);
            return true;
          })
          .build();
      },

      getTotpStatus: function (userId: string) {
        return this.serviceTx(otpSchema)
          .retrieve((uow) =>
            uow.findFirst("totp_secret", (b) =>
              b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
            ),
          )
          .mutate(({ retrieveResult: [totpRecord] }) => {
            return {
              enabled: !!totpRecord,
            };
          })
          .build();
      },
    });
  })
  .build();

type OtpFragmentDefinition = typeof otpFragmentDefinition;
type OtpRoutes = FlattenRouteFactories<[typeof ottRoutesFactory, typeof totpRoutesFactory]>;

/** The one-time password fragment retains its exact routes and database services. */
export type OtpFragment = FragnoInstantiatedFragment<
  RoutesWithInternal<OtpRoutes, NonNullable<OtpFragmentDefinition["$internalRoutes"]>>,
  ExtractFragmentDeps<OtpFragmentDefinition>,
  ExtractFragmentServices<OtpFragmentDefinition>,
  ExtractFragmentServiceThisContext<OtpFragmentDefinition>,
  ExtractFragmentHandlerThisContext<OtpFragmentDefinition>,
  NonNullable<OtpFragmentDefinition["$requestStorage"]>,
  FragnoPublicConfigWithDatabase
>;

type OtpMutator<TPath extends ExtractNonGetRoutePaths<OtpRoutes>> = FragnoClientMutatorData<
  NonGetHTTPMethod,
  TPath,
  ExtractRouteByPath<OtpRoutes, TPath>["inputSchema"],
  ExtractRouteByPath<OtpRoutes, TPath>["outputSchema"],
  NonNullable<ExtractRouteByPath<OtpRoutes, TPath>["errorCodes"]>[number],
  NonNullable<ExtractRouteByPath<OtpRoutes, TPath>["queryParameters"]>[number]
>;
type OtpStatusRoute = ExtractRouteByPath<OtpRoutes, "/totp/status", "GET">;

/** Framework adapters preserve the one-time password routes' inputs, outputs, and errors. */
export interface OtpFragmentClients {
  useGenerateToken: OtpMutator<"/ott/generate">;
  useValidateToken: OtpMutator<"/ott/validate">;
  useCleanupTokens: OtpMutator<"/ott/cleanup">;
  useInvalidateTokens: OtpMutator<"/ott/invalidate">;
  useEnableTotp: OtpMutator<"/totp/enable">;
  useVerifyTotp: OtpMutator<"/totp/verify">;
  useVerifyBackupCode: OtpMutator<"/totp/verify-backup">;
  useDisableTotp: OtpMutator<"/totp/disable">;
  useTotpStatus: FragnoClientHookData<
    "GET",
    "/totp/status",
    NonNullable<OtpStatusRoute["outputSchema"]>,
    NonNullable<OtpStatusRoute["errorCodes"]>[number],
    NonNullable<OtpStatusRoute["queryParameters"]>[number]
  >;
}

/** The mapped client object meets Fragno's record constraint without an open index signature. */
export type OtpFragmentAdapterClients = Pick<OtpFragmentClients, keyof OtpFragmentClients>;

export function createOtpFragment(
  config: Readonly<OtpFragmentConfig> = {},
  fragnoConfig: FragnoPublicConfigWithDatabase,
): OtpFragment {
  return instantiate(otpFragmentDefinition)
    .withConfig(config)
    .withOptions(fragnoConfig)
    .withRoutes([ottRoutesFactory, totpRoutesFactory])
    .build();
}

export function createOtpFragmentClients(
  fragnoConfig: FragnoPublicClientConfig,
): OtpFragmentClients {
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
