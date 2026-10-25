"use client";

import { Alert, AlertDescription, AlertTitle } from "@is3a/design-system/alert";
import { Badge } from "@is3a/design-system/badge";
import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { Checkbox } from "@is3a/design-system/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@is3a/design-system/table";
import { AlertCircle, CheckCircle2, Loader2, UserPlus, Users, XCircle } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { useFetcher } from "react-router";

import { matchStripeCustomerToUser } from "~/lib/bulk-import-helpers";
import type { action as bulkImportAction } from "~/routes/dashboard/stripe/bulk-import";

interface User {
  readonly id: string;
  readonly email: string;
  readonly stripeCustomerId: string | null;
}

interface StripeCustomer {
  readonly id: string;
  readonly email: string | null;
  readonly name?: string | null;
  readonly created: number;
}

interface BulkImportWizardProps {
  readonly stripeCustomers: readonly StripeCustomer[];
  readonly existingUsers: readonly User[];
}

type Step = "select" | "preview" | "execute" | "results";

interface MatchResult {
  readonly customer: StripeCustomer;
  readonly matchedUser: User | null;
  readonly matchType: "stripeCustomerId" | "email" | "none";
  readonly willCreateUser: boolean;
  readonly hasConflict: boolean;
  readonly conflictReason?: string;
  readonly alreadySynced: boolean;
}

function getImportCustomerText(value: string | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : value;
}

function getImportPreviewRowClass(result: MatchResult): string {
  if (result.hasConflict) {
    return "bg-destructive-muted";
  }
  return result.alreadySynced ? "bg-muted" : "";
}

