import type { Route } from "./+types/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Login - IS3A" },
    { name: "description", content: "Login to your IS3A member account." },
  ];
}

export default function Login() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Member Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input type="email" id="email" name="email" placeholder="you@example.com" required />
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
            <a href="/join" className="text-primary font-semibold hover:underline">
              Join IS3A
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
