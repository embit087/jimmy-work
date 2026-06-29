import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import type { StatusResponse } from "../src/types";

const BASE = "https://example.com";
const PW = "endeavor1994";

async function getStatus(user = "tester"): Promise<StatusResponse> {
	const res = await SELF.fetch(`${BASE}/api/status?user=${user}`);
	expect(res.status).toBe(200);
	return (await res.json()) as StatusResponse;
}

async function toggle(user: string, key: string, value: boolean): Promise<StatusResponse> {
	const res = await SELF.fetch(`${BASE}/api/status`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ user, key, value, password: PW }),
	});
	expect(res.status).toBe(200);
	return (await res.json()) as StatusResponse;
}

describe("attendance status API", () => {
	beforeEach(async () => {
		// Each test starts from a clean KV slot.
		await env.OFFICE_LOG.delete("status:tester");
	});

	it("health check responds ok", async () => {
		const res = await SELF.fetch(`${BASE}/api/health`);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	it("seeds initial state with a derived status of 'working'", async () => {
		const s = await getStatus();
		expect(s.arrived).toBe(true);
		expect(s.working).toBe(true);
		expect(s.status).toBe("working");
		expect(s.events.length).toBeGreaterThanOrEqual(4);
	});

	it("CORS preflight is allowed", async () => {
		const res = await SELF.fetch(`${BASE}/api/status`, { method: "OPTIONS" });
		expect(res.status).toBe(204);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});

	it("turning on personal time flips status and logs an event", async () => {
		const before = await getStatus(); // seed
		const after = await toggle("tester", "personal", true);
		expect(after.status).toBe("personal");
		expect(after.working).toBe(false); // interlock
		expect(after.events.length).toBe(before.events.length + 1);
		expect(after.events.at(-1)?.label).toBe("私人事務");
		expect(after.events.at(-1)?.kind).toBe("personal");
	});

	it("resuming work after personal time logs a resume event", async () => {
		await getStatus();
		await toggle("tester", "personal", true);
		const after = await toggle("tester", "working", true);
		expect(after.status).toBe("working");
		expect(after.personal).toBe(false);
		expect(after.events.at(-1)?.label).toBe("恢復工作");
	});

	it("away coexists with working but takes display precedence", async () => {
		await getStatus(); // seed: arrived + working
		const after = await toggle("tester", "away", true);
		expect(after.away).toBe(true);
		expect(after.working).toBe(true); // away is an overlay, work stays on
		expect(after.status).toBe("away");
		expect(after.events.at(-1)?.label).toBe("暫離座位");
		expect(after.events.at(-1)?.kind).toBe("away");
	});

	it("leaving the office clears working/personal/away and goes offline", async () => {
		await getStatus();
		const after = await toggle("tester", "arrived", false);
		expect(after.status).toBe("offline");
		expect(after.working).toBe(false);
		expect(after.personal).toBe(false);
	});

	it("rejects invalid toggle keys", async () => {
		const bad = await SELF.fetch(`${BASE}/api/status`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user: "tester", key: "nope", value: true, password: PW }),
		});
		expect(bad.status).toBe(400);
	});

	it("rejects mutations with a missing or wrong password", async () => {
		const noPw = await SELF.fetch(`${BASE}/api/status`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user: "tester", key: "working", value: false }),
		});
		expect(noPw.status).toBe(401);

		const wrongPw = await SELF.fetch(`${BASE}/api/status`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user: "tester", key: "working", value: false, password: "nope" }),
		});
		expect(wrongPw.status).toBe(401);
	});

	it("updates ETA via /api/eta and validates format", async () => {
		const ok = await SELF.fetch(`${BASE}/api/eta`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user: "tester", eta: "08:30", password: PW }),
		});
		expect(ok.status).toBe(200);
		expect(((await ok.json()) as StatusResponse).eta).toBe("08:30");

		const bad = await SELF.fetch(`${BASE}/api/eta`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user: "tester", eta: "8am", password: PW }),
		});
		expect(bad.status).toBe(400);
	});
});
