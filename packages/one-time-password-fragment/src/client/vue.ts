import type { FragnoPublicClientConfig } from "@fragno-dev/core/client";
import { useFragno as createFragnoClient } from "@fragno-dev/core/vue";

import { createOtpFragmentClients, type OtpFragmentAdapterClients } from "..";

export function createOtpFragmentClient(
  config: FragnoPublicClientConfig = {},
): ReturnType<typeof createFragnoClient<OtpFragmentAdapterClients>> {
  return createFragnoClient<OtpFragmentAdapterClients>(createOtpFragmentClients(config));
}
