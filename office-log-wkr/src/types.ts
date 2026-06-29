/**
 * Shared types for the office attendance status board.
 *
 * The board tracks three independent toggles (arrived / working / personal)
 * plus an expected arrival time. From those we derive a single display status
 * that the manager dashboard renders, and we append an event to the day's log
 * whenever the derived status changes.
 */

/** A toggle the user can flip from the "My Status" card. */
export type ToggleKey = "arrived" | "remote" | "working" | "personal" | "away";

/** The single derived status shown on the manager dashboard. */
export type DisplayStatus = "working" | "personal" | "away" | "idle" | "offline";

/** Colour bucket for an event dot / status (matches the legend in the UI). */
export type EventKind = "work" | "personal" | "away" | "offline";

export interface StatusEvent {
	/** Epoch milliseconds when the event happened. */
	at: number;
	/** Colour bucket used by the timeline + legend. */
	kind: EventKind;
	/** Human label, e.g. "開始工作". */
	label: string;
}

export interface AppState {
	user: string;
	name: string;
	org: string;

	/** Raw toggles. */
	arrived: boolean;
	/** Working remotely (location flag; independent of the work status). */
	remote: boolean;
	working: boolean;
	personal: boolean;
	/** Temporarily away from the desk (still clocked in). */
	away: boolean;

	/** Expected arrival time "HH:MM", shown while not yet arrived. */
	eta: string;

	/** Epoch ms when the *current derived status* began. */
	statusSince: number;
	/** Epoch ms of the last mutation. */
	updatedAt: number;

	/** Taipei calendar day "YYYY-MM-DD" the log belongs to (for daily reset). */
	day: string;
	/** Today's chronological event log. */
	events: StatusEvent[];
}

/** Shape returned to the client: state plus server-derived fields. */
export interface StatusResponse extends AppState {
	status: DisplayStatus;
	/** Whole minutes the current status has lasted (server clock). */
	durationMinutes: number;
	/** Server "now" in epoch ms, so the client can reconcile clocks. */
	now: number;
}
