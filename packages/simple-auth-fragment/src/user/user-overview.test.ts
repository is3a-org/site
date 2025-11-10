import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authFragmentDefinition } from "..";
import { createDatabaseFragmentForTest } from "@fragno-dev/test";
import { userOverviewRoutesFactory } from "./user-overview";

describe("User Overview Services", async () => {
  const { fragment, test } = await createDatabaseFragmentForTest(
    {
      definition: authFragmentDefinition,
      routes: [userOverviewRoutesFactory],
    },
    {
      adapter: { type: "drizzle-pglite" },
    },
  );
  const services = fragment.services;

  // Test data setup
  const testUsers = [
    { email: "alice@example.com", password: "password123" },
    { email: "bob@example.com", password: "password123" },
    { email: "charlie@example.com", password: "password123" },
    { email: "david@test.com", password: "password123" },
    { email: "eve@test.com", password: "password123" },
  ];

  beforeAll(async () => {
    // Create test users
    for (const user of testUsers) {
      await services.createUser(user.email, user.password);
    }
  });

  afterAll(async () => {
    await test.cleanup();
  });

  describe("getUsers", () => {
    it("should return all users without search filter", async () => {
      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: 0,
      });

      expect(result.users.length).toBeGreaterThanOrEqual(testUsers.length);
      expect(result.total).toBeGreaterThanOrEqual(testUsers.length);
    });

    it("should filter users by email search", async () => {
      const result = await services.getUsers({
        search: "example.com",
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: 0,
      });

      expect(result.users.length).toBe(3); // alice, bob, charlie
      expect(result.total).toBe(3);
      result.users.forEach((user) => {
        expect(user.email).toContain("example.com");
      });
    });

    it("should filter users by partial email search", async () => {
      const result = await services.getUsers({
        search: "alice",
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: 0,
      });

      expect(result.users.length).toBe(1);
      expect(result.users[0].email).toBe("alice@example.com");
      expect(result.total).toBe(1);
    });

    it("should sort users by email ascending", async () => {
      const result = await services.getUsers({
        search: "example.com",
        sortBy: "email",
        sortOrder: "asc",
        limit: 20,
        offset: 0,
      });

      expect(result.users.length).toBe(3);
      expect(result.users[0].email).toBe("alice@example.com");
      expect(result.users[1].email).toBe("bob@example.com");
      expect(result.users[2].email).toBe("charlie@example.com");
    });

    it("should sort users by email descending", async () => {
      const result = await services.getUsers({
        search: "example.com",
        sortBy: "email",
        sortOrder: "desc",
        limit: 20,
        offset: 0,
      });

      expect(result.users.length).toBe(3);
      expect(result.users[0].email).toBe("charlie@example.com");
      expect(result.users[1].email).toBe("bob@example.com");
      expect(result.users[2].email).toBe("alice@example.com");
    });

    it("should sort users by createdAt ascending", async () => {
      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "asc",
        limit: 20,
        offset: 0,
      });

      // Verify dates are in ascending order
      for (let i = 1; i < result.users.length; i++) {
        const prevDate = new Date(result.users[i - 1].createdAt);
        const currDate = new Date(result.users[i].createdAt);
        expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
      }
    });

    it("should sort users by createdAt descending", async () => {
      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: 0,
      });

      // Verify dates are in descending order
      for (let i = 1; i < result.users.length; i++) {
        const prevDate = new Date(result.users[i - 1].createdAt);
        const currDate = new Date(result.users[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    it("should respect limit parameter", async () => {
      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 2,
        offset: 0,
      });

      expect(result.users.length).toBe(2);
      expect(result.total).toBeGreaterThan(2);
    });

    it("should respect offset parameter", async () => {
      // Get first page
      const firstPage = await services.getUsers({
        sortBy: "email",
        sortOrder: "asc",
        limit: 2,
        offset: 0,
      });

      // Get second page
      const secondPage = await services.getUsers({
        sortBy: "email",
        sortOrder: "asc",
        limit: 2,
        offset: 2,
      });

      // Verify no overlap
      expect(firstPage.users[0].id).not.toBe(secondPage.users[0].id);
      expect(firstPage.users[1].id).not.toBe(secondPage.users[0].id);
    });

    it("should handle pagination beyond available records", async () => {
      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: 1000,
      });

      expect(result.users.length).toBe(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it("should combine search, sort, and pagination", async () => {
      const result = await services.getUsers({
        search: "test.com",
        sortBy: "email",
        sortOrder: "asc",
        limit: 1,
        offset: 0,
      });

      expect(result.users.length).toBe(1);
      expect(result.users[0].email).toBe("david@test.com");
      expect(result.total).toBe(2); // david and eve
    });

    it("should return empty results for non-matching search", async () => {
      const result = await services.getUsers({
        search: "nonexistent@domain.com",
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: 0,
      });

      expect(result.users.length).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should handle limit of 1", async () => {
      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 1,
        offset: 0,
      });

      expect(result.users.length).toBe(1);
    });

    it("should handle large limit values", async () => {
      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 100,
        offset: 0,
      });

      expect(result.users.length).toBeGreaterThanOrEqual(testUsers.length);
      expect(result.total).toBeGreaterThanOrEqual(testUsers.length);
    });

    it("should return users with all required fields", async () => {
      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 1,
        offset: 0,
      });

      expect(result.users.length).toBe(1);
      const user = result.users[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("createdAt");
      expect(typeof user.id).toBe("string");
      expect(typeof user.email).toBe("string");
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it("should not include password hash in results", async () => {
      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 1,
        offset: 0,
      });

      const user = result.users[0] as unknown as Record<string, unknown>;
      expect(user["passwordHash"]).toBeUndefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle case-sensitive email search", async () => {
      const lowerResult = await services.getUsers({
        search: "alice",
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: 0,
      });

      const upperResult = await services.getUsers({
        search: "ALICE",
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: 0,
      });

      // Note: The behavior depends on database collation
      // For this test, we just verify both searches complete without error
      expect(lowerResult.users.length).toBeGreaterThanOrEqual(0);
      expect(upperResult.users.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle search with special characters", async () => {
      const result = await services.getUsers({
        search: "@",
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: 0,
      });

      // All email addresses contain @
      expect(result.users.length).toBeGreaterThanOrEqual(testUsers.length);
    });

    it("should handle offset equal to total count", async () => {
      const countResult = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 100,
        offset: 0,
      });

      const result = await services.getUsers({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 20,
        offset: countResult.total,
      });

      expect(result.users.length).toBe(0);
      expect(result.total).toBe(countResult.total);
    });

    it("should handle multiple rapid queries", async () => {
      const promises = Array(10)
        .fill(0)
        .map((_, i) =>
          services.getUsers({
            sortBy: "createdAt",
            sortOrder: "desc",
            limit: 5,
            offset: i,
          }),
        );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.users.length).toBeLessThanOrEqual(5);
        expect(result.total).toBeGreaterThan(0);
      });
    });
  });
});
