import type { Route } from "./+types/forms";
import { Link, useNavigate } from "react-router";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { BreadcrumbItem, BreadcrumbPage } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Plus, Pencil, FileText, Trash2, ClipboardList, ExternalLink } from "lucide-react";
import { formsClient } from "~/lib/forms-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { FormStatus } from "@fragno-dev/forms";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useState, useEffect } from "react";

export async function loader(_args: Route.LoaderArgs) {
  return {};
}

export default function FormsPage() {
  const navigate = useNavigate();
  const [formsRefresh, setFormsRefresh] = useState("0");
  const { data: forms, loading: isLoading } = formsClient.useForms({
    query: { refresh: formsRefresh },
  });
  const { mutate: createForm, loading: isCreating } = formsClient.useCreateForm();
  const { mutate: deleteForm, loading: isDeleting } = formsClient.useDeleteForm();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormSlug, setNewFormSlug] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");
  const [newFormStatus, setNewFormStatus] = useState<FormStatus>("open");

  const handleCreate = async () => {
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

    if (createdForm) {
      navigate(`/dashboard/admin/forms/${createdForm}/edit`);
      return;
    }

    setIsCreateDialogOpen(false);
    setNewFormTitle("");
    setNewFormSlug("");
    setNewFormDescription("");
    setNewFormStatus("open");

    setFormsRefresh((prev) => prev + 1);
  };

  const handleDelete = async () => {
    if (!selectedFormId) {
      return;
    }

    await deleteForm({
      path: { id: selectedFormId },
    });

    setIsDeleteDialogOpen(false);
    setSelectedFormId(null);
    setFormsRefresh((prev) => prev + 1);
  };

  const openDeleteDialog = (formId: string) => {
    setSelectedFormId(formId);
    setIsDeleteDialogOpen(true);
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (newFormTitle) {
      const slug = newFormTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setNewFormSlug(slug);
    }
  }, [newFormTitle]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
          <Button onClick={() => setIsCreateDialogOpen(true)}>
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
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !forms || typeof forms === "string" || forms.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No forms yet</p>
                <p className="text-sm">Get started by creating your first form</p>
              </div>
            ) : (
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
                        <code className="bg-muted rounded px-2 py-1 text-sm">{form.slug}</code>
                      </TableCell>
                      <TableCell>{getStatusBadge(form.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/forms/${form.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/dashboard/admin/forms/${form.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/dashboard/admin/forms/${form.id}/submissions`}>
                              <ClipboardList className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(form.id)}
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
                onChange={(e) => setNewFormTitle(e.target.value)}
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
                onChange={(e) => setNewFormSlug(e.target.value)}
              />
              <p className="text-muted-foreground text-sm">
                Public URL: /forms/{newFormSlug || "..."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of this form..."
                value={newFormDescription}
                onChange={(e) => setNewFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newFormStatus}
                onValueChange={(value) => setNewFormStatus(value as FormStatus)}
              >
                <SelectTrigger>
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
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !newFormTitle || !newFormSlug}
            >
              {isCreating ? "Creating..." : "Create"}
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
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
