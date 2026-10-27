import {
  BULK_IMPORT_BATCH_SIZE,
  bulkImportSelectionSchema,
  type BulkImportJob,
  type CustomerSyncState,
  type CustomerLink,
  type ImportCustomer,
  type ImportItem,
  type ImportUser,
} from "./bulk-import";
import { validateStripeCustomer } from "./bulk-import-helpers";

/** Capabilities keep the resumable workflow testable without Stripe, auth or Cloudflare mocks. */
export interface BulkImportDependencies {
  readonly readJob: (id: string) => Promise<BulkImportJob | undefined>;
  readonly writeJob: (job: BulkImportJob) => Promise<void>;
  readonly readLatest: (ownerId: string) => Promise<string | undefined>;
  readonly writeLatest: (ownerId: string, id: string) => Promise<void>;
  readonly retrieveCustomer: (id: string) => Promise<ImportCustomer>;
  readonly findByCustomerId: (id: string) => Promise<ImportUser | null>;
  readonly findByEmail: (email: string) => Promise<ImportUser | null>;
  readonly createAccount: (email: string) => Promise<string>;
  readonly linkCustomer: (customerId: string, userId: string) => Promise<void>;
  readonly readSyncStates: (
    links: readonly CustomerLink[],
  ) => Promise<readonly CustomerSyncState[]>;
  readonly retrySync: (customerId: string, userId: string) => Promise<CustomerSyncState>;
}

export class BulkImportProcessor {
  readonly #deps: BulkImportDependencies;
  readonly #inFlight = new Map<string, Promise<BulkImportJob>>();

  public constructor(deps: BulkImportDependencies) {
    this.#deps = deps;
  }

  public async start(ownerId: string, selection: readonly string[]): Promise<BulkImportJob> {
    const customerIds = bulkImportSelectionSchema.parse(selection);
    const now = new Date().toISOString();
    const job: BulkImportJob = {
      id: crypto.randomUUID(),
      ownerId,
      createdAt: now,
      updatedAt: now,
      items: customerIds.map((customerId) => ({
        customerId,
        status: "queued",
        accountCreated: false,
        linked: false,
      })),
    };
    await this.#deps.writeJob(job);
    await this.#deps.writeLatest(ownerId, job.id);
    return job;
  }

  public async latest(ownerId: string): Promise<BulkImportJob | undefined> {
    const id = await this.#deps.readLatest(ownerId);
    return id === undefined ? undefined : this.read(ownerId, id);
  }

  public async read(ownerId: string, id: string): Promise<BulkImportJob> {
    const job = await this.#deps.readJob(id);
    if (!job || job.ownerId !== ownerId) {
      throw new Error("Import not found");
    }
    return job;
  }

  /** One writer per job, including refreshes, prevents a poll overwriting a newer checkpoint. */
  public async advance(
    ownerId: string,
    id: string,
    intent: "process" | "retry" | "status",
  ): Promise<BulkImportJob> {
    await this.read(ownerId, id);
    const active = this.#inFlight.get(id);
    if (active) {
      return active;
    }
    const work = this.#advance(ownerId, id, intent);
    this.#inFlight.set(id, work);
    try {
      return await work;
    } finally {
      this.#inFlight.delete(id);
    }
  }

