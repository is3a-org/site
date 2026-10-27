import { redirect } from "react-router";

/** Users and members now share one page; keep old links working. */
export function loader(): Response {
  return redirect("/dashboard/admin/members?view=all");
}
