import type { Route } from "./+types/events";
import { Form, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { BreadcrumbItem, BreadcrumbPage } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { DateInput } from "~/components/ui/date-input";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Plus, Pencil, Trash2, Calendar, MapPin, User } from "lucide-react";
import { EventRepo, NewEventSchema, type Event } from "~/db/repo/events";
import { LocationRepo, type Location } from "~/db/repo/locations";
import { formatDate } from "~/lib/date-utils";

export async function loader({ context }: Route.LoaderArgs) {
  const events = await new EventRepo(context.db).getAllEvents();
  const locations = await new LocationRepo(context.db).getAllLocations();
  return { events, locations };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const repo = new EventRepo(context.db);

  if (intent === "create") {
    const data = Object.fromEntries(formData.entries());
    const rawData = {
      name: data.name,
      slug: data.slug === "" ? null : data.slug,
      date: new Date(data.date as string),
      locationId:
        !data.locationId || data.locationId === "none" ? null : parseInt(data.locationId as string),
      description: data.description === "" ? null : data.description,
      speaker: data.speaker === "" ? null : data.speaker,
      speakerAbstract: data.speakerAbstract === "" ? null : data.speakerAbstract,
      speakerSummary: data.speakerSummary === "" ? null : data.speakerSummary,
      published: data.published === "on",
    };

    const result = NewEventSchema.safeParse(rawData);

    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
      };
    }

    await repo.createEvent(result.data);

    return { success: true };
  }

  if (intent === "update") {
    const data = Object.fromEntries(formData.entries());
    const id = parseInt(data.id as string);

    const rawData = {
      name: data.name,
      slug: data.slug === "" ? null : data.slug,
      date: new Date(data.date as string),
      locationId:
        !data.locationId || data.locationId === "none" ? null : parseInt(data.locationId as string),
      description: data.description === "" ? null : data.description,
      speaker: data.speaker === "" ? null : data.speaker,
      speakerAbstract: data.speakerAbstract === "" ? null : data.speakerAbstract,
      speakerSummary: data.speakerSummary === "" ? null : data.speakerSummary,
      published: data.published === "on",
    };

    const result = NewEventSchema.safeParse(rawData);

    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
      };
    }

    await repo.updateEvent(id, result.data);

    return { success: true };
  }

  if (intent === "delete") {
    const id = parseInt(formData.get("id") as string);
    await repo.deleteEvent(id);
    return { success: true };
  }

  return { success: false };
}

export default function EventsPage({ loaderData }: Route.ComponentProps) {
  const { events, locations } = loaderData;
  const navigation = useNavigation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [wasSubmitting, setWasSubmitting] = useState(false);

  // Track submission state
  useEffect(() => {
    if (navigation.state === "submitting") {
      setWasSubmitting(true);
    } else if (navigation.state === "idle" && wasSubmitting) {
      // Form submission completed, close the delete dialog if it was open
      if (isDeleteDialogOpen) {
        setIsDeleteDialogOpen(false);
      }
      setWasSubmitting(false);
    }
  }, [navigation.state, wasSubmitting, isDeleteDialogOpen]);

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const getLocationName = (locationId: number | null) => {
    if (!locationId) {
      return null;
    }
    const location = locations.find((loc: Location) => loc.id === locationId);
    return location?.name;
  };

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Events</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Events</h1>
            <p className="text-muted-foreground">Manage events and gatherings</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
            <CardDescription>View and manage all events</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                <Calendar className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No events yet</p>
                <p className="text-sm">Get started by adding your first event</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Speaker</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((evt: Event) => (
                    <TableRow key={evt.id}>
                      <TableCell className="font-medium">{evt.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(evt.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {evt.locationId ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {getLocationName(evt.locationId)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {evt.speaker ? (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            {evt.speaker}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {evt.published ? (
                          <Badge variant="default" className="bg-green-600">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(evt)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(evt)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <EventFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Add Event"
        description="Create a new event"
        intent="create"
        locations={locations}
      />

      {/* Edit Dialog */}
      {selectedEvent && (
        <EventFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Edit Event"
          description="Update event details"
          intent="update"
          event={selectedEvent}
          locations={locations}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {selectedEvent && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedEvent.name}"? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={selectedEvent.id} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive">
                  Delete
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function EventFormDialog({
  open,
  onOpenChange,
  title,
  description,
  intent,
  event,
  locations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  intent: "create" | "update";
  event?: Event;
  locations: Location[];
}) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Track when submission completes
  const [wasSubmitting, setWasSubmitting] = useState(false);

  useEffect(() => {
    if (isSubmitting) {
      setWasSubmitting(true);
    } else if (!isSubmitting && wasSubmitting && open) {
      // Submission completed, close the dialog
      onOpenChange(false);
      setWasSubmitting(false);
    }
  }, [isSubmitting, wasSubmitting, open, onOpenChange]);

  // Format date for date input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <Form method="post" className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <input type="hidden" name="intent" value={intent} />
          {event && <input type="hidden" name="id" value={event.id} />}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Event name"
                defaultValue={event?.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="winter-drinks-2024"
                defaultValue={event?.slug || ""}
              />
              <p className="text-muted-foreground text-xs">
                Optional. Use lowercase letters, numbers, and hyphens only (e.g.,
                winter-drinks-2024)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-600">*</span>
              </Label>
              <DateInput
                id="date"
                name="date"
                defaultValue={event?.date ? formatDateForInput(event.date) : ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationId">Location</Label>
              <Select name="locationId" defaultValue={event?.locationId?.toString() || "none"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No location</SelectItem>
                  {locations.map((location: Location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speaker">Speaker</Label>
              <Input
                id="speaker"
                name="speaker"
                placeholder="Speaker name"
                defaultValue={event?.speaker || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Event description"
                defaultValue={event?.description || ""}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speakerAbstract">Speaker Abstract</Label>
              <Textarea
                id="speakerAbstract"
                name="speakerAbstract"
                placeholder="Abstract of the speaker's talk"
                defaultValue={event?.speakerAbstract || ""}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speakerSummary">Speaker Summary</Label>
              <Textarea
                id="speakerSummary"
                name="speakerSummary"
                placeholder="Summary of the speaker's talk"
                defaultValue={event?.speakerSummary || ""}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="published"
                name="published"
                defaultChecked={event?.published || false}
              />
              <Label htmlFor="published" className="cursor-pointer font-normal">
                Published (visible on website)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : intent === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
