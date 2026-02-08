export type Env = {
  LOG_KV: KVNamespace;
  IP_SALT: string;
};

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomRef(): string {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${a}-${b}`;
}

export function todayNY(): string {
  // Use America/New_York for daily limit rollover.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`; // YYYY-MM-DD
}

export const ACKS = [
  "Acknowledged.",
  "Noted.",
  "Recorded.",
  "Logged.",
  "Receipt generated.",
  "Entry accepted.",
  "Submission captured.",
  "Reference issued.",
] as const;
