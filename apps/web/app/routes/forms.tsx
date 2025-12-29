import type { Route } from "./+types/forms";
import type { ReactNode } from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { formsClient } from "~/lib/forms-client";
import { JsonForms } from "@jsonforms/react";
import type { UISchemaElement } from "@jsonforms/core";
import { shadcnRenderers, shadcnCells } from "@fragno-dev/jsonforms-shadcn-renderers";

export async function loader({ params }: Route.LoaderArgs) {
  return { slug: params.slug };
}

function PageWrapper({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className={wide ? "w-full max-w-2xl" : "w-full max-w-md text-center"}>{children}</Card>
    </div>
  );
}

function StatusPage({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <PageWrapper>
      <CardHeader>
        <div className="mb-4 flex justify-center">{icon}</div>
        <CardTitle>{title}</CardTitle>
        <p className="text-muted-foreground mt-2">{message}</p>
      </CardHeader>
      {action && <CardContent>{action}</CardContent>}
    </PageWrapper>
  );
}

export default function PublicFormPage({ loaderData }: Route.ComponentProps) {
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

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [formErrors, setFormErrors] = useState<unknown[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (submitResponse) {
    return (
      <StatusPage
        icon={<CheckCircle2 className="h-16 w-16 text-green-500" />}
        title="Thank You!"
        message="Your submission has been received successfully."
        action={
          <Button variant="outline" onClick={() => window.location.reload()}>
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
    <PageWrapper wide>
      {isDraft && (
        <div className="flex items-center gap-2 rounded-t-lg border-b bg-yellow-50 px-4 py-3 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-medium">
            This form is in draft mode. Submissions are disabled.
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description && <CardDescription>{form.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {submitError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
            {submitError.message || "Failed to submit form. Please try again."}
          </div>
        )}

        <JsonForms
          schema={form.dataSchema as Record<string, unknown>}
          uischema={form.uiSchema as unknown as UISchemaElement}
          data={formData}
          renderers={shadcnRenderers}
          cells={shadcnCells}
          onChange={({ data, errors }) => {
            setFormData(data ?? {});
            setFormErrors(errors ?? []);
          }}
        />

        <div className="mt-6">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isDraft || formErrors.length > 0}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </CardContent>
    </PageWrapper>
  );
}
