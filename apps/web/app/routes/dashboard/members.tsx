import { Badge } from "@is3a/design-system/badge";
import { BreadcrumbItem, BreadcrumbPage } from "@is3a/design-system/breadcrumb";
import { Button } from "@is3a/design-system/button";
import { Card, CardContent, CardDescription, CardHeader } from "@is3a/design-system/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@is3a/design-system/dropdown-menu";
import { Input } from "@is3a/design-system/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@is3a/design-system/table";
import { Tabs, TabsList, TabsTrigger } from "@is3a/design-system/tabs";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Copy,
  ExternalLink,
  MoreHorizontal,
  PanelRight,
  Search,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import {
  useRevalidator,
  useRouteLoaderData,
  useSearchParams,
  type ShouldRevalidateFunctionArgs,
} from "react-router";

import type { Role } from "@fragno-dev/auth";

import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { PeriodText, PlanBadge, SubscriptionStatusBadge } from "~/components/member-badges";
import { MemberDetailsSheet } from "~/components/member-details-sheet";
import { UserRepo } from "~/db/repo/user";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { formatCalendarDate } from "~/lib/date-utils";
import {
  countByView,
  directoryStats,
  isInView,
  matchesSearch,
  sortEntries,
  toDirectoryEntry,
  type DirectoryEntry,
  type DirectorySort,
  type DirectorySortKey,
  type DirectoryView,
} from "~/lib/member-directory";
import { MEMBERSHIPS } from "~/lib/memberships";
import { readServerEnvironmentVariable } from "~/lib/server-environment";
import { simpleAuthClient } from "~/lib/simple-auth-client";
import { cn } from "~/lib/utils";
import { requestContext } from "~/request-context";
import type { loader as dashboardLayoutLoader } from "~/routes/dashboard/dashboard-layout";

import type { Route } from "./+types/members";

interface PeopleLoaderData {
  accounts: Awaited<ReturnType<UserRepo["getAllUsers"]>>;
  stripeDashboardUrl: string;
}

export function meta(): Route.MetaDescriptors {
  return [{ title: "People · Dashboard" }];
}

export async function loader({ context }: Readonly<Route.LoaderArgs>): Promise<PeopleLoaderData> {
  const userRepo = new UserRepo(context.get(requestContext).db);
  const live = /^[rs]k_live_/u.test(readServerEnvironmentVariable("STRIPE_SECRET_KEY"));
  return {
    accounts: await userRepo.getAllUsers(),
    stripeDashboardUrl: live ? "https://dashboard.stripe.com" : "https://dashboard.stripe.com/test",
  };
}

/** Tabs, search and sort live in the URL; filtering happens client-side, so skip the reload. */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: Readonly<
  Pick<
    ShouldRevalidateFunctionArgs,
    "currentUrl" | "nextUrl" | "formMethod" | "defaultShouldRevalidate"
  >
>): boolean {
  if (
    formMethod === undefined &&
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.search !== nextUrl.search
  ) {
    return false;
  }
  return defaultShouldRevalidate;
}

const views: readonly { value: DirectoryView; label: string }[] = [
  { value: "members", label: "Members" },
  { value: "attention", label: "Needs attention" },
  { value: "lapsed", label: "Lapsed" },
  { value: "all", label: "All accounts" },
];

const viewNouns = {
  members: "active members",
  attention: "needing attention",
  lapsed: "lapsed members",
  all: "accounts",
} satisfies Record<DirectoryView, string>;

const emptyMessages = {
  members: "No active members yet.",
  attention: "Nobody needs attention. All payments are in order.",
  lapsed: "No lapsed members.",
  all: "No accounts yet.",
} satisfies Record<DirectoryView, string>;

function parseView(value: string | null): DirectoryView {
  return views.find((view) => view.value === value)?.value ?? "members";
}

function parseSort(key: string | null, order: string | null): DirectorySort {
  const sortKeys: readonly DirectorySortKey[] = ["email", "renewal", "memberSince"];
  return {
    key: sortKeys.find((candidate) => candidate === key) ?? "email",
    order: order === "desc" ? "desc" : "asc",
  };
}

