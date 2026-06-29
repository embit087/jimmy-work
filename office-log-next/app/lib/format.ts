// Display helpers. Times are formatted in Asia/Taipei to match the operators'
// local clock regardless of where the dashboard is viewed.

import type { DisplayStatus, EventKind } from "./api";

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Taipei",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Epoch ms → "HH:MM" in Taipei time. */
export function formatTime(at: number): string {
  return timeFmt.format(new Date(at));
}

/** Whole minutes → "X 小時 Y 分" / "Y 分". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} 分`;
  return `${h} 小時 ${m} 分`;
}

export interface StatusMeta {
  label: string;
  /** Colour bucket, shared with the timeline dots + legend. */
  kind: EventKind;
}

/** Derived-status → banner label + colour bucket. */
export const STATUS_META: Record<DisplayStatus, StatusMeta> = {
  working: { label: "工作中", kind: "work" },
  personal: { label: "私人時間", kind: "personal" },
  away: { label: "暫離座位", kind: "away" },
  idle: { label: "已到・待命", kind: "work" },
  offline: { label: "離線 / 未到", kind: "offline" },
};

export const KIND_LABEL: Record<EventKind, string> = {
  work: "工作",
  personal: "私人",
  away: "暫離",
  offline: "離線",
};
