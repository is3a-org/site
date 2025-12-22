import type { Route } from "./+types/login";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "react-router";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { createOtpServer } from "~/fragno/otp-server";
import { magicLinkTemplate, sendEmail } from "~/lib/email";
import { Turnstile } from "@marsidev/react-turnstile";
import { verifyTurnstile } from "~/lib/turnstile";
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Login - IS3A" },
    { name: "description", content: "Login to your IS3A member account." },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = createSimpleAuthServer(context.pool);

  const response = await auth.callRoute("GET", "/me", {
    query: { sessionId: request.url.split("?")[1] },
    headers: request.headers,
  });

  if (response.type === "json") {
    return redirect("/dashboard/membership");
  }
}

type ActionIntent = "magic-link" | "password";

export async function action({ request, context }: Route.ActionArgs) {
  const auth = createSimpleAuthServer(context.pool);
  const otp = createOtpServer(context.pool);

  const formData = await request.formData();
  const intent = (formData.get("intent") as ActionIntent) || "password";
  const email = formData.get("email") as string;

  // Verify Turnstile token
  const turnstileToken = formData.get("cf-turnstile-response") as string | null;
  const clientIp = request.headers.get("CF-Connecting-IP");
  const turnstileResult = await verifyTurnstile(turnstileToken, clientIp);

  if (!turnstileResult.success) {
    return {
      error: turnstileResult.error || "Verification failed. Please try again.",
      email,
      intent,
    };
  }

  if (intent === "magic-link") {
    // Magic link login flow
    const user = await auth.services.getUserByEmail(email);
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
  const password = formData.get("password") as string;

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

export default function Login({ actionData }: Route.ComponentProps) {
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(actionData?.intent === "magic-link");
  const [email, setEmail] = useState(actionData?.email || "");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // Show success message after magic link is sent
  if (actionData?.success && actionData?.intent === "magic-link") {
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
              <p className="text-muted-foreground mb-4">
                Click the link in your email to sign in. The link will expire in 15 minutes.
              </p>
              <p className="text-muted-foreground text-sm">
                Didn't receive it? Check your spam folder or{" "}
                <a href="/login" className="text-primary font-semibold hover:underline">
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
            {turnstileError && (
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

                  {actionData?.error && actionData?.intent === "magic-link" && (
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
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={turnstileError !== null}>
                    Send Sign-in Link
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setShowMagicLinkForm(false)}
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

                  {actionData?.error && actionData?.intent === "password" && (
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
                      onChange={(e) => setEmail(e.target.value)}
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

                  <Button type="submit" className="w-full" disabled={turnstileError !== null}>
                    Sign In
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setShowMagicLinkForm(true)}
                  variant="secondary"
                  className="w-full"
                >
                  Email me a sign-in link instead
                </Button>
              </>
            )}

            <p className="text-muted-foreground mt-6 text-center text-sm">
              Not a member yet?{" "}
              <a href="/sign-up" className="text-primary font-semibold hover:underline">
                Join IS3A
              </a>
            </p>

            <Turnstile
              siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setTurnstileError(null);
              }}
              onError={() => setTurnstileError("Could not verify you as human!")}
              options={{ size: "invisible" }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
