/**
 * State management: load/save to KV, derive the display status, and append log
 * events on transitions.
 */

import type {
	AppState,
	DisplayStatus,
	EventKind,
	StatusEvent,
	StatusResponse,
	ToggleKey,
} from "./types";
import { taipeiDay, taipeiTimeToday } from "./time";

const KEY_PREFIX = "status:";

/** Resolve the single derived status from the raw toggles. */
export function deriveStatus(
	s: Pick<AppState, "arrived" | "working" | "personal" | "away">,
): DisplayStatus {
	if (!s.arrived) return "offline";
	if (s.personal) return "personal";
	if (s.away) return "away";
	if (s.working) return "working";
	return "idle";
}

/** Map a derived status to its colour bucket (legend: work / personal / away / offline). */
function kindOf(status: DisplayStatus): EventKind {
	if (status === "working") return "work";
	if (status === "personal") return "personal";
	if (status === "away") return "away";
	return "offline"; // idle + offline both render as the neutral/grey bucket
}

/**
 * Human label for a transition into `to`, given where we came from. Mirrors the
 * wording in the reference board (抵達辦公室 / 開始工作 / 私人事務 / 恢復工作 …).
 */
function transitionLabel(from: DisplayStatus, to: DisplayStatus): string {
	switch (to) {
		case "offline":
			return "離開辦公室";
		case "idle":
			// Arriving, or finishing work but still in the office.
			return from === "offline" ? "抵達辦公室" : "暫停工作";
		case "working":
			return from === "personal" || from === "away" ? "恢復工作" : "開始工作";
		case "personal":
			return "私人事務";
		case "away":
			return "暫離座位";
	}
}

const newEvent = (at: number, status: DisplayStatus, from: DisplayStatus): StatusEvent => ({
	at,
	kind: kindOf(status),
	label: transitionLabel(from, status),
});

function kvKey(user: string): string {
	return KEY_PREFIX + user;
}

/** Seed a fresh state for `user`, reproducing the reference image's timeline. */
export function seedState(user: string, now: number): AppState {
	const day = taipeiDay(now);
	const events: StatusEvent[] = [
		{ at: taipeiTimeToday(now, "09:02"), kind: "offline", label: "抵達辦公室" },
		{ at: taipeiTimeToday(now, "09:05"), kind: "work", label: "開始工作" },
		{ at: taipeiTimeToday(now, "12:30"), kind: "personal", label: "私人事務(午休)" },
		{ at: taipeiTimeToday(now, "13:05"), kind: "work", label: "恢復工作" },
	];
	return {
		user,
		name: "Jimmy",
		org: "F(SYNC)",
		arrived: true,
		remote: false,
		working: true,
		personal: false,
		away: false,
		eta: "09:00",
		statusSince: events[events.length - 1].at,
		updatedAt: now,
		day,
		events,
	};
}

/** Drop the log (but keep toggles) when the Taipei day rolls over. */
function rolloverIfNewDay(state: AppState, now: number): AppState {
	const today = taipeiDay(now);
	if (state.day === today) return state;
	return { ...state, day: today, events: [], statusSince: now, updatedAt: now };
}

export async function loadState(env: Env, user: string, now: number): Promise<AppState> {
	const raw = await env.OFFICE_LOG.get(kvKey(user));
	if (!raw) {
		const seeded = seedState(user, now);
		await saveState(env, seeded);
		return seeded;
	}
	const parsed = JSON.parse(raw) as AppState;
	return rolloverIfNewDay(parsed, now);
}

export async function saveState(env: Env, state: AppState): Promise<void> {
	await env.OFFICE_LOG.put(kvKey(state.user), JSON.stringify(state));
}

/**
 * Apply a toggle change. Recomputes the derived status and, if it changed,
 * appends a log event and resets `statusSince`.
 */
export function applyToggle(state: AppState, key: ToggleKey, value: boolean, now: number): AppState {
	const before = deriveStatus(state);
	const next: AppState = { ...state, [key]: value, updatedAt: now };

	// A couple of sensible interlocks so the toggles can't contradict the log.
	if (key === "arrived" && value === false) {
		// Clocking out implies you're no longer working / on personal / away / remote.
		next.working = false;
		next.personal = false;
		next.away = false;
		next.remote = false;
	}
	// Personal time is exclusive of working/away. "Away" is an overlay that can
	// coexist with "working" (you stepped away mid work session) — the derived
	// status prioritises "away", and the UI tints the work toggle accordingly.
	if (key === "working" && value === true) {
		next.personal = false;
	}
	if (key === "personal" && value === true) {
		next.working = false;
		next.away = false;
	}
	if (key === "away" && value === true) {
		next.personal = false;
	}

	const after = deriveStatus(next);
	if (after !== before) {
		next.statusSince = now;
		// Keep the log bounded to avoid unbounded KV blob growth.
		next.events = [...state.events, newEvent(now, after, before)].slice(-50);
	}
	return next;
}

export function setEta(state: AppState, eta: string, now: number): AppState {
	return { ...state, eta, updatedAt: now };
}

/** Project the stored state into the client response shape. */
export function toResponse(state: AppState, now: number): StatusResponse {
	const status = deriveStatus(state);
	return {
		...state,
		status,
		durationMinutes: Math.max(0, Math.floor((now - state.statusSince) / 60000)),
		now,
	};
}
