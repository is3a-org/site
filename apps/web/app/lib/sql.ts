export interface Query {
  sql: string;
  params: unknown[];
}

/**
 * Replaces placeholders (?) in a SQL query with their corresponding parameter values
 * @param query - The query object containing SQL and parameters
 * @returns The SQL string with placeholders replaced by actual values
 */
export function replacePlaceholders(query: Query): string {
  const { sql, params } = query;
  let paramIndex = 0;

  return sql.replace(/\?/g, () => {
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
function formatSqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "string") {
    // Escape single quotes by doubling them
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'`;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  // For other types, convert to string and treat as string
  const stringValue = String(value).replace(/'/g, "''");
  return `'${stringValue}'`;
}
