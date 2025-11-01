import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import type { Route } from "./+types/simple-auth";
// import { createSimpleAuthServer } from "~/fragno/simple-auth-server";

export async function loader({ request, context }: Route.LoaderArgs) {
  return createSimpleAuthServer(context.db).handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  console.log("action", request.url);
  return createSimpleAuthServer(context.db).handler(request);
}
