import { buttonVariants } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { TriangleAlert } from "lucide-react";
import type { JSX } from "react";
import { Link } from "react-router";

import { landingCardPage, textLink } from "~/components/landing/landing-styles";

import type { Route } from "./+types/login-error";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Login Error - IS3A" },
    { name: "description", content: "There was an error logging in." },
  ];
}

export default function LoginError(): JSX.Element {
  return (
    <div className={landingCardPage}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-destructive-muted">
            <TriangleAlert className="size-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            <h1>Login failed</h1>
          </CardTitle>
          <CardDescription>
            There was an error logging in to your account. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Link to="/login" className={buttonVariants({ size: "lg" })}>
            Try again
          </Link>
          <Link to="/" className={buttonVariants({ size: "lg", variant: "secondary" })}>
            Back to home
          </Link>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Need help?{" "}
            <a href="mailto:contact@is3a.nl" className={textLink}>
              Contact us
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
