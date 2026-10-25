import type { FragnoPublicClientConfig } from "@fragno-dev/core/client";
import { useFragno } from "@fragno-dev/core/vue";

import { createOtpFragmentClients, type OtpFragmentAdapterClients } from "..";

export function createOtpFragmentClient(
  config: FragnoPublicClientConfig = {},
): ReturnType<typeof useFragno<OtpFragmentAdapterClients>> {
  return useFragno<OtpFragmentAdapterClients>(createOtpFragmentClients(config));
}
