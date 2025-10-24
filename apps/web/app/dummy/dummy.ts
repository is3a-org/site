import type { InferInsertModel } from "drizzle-orm";
import type { Is3aD1 } from "~/db/is3a-d1/is3a-d1";
import { schema } from "~/db/is3a-d1/is3a-d1.schema";

export class DummyRepository {
  #db: Is3aD1;

  constructor(db: Is3aD1) {
    this.#db = db;
  }

  createDummy(dummy: InferInsertModel<typeof schema.dummy>) {
    return this.#db.insert(schema.dummy).values(dummy).returning().execute();
  }

  getDummies() {
    return this.#db.select().from(schema.dummy);
  }
}
