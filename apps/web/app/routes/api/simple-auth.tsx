import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/simple-auth";

export async function loader({ request, context }: Readonly<Route.LoaderArgs>): Promise<Response> {
  return createSimpleAuthServer(context.get(requestContext).pool).handler(request);
}

export async function action({ request, context }: Readonly<Route.ActionArgs>): Promise<Response> {
  console.log("action", request.url);
  return createSimpleAuthServer(context.get(requestContext).pool).handler(request);
}
