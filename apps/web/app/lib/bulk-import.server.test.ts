import { assert, describe, expect, it, vi } from "vite-plus/test";
import { ZodError } from "zod";

import {
  BULK_IMPORT_BATCH_SIZE,
  summarizeImport,
  type BulkImportJob,
  type CustomerSyncState,
  type ImportCustomer,
  type ImportUser,
} from "./bulk-import";
import { BulkImportProcessor, type BulkImportDependencies } from "./bulk-import.server";

interface ImportHarness {
  readonly jobs: Map<string, BulkImportJob>;
  readonly users: Map<string, ImportUser>;
  readonly customers: Map<string, ImportCustomer>;
  readonly syncStates: Map<string, CustomerSyncState>;
  readonly deps: BulkImportDependencies;
  readonly addCustomers: (count: number) => string[];
  readonly processor: BulkImportProcessor;
}

function createHarness(): ImportHarness {
  const jobs = new Map<string, BulkImportJob>();
  const latest = new Map<string, string>();
  const customers = new Map<string, ImportCustomer>();
  const users = new Map<string, ImportUser>();
  const syncStates = new Map<string, CustomerSyncState>();
  const deps: BulkImportDependencies = {
    readJob: async (id) => {
      await Promise.resolve();
      return structuredClone(jobs.get(id));
    },
    writeJob: async (job) => {
      await Promise.resolve();
      jobs.set(job.id, structuredClone(job));
    },
    readLatest: async (owner) => {
      await Promise.resolve();
      return latest.get(owner);
    },
    writeLatest: async (owner, id) => {
      await Promise.resolve();
      latest.set(owner, id);
    },
    retrieveCustomer: async (id) => {
      await Promise.resolve();
      const customer = customers.get(id);
      if (!customer) {
        throw new Error("Customer deleted");
      }
      return customer;
    },
    findByCustomerId: async (id) => {
      await Promise.resolve();
      const user = [...users.values()].find((candidate) => candidate.stripeCustomerId === id);
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Repository capability lookups return null for no account.
      return user ?? null;
    },
    findByEmail: async (email) => {
      await Promise.resolve();
      const user = [...users.values()].find((candidate) => candidate.email === email);
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Repository capability lookups return null for no account.
      return user ?? null;
    },
    createAccount: vi.fn<BulkImportDependencies["createAccount"]>(
      async (email: string): Promise<string> => {
        await Promise.resolve();
        if ([...users.values()].some((user) => user.email === email)) {
          throw new Error("Email already exists");
        }
        const id = crypto.randomUUID();
        // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: A newly created account has no Stripe link.
        users.set(id, { id, email, stripeCustomerId: null });
        return id;
      },
    ),
    linkCustomer: vi.fn<BulkImportDependencies["linkCustomer"]>(
      async (customerId: string, userId: string): Promise<void> => {
        await Promise.resolve();
        const user = users.get(userId);
        if (!user) {
          throw new Error("Account missing");
        }
        if (user.stripeCustomerId !== null && user.stripeCustomerId !== customerId) {
          throw new Error("Conflicting link");
        }
        users.set(userId, { ...user, stripeCustomerId: customerId });
        if (!syncStates.has(customerId)) {
          syncStates.set(customerId, { customerId, status: "pending" });
        }
      },
    ),
    readSyncStates: async (links) => {
      await Promise.resolve();
      return links.map(
        ({ customerId }) =>
          syncStates.get(customerId) ??
          ({ customerId, status: "unverified" } satisfies CustomerSyncState),
      );
    },
    retrySync: vi.fn<BulkImportDependencies["retrySync"]>(
      async (customerId: string): Promise<CustomerSyncState> => {
        await Promise.resolve();
        const state: CustomerSyncState = { customerId, status: "pending" };
        syncStates.set(customerId, state);
        return state;
      },
    ),
  };
  const addCustomers = (count: number): string[] =>
    Array.from({ length: count }, (_, index) => {
      const id = `cus_${index}`;
      customers.set(id, { id, email: `member${index}@example.com`, created: 1 });
      return id;
    });
  return {
    jobs,
    users,
    customers,
    syncStates,
    deps,
    addCustomers,
    processor: new BulkImportProcessor(deps),
  };
}

