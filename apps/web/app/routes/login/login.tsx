import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { Input } from "@is3a/design-system/input";
import { Label } from "@is3a/design-system/label";
import type { JSX } from "react";
import { useState } from "react";
import { redirect } from "react-router";

import { Turnstile } from "@marsidev/react-turnstile";

import { createOtpServer } from "~/fragno/otp-server";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { readFormText } from "~/fragno/request-form";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { magicLinkTemplate, sendEmail } from "~/lib/email";
import { verifyTurnstile } from "~/lib/turnstile";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/login";
export function meta(): Route.MetaDescriptors {
  return [
    { title: "Login - IS3A" },
    { name: "description", content: "Login to your IS3A member account." },
  ];
}

export async function loader({
  request,
  context,
}: Readonly<Route.LoaderArgs>): Promise<Response | undefined> {
  const auth = createSimpleAuthServer(context.get(requestContext).pool);

  const response = await auth.callRoute("GET", "/me", {
    headers: request.headers,
  });

  if (response.type === "json") {
    return redirect("/dashboard/membership");
  }
  return undefined;
}

type ActionIntent = "magic-link" | "password";

interface LoginActionError {
  error: string;
  email: string;
  intent: ActionIntent;
  success?: never;
}

interface MagicLinkActionSuccess {
  success: true;
  email: string;
  intent: "magic-link";
  error?: never;
}

export async function action({
  request,
  context,
}: Readonly<Route.ActionArgs>): Promise<Response | LoginActionError | MagicLinkActionSuccess> {
  const auth = createSimpleAuthServer(context.get(requestContext).pool);
  const otp = createOtpServer(context.get(requestContext).pool);

  const formData = await request.formData();
  const intent = formData.get("intent") === "magic-link" ? "magic-link" : "password";
  const email = readFormText(formData, "email") ?? "";

  // Verify Turnstile token
  const turnstileToken = readFormText(formData, "cf-turnstile-response");
  const clientIp = request.headers.get("CF-Connecting-IP");
  // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Turnstile verification accepts a nullable token from a missing form field.
  const turnstileResult = await verifyTurnstile(turnstileToken ?? null, clientIp);

  if (!turnstileResult.success) {
    return {
      error:
        turnstileResult.error === undefined || turnstileResult.error === ""
          ? "Verification failed. Please try again."
          : turnstileResult.error,
      email,
      intent,
    };
  }

  if (intent === "magic-link") {
    // Magic link login flow
    const user = await auth.inContext(async function () {
      const [result] = await this.handlerTx()
        .withServiceCalls(() => [auth.services.getUserByEmail(email)] as const)
        .execute();
      return result;
    });
    if (!user) {
      return {
        error: "No account found with this email address",
        email,
        intent,
      };
    }

    // Generate magic link token
    const response = await otp.callRoute("POST", "/ott/generate", {
      body: { userId: user.id, type: "passwordless_login", durationMinutes: 15 },
    });

    if (response.type !== "json") {
      return {
        error: "Failed to generate magic link. Please try again.",
        email,
        intent,
      };
    }

    const token = response.data.token;
    const url = new URL(request.url);
    const magicLink = `${url.origin}/login/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email
    await sendEmail(email, "Log in to IS3A", magicLinkTemplate(magicLink));
    if (process.env.NODE_ENV === "development") {
      console.log(`Magic link for ${user.email}: ${magicLink}`);
    }

    return {
      success: true,
      email,
      intent,
    };
  }

  // Password login flow (existing logic)
  const password = readFormText(formData, "password") ?? "";

  try {
    const response = await auth.callRoute("POST", "/sign-in", {
      headers: request.headers,
      body: { email, password },
    });

    if (response.type === "error") {
      return {
        error: response.error.message,
        email,
        intent,
      };
    }

    return redirect("/dashboard/membership", {
      headers: response.headers,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to sign in",
      email,
      intent,
    };
  }
}

export default function Login({
  actionData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(actionData?.intent === "magic-link");
  const [email, setEmail] = useState(actionData?.email ?? "");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState<string>();

  // Show success message after magic link is sent
  if (actionData?.success === true) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
        <div className="flex w-full flex-col items-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a sign-in link to <strong>{actionData.email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-muted-foreground">
                Click the link in your email to sign in. The link will expire in 15 minutes.
              </p>
              <p className="text-sm text-muted-foreground">
                Didn't receive it? Check your spam folder or{" "}
                <a href="/login" className="font-semibold text-primary hover:underline">
                  try again
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="flex w-full flex-col items-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Member Login</CardTitle>
            <CardDescription>Sign in to your IS3A member account</CardDescription>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This website is under construction: this login is for developers only.
            </p>
            {turnstileError !== undefined && turnstileError !== "" && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{turnstileError}</div>
            )}
          </CardHeader>
          <CardContent>
            {showMagicLinkForm ? (
              <>
                {/* Magic Link Form */}
                <form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="magic-link" />
                  <input type="hidden" name="cf-turnstile-response" value={turnstileToken} />

                  {actionData?.error !== undefined &&
                    actionData.error !== "" &&
                    actionData.intent === "magic-link" && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                        {actionData.error}
                      </div>
                    )}

                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email Address</Label>
                    <Input
                      type="email"
                      id="magic-email"
                      name="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={turnstileError !== undefined}>
                    Send Sign-in Link
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setShowMagicLinkForm(false);
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Sign in with password instead
                </Button>
              </>
            ) : (
              <>
                {/* Password Form - Primary */}
                <form method="post" className="space-y-6">
                  <input type="hidden" name="intent" value="password" />
                  <input type="hidden" name="cf-turnstile-response" value={turnstileToken} />

                  {actionData?.error !== undefined &&
                    actionData.error !== "" &&
                    actionData.intent === "password" && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                        {actionData.error}
                      </div>
                    )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={turnstileError !== undefined}>
                    Sign In
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setShowMagicLinkForm(true);
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Email me a sign-in link instead
                </Button>
              </>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Not a member yet?{" "}
              <a href="/sign-up" className="font-semibold text-primary hover:underline">
                Join IS3A
              </a>
            </p>

            <Turnstile
              siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setTurnstileError(undefined);
              }}
              onError={() => {
                setTurnstileError("Could not verify you as human!");
              }}
              options={{ size: "invisible" }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
