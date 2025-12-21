import { useState } from "react";
import type { Route } from "./+types/users";
import { BreadcrumbItem, BreadcrumbPage } from "~/components/ui/breadcrumb";
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
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { simpleAuthClient } from "~/lib/simple-auth-client";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Role } from "@is3a/simple-auth-fragment";
import { formatDateTime } from "~/lib/date-utils";

export async function loader({ context: _context, request: _request }: Route.LoaderArgs) {
  return {};
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"email" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([]);
  const [refreshUser, setRefreshUser] = useState(0);
  const pageSize = 10;

  // Use the hooks from the simple-auth fragment
  const { data, loading, error } = simpleAuthClient.useUsers({
    query: {
      search: search || undefined,
      sortBy,
      sortOrder,
      pageSize: pageSize.toString(),
      cursor,
      refresh: refreshUser.toString(),
    },
  });

  const { mutate: updateRole, loading: updateRoleLoading } = simpleAuthClient.useUpdateUserRole();

  const handleRoleChange = async (userId: string, newRole: Role) => {
    await updateRole({
      path: { userId },
      body: { role: newRole },
    });
    setRefreshUser(refreshUser + 1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCursor(undefined); // Reset to first page on new search
    setCursorHistory([]); // Clear history
  };

  const toggleSort = (column: "email" | "createdAt") => {
    // When searching, only allow email sorting
    if (search && column === "createdAt") {
      return;
    }

    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCursor(undefined); // Reset to first page on sort change
    setCursorHistory([]); // Clear history
  };

  const handleNextPage = () => {
    if (data?.cursor) {
      setCursorHistory([...cursorHistory, cursor]);
      setCursor(data.cursor);
    }
  };

  const handlePreviousPage = () => {
    const newHistory = [...cursorHistory];
    const previousCursor = newHistory.pop();
    setCursorHistory(newHistory);
    setCursor(previousCursor);
  };

  const currentPage = cursorHistory.length + 1;
  const hasPreviousPage = cursorHistory.length > 0;
  const hasNextPage = data?.hasNextPage ?? false;

  return (
    <>
      <DashboardBreadcrumb>
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
              {loading ? "Loading..." : `Showing ${data?.users.length ?? 0} users`}
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
                            disabled={!!search}
                            title={
                              search
                                ? "Sorting by Created At is disabled when searching"
                                : undefined
                            }
                          >
                            Created At
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDateTime(user.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(newRole) =>
                                  handleRoleChange(user.id, newRole as Role)
                                }
                                disabled={updateRoleLoading}
                              >
                                <SelectTrigger className="h-8 w-[110px]">
                                  <SelectValue placeholder="Change role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {(hasPreviousPage || hasNextPage) && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                      Page {currentPage} • Showing {pageSize} users per page
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={!hasPreviousPage || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!hasNextPage || loading}
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
