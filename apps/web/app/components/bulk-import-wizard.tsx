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
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState, type JSX } from "react";
import { Link, useFetcher, useRevalidator } from "react-router";

import {
  BULK_IMPORT_BATCH_SIZE,
  BULK_IMPORT_SELECTION_LIMIT,
  summarizeImport,
  type BulkImportJob,
  type BulkImportResponse,
  type CustomerSyncState,
  type ImportCustomer,
  type ImportItem,
  type ImportItemStatus,
  type ImportUser,
} from "~/lib/bulk-import";
import { canImportPlan, planCustomerImport, type ImportPlan } from "~/lib/bulk-import-helpers";

interface BulkImportWizardProps {
  readonly stripeCustomers: readonly ImportCustomer[];
  readonly existingUsers: readonly ImportUser[];
  readonly syncStates: readonly CustomerSyncState[];
  readonly initialJob?: BulkImportJob;
}

function PlanBadge({ plan }: { readonly plan: ImportPlan }): JSX.Element {
  let variant: "destructive" | "success" | "secondary" = "secondary";
  if (plan.action === "conflict" || plan.action === "invalid") {
    variant = "destructive";
  } else if (plan.action === "synced") {
    variant = "success";
  }
  return <Badge variant={variant}>{plan.description}</Badge>;
}

const itemLabels = {
  queued: "Waiting",
  processing: "Processing / recoverable",
  sync_pending: "Linked · sync pending",
  synced: "Linked · synced",
  error: "Needs retry",
  conflict: "Conflict · review required",
} satisfies Record<ImportItemStatus, string>;

function accountLabel(item: ImportItem): string {
  if (item.accountCreated) {
    return "Created";
  }
  return item.userId === undefined ? "Not yet resolved" : "Existing account";
}

const itemVariants = {
  queued: "secondary",
  processing: "secondary",
  sync_pending: "secondary",
  synced: "success",
  error: "destructive",
  conflict: "destructive",
} satisfies Record<ImportItemStatus, "secondary" | "success" | "destructive">;

