import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@is3a/design-system/breadcrumb";
import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { Input } from "@is3a/design-system/input";
import { Label } from "@is3a/design-system/label";
import { Skeleton } from "@is3a/design-system/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@is3a/design-system/tabs";
import { Textarea } from "@is3a/design-system/textarea";
import { ArrowLeft, Save, Eye, Code, Hammer } from "lucide-react";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { JsonForms } from "@jsonforms/react";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { formRenderers } from "~/components/forms/renderers";
import { FormBuilder, FormMetadataEditor } from "~/components/ui/form-builder";
import type { GeneratedSchemas, FormMetadata } from "~/components/ui/form-builder";
import {
  dataSchemaSchema,
  generatedSchemasSchema,
  uiSchemaElementSchema,
} from "~/components/ui/form-builder/form-schema-contracts";
import {
  toJsonFormsDataSchema,
  toJsonFormsUiSchema,
} from "~/components/ui/form-builder/jsonforms-schema-adapter";
import { formRenderDataSchema } from "~/lib/form-render-data";
import type { FormRenderData } from "~/lib/form-render-data";
import { formsClient } from "~/lib/forms-client";

import type { Route } from "./+types/edit";

export default function FormEditPage({
  params,
}: Readonly<Pick<Route.ComponentProps, "params">>): JSX.Element {
  const { data: form, loading: isLoading } = formsClient.useFormById({ path: { id: params.id } });
  const { mutate: updateForm, loading: isUpdating } = formsClient.useUpdateForm();

  const [slug, setSlug] = useState("");
  const [metadata, setMetadata] = useState<FormMetadata>({
    title: "",
    description: "",
    status: "draft",
  });
  const [schemas, setSchemas] = useState<GeneratedSchemas>();
  const [dataSchemaText, setDataSchemaText] = useState("");
  const [uiSchemaText, setUiSchemaText] = useState("");
  const [previewData, setPreviewData] = useState<FormRenderData>({});
  const [initializedForm, setInitializedForm] = useState<typeof form>();
  const renderedSchemas = useMemo(
    () =>
      schemas === undefined
        ? undefined
        : {
            dataSchema: toJsonFormsDataSchema(schemas.dataSchema),
            uiSchema: toJsonFormsUiSchema(schemas.uiSchema),
          },
    [schemas],
  );

  // Reset the draft before rendering a different server snapshot.
  if (form !== initializedForm) {
    setInitializedForm(form);
    if (form !== undefined) {
      setSlug(form.slug);
      setMetadata({
        title: form.title,
        description: form.description ?? "",
        status: form.status,
      });
      const parsedSchemas = generatedSchemasSchema.parse({
        dataSchema: form.dataSchema,
        uiSchema: form.uiSchema ?? { type: "VerticalLayout", elements: [] },
      });
      setSchemas(parsedSchemas);
      setDataSchemaText(JSON.stringify(parsedSchemas.dataSchema, undefined, 2));
      setUiSchemaText(JSON.stringify(parsedSchemas.uiSchema, undefined, 2));
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!form || !schemas) {
      return;
    }

    await updateForm({
      path: { id: form.id },
      body: {
        title: metadata.title,
        slug,
        description: metadata.description,
        status: metadata.status,
        dataSchema: { ...schemas.dataSchema },
        uiSchema: { ...schemas.uiSchema },
      },
    });

    globalThis.location.reload();
  };

  const handleSchemasChange = (newSchemas: GeneratedSchemas): void => {
    setSchemas(newSchemas);
    setDataSchemaText(JSON.stringify(newSchemas.dataSchema, undefined, 2));
    setUiSchemaText(JSON.stringify(newSchemas.uiSchema, undefined, 2));
  };

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/dashboard/admin/forms" />}>Forms</BreadcrumbLink>
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
          <Button render={<Link to="/dashboard/admin/forms" />} nativeButton={false}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                render={<Link to="/dashboard/admin/forms" />}
                nativeButton={false}
              >
                <ArrowLeft className="h-4 w-4" />
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
              <Button
                variant="outline"
                disabled={isLoading}
                render={<Link to={form ? `/forms/${encodeURIComponent(form.slug)}` : "#"} />}
                nativeButton={false}
              >
                To form submit page
              </Button>
              <Button
                onClick={() => {
                  void handleSave();
                }}
                disabled={(isUpdating ?? false) || isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                {isUpdating === true ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="builder">
            <TabsList>
              <TabsTrigger value="builder">
                <Hammer className="h-4 w-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="json">
                <Code className="h-4 w-4" />
                JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="mt-6 space-y-6">
              <FormMetadataEditor value={metadata} onChange={setMetadata} />
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                  }}
                />
                <p className="text-sm text-muted-foreground">Public URL: /forms/{slug}</p>
              </div>

              {schemas !== undefined && (
                <FormBuilder defaultSchemas={schemas} onChange={handleSchemasChange} />
              )}
              {schemas === undefined && isLoading && (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}
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
                      schema={renderedSchemas?.dataSchema}
                      uischema={renderedSchemas?.uiSchema}
                      data={previewData}
                      renderers={formRenderers}

                      onChange={({ data }) => {
                        setPreviewData(formRenderDataSchema.parse(data ?? {}));
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      No schema defined yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataSchema">Data Schema</Label>
                <Textarea
                  id="dataSchema"
                  className="font-mono text-sm"
                  rows={20}
                  value={dataSchemaText}
                  onChange={(e) => {
                    setDataSchemaText(e.target.value);
                    try {
                      const parsed = dataSchemaSchema.parse(JSON.parse(e.target.value));
                      setSchemas((prev) => (prev ? { ...prev, dataSchema: parsed } : undefined));
                    } catch {
                      // Allow typing invalid JSON
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uiSchema">UI Schema</Label>
                <Textarea
                  id="uiSchema"
                  className="font-mono text-sm"
                  rows={20}
                  value={uiSchemaText}
                  onChange={(e) => {
                    setUiSchemaText(e.target.value);
                    try {
                      const parsed = uiSchemaElementSchema.parse(JSON.parse(e.target.value));
                      setSchemas((prev) => (prev ? { ...prev, uiSchema: parsed } : undefined));
                    } catch {
                      // Allow typing invalid JSON
                    }
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}
