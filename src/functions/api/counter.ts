import { Env, json } from "../_utils";

export async function onRequestGet({ env }: { env: Env }) {
  const raw = await env.LOG_KV.get("counter:total");
  const counter = raw ? Number(raw) : 0;
  return json({ ok: true, counter });
}
