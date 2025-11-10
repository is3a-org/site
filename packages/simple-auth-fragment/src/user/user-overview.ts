import { defineRoute, defineRoutes } from "@fragno-dev/core";
import type { AbstractQuery } from "@fragno-dev/db/query";
import { authSchema } from "../schema";
import { z } from "zod";

export function createUserOverviewServices(db: AbstractQuery<typeof authSchema>) {
  return {
    getUsers: async (params: {
      search?: string;
      sortBy: "email" | "createdAt";
      sortOrder: "asc" | "desc";
      limit: number;
      offset: number;
    }) => {
      const { search, sortBy, sortOrder, limit, offset } = params;

      // When sorting by email, we can use the database index for efficient sorting
      if (sortBy === "email") {
        let allUsers;

        if (search) {
          // Use email index for search with database-level sorting
          allUsers = await db.find("user", (b) =>
            b
              .whereIndex("idx_user_email", (eb) => eb("email", "contains", search))
              .orderByIndex("idx_user_email", sortOrder),
          );
        } else {
          // Fetch all users with email-based sorting at database level
          // Note: We use a query that matches all records via the email index
          allUsers = await db.find("user", (b) =>
            b
              .whereIndex("idx_user_email", (eb) => eb("email", "!=", ""))
              .orderByIndex("idx_user_email", sortOrder),
          );
        }

        // Apply offset-based pagination in memory
        const paginatedUsers = allUsers.slice(offset, offset + limit);

        return {
          users: paginatedUsers.map((user) => ({
            id: user.id.valueOf(),
            email: user.email,
            createdAt: user.createdAt,
          })),
          total: allUsers.length,
        };
      }

      // For createdAt sorting, we need to fetch all and sort in memory (no index on createdAt)
      let users;
      if (search) {
        users = await db.find("user", (b) =>
          b.whereIndex("idx_user_email", (eb) => eb("email", "contains", search)),
        );
      } else {
        // Use email index to get all users (more efficient than primary with != filter)
        users = await db.find("user", (b) =>
          b.whereIndex("idx_user_email", (eb) => eb("email", "!=", "")),
        );
      }

      // Sort by createdAt in memory
      users = users.sort((a, b) => {
        const aTime = a.createdAt.getTime();
        const bTime = b.createdAt.getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      });

      // Apply pagination in memory
      const paginatedUsers = users.slice(offset, offset + limit);

      return {
        users: paginatedUsers.map((user) => ({
          id: user.id.valueOf(),
          email: user.email,
          createdAt: user.createdAt,
        })),
        total: users.length,
      };
    },
  };
}

export const userOverviewRoutesFactory = defineRoutes<
  {},
  {},
  ReturnType<typeof createUserOverviewServices>
>().create(({ services }) => {
  return [
    defineRoute({
      method: "GET",
      path: "/users",
      queryParameters: ["search", "sortBy", "sortOrder", "limit", "offset"],
      outputSchema: z.object({
        users: z.array(
          z.object({
            id: z.string(),
            email: z.string(),
            createdAt: z.string(),
          }),
        ),
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
      }),
      errorCodes: ["invalid_input"],
      handler: async ({ query }, { json }) => {
        // Parse query parameters with defaults
        const search = query.get("search") || undefined;
        const sortBy = (query.get("sortBy") || "createdAt") as "email" | "createdAt";
        const sortOrder = (query.get("sortOrder") || "desc") as "asc" | "desc";
        const limit = Math.min(Math.max(Number(query.get("limit")) || 20, 1), 100);
        const offset = Math.max(Number(query.get("offset")) || 0, 0);

        // Get users from service
        const result = await services.getUsers({
          search,
          sortBy,
          sortOrder,
          limit,
          offset,
        });

        // Format response
        return json({
          users: result.users.map((user) => ({
            id: user.id,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
          })),
          total: result.total,
          limit,
          offset,
        });
      },
    }),
  ];
});
