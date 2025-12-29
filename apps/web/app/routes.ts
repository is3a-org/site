import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  layout("routes/landing/landing-layout.tsx", [
    index("routes/home.tsx"),
    route("join", "routes/join.tsx"),
    route("team", "routes/team.tsx"),
    ...prefix("login", [
      route("", "routes/login/login.tsx"),
      route("verify", "routes/login/verify.tsx"),
      route("error", "routes/login/login-error.tsx"),
    ]),
    route("sign-up", "routes/sign-up.tsx"),
  ]),
  ...prefix("dashboard", [
    layout("routes/dashboard/dashboard-layout.tsx", [
      index("routes/dashboard/dashboard-home.tsx"),
      route("membership", "routes/dashboard/membership.tsx"),
      route("subscribe-confirm", "routes/dashboard/subscribe-confirm.tsx"),
      ...prefix("admin", [
        layout("routes/dashboard/admin-layout.tsx", [
          route("locations", "routes/dashboard/locations.tsx"),
          route("users", "routes/dashboard/users.tsx"),
          route("members", "routes/dashboard/members.tsx"),
          route("stripe", "routes/dashboard/stripe.tsx"),
          route("stripe/bulk-import", "routes/dashboard/stripe/bulk-import.tsx"),
        ]),
      ]),
    ]),
  ]),
  route("api/simple-auth/*", "routes/api/simple-auth.tsx"),
  route("api/otp/*", "routes/api/otp.tsx"),
  route("api/stripe/*", "routes/api/stripe.tsx"),
  route("api/forms/*", "routes/api/forms.tsx"),
  route("_dev/email-preview", "routes/dev/email-preview.tsx"),
] satisfies RouteConfig;
