import type { Route } from "./+types/sign-up";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "react-router";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Sign Up - IS3A" },
    { name: "description", content: "Create your IS3A member account." },
  ];
}

export async function loader(_: Route.LoaderArgs) {
  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const auth = createSimpleAuthServer(context.db);

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

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
    // Check if user already exists
    const existingUser = await auth.services.getUserByEmail(email);
    if (existingUser) {
      return {
        error: "An account with this email already exists",
        email,
      };
    }

    // Create the user
    const user = await auth.services.createUser(email, password);

    // Create a session for the new user
    const session = await auth.services.createSession(user.id);

    console.log({
      user,
      session,
    });

    // Set the session cookie and redirect to dashboard
    return redirect("/dashboard");
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to create account",
      email,
    };
  }
}

export default function SignUp({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="flex w-full flex-col items-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Sign up to become an IS3A member</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" className="space-y-6">
              {actionData?.error && (
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
                  defaultValue={actionData?.email || ""}
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
                <p className="text-xs text-gray-500">Must be at least 8 characters</p>
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

            <p className="text-muted-foreground mt-6 text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="text-primary font-semibold hover:underline">
                Sign In
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
