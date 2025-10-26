import type { Route } from "./+types/simple-auth";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";

export async function loader({ request }: Route.LoaderArgs) {
  console.log("loader", request.url);

  createSimpleAuthServer().handler(request);
}

export async function action({ request }: Route.ActionArgs) {
  console.log("loader", request.url);

  return createSimpleAuthServer().handler(request);
}
