import { Alert, AlertDescription } from "@is3a/design-system/alert";
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
import { redirect } from "react-router";

import { landingCardPage } from "~/components/landing/landing-styles";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { readFormText } from "~/fragno/request-form";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/sign-up";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Sign Up - IS3A" },
    { name: "description", content: "Create your IS3A member account." },
  ];
}

export function loader(): Record<string, never> {
  return {};
}

interface SignUpActionError {
  error: string;
  email: string;
}

export async function action({
  request,
  context,
}: Readonly<Route.ActionArgs>): Promise<Response | SignUpActionError> {
  const auth = createSimpleAuthServer(context.get(requestContext).pool);

  const formData = await request.formData();
  const email = readFormText(formData, "email") ?? "";
  const password = readFormText(formData, "password") ?? "";
  const confirmPassword = readFormText(formData, "confirmPassword") ?? "";

  // Validate passwords match
  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match",
      email,
    };
  }

  // Validate password length
  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters",
      email,
    };
  }

  try {
    const response = await auth.callRoute("POST", "/sign-up", {
      headers: request.headers,
      body: { email, password },
    });

    if (response.type === "error") {
      return {
        error: response.error.message || "Failed to create account",
        email,
      };
    }

    if (response.type !== "json") {
      return {
        error: "Failed to create account",
        email,
      };
    }

    return redirect("/dashboard/membership", {
      headers: response.headers,
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to create account",
      email,
    };
  }
}

export default function SignUp({
  actionData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  return (
    <div className={landingCardPage}>
      <div className="flex w-full flex-col items-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Sign up to become an IS3A member</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" className="space-y-6">
              {actionData?.error !== undefined && actionData.error !== "" && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{actionData.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  defaultValue={actionData?.email ?? ""}
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
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
