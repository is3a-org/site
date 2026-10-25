/** Reads a server environment variable, treating a missing value as an empty string. */
export function readServerEnvironmentVariable(name: string): string {
  return process.env[name] ?? "";
}
