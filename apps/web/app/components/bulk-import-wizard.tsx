"use client";

import { useState } from "react";
import { useFetcher } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, UserPlus, Users, XCircle } from "lucide-react";
import { matchStripeCustomerToUser } from "~/lib/bulk-import-helpers";

type User = {
  id: string;
  email: string;
  stripeCustomerId: string | null;
};

type StripeCustomer = {
  id: string;
  email: string | null;
  name?: string | null;
  created: number;
};

type BulkImportWizardProps = {
  stripeCustomers: StripeCustomer[];
  existingUsers: User[];
};

type Step = "select" | "preview" | "execute" | "results";

type MatchResult = {
  customer: StripeCustomer;
  matchedUser: User | null;
  matchType: "stripeCustomerId" | "email" | "none";
  willCreateUser: boolean;
  hasConflict: boolean;
  conflictReason?: string;
  alreadySynced: boolean;
};

export function BulkImportWizard({ stripeCustomers, existingUsers }: BulkImportWizardProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  const fetcher = useFetcher();
  const isExecuting = fetcher.state === "submitting";

  // Handle checkbox toggle for customer selection
  const toggleCustomer = (customerId: string) => {
    const newSelection = new Set(selectedCustomerIds);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomerIds(newSelection);
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedCustomerIds.size === stripeCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(stripeCustomers.map((c) => c.id)));
    }
  };

  // Move to preview step
  const handlePreview = () => {
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
  const handleExecute = () => {
    setStep("execute");
    // Filter out customers with conflicts and customers already synced
    const validCustomerIds = matchResults
      .filter((r) => !r.hasConflict && !r.alreadySynced)
      .map((r) => r.customer.id);
    const formData = new FormData();
    formData.append("intent", "bulk-sync-subscription");
    formData.append("customerIds", JSON.stringify(validCustomerIds));
    fetcher.submit(formData, { method: "post" });
  };

  // Move to results once fetch completes
  if (step === "execute" && fetcher.data && !isExecuting) {
    if (fetcher.data.success || fetcher.data.error) {
      setStep("results");
    }
  }

  // Reset and start over
  const handleReset = () => {
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
        <div className="bg-border h-px w-12" />
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
        <div className="bg-border h-px w-12" />
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
                        <TableCell colSpan={4} className="text-muted-foreground text-center">
                          No Stripe customers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      stripeCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCustomerIds.has(customer.id)}
                              onCheckedChange={() => toggleCustomer(customer.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{customer.name || "—"}</TableCell>
                          <TableCell>{customer.email || "—"}</TableCell>
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
                <p className="text-destructive text-sm">
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
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{existingUsersCount}</p>
                    <p className="text-muted-foreground text-sm">Will Link</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <UserPlus className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{newUsersCount}</p>
                    <p className="text-muted-foreground text-sm">Will Create</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <CheckCircle2 className="h-8 w-8 text-gray-500" />
                  <div>
                    <p className="text-2xl font-bold">{alreadySyncedCount}</p>
                    <p className="text-muted-foreground text-sm">Already Synced</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{conflictsCount}</p>
                    <p className="text-muted-foreground text-sm">Conflicts</p>
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
                        className={
                          result.hasConflict
                            ? "bg-red-50 dark:bg-red-950/20"
                            : result.alreadySynced
                              ? "bg-gray-50 dark:bg-gray-950/20"
                              : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {result.customer.name || result.customer.email || result.customer.id}
                        </TableCell>
                        <TableCell>{result.customer.email || "—"}</TableCell>
                        <TableCell>
                          {result.alreadySynced ? (
                            <Badge variant="outline" className="border-gray-500 text-gray-700">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Already Synced (Will be skipped)
                            </Badge>
                          ) : result.hasConflict ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className="border-red-500 text-red-700">
                                <XCircle className="mr-1 h-3 w-3" />
                                Conflict (Will be skipped)
                              </Badge>
                              <p className="text-muted-foreground text-xs">
                                {result.conflictReason}
                              </p>
                            </div>
                          ) : result.willCreateUser ? (
                            <Badge variant="outline" className="border-green-500 text-green-700">
                              <UserPlus className="mr-1 h-3 w-3" />
                              Create new user
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              <Users className="mr-1 h-3 w-3" />
                              Link to {result.matchedUser?.email}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {newUsersCount > 0 && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    <strong>Note:</strong> {newUsersCount} new user(s) will be created with
                    auto-generated passwords. Users will need to reset their passwords on first
                    login.
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("select")}>
                  Back
                </Button>
                <Button onClick={handleExecute} disabled={validCount === 0}>
                  {validCount === 0
                    ? "No Valid Customers"
                    : `Execute Import (${validCount} customer${validCount !== 1 ? "s" : ""})`}
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
              <Loader2 className="text-primary h-12 w-12 animate-spin" />
              <p className="text-muted-foreground text-sm">Importing {validCount} customer(s)...</p>
              {(conflictsCount > 0 || alreadySyncedCount > 0) && (
                <p className="text-muted-foreground text-xs">
                  (
                  {[
                    alreadySyncedCount > 0 && `${alreadySyncedCount} already synced`,
                    conflictsCount > 0 &&
                      `${conflictsCount} conflict${conflictsCount !== 1 ? "s" : ""}`,
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
              {fetcher.data?.success ? "Import completed successfully" : "Import failed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fetcher.data?.success ? (
                <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {fetcher.data.message}
                    </p>
                    <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                      Successfully imported {fetcher.data.results?.length || 0} customer(s) and
                      synced their subscriptions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">Import Failed</p>
                    <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                      {fetcher.data?.error || "An unknown error occurred"}
                    </p>
                    {fetcher.data?.customerId && (
                      <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                        Failed at customer: {fetcher.data.customerId}
                      </p>
                    )}
                    {fetcher.data?.results && fetcher.data.results.length > 0 && (
                      <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                        Successfully processed {fetcher.data.results.length} customer(s) before
                        error occurred.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.location.reload()}>
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
