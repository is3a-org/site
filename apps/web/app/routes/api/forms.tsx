import { createFormsServer } from "~/fragno/forms-server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/forms";

export async function loader({ request, context }: Route.LoaderArgs): Promise<Response> {
  return createFormsServer(context.get(requestContext).pool).handler(request);
}

export async function action({ request, context }: Route.ActionArgs): Promise<Response> {
  return createFormsServer(context.get(requestContext).pool).handler(request);
}
