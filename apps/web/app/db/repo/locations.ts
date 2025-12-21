import { location } from "~/db/postgres/postgres.schema";
import { type DrizzleDatabase } from "~/db/postgres/is3a-postgres";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const LocationSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  email: z.email("Invalid email address").nullable().optional(),
  address: z.string().max(500, "Address is too long").nullable().optional(),
  website: z.url().nullable().optional(),
  seasonSummer: z.boolean().default(false),
  seasonAutumn: z.boolean().default(false),
  seasonWinter: z.boolean().default(false),
  seasonSpring: z.boolean().default(false),
});

export const NewLocationSchema = LocationSchema.omit({ id: true });

export type Location = z.infer<typeof LocationSchema>;
export type NewLocation = z.infer<typeof NewLocationSchema>;

export class LocationRepo {
  #db: DrizzleDatabase;

  constructor(db: DrizzleDatabase) {
    this.#db = db;
  }

  async getAllLocations(): Promise<Location[]> {
    return await this.#db.select().from(location).orderBy(location.name);
  }

  async getLocationById(id: number): Promise<Location | null> {
    const results = await this.#db.select().from(location).where(eq(location.id, id)).limit(1);
    return results[0] ?? null;
  }

  async createLocation(newLocation: NewLocation) {
    return await this.#db.insert(location).values(newLocation).returning();
  }

  async updateLocation(id: number, data: Partial<NewLocation>) {
    await this.#db.update(location).set(data).where(eq(location.id, id));
  }

  async deleteLocation(id: number) {
    await this.#db.delete(location).where(eq(location.id, id));
  }
}
