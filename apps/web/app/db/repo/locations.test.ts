import { describe, it, afterAll, beforeAll } from "vitest";
import { createDrizzleDatabase, createPostgresClient } from "../postgres/is3a-postgres";
import { sql } from "drizzle-orm";
import { location } from "../postgres/postgres.schema";

describe("LocationRepo", () => {
  async function createDb() {
    const client = createPostgresClient("postgres://is3a:is3a@localhost:5435/is3a");
    await client.connect();
    return createDrizzleDatabase(client);
  }

  let db: Awaited<ReturnType<typeof createDb>>;

  beforeAll(async () => {
    db = await createDb();
  });

  afterAll(async () => {
    // await db.$client.end();
  });

  it("should create a new location", async () => {
    await db.execute(sql`BEGIN`);

    // const repo = new LocationRepo(db);
    // const locations = await repo.getAllLocations();
    // expect(locations).toHaveLength(0);

    // db.transaction(async (tx) => {
    //   await tx.insert(location).values({
    //     name: "Test Location",
    //     email: "test@example.com",
    //     address: "123 Main St, Anytown, USA",
    //     website: "https://example.com",
    //     seasonSummer: true,
    //     seasonAutumn: true,
    //     seasonWinter: true,
    //     seasonSpring: true,
    //   });
    // });

    await db.insert(location).values({
      name: "Test Location 3",
      email: "test@example.com",
      address: "123 Main St, Anytown, USA",
      website: "https://example.com",
      seasonSummer: true,
      seasonAutumn: true,
      seasonWinter: true,
      seasonSpring: true,
    });

    await db.execute(sql`ROLLBACK`);
  });
});
