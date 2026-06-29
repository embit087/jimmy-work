/**
 * Time helpers. The board is operated from Taiwan, so the daily log resets on
 * the Asia/Taipei calendar day and labels are formatted in that zone. We store
 * epoch milliseconds everywhere and only format on demand.
 */

const TZ = "Asia/Taipei";

const dayFmt = new Intl.DateTimeFormat("en-CA", {
	timeZone: TZ,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

/** Taipei calendar day as "YYYY-MM-DD" for the given epoch ms. */
export function taipeiDay(at: number): string {
	// en-CA formats as YYYY-MM-DD.
	return dayFmt.format(new Date(at));
}

/**
 * Build an epoch-ms timestamp for "HH:MM today" in Taipei. Used to seed the
 * demo log with realistic times relative to the current day.
 */
export function taipeiTimeToday(now: number, hhmm: string): number {
	const [h, m] = hhmm.split(":").map(Number);
	// Taipei is UTC+8 with no DST.
	const day = taipeiDay(now); // YYYY-MM-DD
	const [y, mo, d] = day.split("-").map(Number);
	return Date.UTC(y, mo - 1, d, h - 8, m, 0, 0);
}
