import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { Skeleton } from "@is3a/design-system/skeleton";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { useMemo, useState } from "react";

import { shadcnRenderers, shadcnCells } from "@fragno-dev/jsonforms-shadcn-renderers";
import { JsonForms } from "@jsonforms/react";

import {
  dataSchemaSchema,
  uiSchemaElementSchema,
} from "~/components/ui/form-builder/form-schema-contracts";
import {
  toJsonFormsDataSchema,
  toJsonFormsUiSchema,
} from "~/components/ui/form-builder/jsonforms-schema-adapter";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { formRenderDataSchema } from "~/lib/form-render-data";
import type { FormRenderData } from "~/lib/form-render-data";
import { formsClient } from "~/lib/forms-client";

import type { Route } from "./+types/forms";

interface PublicFormLoaderData {
  slug: string;
}

export function loader({ params }: Readonly<Route.LoaderArgs>): PublicFormLoaderData {
  return { slug: params.slug };
}

function PageWrapper({
  children,
  wide,
  noCard,
}: {
  readonly children: ReactNode;
  readonly wide?: boolean;
  readonly noCard?: boolean;
}): JSX.Element {
  const widthClass = wide === true ? "w-full max-w-2xl" : "w-full max-w-md";

  return (
    <div className="flex min-h-screen items-center justify-center bg-red-800 p-4">
      {noCard === true ? (
        <div className={widthClass}>{children}</div>
      ) : (
        <Card className={`${widthClass} text-center`}>{children}</Card>
      )}
    </div>
  );
}

function StatusPage({
  icon,
  title,
  message,
  action,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly message: string;
  readonly action?: ReactNode;
}): JSX.Element {
  return (
    <PageWrapper>
      <CardHeader>
        <div className="mb-4 flex justify-center">{icon}</div>
        <CardTitle>{title}</CardTitle>
        <p className="mt-2 text-muted-foreground">{message}</p>
      </CardHeader>
      {action === undefined ||
      action === null ||
      action === false ||
      action === "" ||
      action === 0 ? (
        action
      ) : (
        <CardContent>{action}</CardContent>
      )}
    </PageWrapper>
  );
}

export default function PublicFormPage({
  loaderData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  const { slug } = loaderData;

  const {
    data: form,
    loading: isLoading,
    error: formError,
  } = formsClient.useForm({
    path: { slug },
  });
  const {
    mutate: submitForm,
    data: submitResponse,
    loading: isSubmitting,
    error: submitError,
  } = formsClient.useSubmitForm();

  const [formData, setFormData] = useState<FormRenderData>({});
  const [formErrorCount, setFormErrorCount] = useState(0);
  const renderedSchemas = useMemo(
    () =>
      form === undefined
        ? undefined
        : {
            dataSchema: toJsonFormsDataSchema(dataSchemaSchema.parse(form.dataSchema)),
            uiSchema:
              form.uiSchema === undefined
                ? undefined
                : toJsonFormsUiSchema(uiSchemaElementSchema.parse(form.uiSchema)),
          },
    [form],
  );

  const handleSubmit = async (): Promise<void> => {
    await submitForm({
      path: { slug },
      body: { data: formData },
    });
  };

  if (isLoading) {
    return (
      <PageWrapper wide>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </PageWrapper>
    );
  }

  if (formError) {
    return (
      <StatusPage
        icon={<XCircle className="h-16 w-16 text-red-500" />}
        title={formError.code}
        message={formError.message}
      />
    );
  }

  if (form?.status === "closed") {
    return (
      <StatusPage
        icon={<XCircle className="h-16 w-16 text-gray-400" />}
        title="Form Closed"
        message="This form is no longer accepting submissions."
      />
    );
  }

  if (submitResponse !== undefined && submitResponse !== "") {
    return (
      <StatusPage
        icon={<CheckCircle2 className="h-16 w-16 text-green-500" />}
        title="Thank You!"
        message="Your submission has been received successfully."
        action={
          <Button
            variant="outline"
            onClick={() => {
              globalThis.location.reload();
            }}
          >
            Submit Another Response
          </Button>
        }
      />
    );
  }

  if (!form) {
    return <div>Loading...</div>;
  }

  const isDraft = form.status === "draft";

  return (
    <PageWrapper wide noCard>
      <div className="space-y-4">
        <Card>
          {isDraft && (
            <div className="flex items-center gap-2 rounded-t-lg border-b bg-yellow-50 px-4 py-3 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">
                This form is in draft mode. Submissions are disabled.
              </span>
            </div>
          )}
          <CardHeader className="space-y-4">
            <img src="/is3a.svg" alt="IS3A logo" className="h-10 w-auto" />
            <CardTitle className="text-3xl leading-tight font-bold">{form.title}</CardTitle>
            {form.description !== undefined &&
              form.description !== null &&
              form.description !== "" && (
                <CardDescription className="text-base whitespace-pre-line text-foreground">
                  {form.description}
                </CardDescription>
              )}
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {submitError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
                {submitError.message === ""
                  ? "Failed to submit form. Please try again."
                  : submitError.message}
              </div>
            )}

            <JsonForms
              schema={renderedSchemas?.dataSchema}
              uischema={renderedSchemas?.uiSchema}
              data={formData}
              renderers={shadcnRenderers}
              cells={shadcnCells}
              onChange={({ data, errors }) => {
                setFormData(formRenderDataSchema.parse(data ?? {}));
                setFormErrorCount(errors?.length ?? 0);
              }}
            />

            <div className="mt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={(isSubmitting ?? false) || isDraft || formErrorCount > 0}
                onClick={(event) => {
                  event.preventDefault();
                  void handleSubmit();
                }}
              >
                {isSubmitting === true ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
