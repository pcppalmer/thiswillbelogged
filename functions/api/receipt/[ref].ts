import { Env, json } from "../../_utils";

export async function onRequestGet({ params, env }: { params: { ref: string }; env: Env }) {
  const ref = String(params.ref || "").toUpperCase();

  const raw = await env.LOG_KV.get(`receipt:${ref}`);
  if (!raw) return json({ ok: false, error: "Receipt not found." }, { status: 404 });

  const data = JSON.parse(raw) as { ts: string; ack: string; fingerprint: string };

  return json({
  ok: true,
  ref,
  timestamp: data.ts,
  message: data.ack,
  fingerprint: data.fingerprint, // full fingerprint for verification
});}
