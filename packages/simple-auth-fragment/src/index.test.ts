import { assert, beforeAll, describe, expect, it } from "vitest";
import { Kysely } from "kysely";
import { KyselyPGlite } from "kysely-pglite";
import { KyselyAdapter } from "@fragno-dev/db/adapters/kysely";
import { authSchema } from "./schema";
import { createAuthFragment } from ".";

describe("simple-auth-fragment", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let kysely: Kysely<any>;
  let adapter: KyselyAdapter;
  let fragment: ReturnType<typeof createAuthFragment>;

  beforeAll(async () => {
    const { dialect } = await KyselyPGlite.create();
    kysely = new Kysely({
      dialect,
    });

    adapter = new KyselyAdapter({
      db: kysely,
      provider: "postgresql",
    });

    fragment = createAuthFragment(
      {},
      {
        databaseAdapter: adapter,
      },
    );
  }, 12000);

  it("should run migrations", async () => {
    const schemaVersion = await adapter.getSchemaVersion("simple-auth-db");
    expect(schemaVersion).toBeUndefined();

    const migrator = adapter.createMigrationEngine(authSchema, "simple-auth-db");
    const preparedMigration = await migrator.prepareMigration({
      updateSettings: false,
    });
    assert(preparedMigration.getSQL);
    await preparedMigration.execute();
  });

  it("should create a user", async () => {
    const user = await fragment.services.createUser("test@test.com", "password");
    expect(user).toBeDefined();
    expect(user.email).toBe("test@test.com");
  });

  it("should get user by email", async () => {
    const user = await fragment.services.getUserByEmail("test@test.com");
    expect(user).toBeDefined();
    expect(user?.email).toBe("test@test.com");
  });
});
