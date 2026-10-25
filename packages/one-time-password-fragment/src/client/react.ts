import type { FragnoPublicClientConfig } from "@fragno-dev/core/client";
import { createFragnoReactClient } from "@fragno-dev/core/react";

import { createOtpFragmentClients, type OtpFragmentAdapterClients } from "..";

export function createOtpFragmentClient(
  config: FragnoPublicClientConfig = {},
): ReturnType<typeof createFragnoReactClient<OtpFragmentAdapterClients>> {
  return createFragnoReactClient<OtpFragmentAdapterClients>(createOtpFragmentClients(config));
}
