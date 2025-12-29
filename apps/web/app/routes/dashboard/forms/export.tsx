import type { Route } from "./+types/export";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { formsClient } from "~/lib/forms-client";

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value) && value !== null) {
        Object.assign(acc, flattenObject(value as Record<string, unknown>, newKey));
      } else {
        acc[newKey] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>,
  );
}

function generateCSV(data: Record<string, unknown>[], columns: string[]): string {
  const escapeCSV = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map(escapeCSV).join(",");
  const rows = data.map((row) => columns.map((col) => escapeCSV(row[col])).join(","));
  return [header, ...rows].join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportSubmissionsPage({ params }: Route.ComponentProps) {
  const { data: form, loading: isLoadingForm } = formsClient.useFormById({
    path: { id: params.id },
  });
  const { data: submissions, loading: isLoadingSubmissions } = formsClient.useSubmissions({
    path: { id: params.id },
  });
  const isLoading = isLoadingForm || isLoadingSubmissions;

  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  const submissionsList = submissions ?? [];

  // Get unique versions
  const versions = useMemo(() => {
    const versionSet = new Set(submissionsList.map((s) => s.formVersion));
    return Array.from(versionSet).sort((a, b) => b - a);
  }, [submissionsList]);

  // Filter submissions by selected version
  const filteredSubmissions = useMemo(() => {
    if (!selectedVersion) {
      return [];
    }
    return submissionsList.filter((s) => s.formVersion === Number(selectedVersion));
  }, [submissionsList, selectedVersion]);

  // Flatten all submissions data and get all unique column keys
  const { flattenedData, allColumns } = useMemo(() => {
    const flattened: Record<string, unknown>[] = filteredSubmissions.map((s) => ({
      submittedAt: new Date(s.submittedAt).toISOString(),
      ...flattenObject(s.data as Record<string, unknown>),
    }));

    const columns = new Set<string>();
    columns.add("submittedAt");
    flattened.forEach((row) => {
      Object.keys(row).forEach((key) => columns.add(key));
    });

    return {
      flattenedData: flattened,
      allColumns: Array.from(columns),
    };
  }, [filteredSubmissions]);

  // Reset selected columns when version changes
  useEffect(() => {
    setSelectedColumns(new Set(allColumns));
  }, [allColumns]);

  // Set default version when page loads
  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(String(versions[0]));
    }
  }, [versions, selectedVersion]);

  const toggleColumn = (column: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(column)) {
      newSelected.delete(column);
    } else {
      newSelected.add(column);
    }
    setSelectedColumns(newSelected);
  };

  const selectAll = () => setSelectedColumns(new Set(allColumns));
  const deselectAll = () => setSelectedColumns(new Set());

  const handleExport = () => {
    if (!form) {
      return;
    }
    const columnsToExport = allColumns.filter((c) => selectedColumns.has(c));
    const csv = generateCSV(flattenedData, columnsToExport);
    const filename = `${form.title.toLowerCase().replace(/\s+/g, "-")}-v${selectedVersion}-submissions.csv`;
    downloadCSV(csv, filename);
  };

  const selectedColumnsArray = allColumns.filter((c) => selectedColumns.has(c));

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
          {isLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : form ? (
            <BreadcrumbLink asChild>
              <Link to={`/dashboard/admin/forms/${form.id}/submissions`}>Submissions</Link>
            </BreadcrumbLink>
          ) : null}
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Export</BreadcrumbPage>
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild disabled={isLoading}>
              <Link to={form ? `/dashboard/admin/forms/${form.id}/submissions` : "#"}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
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
                <Label>Form Version</Label>
                <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                  <SelectTrigger className="w-48">
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
                  <p className="text-muted-foreground text-sm">
                    {filteredSubmissions.length} submission
                    {filteredSubmissions.length !== 1 ? "s" : ""} for this version. Each form
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
                          onCheckedChange={() => toggleColumn(column)}
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
                              {String(row[col] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredSubmissions.length === 0 && selectedVersion && (
                <p className="text-muted-foreground py-4 text-center">
                  No submissions for this version
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link to={form ? `/dashboard/admin/forms/${form.id}/submissions` : "#"}>
                    Cancel
                  </Link>
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
