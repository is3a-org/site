import { createFragment, type FragnoPublicClientConfig } from "@fragno-dev/core";
import { createClientBuilder } from "@fragno-dev/core/client";
import {
  defineFragmentWithDatabase,
  type FragnoPublicConfigWithDatabase,
} from "@fragno-dev/db/fragment";
import { otpSchema } from "./schema";
import { createOttServices, ottRoutesFactory, type OttConfig } from "./ott/ott";
import { createTotpServices, totpRoutesFactory, type TotpConfig } from "./totp/totp";

export interface OtpFragmentConfig extends OttConfig, TotpConfig {
  issuer?: string;
}

export const otpFragmentDefinition = defineFragmentWithDatabase<OtpFragmentConfig>(
  "one-time-password",
)
  .withDatabase(otpSchema)
  .providesService(({ db, config }) => {
    return {
      ...createOttServices(db),
      ...createTotpServices(db, config),
    };
  });

export function createOtpFragment(
  config: OtpFragmentConfig = {},
  fragnoConfig: FragnoPublicConfigWithDatabase,
) {
  return createFragment(
    otpFragmentDefinition,
    config,
    [ottRoutesFactory, totpRoutesFactory],
    fragnoConfig,
  );
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
