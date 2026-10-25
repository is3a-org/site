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
import { Skeleton } from "@is3a/design-system/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@is3a/design-system/table";
import { ArrowLeft, Trash2, Eye, ClipboardList, Download } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { Link } from "react-router";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { formJsonObjectSchema } from "~/components/ui/form-builder/form-schema-contracts";
import type { FormJsonObject } from "~/components/ui/form-builder/types";
import { formsClient, useAllSubmissions } from "~/lib/forms-client";

import type { Route } from "./+types/submissions";

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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>();
  const [selectedSubmissionData, setSelectedSubmissionData] = useState<FormJsonObject>();

  const handleDelete = async (): Promise<void> => {
    if (selectedSubmissionId === undefined || selectedSubmissionId === "") {
      return;
    }

    await deleteSubmission({
      path: { id: selectedSubmissionId },
    });

    setIsDeleteDialogOpen(false);
    setSelectedSubmissionId(undefined);
    globalThis.location.reload();
  };

  const openDeleteDialog = (submissionId: string): void => {
    setSelectedSubmissionId(submissionId);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (data: FormJsonObject): void => {
    setSelectedSubmissionData(formJsonObjectSchema.parse(data));
    setIsViewDialogOpen(true);
  };

  const submissionsList = submissions ?? [];

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/dashboard/admin/forms" />}>Forms</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {isLoading && <Skeleton className="h-4 w-24" />}
          {!isLoading && form && (
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
                      <TableHead>Submitted</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissionsList.map((submission) => {
                      const data = submission.data;
                      return (
                        <TableRow key={submission.id}>
                          <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              v{submission.formVersion}
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="inline-block max-w-sm truncate rounded bg-muted px-2 py-1 text-xs">
                              {JSON.stringify(data)}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  openViewDialog(formJsonObjectSchema.parse(data));
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  openDeleteDialog(submission.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>Full submission data</DialogDescription>
          </DialogHeader>
          <pre className="overflow-auto rounded-md bg-muted p-4 text-sm">
            {JSON.stringify(selectedSubmissionData, undefined, 2)}
          </pre>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
