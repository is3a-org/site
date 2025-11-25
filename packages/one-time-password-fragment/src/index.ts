import { defineFragment, instantiate } from "@fragno-dev/core";
import { createClientBuilder, type FragnoPublicClientConfig } from "@fragno-dev/core/client";
import { withDatabase, type FragnoPublicConfigWithDatabase } from "@fragno-dev/db";
import { otpSchema } from "./schema";
import { createOttServices, ottRoutesFactory, type OttConfig } from "./ott/ott";
import { createTotpServices, totpRoutesFactory, type TotpConfig } from "./totp/totp";

export interface OtpFragmentConfig extends OttConfig, TotpConfig {
  issuer?: string;
}

export const otpFragmentDefinition = defineFragment<OtpFragmentConfig>("one-time-password")
  .extend(withDatabase(otpSchema, "one-time-password-db"))
  .providesBaseService(({ deps, config }) => {
    return {
      ...createOttServices(deps.db),
      ...createTotpServices(deps.db, config),
    };
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
