// Colour tokens per event/status kind. Literal Tailwind class strings so the
// JIT compiler keeps them.

import type { EventKind } from "./api";

/** Solid dot colour for the timeline + legend. */
export const KIND_DOT: Record<EventKind, string> = {
  work: "bg-green-600",
  personal: "bg-amber-700",
  away: "bg-yellow-400",
  offline: "bg-gray-400",
};

/** Status-banner surface (background + border + text). */
export const KIND_BANNER: Record<EventKind, string> = {
  work: "bg-green-50 border-green-200 text-green-700",
  personal: "bg-amber-50 border-amber-200 text-amber-800",
  away: "bg-yellow-50 border-yellow-200 text-yellow-700",
  offline: "bg-gray-50 border-gray-200 text-gray-500",
};