  async #advance(
    ownerId: string,
    id: string,
    intent: "process" | "retry" | "status",
  ): Promise<BulkImportJob> {
    let job = await this.read(ownerId, id);
    const save = async (item: ImportItem): Promise<void> => {
      job = {
        ...job,
        updatedAt: new Date().toISOString(),
        items: job.items.map((previous) =>
          previous.customerId === item.customerId ? item : previous,
        ),
      };
      await this.#deps.writeJob(job);
    };
    // Observe durable hooks, including completed syncs which found zero subscriptions.
    const pendingLinks = job.items.flatMap((item) =>
      item.status === "sync_pending" && item.userId !== undefined
        ? [{ customerId: item.customerId, referenceId: item.userId }]
        : [],
    );
    const syncStates = await this.#deps.readSyncStates(pendingLinks);
    for (const item of job.items) {
      if (item.status === "sync_pending") {
        const state = syncStates.find((sync) => sync.customerId === item.customerId);
        if (state) {
          await save(this.#withSyncState(item, state));
        }
      }
    }
    if (intent === "status") {
      return job;
    }
    // A conflict needs a reviewed new import. Re-queuing errors behind it would strand them.
    if (intent === "retry" && !job.items.some((item) => item.status === "conflict")) {
      for (const item of job.items) {
        if (item.status === "error") {
          await save({ ...item, status: "queued", error: undefined });
        }
      }
    }
    // Preserve stop-on-error while making completed and remaining work recoverable.
    if (job.items.some((item) => item.status === "error" || item.status === "conflict")) {
      return job;
    }
    const batch = job.items
      .filter((item) => item.status === "queued" || item.status === "processing")
      .slice(0, BULK_IMPORT_BATCH_SIZE);
    for (const item of batch) {
      await this.#importCustomer(item, save);
      if (job.items.some((result) => result.status === "error" || result.status === "conflict")) {
        break;
      }
    }
    return job;
  }

  #withSyncState(item: ImportItem, state: CustomerSyncState): ImportItem {
    let status: ImportItem["status"] = "sync_pending";
    if (state.status === "synced") {
      status = "synced";
    } else if (state.status === "error" || state.status === "unverified") {
      status = "error";
    }
    const error =
      state.status === "unverified"
        ? "Sync confirmation unavailable; retry verification"
        : state.error;
    return { ...item, status, error };
  }

  async #importCustomer(
    original: ImportItem,
    save: (item: ImportItem) => Promise<void>,
  ): Promise<void> {
    let item: ImportItem = { ...original, status: "processing", error: undefined };
    await save(item);
    try {
      const customer = await this.#deps.retrieveCustomer(item.customerId);
      let user = await this.#deps.findByCustomerId(customer.id);
      const email = (customer.email ?? "").trim().toLowerCase();
      if (!user && email) {
        user = await this.#deps.findByEmail(email);
      }
      if (
        user?.stripeCustomerId !== undefined &&
        user.stripeCustomerId !== null &&
        user.stripeCustomerId !== "" &&
        user.stripeCustomerId !== customer.id
      ) {
        await save({
          ...item,
          status: "conflict",
          userId: user.id,
          error: `Account already linked to Stripe customer ${user.stripeCustomerId}`,
        });
        return;
      }
      let userId = user?.id;
      if (userId === undefined || userId === "") {
        const validation = validateStripeCustomer(customer);
        if (!validation.valid || !email) {
          throw new Error(validation.error ?? "Customer has no email address");
        }
        try {
          userId = await this.#deps.createAccount(email);
          item = { ...item, accountCreated: true };
        } catch (error) {
          // Another request may have created the same normalized email meanwhile.
          user = await this.#deps.findByEmail(email);
          if (!user) {
            throw error;
          }
          if (
            user.stripeCustomerId !== null &&
            user.stripeCustomerId !== "" &&
            user.stripeCustomerId !== customer.id
          ) {
            await save({
              ...item,
              status: "conflict",
              userId: user.id,
              error: "Account was linked to another customer during import",
            });
            return;
          }
          userId = user.id;
        }
      }
      item = { ...item, userId };
      // Save account creation before linking: a later failure must not erase that outcome.
      await save(item);
      await this.#deps.linkCustomer(customer.id, userId);
      item = { ...item, linked: true, status: "sync_pending" };
      await save(item);
      const states = await this.#deps.readSyncStates([
        { customerId: customer.id, referenceId: userId },
      ]);
      let state = states[0];
      if (state.status === "error" || state.status === "unverified") {
        // Never start a second sync when the link's durable hook is pending or processing.
        state = await this.#deps.retrySync(customer.id, userId);
      }
      await save(this.#withSyncState(item, state));
    } catch (error) {
      await save({
        ...item,
        status: "error",
        error: error instanceof Error ? error.message : "Import failed",
      });
    }
  }
}
