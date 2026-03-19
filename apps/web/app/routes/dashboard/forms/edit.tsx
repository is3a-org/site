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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { formsClient } from "~/lib/forms-client";
import { JsonForms } from "@jsonforms/react";
import type { UISchemaElement } from "@jsonforms/core";
import { shadcnRenderers, shadcnCells } from "@fragno-dev/jsonforms-shadcn-renderers";
import { Skeleton } from "~/components/ui/skeleton";
import { FormBuilder, FormMetadataEditor } from "~/components/ui/form-builder";
import type { GeneratedSchemas, FormMetadata } from "~/components/ui/form-builder";

import type { FormStatus } from "@fragno-dev/forms";

export default function FormEditPage({ params }: Route.ComponentProps) {
  const { data: form, loading: isLoading } = formsClient.useFormById({ path: { id: params.id } });
  const { mutate: updateForm, loading: isUpdating } = formsClient.useUpdateForm();

  const [slug, setSlug] = useState("");
  const [metadata, setMetadata] = useState<FormMetadata>({
    title: "",
    description: "",
    status: "draft",
  });
  const [schemas, setSchemas] = useState<GeneratedSchemas | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});

  // Initialize form state when data loads
  useEffect(() => {
    if (form) {
      setSlug(form.slug);
      setMetadata({
        title: form.title,
        description: form.description || "",
        status: form.status as FormMetadata["status"],
      });
      setSchemas({
        dataSchema: form.dataSchema as unknown as GeneratedSchemas["dataSchema"],
        uiSchema: form.uiSchema as unknown as GeneratedSchemas["uiSchema"],
      });
    }
  }, [form]);

  const handleSave = async () => {
    if (!form || !schemas) {
      return;
    }

    await updateForm({
      path: { id: form.id },
      body: {
        title: metadata.title,
        slug,
        description: metadata.description,
        status: metadata.status as FormStatus,
        dataSchema: schemas.dataSchema,
        uiSchema: schemas.uiSchema,
      },
    });

    window.location.reload();
  };

  const handleSchemasChange = (newSchemas: GeneratedSchemas) => {
    setSchemas(newSchemas);
  };

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

          <Tabs defaultValue="builder">
            <TabsList>
              <TabsTrigger value="builder">Builder</TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="mt-6 space-y-6">
              <FormMetadataEditor value={metadata} onChange={setMetadata} />
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                <p className="text-muted-foreground text-sm">Public URL: /forms/{slug}</p>
              </div>

              {schemas ? (
                <FormBuilder defaultSchemas={schemas} onChange={handleSchemasChange} />
              ) : isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </CardTitle>
                  <CardDescription>Live form preview</CardDescription>
                </CardHeader>
                <CardContent>
                  {schemas ? (
                    <JsonForms
                      schema={schemas.dataSchema}
                      uischema={schemas.uiSchema as UISchemaElement}
                      data={previewData}
                      renderers={shadcnRenderers}
                      cells={shadcnCells}
                      onChange={({ data }) => setPreviewData(data ?? {})}
                    />
                  ) : (
                    <div className="text-muted-foreground flex items-center justify-center py-8">
                      No schema defined yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}
