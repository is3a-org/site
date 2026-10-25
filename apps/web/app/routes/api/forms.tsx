import { createFormsServer } from "~/fragno/forms-server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/forms";

export async function loader({ request, context }: Route.LoaderArgs) {
  return createFormsServer(context.get(requestContext).pool).handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  return createFormsServer(context.get(requestContext).pool).handler(request);
}
