import type { Route } from "./+types/login-error";
import { Link } from "react-router";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Login Error - IS3A" },
    { name: "description", content: "There was an error logging in." },
  ];
}

export default function LoginError() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Login Failed</h1>
            <p className="text-gray-600">
              There was an error logging in to your account. Please try again.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full rounded-md bg-red-800 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-red-700"
            >
              Try Again
            </Link>

            <Link
              to="/"
              className="block w-full rounded-md bg-gray-100 px-6 py-3 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              Back to Home
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Need help?{" "}
            <a
              href="mailto:contact@is3a.nl"
              className="font-semibold text-red-800 hover:text-red-700"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
