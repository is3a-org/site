import {
  createFragmentDurableObjectHost,
  type FragmentDurableObjectHost,
} from "@fragno-dev/db/dispatchers/cloudflare-do/fragment-durable-object";
import { DurableObject } from "cloudflare:workers";

import { getDurableHooksService } from "@fragno-dev/db";
import type { LinkCustomerResult, StripeCustomerLink, Subscription } from "@fragno-dev/stripe";

import { createDrizzleDatabase, createPostgresPool } from "~/db/postgres/is3a-postgres";
import { UserRepo } from "~/db/repo/user";
import {
  summarizeImport,
  BULK_IMPORT_BATCH_SIZE,
  type BulkImportJob,
  type CustomerLink,
  type CustomerSyncState,
  type ImportCustomer,
  type ImportUser,
} from "~/lib/bulk-import";
import { BulkImportProcessor } from "~/lib/bulk-import.server";
import { createStripeClient } from "~/lib/stripe.server";

import { createFormsServer } from "./forms-server";
import { createSimpleAuthServer } from "./simple-auth-server";
import { createStripeServer } from "./stripe-server";
import { runSubscriptionSync } from "./stripe-subscription-sync";

interface SyncProof {
  readonly referenceId: string;
  readonly completedAt: string;
}

interface StripeFragmentRuntime {
  userRepo: UserRepo;
  stripe: ReturnType<typeof createStripeServer>;
  auth: ReturnType<typeof createSimpleAuthServer>;
  forms: ReturnType<typeof createFormsServer>;
}

function createRuntime(): StripeFragmentRuntime {
  const pool = createPostgresPool();
  return {
    userRepo: new UserRepo(createDrizzleDatabase(pool)),
    stripe: createStripeServer(pool),
    // Auth and forms queue durable hooks on every sign-in and submission. The app registers no
    // callbacks for them, but this dispatcher drains them so they do not pile up as pending.
    auth: createSimpleAuthServer(pool),
    forms: createFormsServer(pool),
  };
}

/**
 * Hosts the Stripe fragment and the durable hook dispatcher that processes its webhook events.
 *
 * The dispatcher is only notified of new hooks by fragments hosted here, so every Stripe route and
 * every Stripe service call that writes must go through this object. Use `getStripeFragment()`.
 */
export class StripeFragmentDurableObject extends DurableObject<CloudflareEnv> {
  readonly #host: FragmentDurableObjectHost<void, StripeFragmentRuntime>;
  #runtime!: StripeFragmentRuntime;
  readonly #imports: BulkImportProcessor;

