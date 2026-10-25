import { createOtpServer } from "~/fragno/otp-server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/otp";

export async function loader({ request, context }: Readonly<Route.LoaderArgs>): Promise<Response> {
  return createOtpServer(context.get(requestContext).pool).handler(request);
}

export async function action({ request, context }: Readonly<Route.ActionArgs>): Promise<Response> {
  return createOtpServer(context.get(requestContext).pool).handler(request);
}
