import { BreadcrumbItem, BreadcrumbPage } from "@is3a/design-system/breadcrumb";
import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { Checkbox } from "@is3a/design-system/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@is3a/design-system/dialog";
import { Input } from "@is3a/design-system/input";
import { Label } from "@is3a/design-system/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@is3a/design-system/table";
import { Plus, Pencil, Trash2, MapPin, Mail, Globe, Calendar } from "lucide-react";
import type { JSX } from "react";
import { useState, useEffect, useRef } from "react";
import { Form, useNavigation } from "react-router";
import { z } from "zod";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { parseLocationFormData } from "~/db/repo/location-form";
import { LocationRepo, type Location, type NewLocation } from "~/db/repo/locations";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { readFormText } from "~/fragno/request-form";
import { requestContext } from "~/request-context";

import type { Route } from "./+types/locations";

interface LocationsLoaderData {
  locations: Awaited<ReturnType<LocationRepo["getAllLocations"]>>;
}

type LocationActionResult =
  | { success: true; errors?: never }
  | { success: false; errors?: Partial<Record<keyof NewLocation, string[]>> };

export async function loader({
  context,
}: Readonly<Route.LoaderArgs>): Promise<LocationsLoaderData> {
  const locations = await new LocationRepo(context.get(requestContext).db).getAllLocations();
  return { locations };
}

export async function action({
  request,
  context,
}: Readonly<Route.ActionArgs>): Promise<LocationActionResult> {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const repo = new LocationRepo(context.get(requestContext).db);

  if (intent === "create") {
    const result = parseLocationFormData(formData);

    if (!result.success) {
      return {
        success: false,
        errors: z.flattenError(result.error).fieldErrors,
      };
    }

    await repo.createLocation(result.data);

    return { success: true };
  }

  if (intent === "update") {
    const id = Number(readFormText(formData, "id"));
    const result = parseLocationFormData(formData);

    if (!result.success) {
      return {
        success: false,
        errors: z.flattenError(result.error).fieldErrors,
      };
    }

    await repo.updateLocation(id, result.data);

    return { success: true };
  }

  if (intent === "delete") {
    const id = Number(readFormText(formData, "id"));
    await repo.deleteLocation(id);
    return { success: true };
  }

  return { success: false };
}

export default function LocationsPage({
  loaderData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  const { locations } = loaderData;
  const navigation = useNavigation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Readonly<Location>>();
  const [wasSubmitting, setWasSubmitting] = useState(false);
  const [previousNavigationState, setPreviousNavigationState] = useState(navigation.state);

  if (previousNavigationState !== navigation.state) {
    setPreviousNavigationState(navigation.state);
    if (navigation.state === "submitting") {
      setWasSubmitting(true);
    } else if (navigation.state === "idle" && wasSubmitting) {
      // Form submission completed, close the delete dialog if it was open
      if (isDeleteDialogOpen) {
        setIsDeleteDialogOpen(false);
      }
      setWasSubmitting(false);
    }
  }

  const handleEdit = (location: Readonly<Location>): void => {
    setSelectedLocation(location);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (location: Readonly<Location>): void => {
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
          <Button
            onClick={() => {
              setIsCreateDialogOpen(true);
            }}
          >
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
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
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
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell>
                        {loc.email !== undefined && loc.email !== null && loc.email !== "" ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {loc.email}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {loc.address !== undefined && loc.address !== null && loc.address !== "" ? (
                          <span className="text-sm">{loc.address}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {loc.website !== undefined && loc.website !== null && loc.website !== "" ? (
                          <a
                            href={loc.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            Link
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {((): JSX.Element => {
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
                            <span className="text-sm text-muted-foreground">—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleEdit(loc);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleDelete(loc);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                  }}
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
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly intent: "create" | "update";
  readonly location?: Readonly<Location>;
}): JSX.Element {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submitLabel = intent === "create" ? "Create" : "Update";

  // Track when submission completes
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (isSubmitting) {
      wasSubmitting.current = true;
    } else if (wasSubmitting.current && open) {
      // Submission completed, close the dialog.
      onOpenChange(false);
      wasSubmitting.current = false;
    }
  }, [isSubmitting, open, onOpenChange]);

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
                Name <span className="text-destructive">*</span>
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
                defaultValue={location?.email ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="123 Main St, City, State"
                defaultValue={location?.address ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://location.com"
                defaultValue={location?.website ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Seasons</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seasonSummer"
                    name="seasonSummer"
                    defaultChecked={location?.seasonSummer ?? false}
                  />
                  <Label htmlFor="seasonSummer" className="cursor-pointer font-normal">
                    Summer
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seasonAutumn"
                    name="seasonAutumn"
                    defaultChecked={location?.seasonAutumn ?? false}
                  />
                  <Label htmlFor="seasonAutumn" className="cursor-pointer font-normal">
                    Autumn
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seasonWinter"
                    name="seasonWinter"
                    defaultChecked={location?.seasonWinter ?? false}
                  />
                  <Label htmlFor="seasonWinter" className="cursor-pointer font-normal">
                    Winter
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seasonSpring"
                    name="seasonSpring"
                    defaultChecked={location?.seasonSpring ?? false}
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
              onClick={() => {
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
