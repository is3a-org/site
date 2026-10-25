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
import { Checkbox } from "@is3a/design-system/checkbox";
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
import { ArrowLeft, Download } from "lucide-react";
import type { JSX } from "react";
import { useState, useMemo } from "react";
import { Link } from "react-router";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { formJsonObjectSchema } from "~/components/ui/form-builder/form-schema-contracts";
import type { FormJsonObject } from "~/components/ui/form-builder/types";
import { formsClient, useAllSubmissions } from "~/lib/forms-client";

import type { Route } from "./+types/export";
import {
  flattenSubmission,
  formatSubmissionCell,
  generateSubmissionCsv,
} from "./submission-export";

interface ColumnSelection {
  readonly source: readonly string[];
  readonly columns: ReadonlySet<string>;
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportSubmissionsPage({
  params,
}: Readonly<Pick<Route.ComponentProps, "params">>): JSX.Element {
  const { data: form, loading: isLoadingForm } = formsClient.useFormById({
    path: { id: params.id },
  });
  const { data: submissions, loading: isLoadingSubmissions } = useAllSubmissions(params.id);
  const isLoading = isLoadingForm || isLoadingSubmissions;

  const [versionChoice, setSelectedVersion] = useState("");
  const [columnSelection, setColumnSelection] = useState<ColumnSelection>();

  const submissionsList = useMemo(() => submissions ?? [], [submissions]);

  // Get unique versions
  const versions = useMemo(() => {
    const versionSet = new Set(submissionsList.map((s) => s.formVersion));
    return [...versionSet].toSorted((a, b) => b - a);
  }, [submissionsList]);
  const selectedVersion = versionChoice === "" ? String(versions[0] ?? "") : versionChoice;

  // Filter submissions by selected version
  const filteredSubmissions = useMemo(() => {
    if (!selectedVersion) {
      return [];
    }
    return submissionsList.filter((s) => s.formVersion === Number(selectedVersion));
  }, [submissionsList, selectedVersion]);

  // Flatten all submissions data and get all unique column keys
  const { flattenedData, allColumns } = useMemo(() => {
    const flattened: FormJsonObject[] = filteredSubmissions.map((s) => ({
      submittedAt: new Date(s.submittedAt).toISOString(),
      ...flattenSubmission(formJsonObjectSchema.parse(s.data)),
    }));

    const columns = new Set<string>(["submittedAt"]);
    for (const row of flattened) {
      for (const key of Object.keys(row)) {
        columns.add(key);
      }
    }

    return {
      flattenedData: flattened,
      allColumns: [...columns],
    };
  }, [filteredSubmissions]);

  // A new submission snapshot selects all columns without copying derived data into state.
  const selectedColumns =
    columnSelection?.source === allColumns ? columnSelection.columns : new Set(allColumns);

  const toggleColumn = (column: string): void => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(column)) {
      newSelected.delete(column);
    } else {
      newSelected.add(column);
    }
    setColumnSelection({ source: allColumns, columns: newSelected });
  };

  const selectAll = (): void => {
    setColumnSelection({ source: allColumns, columns: new Set(allColumns) });
  };
  const deselectAll = (): void => {
    setColumnSelection({ source: allColumns, columns: new Set() });
  };

  const handleExport = (): void => {
    if (!form) {
      return;
    }
    const columnsToExport = allColumns.filter((c) => selectedColumns.has(c));
    const csv = generateSubmissionCsv(flattenedData, columnsToExport);
    const filename = `${form.title.toLowerCase().replaceAll(/\s+/g, "-")}-v${selectedVersion}-submissions.csv`;
    downloadCSV(csv, filename);
  };

  const selectedColumnsArray = allColumns.filter((c) => selectedColumns.has(c));

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
          {isLoading && <Skeleton className="h-4 w-20" />}
          {!isLoading && form && (
            <BreadcrumbLink render={<Link to={`/dashboard/admin/forms/${form.id}/submissions`} />}>
              Submissions
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Export</BreadcrumbPage>
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              disabled={isLoading}
              render={<Link to={form ? `/dashboard/admin/forms/${form.id}/submissions` : "#"} />}
              nativeButton={false}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Export Submissions</h1>
              {isLoading ? (
                <Skeleton className="mt-1 h-4 w-32" />
              ) : (
                <p className="text-muted-foreground">{form?.title}</p>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export to CSV</CardTitle>
              <CardDescription>Select version and columns to export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Version selector */}
              <div className="space-y-2">
                <Label htmlFor="export-version">Form Version</Label>
                <Select
                  items={versions.map((version) => ({
                    value: String(version),
                    label: `Version ${version}`,
                  }))}
                  value={selectedVersion}
                  onValueChange={(value) => {
                    if (value !== null) {
                      setSelectedVersion(value);
                    }
                  }}
                >
                  <SelectTrigger id="export-version" className="w-48">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v} value={String(v)}>
                        Version {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVersion && (
                  <p className="text-sm text-muted-foreground">
                    {filteredSubmissions.length} submission
                    {filteredSubmissions.length === 1 ? "" : "s"} for this version. Each form
                    version represents a different data schema.
                  </p>
                )}
              </div>

              {/* Column selection */}
              {allColumns.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Columns</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
                    {allColumns.map((column) => (
                      <div key={column} className="flex items-center gap-2">
                        <Checkbox
                          id={`col-${column}`}
                          checked={selectedColumns.has(column)}
                          onCheckedChange={() => {
                            toggleColumn(column);
                          }}
                        />
                        <label
                          htmlFor={`col-${column}`}
                          className="cursor-pointer truncate text-sm"
                          title={column}
                        >
                          {column}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview table */}
              {flattenedData.length > 0 && selectedColumnsArray.length > 0 && (
                <div className="space-y-2">
                  <Label>
                    Preview ({Math.min(flattenedData.length, 5)} of {flattenedData.length} rows)
                  </Label>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectedColumnsArray.map((col) => (
                          <TableHead key={col} className="whitespace-nowrap">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flattenedData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {selectedColumnsArray.map((col) => (
                            <TableCell key={col} className="whitespace-nowrap">
                              {formatSubmissionCell(row[col])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredSubmissions.length === 0 && selectedVersion && (
                <p className="py-4 text-center text-muted-foreground">
                  No submissions for this version
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  render={
                    <Link to={form ? `/dashboard/admin/forms/${form.id}/submissions` : "#"} />
                  }
                  nativeButton={false}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={selectedColumnsArray.length === 0 || flattenedData.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