describe("Resumable Stripe imports", () => {
  it("bounds each request, checkpoints progress, and never races a pending sync", async () => {
    const h = createHarness();
    const selection = h.addCustomers(8);
    const job = await h.processor.start("admin", selection);
    const processed = await h.processor.advance("admin", job.id, "process");
    expect(summarizeImport(processed)).toMatchObject({
      created: BULK_IMPORT_BATCH_SIZE,
      linked: 3,
      pending: 3,
      remaining: 5,
      synced: 0,
      complete: false,
    });
    expect(h.deps.retrySync).not.toHaveBeenCalled();
    expect(h.jobs.get(job.id)).toEqual(processed);
    expect(await h.processor.latest("admin")).toEqual(processed);
  });

  it("resumes saved work after a lost response or a new processor instance", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(5));
    await h.processor.advance("admin", job.id, "process");
    const resumed = new BulkImportProcessor(h.deps);
    const result = await resumed.advance("admin", job.id, "process");
    expect(h.users.size).toBe(5);
    expect(h.deps.createAccount).toHaveBeenCalledTimes(5);
    expect(summarizeImport(result)).toMatchObject({ created: 5, pending: 5, remaining: 0 });
  });

  it("retains account creation on a link failure and retries without creating another account", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(1));
    const link = vi
      .spyOn(h.deps, "linkCustomer")
      .mockRejectedValueOnce(new Error("Temporary link outage"));
    const failed = await h.processor.advance("admin", job.id, "process");
    expect(failed.items[0]).toMatchObject({ status: "error", accountCreated: true, linked: false });
    const retried = await h.processor.advance("admin", job.id, "retry");
    expect(retried.items[0]).toMatchObject({
      status: "sync_pending",
      accountCreated: true,
      linked: true,
    });
    expect(h.deps.createAccount).toHaveBeenCalledTimes(1);
    expect(link).toHaveBeenCalledTimes(2);
  });

  it("recovers a persisted processing item by looking up its already-created account", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(1));
    // Simulate termination after auth committed but before its checkpoint reached storage.
    h.users.set("existing", {
      id: "existing",
      email: "member0@example.com",
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: The interrupted account has not yet been linked.
      stripeCustomerId: null,
    });
    h.jobs.set(job.id, { ...job, items: [{ ...job.items[0], status: "processing" }] });
    const resumed = await new BulkImportProcessor(h.deps).advance("admin", job.id, "process");
    expect(resumed.items[0]).toMatchObject({ userId: "existing", linked: true });
    expect(h.deps.createAccount).not.toHaveBeenCalled();
  });

  it("stops on an independent failure without discarding successful or remaining customers", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(3));
    h.customers.delete("cus_1");
    const result = await h.processor.advance("admin", job.id, "process");
    expect(result.items.map((item) => item.status)).toEqual(["sync_pending", "error", "queued"]);
    expect(h.users.size).toBe(1);
  });

  it("does not confuse a linked account or failed hook with a completed sync", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(1));
    await h.processor.advance("admin", job.id, "process");
    h.syncStates.set("cus_0", {
      customerId: "cus_0",
      status: "error",
      error: "Stripe unavailable",
    });
    const failed = await h.processor.advance("admin", job.id, "status");
    expect(summarizeImport(failed)).toMatchObject({ created: 1, linked: 1, synced: 0, errors: 1 });
    await h.processor.advance("admin", job.id, "retry");
    expect(h.deps.retrySync).toHaveBeenCalledTimes(1);
    expect(h.deps.createAccount).toHaveBeenCalledTimes(1);
    // Completion is confirmed by the hook even when no subscription rows exist.
    h.syncStates.set("cus_0", { customerId: "cus_0", status: "synced" });
    const completed = await h.processor.advance("admin", job.id, "status");
    expect(summarizeImport(completed)).toMatchObject({ complete: true, synced: 1, pending: 0 });
  });

  it("rechecks conflicts and never overwrites a different customer's link", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(1));
    h.users.set("member", {
      id: "member",
      email: "member0@example.com",
      stripeCustomerId: "cus_other",
    });
    const result = await h.processor.advance("admin", job.id, "process");
    expect(result.items[0].status).toBe("conflict");
    expect(h.deps.createAccount).not.toHaveBeenCalled();
    expect(h.deps.linkCustomer).not.toHaveBeenCalled();
  });

  it("keeps errors visible instead of stranding them as queued behind a conflict", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(3));
    h.users.set("member", {
      id: "member",
      email: "member1@example.com",
      stripeCustomerId: "cus_other",
    });
    await h.processor.advance("admin", job.id, "process");
    h.syncStates.set("cus_0", { customerId: "cus_0", status: "error", error: "Stripe down" });
    const result = await h.processor.advance("admin", job.id, "retry");
    expect(result.items.map((item) => item.status)).toEqual(["error", "conflict", "queued"]);
    expect(h.deps.retrySync).not.toHaveBeenCalled();
  });

  it("matches by customer ID even when the login and Stripe email differ", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(1));
    h.users.set("member", {
      id: "member",
      email: "different@example.com",
      stripeCustomerId: "cus_0",
    });
    h.syncStates.set("cus_0", { customerId: "cus_0", status: "synced" });
    const result = await h.processor.advance("admin", job.id, "process");
    expect(result.items[0]).toMatchObject({
      userId: "member",
      status: "synced",
      accountCreated: false,
    });
    expect(h.deps.createAccount).not.toHaveBeenCalled();
  });

  it("normalizes email before signup and recovers a concurrent signup", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(1));
    h.customers.set("cus_0", { id: "cus_0", email: " Member0@Example.COM ", created: 1 });
    vi.spyOn(h.deps, "createAccount").mockImplementationOnce(async (email): Promise<string> => {
      await Promise.resolve();
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Another request created an unlinked account.
      h.users.set("concurrent", { id: "concurrent", email, stripeCustomerId: null });
      throw new Error("Email already exists");
    });
    const result = await h.processor.advance("admin", job.id, "process");
    expect(result.items[0]).toMatchObject({ userId: "concurrent", linked: true });
    expect(h.users.get("concurrent")?.email).toBe("member0@example.com");
  });

  it("coalesces overlapping process and status requests instead of duplicating work", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(1));
    const results = await Promise.all([
      h.processor.advance("admin", job.id, "process"),
      h.processor.advance("admin", job.id, "process"),
      h.processor.advance("admin", job.id, "status"),
    ]);
    expect(h.deps.createAccount).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });

  it("makes a vanished sync confirmation recoverable instead of polling forever", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(1));
    await h.processor.advance("admin", job.id, "process");
    h.syncStates.delete("cus_0");
    const result = await h.processor.advance("admin", job.id, "status");
    expect(result.items[0]).toMatchObject({
      status: "error",
      error: "Sync confirmation unavailable; retry verification",
      linked: true,
    });
  });

  it("does not expose another administrator's import or accept invalid selections", async () => {
    const h = createHarness();
    const job = await h.processor.start("admin", h.addCustomers(1));
    await expect(h.processor.read("other-admin", job.id)).rejects.toThrow("Import not found");
    await expect(h.processor.advance("other-admin", job.id, "process")).rejects.toThrow(
      "Import not found",
    );
    await expect(h.processor.start("admin", [])).rejects.toThrow(ZodError);
    await expect(
      h.processor.start(
        "admin",
        Array.from({ length: 51 }, (_, index) => `cus_${index}`),
      ),
    ).rejects.toThrow(ZodError);
    expect(h.deps.createAccount).not.toHaveBeenCalled();
    assert(await h.processor.latest("admin"));
  });
});
