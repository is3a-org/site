import { isUniqueConstraintError } from "@fragno-dev/db";

/** Retry only the concurrent subscription-ID insert race, with a fresh service transaction. */
export async function runSubscriptionSync(sync: () => Promise<void>): Promise<void> {
  try {
    await sync();
  } catch (error) {
    if (
      !isUniqueConstraintError(error) ||
      error.table !== "subscription" ||
      error.constraint !== "subscription_id_unique"
    ) {
      throw error;
    }
    // The competing transaction committed the row. Re-read rather than hiding the error.
    await sync();
  }
}
