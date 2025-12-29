import { createFormsServer } from "~/fragno/forms-server";
import type { Route } from "./+types/forms";

export async function loader({ request, context }: Route.LoaderArgs) {
  return createFormsServer(context.pool).handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  return createFormsServer(context.pool).handler(request);
}
