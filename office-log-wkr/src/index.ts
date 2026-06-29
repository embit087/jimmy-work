/**
 * Office attendance status board — API worker.
 *
 * State lives in the OFFICE_LOG KV namespace, one JSON blob per user. The
 * Next.js dashboard (office-log-next) reads/writes through these endpoints:
 *
 *   GET  /api/status?user=<id>                  → current state + derived status
 *   POST /api/status   { user, key, value }     → flip a toggle
 *   POST /api/eta      { user, eta }             → set expected arrival time
 *   GET  /api/health                            → liveness probe
 *
 * CORS is wide-open (no credentials, public read/write demo) so the dashboard
 * can be hosted anywhere.
 */

import type { ToggleKey } from "./types";
import { applyToggle, loadState, saveState, setEta, toResponse } from "./state";

const DEFAULT_USER = "jimmy";
const TOGGLE_KEYS: ToggleKey[] = ["arrived", "remote", "working", "personal", "away"];

const CORS_HEADERS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Max-Age": "86400",
};

/** Constant-time-ish check that the request carries the right password. */
function authorized(env: Env, body: Record<string, unknown>): boolean {
	const expected = env.STATUS_PASSWORD;
	// If no password is configured, fail closed (mutations are protected).
	if (!expected) return false;
	return typeof body.password === "string" && body.password === expected;
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
			...CORS_HEADERS,
		},
	});
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
	try {
		const data = await request.json();
		return typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
	} catch {
		return null;
	}
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		const { pathname } = url;

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		if (pathname === "/api/health") {
			return json({ ok: true });
		}

		if (pathname === "/api/status" && request.method === "GET") {
			const user = url.searchParams.get("user") || DEFAULT_USER;
			const now = Date.now();
			const state = await loadState(env, user, now);
			return json(toResponse(state, now));
		}

		if (pathname === "/api/status" && request.method === "POST") {
			const body = await readJson(request);
			if (!body) return json({ error: "invalid JSON body" }, 400);
			if (!authorized(env, body)) return json({ error: "密碼錯誤" }, 401);

			const user = typeof body.user === "string" ? body.user : DEFAULT_USER;
			const key = body.key as ToggleKey;
			if (!TOGGLE_KEYS.includes(key)) {
				return json({ error: `key must be one of ${TOGGLE_KEYS.join(", ")}` }, 400);
			}
			if (typeof body.value !== "boolean") {
				return json({ error: "value must be a boolean" }, 400);
			}

			const now = Date.now();
			const state = await loadState(env, user, now);
			const next = applyToggle(state, key, body.value, now);
			await saveState(env, next);
			return json(toResponse(next, now));
		}

		if (pathname === "/api/eta" && request.method === "POST") {
			const body = await readJson(request);
			if (!body) return json({ error: "invalid JSON body" }, 400);
			if (!authorized(env, body)) return json({ error: "密碼錯誤" }, 401);

			const user = typeof body.user === "string" ? body.user : DEFAULT_USER;
			const eta = body.eta;
			if (typeof eta !== "string" || !/^\d{2}:\d{2}$/.test(eta)) {
				return json({ error: "eta must be a HH:MM string" }, 400);
			}

			const now = Date.now();
			const state = await loadState(env, user, now);
			const next = setEta(state, eta, now);
			await saveState(env, next);
			return json(toResponse(next, now));
		}

		return json({ error: "not found" }, 404);
	},
} satisfies ExportedHandler<Env>;
