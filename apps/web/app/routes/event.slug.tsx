import { data } from "react-router";
import type { Route } from "./+types/event.slug";
import { EventRepo } from "~/db/repo/events";
import { LocationRepo } from "~/db/repo/locations";
import { EventDetailPage } from "./event.id";

export async function loader({ params, context }: Route.LoaderArgs) {
  const eventRepo = new EventRepo(context.db);
  const event = await eventRepo.getEventBySlug(params.slug);

  if (!event) {
    throw data({ message: "Event not found" }, { status: 404 });
  }

  // Fetch location if locationId is set
  let location = null;
  if (event.locationId) {
    const locationRepo = new LocationRepo(context.db);
    location = await locationRepo.getLocationById(event.locationId);
  }

  return { event, location };
}

export default EventDetailPage;