export default function PeoplePage({
  loaderData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  const { accounts, stripeDashboardUrl } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseView(searchParams.get("view"));
  const sort = parseSort(searchParams.get("sort"), searchParams.get("order"));
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedId, setSelectedId] = useState<string>();
  const layoutData = useRouteLoaderData<typeof dashboardLayoutLoader>(
    "routes/dashboard/dashboard-layout",
  );
  const viewerEmail =
    layoutData === undefined || layoutData instanceof Response ? undefined : layoutData.user.email;

  const updateParams = (changes: Readonly<Record<string, string | undefined>>): void => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === "") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  const entries = useMemo(() => accounts.map((account) => toDirectoryEntry(account)), [accounts]);
  const stats = useMemo(() => directoryStats(entries), [entries]);
  const searched = useMemo(
    () => entries.filter((entry) => matchesSearch(entry, search)),
    [entries, search],
  );
  const totals = useMemo(() => countByView(entries), [entries]);
  const counts = countByView(searched);
  const visible = sortEntries(
    searched.filter((entry) => isInView(entry, view)),
    sort,
  );
  const selected = entries.find((entry) => entry.account.id === selectedId);

  const handleSearch = (value: string): void => {
    setSearch(value);
    updateParams({ q: value });
  };

  const toggleSort = (key: DirectorySortKey): void => {
    const order = sort.key === key && sort.order === "asc" ? "desc" : "asc";
    updateParams({
      sort: key === "email" ? undefined : key,
      order: order === "asc" ? undefined : order,
    });
  };

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbPage>People</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="text-muted-foreground">
            Everyone with an account, and where they stand as members.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active members"
            value={stats.active}
            detail={planSplit(stats.byPriceId)}
          />
          <StatCard
            label="Cancelling"
            value={stats.cancelling}
            detail="Active until their period ends"
          />
          <StatCard
            label="Needs attention"
            value={stats.attention}
            detail="Past due, unpaid or incomplete"
            onSelect={
              stats.attention > 0
                ? () => {
                    updateParams({ view: "attention" });
                  }
                : undefined
            }
          />
          <StatCard
            label="Accounts"
            value={entries.length}
            detail={`${entries.filter((entry) => entry.standing === "none").length} without a membership`}
          />
        </div>

        <Card>
          <CardHeader className="gap-4 md:flex md:items-center md:justify-between">
            <Tabs
              value={view}
              onValueChange={(value: DirectoryView) => {
                updateParams({ view: value === "members" ? undefined : value });
              }}
            >
              <TabsList className="flex-wrap">
                {views.map(({ value, label }) => (
                  <TabsTrigger key={value} value={value}>
                    {label}
                    <span className="ml-1.5 text-sm text-muted-foreground tabular-nums">
                      {counts[value]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search email or Stripe ID…"
                aria-label="Search people"
                value={search}
                onChange={(event) => {
                  handleSearch(event.target.value);
                }}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Member" sortKey="email" sort={sort} onSort={toggleSort} />
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <SortableHead
                      label="Renews / ends"
                      sortKey="renewal"
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <SortableHead
                      label="Member since"
                      sortKey="memberSince"
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <TableHead>Role</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        {search.trim() === "" ? (
                          emptyMessages[view]
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            Nobody matches “{search.trim()}”.
                            <Button
                              variant="link"
                              onClick={() => {
                                handleSearch("");
                              }}
                            >
                              Clear search
                            </Button>
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visible.map((entry) => (
                      <PersonRow
                        key={entry.account.id}
                        entry={entry}
                        isSelf={entry.account.email === viewerEmail}
                        stripeDashboardUrl={stripeDashboardUrl}
                        onOpen={() => {
                          setSelectedId(entry.account.id);
                        }}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {visible.length > 0 && (
              <CardDescription className="mt-3">
                {search.trim() === ""
                  ? `${visible.length} ${viewNouns[view]}`
                  : `${visible.length} of ${totals[view]} ${viewNouns[view]} match “${search.trim()}”`}
              </CardDescription>
            )}
          </CardContent>
        </Card>
      </div>

      <MemberDetailsSheet
        entry={selected}
        stripeDashboardUrl={stripeDashboardUrl}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(undefined);
          }
        }}
      />
    </>
  );
}

function planSplit(byPriceId: ReadonlyMap<string, number>): string {
  const known = Object.values(MEMBERSHIPS).map(
    (plan) => `${byPriceId.get(plan.priceId) ?? 0} ${plan.name}`,
  );
  const knownIds = new Set(Object.values(MEMBERSHIPS).map((plan) => plan.priceId));
  const other = [...byPriceId]
    .filter(([priceId]) => !knownIds.has(priceId))
    .reduce((sum, [, count]) => sum + count, 0);
  return [...known, ...(other > 0 ? [`${other} other`] : [])].join(" · ");
}

interface StatCardProps {
  readonly label: string;
  readonly value: number;
  readonly detail: string;
  /** Turns the card into a shortcut to the matching tab, flagged while the value is non-zero. */
  readonly onSelect?: () => void;
}

function StatCard({ label, value, detail, onSelect }: StatCardProps): JSX.Element {
  const flagged = onSelect !== undefined && value > 0;
  const body = (
    <>
      <span className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        {flagged && <ChevronRight className="size-4" />}
      </span>
      <span
        className={cn(
          "text-3xl font-semibold font-display tabular-nums",
          flagged && "text-destructive",
        )}
      >
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{detail}</span>
    </>
  );
  return (
    <Card className="gap-1 px-5">
      {flagged ? (
        <button
          type="button"
          onClick={onSelect}
          className="-m-2 flex flex-col gap-1 rounded-md p-2 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {body}
        </button>
      ) : (
        body
      )}
    </Card>
  );
}

interface SortableHeadProps {
  readonly label: string;
  readonly sortKey: DirectorySortKey;
  readonly sort: DirectorySort;
  readonly onSort: (key: DirectorySortKey) => void;
}

function SortableHead({ label, sortKey, sort, onSort }: SortableHeadProps): JSX.Element {
  const active = sort.key === sortKey;
  const ascending = sort.order === "asc";
  const Icon = active ? (ascending ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead aria-sort={active ? (ascending ? "ascending" : "descending") : "none"}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => {
          onSort(sortKey);
        }}
      >
        {label}
        <Icon className={active ? "" : "text-muted-foreground"} />
      </Button>
    </TableHead>
  );
}

// Clicks inside the actions menu, including its portalled popup, must not open the panel.
function stopRowClick(event: React.SyntheticEvent): void {
  event.stopPropagation();
}

interface PersonRowProps {
  readonly entry: DirectoryEntry;
  readonly isSelf: boolean;
  readonly stripeDashboardUrl: string;
  readonly onOpen: () => void;
}

function PersonRow({ entry, isSelf, stripeDashboardUrl, onOpen }: PersonRowProps): JSX.Element {
  const { account, current, period, memberSince, standing } = entry;
  const hasMembership = current !== undefined && standing !== "none";
  const { mutate: updateRole } = simpleAuthClient.useUpdateUserRole();
  const { revalidate } = useRevalidator();
  const [roleState, setRoleState] = useState<"idle" | "saving" | "failed">("idle");
  const isAdmin = account.role === "admin";

  const changeRole = async (role: Role): Promise<void> => {
    setRoleState("saving");
    try {
      await updateRole({ path: { userId: account.id }, body: { role } });
      await revalidate();
      setRoleState("idle");
    } catch {
      setRoleState("failed");
    }
  };

  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="font-medium">
        <button
          type="button"
          className="text-left underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          {account.email}
        </button>
      </TableCell>
      <TableCell>{hasMembership ? <PlanBadge priceId={current.priceId} /> : <Dash />}</TableCell>
      <TableCell>
        {current === undefined ? (
          <span className="text-sm text-muted-foreground">No membership</span>
        ) : (
          <SubscriptionStatusBadge subscription={current} />
        )}
      </TableCell>
      <TableCell>{period ? <PeriodText period={period} /> : <Dash />}</TableCell>
      <TableCell className="tabular-nums">
        {memberSince ? formatCalendarDate(memberSince) : <Dash />}
      </TableCell>
      <TableCell>
        <RoleLabel isAdmin={isAdmin} state={roleState} />
      </TableCell>
      <TableCell onClick={stopRowClick}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" />}
            aria-label={`Actions for ${account.email}`}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>
              <PanelRight />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={account.stripeCustomerId === null || account.stripeCustomerId === ""}
              onClick={() => {
                window.open(
                  `${stripeDashboardUrl}/customers/${account.stripeCustomerId}`,
                  "_blank",
                  "noreferrer",
                );
              }}
            >
              <ExternalLink />
              Open in Stripe
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(account.email);
              }}
            >
              <Copy />
              Copy email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              // Demoting yourself would lock you out of this page.
              disabled={isSelf || roleState === "saving"}
              onClick={() => {
                void changeRole(isAdmin ? "user" : "admin");
              }}
            >
              {isAdmin ? <ShieldOff /> : <ShieldCheck />}
              {isAdmin ? "Remove admin" : "Make admin"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function RoleLabel({
  isAdmin,
  state,
}: Readonly<{ isAdmin: boolean; state: "idle" | "saving" | "failed" }>): JSX.Element {
  if (state === "saving") {
    return <span className="text-sm text-muted-foreground">Updating…</span>;
  }
  if (state === "failed") {
    return <span className="text-sm text-destructive">Couldn't update</span>;
  }
  return isAdmin ? (
    <Badge>Admin</Badge>
  ) : (
    <span className="text-sm text-muted-foreground">User</span>
  );
}

function Dash(): JSX.Element {
  return <span className="text-muted-foreground">—</span>;
}
