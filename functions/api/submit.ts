import { ACKS, Env, json, randomRef, sha256Hex, todayNY } from "../_utils";

type Body = { note?: string };

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const note = (body.note || "").trim();
  if (!note) return json({ ok: false, error: "Empty submission." }, { status: 400 });

  // Daily limit keyed by hashed IP + NY date (no raw IP stored)
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const day = todayNY();
  const ipHash = await sha256Hex(`${ip}:${env.IP_SALT}`);
  const limitKey = `limit:${ipHash}:${day}`;

  const maxPerDay = 3;
  const current = Number((await env.LOG_KV.get(limitKey)) || "0");

  if (current >= maxPerDay) {
    const raw = await env.LOG_KV.get("counter:total");
    const counter = raw ? Number(raw) : 0;
    return json(
      { ok: false, error: "Daily limit reached.", remainingToday: 0, counter },
      { status: 429 }
    );
  }

  const ref = randomRef();
  const ts = new Date().toISOString();
  const ack = ACKS[Math.floor(Math.random() * ACKS.length)];

  // Fingerprint note so the receipt feels “real” without storing content
  const fingerprint = await sha256Hex(`note:${note}:${env.IP_SALT}`);

  // Store receipt metadata only
  await env.LOG_KV.put(`receipt:${ref}`, JSON.stringify({ ts, ack, fingerprint }));

  // Update daily limit count (expire after ~2 days to stay tidy)
  await env.LOG_KV.put(limitKey, String(current + 1), { expirationTtl: 60 * 60 * 48 });

  // Increment public counter
  const rawTotal = await env.LOG_KV.get("counter:total");
  const counter = (rawTotal ? Number(rawTotal) : 0) + 1;
  await env.LOG_KV.put("counter:total", String(counter));

  const remainingToday = maxPerDay - (current + 1);

  return json({
    ok: true,
    ref,
    receiptUrl: `/r/${encodeURIComponent(ref)}`,
    message: ack,
    counter,
    remainingToday,
  });
}
