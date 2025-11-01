import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  layout("routes/landing/landing-layout.tsx", [
    index("routes/home.tsx"),
    route("join", "routes/join.tsx"),
    route("team", "routes/team.tsx"),
    ...prefix("login", [
      route("", "routes/login/login.tsx"),
      route("error", "routes/login/login-error.tsx"),
    ]),
    route("sign-up", "routes/sign-up.tsx"),
  ]),
  ...prefix("dashboard", [
    layout("routes/dashboard/dashboard-layout.tsx", [
      index("routes/dashboard/dashboard-home.tsx"),
      route("locations", "routes/dashboard/locations.tsx"),
    ]),
  ]),
  route("api/simple-auth/*", "routes/api/simple-auth.tsx"),
] satisfies RouteConfig;
