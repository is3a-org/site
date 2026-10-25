import { Badge } from "@is3a/design-system/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@is3a/design-system/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@is3a/design-system/sheet";
import { Skeleton } from "@is3a/design-system/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@is3a/design-system/table";
import { ArrowLeft, ChevronRight, ClipboardList, Download, Trash2 } from "lucide-react";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import {
  dataSchemaSchema,
  formJsonObjectSchema,
  uiSchemaElementSchema,
} from "~/components/ui/form-builder/form-schema-contracts";
import type { FormJsonObject, FormJsonValue } from "~/components/ui/form-builder/types";
import { formsClient, useAllSubmissions } from "~/lib/forms-client";
import {
  displaySubmissionValue,
  submissionFields,
  type SubmissionField,
} from "~/lib/submission-fields";

import type { Route } from "./+types/submissions";

interface ViewedSubmission {
  readonly id: string;
  readonly formVersion: number;
  readonly submittedAt: Date;
  readonly data: FormJsonObject;
}

/** The table shows the first few fields; the detail panel shows all of them. */
const tableFieldCount = 3;

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { timeStyle: "short" });
const fullDateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeStyle: "short",
});

function SubmissionValue({
  value,
  field,
  truncate,
}: Readonly<{
  value: FormJsonValue | undefined;
  field: SubmissionField;
  truncate?: boolean;
}>): JSX.Element {
  const display = displaySubmissionValue(value, field);
  const truncateClass = truncate === true ? "block max-w-56 truncate" : "break-words";
  if (display.kind === "empty") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (display.kind === "link") {
    return (
      <a
        href={display.href}
        target={display.href.startsWith("mailto:") ? undefined : "_blank"}
        rel="noopener noreferrer"
        title={truncate === true ? display.text : undefined}
        className={`${truncateClass} underline decoration-primary/40 decoration-1 underline-offset-4 hover:decoration-primary`}
      >
        {display.text}
      </a>
    );
  }
  return (
    <span
      title={truncate === true ? display.text : undefined}
      className={`${truncateClass} whitespace-pre-line`}
    >
      {display.text}
    </span>
  );
}

