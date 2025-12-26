import { data } from "react-router";
import type { Route } from "./+types/event.id";
import { EventRepo } from "~/db/repo/events";
import { LocationRepo } from "~/db/repo/locations";
import { Calendar, MapPin } from "lucide-react";
import { formatDate } from "~/lib/date-utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function loader({ params, context }: Route.LoaderArgs) {
  const eventId = parseInt(params.id);

  if (isNaN(eventId)) {
    throw data({ message: "Invalid event ID" }, { status: 404 });
  }

  const eventRepo = new EventRepo(context.db);
  const event = await eventRepo.getEventById(eventId);

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

export function EventDetailPage({ loaderData }: Route.ComponentProps) {
  const { event, location } = loaderData;

  const formatLocation = () => {
    if (!location) {
      return <div className="text-lg">TBA</div>;
    }

    if (!location.address) {
      return <div className="text-lg">{location.name}</div>;
    }

    return (
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ", " + location.address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-red-800 hover:underline"
      >
        <div className="text-lg">{location.name}</div>
        <div className="text-sm">{location.address}</div>
      </a>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Event Header */}
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">{event.name}</h1>

        <div className="flex flex-col gap-3 text-gray-600">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-red-800" />
            <span className="text-lg">{formatDate(event.date)}</span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 text-red-800" />
            <div>{formatLocation()}</div>
          </div>
        </div>
      </div>

      {/* Event Description */}
      {event.description && (
        <div className="prose prose-gray mb-8 max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.description}</ReactMarkdown>
        </div>
      )}

      {/* Speaker */}
      {event.speaker && (
        <div className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold text-gray-900">Speaker: {event.speaker}</h2>
          {event.speakerAbstract && (
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.speakerAbstract}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EventDetailPage;
