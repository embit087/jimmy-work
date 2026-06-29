"use client";

import { useEffect, useState } from "react";
import type { StatusResponse } from "../lib/api";
import {
  formatDuration,
  formatTime,
  KIND_LABEL,
  STATUS_META,
} from "../lib/format";
import { KIND_BANNER, KIND_DOT } from "../lib/theme";

interface ManagerCardProps {
  status: StatusResponse;
}

export function ManagerCard({ status }: ManagerCardProps) {
  const meta = STATUS_META[status.status];

  // Tick periodically so "已持續" stays live between server refreshes.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const durationMin = Math.max(0, Math.floor((now - status.statusSince) / 60000));

  // Show the most recent events newest-last; bound the height so the page
  // itself never needs to scroll.
  const recent = status.events.slice(-6);
  const lastEventIdx = recent.length - 1;

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white px-4 py-3 shadow-sm">
      {/* Current-status banner */}
      <div
        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${KIND_BANNER[meta.kind]}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${KIND_DOT[meta.kind]}`} />
          <span className="text-xl font-bold">{meta.label}</span>
          {status.arrived && (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700">
              {status.remote ? "遠端" : "在辦公室"}
            </span>
          )}
        </div>
        <div className="text-right text-xs text-gray-600">
          <p>自 {formatTime(status.statusSince)}</p>
          <p className="mt-0.5">已持續 {formatDuration(durationMin)}</p>
        </div>
      </div>

      {/* Today's timeline (scrolls internally only if it ever overflows) */}
      <h3 className="mt-3 text-sm font-bold text-gray-900">今日紀錄</h3>
      <ol className="mt-1.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {recent.length === 0 && (
          <li className="text-sm text-gray-400">今日尚無紀錄</li>
        )}
        {recent.map((ev, i) => (
          <li key={`${ev.at}-${i}`} className="flex items-center gap-2.5">
            <time className="w-11 shrink-0 font-mono text-xs tabular-nums text-gray-400">
              {formatTime(ev.at)}
            </time>
            <span className={`h-2 w-2 shrink-0 rounded-full ${KIND_DOT[ev.kind]}`} />
            <span className="text-sm text-gray-800">
              {ev.label}
              {i === lastEventIdx && (
                <span className="text-gray-400"> (目前)</span>
              )}
            </span>
          </li>
        ))}
      </ol>

      {/* Footer + legend */}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[0.7rem] text-gray-400">
        <span className="shrink-0 tabular-nums">{formatTime(status.updatedAt)}</span>
        <div className="flex shrink-0 items-center gap-2">
          {(["work", "personal", "away", "offline"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${KIND_DOT[k]}`} />
              {KIND_LABEL[k]}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
