import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import type { Route } from "./+types/simple-auth";

export async function loader({ request, context }: Route.LoaderArgs) {
  return createSimpleAuthServer(context.pool).handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  console.log("action", request.url);
  return createSimpleAuthServer(context.pool).handler(request);
}
