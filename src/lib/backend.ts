import { describeError } from "@/lib/errors";

/**
 * Where the Python backend lives.
 *
 * The one place this is set. It used to be written out by hand in every tool
 * page — some as `localhost:8000`, some as `127.0.0.1:8000` — so moving the
 * backend meant finding and editing each copy.
 *
 * Override it without touching code by setting NEXT_PUBLIC_API_URL in
 * `.env.local`, e.g. `NEXT_PUBLIC_API_URL=http://127.0.0.1:9000`. The value is
 * read at build time, so restart `npm run dev` after changing it.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

/**
 * POSTs a form to a backend tool endpoint and returns the `data` of its reply.
 *
 * The tool endpoints answer { success, data, error: { message } }, and most
 * of them answer 200 even when they fail — so `res.ok` alone lets a failure
 * through. Throws an Error carrying the backend's own message.
 */
export async function postForm<T>(path: string, form: FormData, fallback: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { method: "POST", body: form });
  } catch {
    throw new Error(`Cannot reach the backend at ${API_BASE_URL}. Is it running?`);
  }
  const body: { success?: boolean; data?: T; error?: unknown; detail?: unknown } | null = await res
    .json()
    .catch(() => null);
  if (!res.ok || !body || body.success === false || body.data === undefined) {
    throw new Error(describeError(body?.error ?? body?.detail, fallback));
  }
  return body.data;
}
