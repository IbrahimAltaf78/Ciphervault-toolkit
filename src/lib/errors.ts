/**
 * Turns anything a failed request can throw into one readable line.
 *
 * The tool pages each had their own copy of this — typed `any`, which lint
 * rejects and which let a bad shape through silently. One version, typed
 * `unknown` and narrowed step by step, covers every caller.
 *
 * Handles, in order:
 *   - nothing at all            → the fallback
 *   - a plain string            → itself
 *   - FastAPI validation errors → "field -> path: message | …"
 *   - an Error                  → its message
 *   - a JSON body               → its `detail`, `message` or `error`, recursively
 *   - anything else             → its JSON, or String() if that fails
 */
export function describeError(err: unknown, fallback = "An unexpected error occurred."): string {
  if (err === null || err === undefined || err === "") return fallback;
  if (typeof err === "string") return err;

  if (Array.isArray(err)) {
    const parts = err.map((item) => {
      if (typeof item === "object" && item !== null) {
        const record = item as { loc?: unknown; msg?: unknown };
        const loc = Array.isArray(record.loc) ? record.loc.join(" -> ") : "";
        const msg = typeof record.msg === "string" ? record.msg : JSON.stringify(item);
        return loc ? `${loc}: ${msg}` : msg;
      }
      return String(item);
    });
    return parts.join(" | ") || fallback;
  }

  if (err instanceof Error) return err.message || fallback;

  if (typeof err === "object") {
    const body = err as { detail?: unknown; message?: unknown; error?: unknown };
    if (body.detail) return describeError(body.detail, fallback);
    if (body.message) return describeError(body.message, fallback);
    if (body.error) return describeError(body.error, fallback);
    try {
      return JSON.stringify(err);
    } catch {
      return fallback;
    }
  }

  return String(err);
}
