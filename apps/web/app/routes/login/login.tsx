import type { Route } from "./+types/login";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Login - IS3A" },
    { name: "description", content: "Login to your IS3A member account." },
  ];
}

export default function Login() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">Member Login</h1>

          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Not a member yet?{" "}
            <a href="/join" className="font-semibold text-red-600 hover:text-red-700">
              Join IS3A
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
