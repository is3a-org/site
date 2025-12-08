import type { Route } from "./+types/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "react-router";
import { createSimpleAuthServer } from "~/fragno/simple-auth-server";

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
    return redirect("/dashboard");
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  const auth = createSimpleAuthServer(context.pool);

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    // Call the /sign-in route
    const response = await auth.callRoute("POST", "/sign-in", {
      headers: request.headers,
      body: { email, password },
    });

    if (response.type === "error") {
      return {
        error: response.error.message,
        email,
      };
    }

    // Redirect to dashboard on success
    return redirect("/dashboard", {
      headers: response.headers,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to sign in",
      email,
    };
  }
}

export default function Login({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="flex w-full flex-col items-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Member Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
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
                />
              </div>

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>

            <p className="text-muted-foreground mt-6 text-center text-sm">
              Not a member yet?{" "}
              <a href="/sign-up" className="text-primary font-semibold hover:underline">
                Join IS3A
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
