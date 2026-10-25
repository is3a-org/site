/** SQL parameters are scalar values or dates; query objects never accept arbitrary objects. */
export type SqlParameter = string | number | boolean | Date | null | undefined;

export interface Query {
  readonly sql: string;
  readonly params: readonly SqlParameter[];
}

/**
 * Replaces placeholders (?) in a SQL query with their corresponding parameter values
 * @param query - The query object containing SQL and parameters
 * @returns The SQL string with placeholders replaced by actual values
 */
export function replacePlaceholders(query: Query): string {
  const { sql, params } = query;
  let paramIndex = 0;

  return sql.replaceAll("?", () => {
    if (paramIndex >= params.length) {
      throw new Error(
        `Not enough parameters provided. Expected at least ${paramIndex + 1}, but got ${params.length}`,
      );
    }

    const value = params[paramIndex++];
    return formatSqlValue(value);
  });
}

/**
 * Formats a value for SQL insertion, handling proper quoting and escaping
 * @param value - The value to format
 * @returns The formatted SQL value
 */
function formatSqlValue(value: SqlParameter): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: SQL parameters are a closed scalar/date union; strings require SQL quote escaping.
  if (typeof value === "string") {
    // Escape single quotes by doubling them
    const escaped = value.replaceAll("'", "''");
    return `'${escaped}'`;
  }

  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: SQL parameters are a closed scalar/date union; numbers are emitted without quotes.
  if (typeof value === "number") {
    return value.toString();
  }

  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: SQL parameters are a closed scalar/date union; boolean parameters map to SQL integer literals.
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  return `'${value.toISOString()}'`;
}
