import { createOtpServer } from "~/fragno/otp-server";
import type { Route } from "./+types/otp";

export async function loader({ request, context }: Route.LoaderArgs) {
  return createOtpServer(context.pool).handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  return createOtpServer(context.pool).handler(request);
}
