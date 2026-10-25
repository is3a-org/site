import { createClientBuilder } from "@fragno-dev/core/client";
import { expect, expectTypeOf, it } from "vite-plus/test";

import { instantiate } from "@fragno-dev/core";
import type { FragnoPublicConfigWithDatabase } from "@fragno-dev/db";

import {
  otpFragmentDefinition,
  OttType,
  type OtpFragment,
  type OtpFragmentClients,
  type OtpFragmentConfig,
} from ".";
import { ottRoutesFactory } from "./ott/ott";
import { totpRoutesFactory } from "./totp/totp";

it("preserves the asynchronous one-time password email callback contract", () => {
  expectTypeOf<ReturnType<NonNullable<OtpFragmentConfig["sendEmail"]>>>().toEqualTypeOf<
    Promise<void>
  >();
});

it("preserves the public OttType schema value and inferred token type", () => {
  expectTypeOf<OttType>().toEqualTypeOf<
    "email_verification" | "password_reset" | "passwordless_login"
  >();
  expect(OttType.parse("password_reset")).toBe("password_reset");
  expect(OttType.safeParse("invalid_token_type").success).toBe(false);
});

it("preserves the exact inferred one-time password client routes", () => {
  const builder = createClientBuilder(otpFragmentDefinition, {}, [
    ottRoutesFactory,
    totpRoutesFactory,
  ]);
  const inferredClients = {
    useGenerateToken: builder.createMutator("POST", "/ott/generate"),
    useValidateToken: builder.createMutator("POST", "/ott/validate"),
    useCleanupTokens: builder.createMutator("POST", "/ott/cleanup"),
    useInvalidateTokens: builder.createMutator("POST", "/ott/invalidate"),
    useEnableTotp: builder.createMutator("POST", "/totp/enable"),
    useVerifyTotp: builder.createMutator("POST", "/totp/verify"),
    useVerifyBackupCode: builder.createMutator("POST", "/totp/verify-backup"),
    useDisableTotp: builder.createMutator("POST", "/totp/disable"),
    useTotpStatus: builder.createHook("/totp/status"),
  };

  expectTypeOf<OtpFragmentClients>().toEqualTypeOf<typeof inferredClients>();
});

it("preserves the exact inferred one-time password server fragment", () => {
  const fragmentOptions: FragnoPublicConfigWithDatabase = {};
  const builder = instantiate(otpFragmentDefinition)
    .withConfig({})
    .withOptions(fragmentOptions)
    .withRoutes([ottRoutesFactory, totpRoutesFactory]);

  expectTypeOf<OtpFragment>().toEqualTypeOf<ReturnType<typeof builder.build>>();
});
