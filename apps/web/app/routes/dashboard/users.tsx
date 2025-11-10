import { useState } from "react";
import type { Route } from "./+types/users";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { DashboardBreadcrumb } from "~/components/dashboard-breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { simpleAuthClient } from "~/lib/simple-auth-client";
import { Skeleton } from "~/components/ui/skeleton";

export async function loader({ context: _context, request: _request }: Route.LoaderArgs) {
  return {};
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"email" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const limit = 10;

  // Use the hook from the simple-auth fragment
  const { data, loading, error } = simpleAuthClient.useUsers({
    query: {
      search: search || undefined,
      sortBy,
      sortOrder,
      limit: limit.toString(),
      offset: (page * limit).toString(),
    },
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0); // Reset to first page on new search
  };

  const toggleSort = (column: "email" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(0); // Reset to first page on sort change
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <>
      <DashboardBreadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Users</BreadcrumbPage>
        </BreadcrumbItem>
      </DashboardBreadcrumb>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage and view all registered users</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Overview</CardTitle>
            <CardDescription>
              {data ? `${data.total} total user${data.total !== 1 ? "s" : ""}` : "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="mb-6 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {search && (
                <Button variant="outline" size="sm" onClick={() => handleSearch("")}>
                  Clear
                </Button>
              )}
            </div>

            {/* Error State */}
            {error && (
              <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
                Failed to load users. Please try again.
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}

            {/* Users Table */}
            {!loading && data && (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="data-[state=open]:bg-accent -ml-3 h-8"
                            onClick={() => toggleSort("email")}
                          >
                            Email
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="data-[state=open]:bg-accent -ml-3 h-8"
                            onClick={() => toggleSort("createdAt")}
                          >
                            Created At
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            {search ? "No users found matching your search." : "No users yet."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">Active</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                      Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of{" "}
                      {data.total} users
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">
                          Page {page + 1} of {totalPages}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages - 1}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
