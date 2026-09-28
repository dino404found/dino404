/** Only the initial, additive schema may be initialized on a fresh deployment. */
export function initialSchemaStatements(sql: string) {
  return sql
    .replaceAll("--> statement-breakpoint", "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => {
      if (!/^CREATE (TABLE|INDEX) /i.test(statement))
        throw new Error("Initial schema must contain only additive table/index creation.");
      return statement.replace(/^CREATE (TABLE|INDEX) /i, "CREATE $1 IF NOT EXISTS ");
    });
}
