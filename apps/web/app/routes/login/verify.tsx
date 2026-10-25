import { buttonVariants } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { CrossesLoader } from "@is3a/design-system/crosses";
import { TriangleAlert } from "lucide-react";
import type { JSX } from "react";
import { redirect, Link } from "react-router";

import { landingCardPage } from "~/components/landing/landing-styles";
import { createOtpServer } from "~/fragno/otp-server";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/verify";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Verifying Login - IS3A" },
    { name: "description", content: "Verifying your magic link login." },
  ];
}

interface LoginVerificationError {
  error: string;
}

export async function loader({
  request,
  context,
}: Readonly<Route.LoaderArgs>): Promise<Response | LoginVerificationError> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (token === null || token === "" || email === null || email === "") {
    return { error: "Invalid link. The sign-in link is missing required parameters." };
  }

  const auth = createSimpleAuthServer(context.get(requestContext).pool);
  const otp = createOtpServer(context.get(requestContext).pool);

  // Lookup user by email
  const user = await auth.inContext(async function () {
    const [result] = await this.handlerTx()
      .withServiceCalls(() => [auth.services.getUserByEmail(email)] as const)
      .execute();
    return result;
  });
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
      case "token_invalid": {
        msg = "This sign-in link is invalid.";
        break;
      }
      case "token_expired": {
        msg = "This sign-in link has expired.";
        break;
      }
    }

    return { error: msg };
  }

  // Create session for the user
  const issued = await auth.inContext(async function () {
    const [result] = await this.handlerTx()
      .withServiceCalls(() => [auth.services.issueCredential(user.id)] as const)
      .execute();
    return result;
  });

  if (!issued.ok) {
    return { error: "This account cannot sign in right now." };
  }

  // Redirect to dashboard with session cookie
  return redirect("/dashboard/membership", {
    headers: {
      "Set-Cookie": auth.services.buildAuthCookie(issued.credential.id),
    },
  });
}

export default function Verify({
  loaderData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  if (loaderData.error !== "") {
    return (
      <div className={landingCardPage}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-destructive-muted">
              <TriangleAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Sign-in Failed</CardTitle>
            <CardDescription>{loaderData.error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/login" className={buttonVariants()}>
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={landingCardPage}>
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <CrossesLoader label="Verifying your login" className="[&_svg]:size-4" />
        <p aria-hidden>Verifying your login…</p>
      </div>
    </div>
  );
}
