import type { Route } from "./+types/verify";
import { redirect, Link } from "react-router";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { createOtpServer } from "~/fragno/otp-server";
import { TriangleAlert } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Verifying Login - IS3A" },
    { name: "description", content: "Verifying your magic link login." },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return { error: "Invalid link. The sign-in link is missing required parameters." };
  }

  const auth = createSimpleAuthServer(context.pool);
  const otp = createOtpServer(context.pool);

  // Lookup user by email
  const user = await auth.services.getUserByEmail(email);
  if (!user) {
    return { error: "Account not found. The account associated with this link no longer exists." };
  }

  // Validate the magic link token
  const response = await otp.callRoute("POST", "/ott/validate", {
    body: { userId: user.id, token, type: "passwordless_login" },
  });

  if (response.type === "error") {
    let msg = "This sign-in link has expired or has already been used.";

    switch (response.error.code) {
      case "token_invalid":
        msg = "This sign-in link is invalid.";
        break;
      case "token_expired":
        msg = "This sign-in link has expired.";
        break;
    }

    return { error: msg };
  }

  // Create session for the user
  const session = await auth.services.createSession(user.id);

  // Redirect to dashboard with session cookie
  return redirect("/dashboard/membership", {
    headers: {
      "Set-Cookie": auth.services.buildSessionCookie(session.id),
    },
  });
}

export default function Verify({ loaderData }: Route.ComponentProps) {
  if (loaderData?.error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <TriangleAlert className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Sign-in Failed</CardTitle>
            <CardDescription>{loaderData.error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/login">
              <Button>Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-t-gray-900"></div>
        <p className="text-gray-600">Verifying your login...</p>
      </div>
    </div>
  );
}
