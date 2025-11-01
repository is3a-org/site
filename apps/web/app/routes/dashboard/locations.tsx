import type { Route } from "./+types/locations";
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
import { Checkbox } from "~/components/ui/checkbox";
import { Plus, Pencil, Trash2, MapPin, Mail, Globe, Calendar } from "lucide-react";
import { location } from "~/db/postgres/postgres.schema";
import { eq } from "drizzle-orm";

export async function loader({ context }: Route.LoaderArgs) {
  const locations = await context.db.select().from(location).orderBy(location.name);
  return { locations };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string | null;
    const address = formData.get("address") as string | null;
    const website = formData.get("website") as string | null;
    const seasonSummer = formData.get("seasonSummer") === "on";
    const seasonAutumn = formData.get("seasonAutumn") === "on";
    const seasonWinter = formData.get("seasonWinter") === "on";
    const seasonSpring = formData.get("seasonSpring") === "on";

    await context.db.insert(location).values({
      name,
      email: email || null,
      address: address || null,
      website: website || null,
      seasonSummer,
      seasonAutumn,
      seasonWinter,
      seasonSpring,
    });

    return { success: true };
  }

  if (intent === "update") {
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string | null;
    const address = formData.get("address") as string | null;
    const website = formData.get("website") as string | null;
    const seasonSummer = formData.get("seasonSummer") === "on";
    const seasonAutumn = formData.get("seasonAutumn") === "on";
    const seasonWinter = formData.get("seasonWinter") === "on";
    const seasonSpring = formData.get("seasonSpring") === "on";

    await context.db
      .update(location)
      .set({
        name,
        email: email || null,
        address: address || null,
        website: website || null,
        seasonSummer,
        seasonAutumn,
        seasonWinter,
        seasonSpring,
      })
      .where(eq(location.id, id));

    return { success: true };
  }

  if (intent === "delete") {
    const id = parseInt(formData.get("id") as string);
    await context.db.delete(location).where(eq(location.id, id));
    return { success: true };
  }

  return { success: false };
}

type Location = {
  id: number;
  name: string;
  email: string | null;
  address: string | null;
  website: string | null;
  seasonSummer: boolean;
  seasonAutumn: boolean;
  seasonWinter: boolean;
  seasonSpring: boolean;
};

export default function LocationsPage({ loaderData }: Route.ComponentProps) {
  const { locations } = loaderData;
  const navigation = useNavigation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
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

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Locations</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Locations</h1>
            <p className="text-muted-foreground">Manage event locations</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Locations</CardTitle>
            <CardDescription>
              View and manage all locations where events can be hosted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {locations.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                <MapPin className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No locations yet</p>
                <p className="text-sm">Get started by adding your first location</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Seasons</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc: Location) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell>
                        {loc.email ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {loc.email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {loc.address ? (
                          <span className="text-sm">{loc.address}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {loc.website ? (
                          <a
                            href={loc.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            Link
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const activeSeasons = [];
                          if (loc.seasonSummer) {
                            activeSeasons.push("Summer");
                          }
                          if (loc.seasonAutumn) {
                            activeSeasons.push("Autumn");
                          }
                          if (loc.seasonWinter) {
                            activeSeasons.push("Winter");
                          }
                          if (loc.seasonSpring) {
                            activeSeasons.push("Spring");
                          }

                          return activeSeasons.length > 0 ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              <span>{activeSeasons.join(", ")}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(loc)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(loc)}>
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
      <LocationFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Add Location"
        description="Create a new location for hosting events"
        intent="create"
      />

      {/* Edit Dialog */}
      {selectedLocation && (
        <LocationFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Edit Location"
          description="Update location details"
          intent="update"
          location={selectedLocation}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {selectedLocation && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Location</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedLocation.name}"? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={selectedLocation.id} />
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

function LocationFormDialog({
  open,
  onOpenChange,
  title,
  description,
  intent,
  location,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  intent: "create" | "update";
  location?: Location;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <Form method="post" className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <input type="hidden" name="intent" value={intent} />
          {location && <input type="hidden" name="id" value={location.id} />}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Downtown Conference Center"
                defaultValue={location?.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="contact@location.com"
                defaultValue={location?.email || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="123 Main St, City, State"
                defaultValue={location?.address || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://location.com"
                defaultValue={location?.website || ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Seasons</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seasonSummer"
                    name="seasonSummer"
                    defaultChecked={location?.seasonSummer || false}
                  />
                  <Label htmlFor="seasonSummer" className="cursor-pointer font-normal">
                    Summer
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seasonAutumn"
                    name="seasonAutumn"
                    defaultChecked={location?.seasonAutumn || false}
                  />
                  <Label htmlFor="seasonAutumn" className="cursor-pointer font-normal">
                    Autumn
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seasonWinter"
                    name="seasonWinter"
                    defaultChecked={location?.seasonWinter || false}
                  />
                  <Label htmlFor="seasonWinter" className="cursor-pointer font-normal">
                    Winter
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seasonSpring"
                    name="seasonSpring"
                    defaultChecked={location?.seasonSpring || false}
                  />
                  <Label htmlFor="seasonSpring" className="cursor-pointer font-normal">
                    Spring
                  </Label>
                </div>
              </div>
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
