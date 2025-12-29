import type { Route } from "./+types/edit";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { formsClient } from "~/lib/forms-client";
import { JsonForms } from "@jsonforms/react";
import type { UISchemaElement } from "@jsonforms/core";
import { shadcnRenderers, shadcnCells } from "@fragno-dev/jsonforms-shadcn-renderers";
import { Skeleton } from "~/components/ui/skeleton";

import type { FormStatus } from "@fragno-dev/forms";

export default function FormEditPage({ params }: Route.ComponentProps) {
  const { data: form, loading: isLoading } = formsClient.useFormById({ path: { id: params.id } });
  const { mutate: updateForm, loading: isUpdating } = formsClient.useUpdateForm();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FormStatus>("draft");
  const [dataSchemaText, setDataSchemaText] = useState("");
  const [uiSchemaText, setUiSchemaText] = useState("");
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Initialize form state when data loads
  useEffect(() => {
    if (form) {
      setTitle(form.title);
      setSlug(form.slug);
      setDescription(form.description || "");
      setStatus(form.status);
      setDataSchemaText(JSON.stringify(form.dataSchema, null, 2));
      setUiSchemaText(form.uiSchema ? JSON.stringify(form.uiSchema, null, 2) : "");
    }
  }, [form]);

  const handleSave = async () => {
    if (!form) {
      return;
    }

    try {
      const dataSchema = JSON.parse(dataSchemaText);
      const uiSchema = uiSchemaText ? JSON.parse(uiSchemaText) : undefined;
      setSchemaError(null);

      await updateForm({
        path: { id: form.id },
        body: {
          title,
          slug,
          description,
          status,
          dataSchema,
          uiSchema,
        },
      });

      // Reload to reflect changes
      window.location.reload();
    } catch (e) {
      if (e instanceof SyntaxError) {
        setSchemaError("Invalid JSON in schema");
      }
    }
  };

  // Parse schemas for preview
  let parsedDataSchema: Record<string, unknown> | null = null;
  let parsedUiSchema: UISchemaElement | undefined = undefined;
  try {
    parsedDataSchema = JSON.parse(dataSchemaText);
    if (uiSchemaText) {
      parsedUiSchema = JSON.parse(uiSchemaText) as UISchemaElement;
    }
  } catch {
    // Invalid JSON, preview will show error
  }

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard/admin/forms">Forms</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <BreadcrumbPage>{form?.title ?? "Not Found"}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      {!isLoading && !form ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
          <p className="text-muted-foreground">Form not found</p>
          <Button asChild>
            <Link to="/dashboard/admin/forms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forms
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard/admin/forms">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit Form</h1>
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  <p className="text-muted-foreground">{form?.title}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild disabled={isLoading}>
                <Link to={form ? `/forms/${encodeURIComponent(form.slug)}` : "#"}>
                  To form submit page
                </Link>
              </Button>
              <Button onClick={handleSave} disabled={isUpdating || isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {schemaError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
              {schemaError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Form Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                  <p className="text-muted-foreground text-sm">Public URL: /forms/{slug}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of this form..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as FormStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
                <CardDescription>Live form preview</CardDescription>
              </CardHeader>
              <CardContent>
                {parsedDataSchema ? (
                  <JsonForms
                    schema={parsedDataSchema}
                    uischema={parsedUiSchema}
                    data={previewData}
                    renderers={shadcnRenderers}
                    cells={shadcnCells}
                    onChange={({ data }) => setPreviewData(data ?? {})}
                  />
                ) : (
                  <div className="text-muted-foreground flex items-center justify-center py-8">
                    Invalid schema JSON
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Schema Editors */}
          <Card>
            <CardHeader>
              <CardTitle>Schema Definition</CardTitle>
              <CardDescription>
                Define the form structure using JSON Schema and{" "}
                <a className="underline" href="https://jsonforms.io/docs/uischema/" target="_blank">
                  UI Schema
                </a>{" "}
                (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="dataSchema">
                <TabsList>
                  <TabsTrigger value="dataSchema">Data Schema</TabsTrigger>
                  <TabsTrigger value="uiSchema">UI Schema</TabsTrigger>
                </TabsList>
                <TabsContent value="dataSchema" className="mt-4">
                  <Textarea
                    className="font-mono text-sm"
                    rows={20}
                    value={dataSchemaText}
                    onChange={(e) => setDataSchemaText(e.target.value)}
                    placeholder="Enter JSON Schema..."
                  />
                </TabsContent>
                <TabsContent value="uiSchema" className="mt-4">
                  <Textarea
                    className="font-mono text-sm"
                    rows={20}
                    value={uiSchemaText}
                    onChange={(e) => setUiSchemaText(e.target.value)}
                    placeholder="Enter UI Schema..."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
