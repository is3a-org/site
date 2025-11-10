import { useFragno } from "@fragno-dev/core/vue";
import { createOtpFragmentClients } from "..";
import type { FragnoPublicClientConfig } from "@fragno-dev/core";

export function createOtpFragmentClient(config: FragnoPublicClientConfig = {}) {
  return useFragno(createOtpFragmentClients(config));
}