  public constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env);

    this.#host = createFragmentDurableObjectHost({
      name: "stripe",
      state: ctx,
      env,
      createRuntime,
      // Drizzle owns the schema, see app/db/postgres/migrations
      getMigrationFragments: () => [],
      getHookFragments: (runtime) => [runtime.stripe, runtime.auth, runtime.forms],
      hostRuntime: (runtime, { hostFragment }) => ({
        ...runtime,
        stripe: hostFragment(runtime.stripe),
      }),
      mounts: [
        { id: "stripe", target: (runtime): StripeFragmentRuntime["stripe"] => runtime.stripe },
      ],
    });

    this.#imports = new BulkImportProcessor({
      readJob: async (id): Promise<BulkImportJob | undefined> =>
        ctx.storage.get<BulkImportJob>(`bulk-import:${id}`),
      writeJob: async (job): Promise<void> => ctx.storage.put(`bulk-import:${job.id}`, job),
      readLatest: async (ownerId): Promise<string | undefined> =>
        ctx.storage.get<string>(`bulk-import-latest:${ownerId}`),
      writeLatest: async (ownerId, id): Promise<void> =>
        ctx.storage.put(`bulk-import-latest:${ownerId}`, id),
      retrieveCustomer: async (id): Promise<ImportCustomer> => {
        const customer = await createStripeClient().customers.retrieve(id);
        if (customer.deleted) {
          throw new Error(`Stripe customer ${id} has been deleted`);
        }
        return customer;
      },
      findByCustomerId: async (id): Promise<ImportUser | null> =>
        this.#runtime.userRepo.getUserByStripeCustomerId(id),
      findByEmail: async (email): Promise<ImportUser | null> =>
        this.#runtime.userRepo.getUserByEmail(email),
      createAccount: async (email): Promise<string> => {
        const response = await this.#runtime.auth.callRoute("POST", "/sign-up", {
          body: { email, password: crypto.randomUUID() },
        });
        if (response.type !== "json") {
          throw new Error(
            response.type === "error" ? response.error.message : "Account creation failed",
          );
        }
        return response.data.userId;
      },
      linkCustomer: async (customerId, referenceId): Promise<void> => {
        const linkError = await linkStripeCustomer(this, this.#runtime.userRepo, {
          customerId,
          referenceId,
        });
        if (linkError !== null) {
          throw new Error(linkError);
        }
      },
      readSyncStates: async (links): Promise<CustomerSyncState[]> =>
        this.getCustomerSyncStates(links),
      retrySync: async (customerId, referenceId): Promise<CustomerSyncState> =>
        this.requestCustomerSync({ customerId, referenceId }),
    });

    void ctx.blockConcurrencyWhile(async () => {
      this.#runtime = await this.#host.initialize();
      await this.#linkStripeCustomers();
    });
  }

  public override async fetch(request: Request): Promise<Response> {
    return this.#host.fetch(this.#runtime, request);
  }

  public override async alarm(): Promise<void> {
    await this.#host.alarm();
  }

  public async getSubscriptionsByReferenceId(referenceId: string): Promise<Subscription[]> {
    const { stripe } = this.#runtime;
    return stripe.callServices(() => stripe.services.getSubscriptionsByReferenceId(referenceId));
  }

  public async syncSubscriptions(referenceId: string): Promise<void> {
    const { stripe } = this.#runtime;
    await runSubscriptionSync(async () => {
      await stripe.callServices(() => stripe.services.syncSubscriptions(referenceId));
    });
    const user = await this.#runtime.userRepo.getUserById(referenceId);
    if (
      user?.stripeCustomerId !== undefined &&
      user.stripeCustomerId !== null &&
      user.stripeCustomerId !== ""
    ) {
      await this.ctx.storage.put(`stripe-sync:${user.stripeCustomerId}`, {
        referenceId,
        completedAt: new Date().toISOString(),
      } satisfies SyncProof);
    }
  }

  public async startImport(
    ownerId: string,
    customerIds: readonly string[],
  ): Promise<BulkImportJob> {
    return this.#imports.start(ownerId, customerIds);
  }

  public async getImport(ownerId: string, id?: string): Promise<BulkImportJob | undefined> {
    return id === undefined ? this.#imports.latest(ownerId) : this.#imports.read(ownerId, id);
  }

  public async advanceImport(
    ownerId: string,
    id: string,
    intent: "process" | "retry" | "status",
  ): Promise<BulkImportJob> {
    const started = performance.now();
    if (intent !== "status") {
      console.info("[Stripe import] Batch started", {
        importId: id,
        intent,
        batchLimit: BULK_IMPORT_BATCH_SIZE,
      });
    }
    try {
      const job = await this.#imports.advance(ownerId, id, intent);
      if (intent !== "status") {
        console.info("[Stripe import] Batch completed", {
          importId: id,
          intent,
          durationMs: Math.round(performance.now() - started),
          ...summarizeImport(job),
        });
      }
      return job;
    } catch (error) {
      console.error("[Stripe import] Request failed", {
        importId: id,
        intent,
        durationMs: Math.round(performance.now() - started),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  public async getCustomerSyncStates(links: readonly CustomerLink[]): Promise<CustomerSyncState[]> {
    const states = await this.#runtime.userRepo.getStripeSyncStates(links);
    if (links.length === 0) {
      return states;
    }
    const proofs = new Map<string, SyncProof>();
    // Storage multi-get accepts at most 128 keys; keep this bounded for large member lists.
    for (let offset = 0; offset < links.length; offset += 128) {
      const keys = links
        .slice(offset, offset + 128)
        .map((link) => `stripe-sync:${link.customerId}`);
      const batch = await this.ctx.storage.get<SyncProof>(keys);
      for (const [key, proof] of batch) {
        proofs.set(key, proof);
      }
    }
    for (const [index, state] of states.entries()) {
      const referenceId = links[index].referenceId;
      const key = `stripe-sync:${state.customerId}`;
      if (state.status === "synced" && proofs.get(key)?.referenceId !== referenceId) {
        await this.ctx.storage.put(key, {
          referenceId,
          completedAt: new Date().toISOString(),
        } satisfies SyncProof);
      } else if (state.status === "unverified" && state.linked === true) {
        const proof = proofs.get(key);
        if (proof?.referenceId === referenceId) {
          states[index] = { ...state, status: "synced" };
        }
      }
    }
    return states;
  }

  /** Retries a failed hook or re-syncs from Stripe, but never races an active hook. */
  public async requestCustomerSync(link: Readonly<CustomerLink>): Promise<CustomerSyncState> {
    const [state] = await this.getCustomerSyncStates([link]);
    if (state.status === "pending") {
      return state;
    }
    if (state.status === "error" && state.hookId !== undefined) {
      const { stripe } = this.#runtime;
      const { hookService, namespace } = getDurableHooksService(stripe);
      await stripe.callServices(() => hookService.retryFailedHook(namespace, state.hookId ?? ""));
      // Retrying an existing hook does not enqueue a new one; wake its existing dispatcher.
      await this.ctx.storage.setAlarm(Date.now());
      return { customerId: link.customerId, status: "pending" };
    }
    // A completed sync can be stale, older links may predate the durable hook, or its completed
    // history may have expired: sync directly.
    if (state.linked === false) {
      throw new Error("Customer is not linked to this account in the Stripe fragment");
    }
    await this.syncSubscriptions(link.referenceId);
    return { customerId: link.customerId, status: "synced" };
  }

  public async linkCustomer(link: Readonly<StripeCustomerLink>): Promise<LinkCustomerResult> {
    const { stripe } = this.#runtime;
    return stripe.callServices(() => stripe.services.linkCustomer(link));
  }

  /**
   * Links customers recorded in `user_stripe` that the Stripe fragment does not know about, such as
   * those linked before the fragment kept its own links. Linking syncs their subscriptions.
   */
  async #linkStripeCustomers(): Promise<void> {
    try {
      const unlinked = await this.#runtime.userRepo.getUsersWithUnlinkedStripeCustomer();
      for (const { userId, stripeCustomerId } of unlinked) {
        if (stripeCustomerId === null || stripeCustomerId === "") {
          continue;
        }
        const result = await this.linkCustomer({
          customerId: stripeCustomerId,
          referenceId: userId,
        });
        if (!result.ok) {
          console.warn(
            `Could not link Stripe customer ${stripeCustomerId} to user ${userId}: ${result.code}`,
          );
        }
      }
    } catch (error) {
      console.error("Linking Stripe customers failed", error);
    }
  }
}

export function getStripeFragment(
  env: CloudflareEnv,
): DurableObjectStub<StripeFragmentDurableObject> {
  return env.STRIPE_FRAGMENT.getByName("stripe");
}

/**
 * Links a user to an existing Stripe customer. The fragment's durable hook owns subscription sync.
 * Returns an error message when either side is already linked elsewhere.
 */
export async function linkStripeCustomer(
  stripe: Pick<StripeFragmentDurableObject, "linkCustomer">,
  userRepo: UserRepo,
  link: Readonly<StripeCustomerLink>,
): Promise<string | null> {
  const result = await stripe.linkCustomer(link);
  if (!result.ok) {
    return result.code === "REFERENCE_ALREADY_LINKED"
      ? `User ${link.referenceId} is already linked to another Stripe customer`
      : `Stripe customer ${link.customerId} is already linked to another user`;
  }

  // The fragment's onCustomerLinked hook records this too, but only once the hook has run
  await userRepo.setStripeCustomerId(link.referenceId, link.customerId);
  // Do not start another sync here: linkCustomer already queued the durable sync hook.
  // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: linkStripeCustomer returns a nullable error string; null means linking succeeded and sync is delegated to the durable hook.
  return null;
}
