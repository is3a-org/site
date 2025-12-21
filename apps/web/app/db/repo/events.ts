import { event } from "~/db/postgres/postgres.schema";
import { type DrizzleDatabase } from "~/db/postgres/is3a-postgres";
import { z } from "zod";
import { eq, and, gte } from "drizzle-orm";

export const EventSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly (lowercase, numbers, hyphens)")
    .max(100, "Slug is too long")
    .nullable()
    .optional(),
  date: z.date(),
  locationId: z.number().nullable().optional(),
  description: z.string().max(5000, "Description is too long").nullable().optional(),
  speaker: z.string().max(255, "Speaker name is too long").nullable().optional(),
  speakerAbstract: z.string().max(5000, "Speaker abstract is too long").nullable().optional(),
  speakerSummary: z.string().max(5000, "Speaker summary is too long").nullable().optional(),
  published: z.boolean().default(false),
});

export const NewEventSchema = EventSchema.omit({ id: true });

export type Event = z.infer<typeof EventSchema>;
export type NewEvent = z.infer<typeof NewEventSchema>;

export class EventRepo {
  #db: DrizzleDatabase;

  constructor(db: DrizzleDatabase) {
    this.#db = db;
  }

  async getAllEvents(): Promise<Event[]> {
    return await this.#db.select().from(event).orderBy(event.date);
  }

  async getPublishedUpcomingEvents(): Promise<Event[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.#db
      .select()
      .from(event)
      .where(and(eq(event.published, true), gte(event.date, today)))
      .orderBy(event.date);
  }

  async getEventById(id: number): Promise<Event | null> {
    const results = await this.#db.select().from(event).where(eq(event.id, id)).limit(1);
    return results[0] ?? null;
  }

  async getEventBySlug(slug: string): Promise<Event | null> {
    const results = await this.#db.select().from(event).where(eq(event.slug, slug)).limit(1);
    return results[0] ?? null;
  }

  async createEvent(newEvent: NewEvent) {
    return await this.#db.insert(event).values(newEvent).returning();
  }

  async updateEvent(id: number, data: Partial<NewEvent>) {
    await this.#db.update(event).set(data).where(eq(event.id, id));
  }

  async deleteEvent(id: number) {
    await this.#db.delete(event).where(eq(event.id, id));
  }
}
