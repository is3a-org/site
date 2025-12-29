import type { Route } from "./+types/submissions";
import { Link } from "react-router";
import { useState } from "react";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ArrowLeft, Trash2, Eye, ClipboardList, Download } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { formsClient } from "~/lib/forms-client";

export default function FormSubmissionsPage({ params }: Route.ComponentProps) {
  const { data: form, loading: isLoadingForm } = formsClient.useFormById({
    path: { id: params.id },
  });
  const { data: submissions, loading: isLoadingSubmissions } = formsClient.useSubmissions({
    path: { id: params.id },
  });
  const isLoading = isLoadingForm || isLoadingSubmissions;

  const { mutate: deleteSubmission, loading: isDeleting } = formsClient.useDeleteSubmission();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedSubmissionData, setSelectedSubmissionData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const handleDelete = async () => {
    if (!selectedSubmissionId) {
      return;
    }

    await deleteSubmission({
      path: { id: selectedSubmissionId },
    });

    setIsDeleteDialogOpen(false);
    setSelectedSubmissionId(null);
    window.location.reload();
  };

  const openDeleteDialog = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (data: Record<string, unknown>) => {
    setSelectedSubmissionData(data);
    setIsViewDialogOpen(true);
  };

  const submissionsList = submissions ?? [];

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
          ) : form ? (
            <BreadcrumbLink asChild>
              <Link to={`/dashboard/admin/forms/${form.id}/edit`}>{form.title}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Not Found</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Submissions</BreadcrumbPage>
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
                <h1 className="text-2xl font-bold">Submissions</h1>
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  <p className="text-muted-foreground">{form?.title}</p>
                )}
              </div>
            </div>
            <Button asChild disabled={isLoading || submissionsList.length === 0}>
              <Link to={form ? `/dashboard/admin/forms/${form.id}/export` : "#"}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Link>
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
                    {submissionsList.length} submission{submissionsList.length !== 1 ? "s" : ""}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : submissionsList.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                  <ClipboardList className="mb-4 h-12 w-12 opacity-50" />
                  <p className="text-lg font-medium">No submissions yet</p>
                  <p className="text-sm">
                    Submissions will appear here when users fill out the form
                  </p>
                </div>
              ) : (
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
                      const data = submission.data as Record<string, unknown>;
                      return (
                        <TableRow key={submission.id}>
                          <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <code className="bg-muted rounded px-2 py-1 text-xs">
                              v{submission.formVersion}
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted inline-block max-w-sm truncate rounded px-2 py-1 text-xs">
                              {JSON.stringify(data)}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openViewDialog(data)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(submission.id)}
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
          <pre className="bg-muted overflow-auto rounded-md p-4 text-sm">
            {JSON.stringify(selectedSubmissionData, null, 2)}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
