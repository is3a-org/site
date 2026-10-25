import { Badge } from "@is3a/design-system/badge";
import { BreadcrumbItem, BreadcrumbPage } from "@is3a/design-system/breadcrumb";
import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@is3a/design-system/select";
import { Skeleton } from "@is3a/design-system/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@is3a/design-system/table";
import { Textarea } from "@is3a/design-system/textarea";
import { Plus, Pencil, FileText, Trash2, ClipboardList, ExternalLink } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";

import type { FormStatus } from "@fragno-dev/forms";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { formsClient } from "~/lib/forms-client";

export function loader(): Record<string, never> {
  return {};
}

export default function FormsPage(): JSX.Element {
  const navigate = useNavigate();
  const { data: forms, loading: isLoading, refetch: refetchForms } = formsClient.useForms();
  const { mutate: createForm, loading: isCreating } = formsClient.useCreateForm();
  const { mutate: deleteForm, loading: isDeleting } = formsClient.useDeleteForm();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string>();
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormSlug, setNewFormSlug] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");
  const [newFormStatus, setNewFormStatus] = useState<FormStatus>("open");

  const handleCreate = async (): Promise<void> => {
    if (!newFormTitle || !newFormSlug) {
      return;
    }

    const createdForm = await createForm({
      body: {
        title: newFormTitle,
        slug: newFormSlug,
        description: newFormDescription,
        status: newFormStatus,
        dataSchema: {
          type: "object",
          properties: {
            name: { type: "string", title: "Name" },
            email: { type: "string", format: "email", title: "Email" },
          },
          required: ["name", "email"],
        },
        uiSchema: {
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/name" },
            { type: "Control", scope: "#/properties/email" },
          ],
        },
      },
    });

    const createdFormId = z.string().min(1).safeParse(createdForm);
    if (createdFormId.success) {
      await navigate(`/dashboard/admin/forms/${createdFormId.data}/edit`);
      return;
    }

    setIsCreateDialogOpen(false);
    setNewFormTitle("");
    setNewFormSlug("");
    setNewFormDescription("");
    setNewFormStatus("open");

    refetchForms();
  };

  const handleDelete = async (): Promise<void> => {
    if (selectedFormId === undefined || selectedFormId === "") {
      return;
    }

    await deleteForm({
      path: { id: selectedFormId },
    });

    setIsDeleteDialogOpen(false);
    setSelectedFormId(undefined);
    // The delete mutator invalidates form details, not the cached list.
    refetchForms();
  };

  const openDeleteDialog = (formId: string): void => {
    setSelectedFormId(formId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>Forms</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Forms</h1>
            <p className="text-muted-foreground">Create and manage forms</p>
          </div>
          <Button
            onClick={() => {
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Form
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Forms</CardTitle>
            <CardDescription>View and manage all forms and their submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {!isLoading && (!Array.isArray(forms) || forms.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No forms yet</p>
                <p className="text-sm">Get started by creating your first form</p>
              </div>
            )}
            {!isLoading && Array.isArray(forms) && forms.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{form.title}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm">{form.slug}</code>
                      </TableCell>
                      <TableCell>{getStatusBadge(form.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            render={<Link to={`/forms/${form.slug}`} target="_blank" />}
                            nativeButton={false}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            render={<Link to={`/dashboard/admin/forms/${form.id}/edit`} />}
                            nativeButton={false}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            render={<Link to={`/dashboard/admin/forms/${form.id}/submissions`} />}
                            nativeButton={false}
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              openDeleteDialog(form.id);
                            }}
                          >
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
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Form</DialogTitle>
            <DialogDescription>Create a new form with a default template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-600">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contact Form"
                value={newFormTitle}
                onChange={(e) => {
                  const title = e.target.value;
                  setNewFormTitle(title);
                  if (title !== "") {
                    setNewFormSlug(
                      title
                        .toLowerCase()
                        .replaceAll(/[^a-z0-9]+/g, "-")
                        .replaceAll(/^-|-$/g, ""),
                    );
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-red-600">*</span>
              </Label>
              <Input
                id="slug"
                placeholder="contact-form"
                value={newFormSlug}
                onChange={(e) => {
                  setNewFormSlug(e.target.value);
                }}
              />
              <p className="text-sm text-muted-foreground">
                Public URL: /forms/{newFormSlug || "..."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of this form..."
                value={newFormDescription}
                onChange={(e) => {
                  setNewFormDescription(e.target.value);
                }}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                items={{ draft: "Draft", open: "Open", closed: "Closed" }}
                value={newFormStatus}
                onValueChange={(value) => {
                  if (
                    value === "draft" ||
                    value === "open" ||
                    value === "closed" ||
                    value === "static"
                  ) {
                    setNewFormStatus(value);
                  }
                }}
              >
                <SelectTrigger aria-label="Form status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleCreate();
              }}
              disabled={(isCreating ?? false) || !newFormTitle || !newFormSlug}
            >
              {isCreating === true ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this form? This will also delete all submissions. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
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
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                void handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting === true ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getStatusBadge(status: string): JSX.Element {
  switch (status) {
    case "open": {
      return <Badge variant="default">Open</Badge>;
    }
    case "closed": {
      return <Badge variant="secondary">Closed</Badge>;
    }
    case "draft": {
      return <Badge variant="outline">Draft</Badge>;
    }
    default: {
      return <Badge variant="outline">{status}</Badge>;
    }
  }
}