function BulkImportMatchAction({ result }: Readonly<{ result: MatchResult }>): JSX.Element {
  if (result.alreadySynced) {
    return (
      <Badge variant="secondary">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Already Synced (Will be skipped)
      </Badge>
    );
  }
  if (result.hasConflict) {
    return (
      <div className="space-y-1">
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Conflict (Will be skipped)
        </Badge>
        <p className="text-xs text-muted-foreground">{result.conflictReason}</p>
      </div>
    );
  }
  if (result.willCreateUser) {
    return (
      <Badge variant="success">
        <UserPlus className="mr-1 h-3 w-3" />
        Create new user
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <Users className="mr-1 h-3 w-3" />
      Link to {result.matchedUser?.email}
    </Badge>
  );
}

export function BulkImportWizard({
  stripeCustomers,
  existingUsers,
}: BulkImportWizardProps): JSX.Element {
  const [step, setStep] = useState<Step>("select");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  const fetcher = useFetcher<typeof bulkImportAction>();
  const isExecuting = fetcher.state === "submitting";
  const importError = fetcher.data?.success === false ? fetcher.data : undefined;

  // Handle checkbox toggle for customer selection
  const toggleCustomer = (customerId: string): void => {
    const newSelection = new Set(selectedCustomerIds);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomerIds(newSelection);
  };

  // Select/deselect all
  const toggleAll = (): void => {
    if (selectedCustomerIds.size === stripeCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(stripeCustomers.map((c) => c.id)));
    }
  };

  // Move to preview step
  const handlePreview = (): void => {
    const selectedCustomers = stripeCustomers.filter((c) => selectedCustomerIds.has(c.id));
    const results = selectedCustomers.map((customer) => {
      const { matchedUser, matchType, hasConflict, conflictReason, alreadySynced } =
        matchStripeCustomerToUser(customer, existingUsers);
      return {
        customer,
        matchedUser,
        matchType,
        willCreateUser: !matchedUser && !hasConflict && !alreadySynced,
        hasConflict,
        conflictReason,
        alreadySynced,
      };
    });
    setMatchResults(results);
    setStep("preview");
  };

  // Execute bulk import (excluding customers with conflicts and already synced)
  const handleExecute = (): void => {
    setStep("execute");
    // Filter out customers with conflicts and customers already synced
    const validCustomerIds = matchResults
      .filter((r) => !r.hasConflict && !r.alreadySynced)
      .map((r) => r.customer.id);
    const formData = new FormData();
    formData.append("intent", "bulk-sync-subscription");
    formData.append("customerIds", JSON.stringify(validCustomerIds));
    void fetcher.submit(formData, { method: "post" }).catch((cause: unknown) => {
      console.error(new Error("Bulk import submission failed", { cause }));
    });
  };

  // Move to results once fetch completes
  if (step === "execute" && fetcher.data !== undefined && !isExecuting) {
    setStep("results");
  }

  // Reset and start over
  const handleReset = (): void => {
    setStep("select");
    setSelectedCustomerIds(new Set());
    setMatchResults([]);
  };

  const newUsersCount = matchResults.filter(
    (r) => r.willCreateUser && !r.hasConflict && !r.alreadySynced,
  ).length;
  const existingUsersCount = matchResults.filter(
    (r) => !r.willCreateUser && !r.hasConflict && !r.alreadySynced,
  ).length;
  const conflictsCount = matchResults.filter((r) => r.hasConflict).length;
  const alreadySyncedCount = matchResults.filter((r) => r.alreadySynced).length;
  const validCount = newUsersCount + existingUsersCount;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step === "select"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </div>
          <span className="text-sm font-medium">Select Customers</span>
        </div>
        <div className="h-px w-12 bg-border" />
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step === "preview"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
          <span className="text-sm font-medium">Preview</span>
        </div>
        <div className="h-px w-12 bg-border" />
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step === "execute" || step === "results"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            3
          </div>
          <span className="text-sm font-medium">Execute</span>
        </div>
      </div>

      {/* Step 1: Select Customers */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Customers to Import</CardTitle>
            <CardDescription>
              Choose which Stripe customers you want to sync. You can select up to 50 customers at a
              time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedCustomerIds.size === stripeCustomers.length &&
                      stripeCustomers.length > 0
                    }
                    onCheckedChange={toggleAll}
                  />
                  <label htmlFor="select-all" className="cursor-pointer text-sm font-medium">
                    Select All ({stripeCustomers.length})
                  </label>
                </div>
                <Badge variant="secondary">
                  {selectedCustomerIds.size} of {stripeCustomers.length} selected
                </Badge>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Stripe ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stripeCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No Stripe customers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      stripeCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <Checkbox
                              aria-label={`Select Stripe customer ${customer.id}`}
                              checked={selectedCustomerIds.has(customer.id)}
                              onCheckedChange={() => {
                                toggleCustomer(customer.id);
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {getImportCustomerText(customer.name)}
                          </TableCell>
                          <TableCell>{getImportCustomerText(customer.email)}</TableCell>
                          <TableCell className="font-mono text-xs">{customer.id}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={handlePreview}
                  disabled={selectedCustomerIds.size === 0 || selectedCustomerIds.size > 50}
                >
                  Preview
                </Button>
              </div>
              {selectedCustomerIds.size > 50 && (
                <p className="text-sm text-destructive">
                  Please select 50 or fewer customers for bulk import
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import Plan</CardTitle>
            <CardDescription>Review what will happen when you execute this import</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Users className="h-8 w-8 text-chart-3" />
                  <div>
                    <p className="text-2xl font-bold">{existingUsersCount}</p>
                    <p className="text-sm text-muted-foreground">Will Link</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <UserPlus className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{newUsersCount}</p>
                    <p className="text-sm text-muted-foreground">Will Create</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{alreadySyncedCount}</p>
                    <p className="text-sm text-muted-foreground">Already Synced</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{conflictsCount}</p>
                    <p className="text-sm text-muted-foreground">Conflicts</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stripe Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchResults.map((result) => (
                      <TableRow
                        key={result.customer.id}
                        className={getImportPreviewRowClass(result)}
                      >
                        <TableCell className="font-medium">
                          {[result.customer.name, result.customer.email, result.customer.id].find(
                            (value) => value !== undefined && value !== null && value !== "",
                          ) ?? result.customer.id}
                        </TableCell>
                        <TableCell>{getImportCustomerText(result.customer.email)}</TableCell>
                        <TableCell>
                          <BulkImportMatchAction result={result} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {newUsersCount > 0 && (
                <Alert variant="warning">
                  <AlertDescription>
                    <strong>Note:</strong> {newUsersCount} new user(s) will be created with
                    auto-generated passwords. Users will need to reset their passwords on first
                    login.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("select");
                  }}
                >
                  Back
                </Button>
                <Button onClick={handleExecute} disabled={validCount === 0}>
                  {validCount === 0
                    ? "No Valid Customers"
                    : `Execute Import (${validCount} customer${validCount === 1 ? "" : "s"})`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Execute */}
      {step === "execute" && (
        <Card>
          <CardHeader>
            <CardTitle>Executing Import</CardTitle>
            <CardDescription>Please wait while we process the import...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Importing {validCount} customer(s)...</p>
              {(conflictsCount > 0 || alreadySyncedCount > 0) && (
                <p className="text-xs text-muted-foreground">
                  (
                  {[
                    alreadySyncedCount > 0 && `${alreadySyncedCount} already synced`,
                    conflictsCount > 0 &&
                      `${conflictsCount} conflict${conflictsCount === 1 ? "" : "s"}`,
                  ]
                    .filter(Boolean)
                    .join(", ")}{" "}
                  - skipped)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === "results" && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>
              {fetcher.data?.success === true ? "Import completed successfully" : "Import failed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fetcher.data?.success === true ? (
                <Alert variant="success" role="alert">
                  <CheckCircle2 />
                  <AlertTitle>{fetcher.data.message}</AlertTitle>
                  <AlertDescription>
                    Successfully imported {fetcher.data.results.length} customer(s) and synced their
                    subscriptions.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive" role="alert">
                  <AlertCircle />
                  <AlertTitle>Import Failed</AlertTitle>
                  <AlertDescription>
                    <p>
                      {importError === undefined || importError.error === ""
                        ? "An unknown error occurred"
                        : importError.error}
                    </p>
                    {importError?.customerId !== undefined && importError.customerId !== "" && (
                      <p className="text-xs">Failed at customer: {importError.customerId}</p>
                    )}
                    {importError?.results !== undefined && importError.results.length > 0 && (
                      <p>
                        Successfully processed {importError.results.length} customer(s) before error
                        occurred.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    globalThis.location.reload();
                  }}
                >
                  Refresh Page
                </Button>
                <Button onClick={handleReset}>Start New Import</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