function ImportProgress({
  initialJob,
  customers,
  autoRun,
  onNewImport,
}: {
  readonly initialJob: BulkImportJob;
  readonly customers: readonly ImportCustomer[];
  readonly autoRun: boolean;
  readonly onNewImport: () => void;
}): JSX.Element {
  const { data, state, submit } = useFetcher<BulkImportResponse>();
  const [running, setRunning] = useState(autoRun);
  const [transportError, setTransportError] = useState<string>();
  const [confirmedJob, setConfirmedJob] = useState(initialJob);
  const job = data?.success === true ? data.job : confirmedJob;
  // Keep the last confirmed checkpoint when a later request returns an error.
  if (data?.success === true && confirmedJob !== data.job) {
    setConfirmedJob(data.job);
  }
  const summary = summarizeImport(job);
  const serverError = data?.success === false ? data.error : undefined;
  const busy = state !== "idle";
  const hasRequestError = serverError !== undefined || transportError !== undefined;
  const hasConflict = job.items.some((item) => item.status === "conflict");

  const send = useCallback(
    (intent: "process" | "retry" | "status"): void => {
      setTransportError(undefined);
      void submit(
        { intent, importId: job.id },
        {
          method: "post",
          defaultShouldRevalidate: false,
        },
      ).catch(() => {
        setTransportError(
          "Connection lost. Progress is saved; refresh this page to resume safely.",
        );
      });
    },
    [job.id, submit],
  );

  useEffect((): (() => void) | undefined => {
    if (!running || busy || summary.complete || summary.errors > 0 || hasRequestError) {
      return undefined;
    }
    const timer = globalThis.setTimeout(
      () => {
        send(summary.remaining > 0 ? "process" : "status");
      },
      summary.remaining > 0 ? 0 : 2000,
    );
    return (): void => {
      globalThis.clearTimeout(timer);
    };
  }, [
    running,
    busy,
    summary.complete,
    summary.errors,
    summary.remaining,
    hasRequestError,
    job.updatedAt,
    send,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{summary.complete ? "Import complete" : "Import progress"}</CardTitle>
        <CardDescription>
          Saved after every customer. You can leave this page and resume later. Subscription sync
          never creates a new subscription or changes billing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-live="polite">
          {[
            ["Accounts created", summary.created],
            ["Customers linked", summary.linked],
            ["Customers synced", summary.synced],
            ["Sync pending", summary.pending],
            ["Need attention", summary.errors],
          ].map(([label, count]) => (
            <div key={label} className="rounded-lg border p-3">
              <p className="text-2xl font-semibold tabular-nums">{count}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <output className="flex items-center gap-2 text-sm text-muted-foreground">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {summary.synced} of {job.items.length} customers fully synced · {summary.remaining}{" "}
          remaining to process
        </output>
        {summary.complete && (
          <Alert variant="success">
            <AlertTitle>All selected customers are linked and synced</AlertTitle>
            <AlertDescription>
              A completed sync can legitimately contain no subscriptions.
            </AlertDescription>
          </Alert>
        )}
        {hasRequestError && (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Import paused</AlertTitle>
            <AlertDescription>
              {serverError ?? transportError} Completed work is not rolled back.
            </AlertDescription>
          </Alert>
        )}
        {summary.errors > 0 && (
          <Alert variant="warning">
            <AlertTitle>Import paused for review</AlertTitle>
            <AlertDescription>
              {hasConflict
                ? "Completed work is saved. A conflicting link needs review: start a new import to continue with the remaining customers."
                : "Completed work is saved. Retry errors below."}
            </AlertDescription>
          </Alert>
        )}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {job.items.map((item) => {
                const customer = customers.find((candidate) => candidate.id === item.customerId);
                return (
                  <TableRow key={item.customerId}>
                    <TableCell>
                      <p className="font-medium">
                        {customer?.name ?? customer?.email ?? item.customerId}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.customerId}</p>
                    </TableCell>
                    <TableCell>{accountLabel(item)}</TableCell>
                    <TableCell>
                      <Badge variant={itemVariants[item.status]}>{itemLabels[item.status]}</Badge>
                      {item.error !== undefined && (
                        <p className="mt-1 text-sm text-destructive">{item.error}</p>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!summary.complete && summary.errors === 0 && !hasRequestError && running && (
            <Button
              variant="outline"
              onClick={() => {
                setRunning(false);
              }}
            >
              Pause after this batch
            </Button>
          )}
          {!summary.complete && (!running || hasRequestError) && summary.errors === 0 && (
            <Button
              disabled={busy}
              onClick={() => {
                setRunning(true);
                send("process");
              }}
            >
              Resume import
            </Button>
          )}
          {!hasConflict && job.items.some((item) => item.status === "error") && (
            <Button
              disabled={busy}
              onClick={() => {
                setRunning(true);
                send("retry");
              }}
            >
              Retry remaining
            </Button>
          )}
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              send("status");
            }}
          >
            Refresh status
          </Button>
          <Button variant="outline" disabled={busy} onClick={onNewImport}>
            Start new import
          </Button>
          <Button
            variant="outline"
            render={<Link to="/dashboard/admin/members" />}
            nativeButton={false}
          >
            View members
          </Button>
          <Link className="text-sm underline underline-offset-4" to={`?import=${job.id}`}>
            Saved import link
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function BulkImportWizard({
  stripeCustomers,
  existingUsers,
  syncStates,
  initialJob,
}: BulkImportWizardProps): JSX.Element {
  const [step, setStep] = useState<"select" | "preview" | "run">(initialJob ? "run" : "select");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [autoRun, setAutoRun] = useState(false);
  const { revalidate } = useRevalidator();
  const start = useFetcher<BulkImportResponse>();
  const plans = stripeCustomers.map((customer) =>
    planCustomerImport(customer, existingUsers, syncStates),
  );
  const selected = plans.filter((plan) => selectedIds.has(plan.customer.id));
  const valid = selected.filter((plan) => canImportPlan(plan));
  const selectable = plans.filter((plan) => canImportPlan(plan));
  const job = start.data?.success === true ? start.data.job : initialJob;
  const busy = start.state !== "idle";
  const tooMany = selectedIds.size > BULK_IMPORT_SELECTION_LIMIT;

  const toggle = (id: string): void => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const startImport = (): void => {
    setAutoRun(true);
    setStep("run");
    void start
      .submit(
        { intent: "start", customerIds: JSON.stringify(valid.map((plan) => plan.customer.id)) },
        {
          method: "post",
          defaultShouldRevalidate: false,
        },
      )
      .catch(() => {
        setStep("preview");
      });
  };

  if (step === "run" && busy) {
    return (
      <Card>
        <CardContent className="py-8">
          <output className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Saving import selection…
          </output>
        </CardContent>
      </Card>
    );
  }
  if (step === "run" && job && start.data?.success !== false) {
    return (
      <ImportProgress
        key={job.id}
        initialJob={job}
        customers={stripeCustomers}
        autoRun={autoRun}
        onNewImport={() => {
          setAutoRun(false);
          void revalidate();
          setSelectedIds(new Set());
          setStep("select");
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {step === "preview" ? "Preview import plan" : "Select customers to import"}
        </CardTitle>
        <CardDescription>
          Select up to {BULK_IMPORT_SELECTION_LIMIT} customers. Requests process only{" "}
          {BULK_IMPORT_BATCH_SIZE} customers at a time. Existing accounts are matched by Stripe ID
          first, then normalized email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {start.data?.success === false && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{start.data.error}</AlertDescription>
          </Alert>
        )}
        {step !== "preview" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedIds(
                  new Set(
                    plans
                      .filter((plan) => plan.action === "create")
                      .slice(0, BULK_IMPORT_SELECTION_LIMIT)
                      .map((plan) => plan.customer.id),
                  ),
                );
              }}
            >
              Select customers without accounts
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedIds(
                  new Set(
                    selectable
                      .slice(0, BULK_IMPORT_SELECTION_LIMIT)
                      .map((plan) => plan.customer.id),
                  ),
                );
              }}
            >
              Select actionable customers
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedIds(new Set());
              }}
            >
              Clear selection
            </Button>
            <Badge variant="secondary" className="tabular-nums">
              {selectedIds.size} of {stripeCustomers.length} selected
            </Badge>
          </div>
        )}
        {step === "preview" && (
          <Alert>
            <AlertTitle>Review before importing</AlertTitle>
            <AlertDescription>
              {valid.filter((plan) => plan.action === "create").length} accounts to create ·{" "}
              {valid.filter((plan) => plan.action === "link").length} existing accounts to link ·{" "}
              {valid.filter((plan) => plan.action === "retry" || plan.action === "pending").length}{" "}
              syncs to verify. New accounts receive random passwords. This import does not send
              invitations or change existing subscriptions.
            </AlertDescription>
          </Alert>
        )}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {step !== "preview" && (
                  <TableHead className="w-12">
                    <span className="sr-only">Select</span>
                  </TableHead>
                )}
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Account / sync status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(step === "preview" ? selected : plans).map((plan) => (
                <TableRow key={plan.customer.id}>
                  {step !== "preview" && (
                    <TableCell>
                      <Checkbox
                        aria-label={`Select Stripe customer ${plan.customer.id}`}
                        checked={selectedIds.has(plan.customer.id)}
                        disabled={!canImportPlan(plan)}
                        onCheckedChange={() => {
                          toggle(plan.customer.id);
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <p className="font-medium">{plan.customer.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{plan.customer.id}</p>
                  </TableCell>
                  <TableCell>{plan.customer.email ?? "—"}</TableCell>
                  <TableCell>
                    <PlanBadge plan={plan} />
                    {plan.matchedUser && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Existing account: {plan.matchedUser.email}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>No Stripe customers found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {tooMany && (
          <p role="alert" className="text-sm text-destructive">
            Select {BULK_IMPORT_SELECTION_LIMIT} or fewer customers.
          </p>
        )}
        <div className="flex justify-end gap-2">
          {step === "preview" && (
            <Button
              variant="outline"
              onClick={() => {
                setStep("select");
              }}
            >
              Back
            </Button>
          )}
          {step === "preview" ? (
            <Button disabled={valid.length === 0 || tooMany || busy} onClick={startImport}>
              Start import ({valid.length})
            </Button>
          ) : (
            <Button
              disabled={selectedIds.size === 0 || tooMany}
              onClick={() => {
                setStep("preview");
              }}
            >
              Preview
            </Button>
          )}
          {step === "run" && (
            <Button
              variant="outline"
              onClick={() => {
                setStep("select");
              }}
            >
              Back to selection
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
