"use client";

// Accessible iOS-style switch with a large (mobile-friendly) hit area.

type Tone = "green" | "warn" | "away";

const TRACK_ON: Record<Tone, string> = {
  green: "bg-green-600",
  warn: "bg-lime-500", // greenish-orange: working but away from seat
  away: "bg-yellow-400",
};

const LABEL_ON: Record<Tone, string> = {
  green: "text-green-700",
  warn: "text-lime-600",
  away: "text-yellow-600",
};

interface ToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
  /** Short state word shown beside the switch, e.g. 已到 / 關閉. */
  stateLabel: string;
  /** Accessible name (the row title). */
  ariaLabel: string;
  disabled?: boolean;
  /** On-state colour. Defaults to green. */
  tone?: Tone;
}

export function Toggle({
  on,
  onChange,
  stateLabel,
  ariaLabel,
  disabled,
  tone = "green",
}: ToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`text-sm font-medium tabular-nums ${
          on ? LABEL_ON[tone] : "text-gray-400"
        }`}
      >
        {stateLabel}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className={`relative inline-flex h-7 w-[3.25rem] shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 disabled:opacity-50 ${
          on ? TRACK_ON[tone] : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
            on ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