export default function FormSubmissionsPage({
  params,
}: Readonly<Pick<Route.ComponentProps, "params">>): JSX.Element {
  const { data: form, loading: isLoadingForm } = formsClient.useFormById({
    path: { id: params.id },
  });
  const { data: submissions, loading: isLoadingSubmissions } = useAllSubmissions(params.id);
  const isLoading = isLoadingForm || isLoadingSubmissions;
  const { mutate: deleteSubmission, loading: isDeleting } = formsClient.useDeleteSubmission();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteSubmissionId, setDeleteSubmissionId] = useState<string>();
  const [viewedSubmission, setViewedSubmission] = useState<ViewedSubmission>();

  // Submissions store arbitrary JSON; anything that isn't a JSON object shows as empty.
  const submissionsList = useMemo(
    () =>
      (submissions ?? []).map((submission) => {
        const data = formJsonObjectSchema.safeParse(submission.data);
        return { ...submission, data: data.success ? data.data : {} };
      }),
    [submissions],
  );
  const fields = useMemo(() => {
    const dataSchema = dataSchemaSchema.safeParse(form?.dataSchema);
    const uiSchema = uiSchemaElementSchema.safeParse(form?.uiSchema);
    return submissionFields(
      dataSchema.success ? dataSchema.data : undefined,
      uiSchema.success ? uiSchema.data : undefined,
      submissionsList,
    );
  }, [form, submissionsList]);
  const tableFields = fields.slice(0, tableFieldCount);
  // Only worth a column once the form has been changed after people submitted it.
  const showVersion = new Set(submissionsList.map((s) => s.formVersion)).size > 1;

  const handleDelete = async (): Promise<void> => {
    if (deleteSubmissionId === undefined || deleteSubmissionId === "") {
      return;
    }
    await deleteSubmission({
      path: { id: deleteSubmissionId },
    });
    setIsDeleteDialogOpen(false);
    setDeleteSubmissionId(undefined);
    globalThis.location.reload();
  };

  const openDeleteDialog = (submissionId: string): void => {
    setDeleteSubmissionId(submissionId);
    setIsDeleteDialogOpen(true);
  };

  const firstField = fields.at(0);
  const viewedTitle =
    viewedSubmission === undefined || firstField === undefined
      ? undefined
      : displaySubmissionValue(viewedSubmission.data[firstField.key], firstField);

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/dashboard/admin/forms" />}>Forms</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {isLoading && <Skeleton className="h-4 w-24" />}
          {!isLoading && form && form.status === "static" && (
            <BreadcrumbPage>{form.title}</BreadcrumbPage>
          )}
          {!isLoading && form && form.status !== "static" && (
            <BreadcrumbLink render={<Link to={`/dashboard/admin/forms/${form.id}/edit`} />}>
              {form.title}
            </BreadcrumbLink>
          )}
          {!isLoading && !form && <BreadcrumbPage>Not Found</BreadcrumbPage>}
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Submissions</BreadcrumbPage>
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Back to forms"
                render={<Link to="/dashboard/admin/forms" />}
                nativeButton={false}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Submissions</h1>
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  <p className="text-muted-foreground">{form?.title}</p>
                )}
              </div>
            </div>
            <Button
              disabled={isLoading || submissionsList.length === 0}
              render={<Link to={form ? `/dashboard/admin/forms/${form.id}/export` : "#"} />}
              nativeButton={false}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Submissions</CardTitle>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <>
                    {submissionsList.length} submission{submissionsList.length === 1 ? "" : "s"}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
              {!isLoading && submissionsList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ClipboardList className="mb-4 h-12 w-12 opacity-50" />
                  <p className="text-lg font-medium">No submissions yet</p>
                  <p className="text-sm">
                    Submissions will appear here when users fill out the form
                  </p>
                </div>
              )}
              {!isLoading && submissionsList.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableFields.map((field) => (
                        <TableHead key={field.key}>{field.title}</TableHead>
                      ))}
                      <TableHead>Submitted</TableHead>
                      {showVersion && <TableHead>Version</TableHead>}
                      <TableHead className="w-0">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissionsList.map((submission) => {
                      const submittedAt = new Date(submission.submittedAt);
                      return (
                        <TableRow key={submission.id}>
                          {tableFields.map((field, index) => (
                            <TableCell
                              key={field.key}
                              className={index === 0 ? "font-medium" : undefined}
                            >
                              <SubmissionValue
                                value={submission.data[field.key]}
                                field={field}
                                truncate
                              />
                            </TableCell>
                          ))}
                          <TableCell className="whitespace-nowrap tabular-nums">
                            {dateFormat.format(submittedAt)}
                            <span className="ml-2 text-muted-foreground">
                              {timeFormat.format(submittedAt)}
                            </span>
                          </TableCell>
                          {showVersion && (
                            <TableCell>
                              <Badge variant="outline">v{submission.formVersion}</Badge>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setViewedSubmission(submission);
                                }}
                              >
                                View
                                <ChevronRight aria-hidden className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Delete submission"
                                onClick={() => {
                                  openDeleteDialog(submission.id);
                                }}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail panel: every field, labelled from the form's schema */}
      <Sheet
        open={viewedSubmission !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setViewedSubmission(undefined);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-md">
          {viewedSubmission !== undefined && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">
                  {viewedTitle?.kind === "text" ? viewedTitle.text : "Submission"}
                </SheetTitle>
                <SheetDescription>
                  Submitted {fullDateFormat.format(new Date(viewedSubmission.submittedAt))}
                  {showVersion && ` · version ${viewedSubmission.formVersion}`}
                </SheetDescription>
              </SheetHeader>
              <dl className="grid flex-1 content-start gap-5 text-sm">
                {fields.map((field) => (
                  <div key={field.key} className="grid gap-1 border-t border-border pt-4">
                    <dt className="text-muted-foreground">{field.title}</dt>
                    <dd className="text-base">
                      <SubmissionValue value={viewedSubmission.data[field.key]} field={field} />
                    </dd>
                  </div>
                ))}
              </dl>
              <SheetFooter className="flex-row justify-between">
                <Button
                  variant="destructive"
                  onClick={() => {
                    const { id } = viewedSubmission;
                    setViewedSubmission(undefined);
                    openDeleteDialog(id);
                  }}
                >
                  <Trash2 aria-hidden />
                  Delete
                </Button>
                <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDelete();
              }}
              disabled={isDeleting ?? false}
            >
              {isDeleting === true ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
