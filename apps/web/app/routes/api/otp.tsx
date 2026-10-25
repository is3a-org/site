import { createOtpServer } from "~/fragno/otp-server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/otp";

export async function loader({ request, context }: Route.LoaderArgs) {
  return createOtpServer(context.get(requestContext).pool).handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  return createOtpServer(context.get(requestContext).pool).handler(request);
}
