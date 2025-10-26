import type { Route } from "./+types/simple-auth";
import { db } from "~/db/postgres/is3a-postgres";
import { schema } from "~/db/postgres/postgres.schema";

export async function loader({ request }: Route.LoaderArgs) {
  console.log("loader", request.url);

  const insert = await db.insert(schema.dummy).values({ id: 1, name: "test" }).returning();
  console.log("insert", insert);

  console.log("db", await db.select().from(schema.dummy));
  console.log("exit");
  return 1;
}

export async function action({ request }: Route.ActionArgs) {
  console.log("loader", request.url);

  const insert = await db.insert(schema.dummy).values({ id: 1, name: "test" }).returning();
  console.log("insert", insert);

  console.log("db", await db.select().from(schema.dummy));
  console.log("exit");
  return 1;
}
