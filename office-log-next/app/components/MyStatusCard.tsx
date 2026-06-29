"use client";

import { useEffect, useState } from "react";
import type { StatusResponse, ToggleKey } from "../lib/api";
import { Toggle } from "./Toggle";

interface MyStatusCardProps {
  status: StatusResponse;
  onToggle: (key: ToggleKey, value: boolean) => void;
  onEta: (eta: string) => void;
  pending: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/**
 * ETA picker built from two native <select>s instead of <input type="time">,
 * which clipped its clock glyph on mobile. Reliable + consistent everywhere.
 */
function EtaPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [h = "09", m = "00"] = value.split(":");
  const selectCls =
    "appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-2 text-center text-base font-medium tabular-nums text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30";

  // Snap a stored minute to the nearest 5 so it always matches an option.
  const snappedM = MINUTES.includes(m)
    ? m
    : String(Math.round(parseInt(m || "0", 10) / 5) * 5 % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-1">
      <select
        aria-label="預計到達 - 時"
        value={HOURS.includes(h) ? h : "09"}
        onChange={(e) => onChange(`${e.target.value}:${snappedM}`)}
        className={selectCls}
      >
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>
            {hh}
          </option>
        ))}
      </select>
      <span className="text-base font-semibold text-gray-400">:</span>
      <select
        aria-label="預計到達 - 分"
        value={snappedM}
        onChange={(e) => onChange(`${HOURS.includes(h) ? h : "09"}:${e.target.value}`)}
        className={selectCls}
      >
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
    </div>
  );
}

function Row({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[0.95rem] font-semibold leading-tight text-gray-900">
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function MyStatusCard({
  status,
  onToggle,
  onEta,
  pending,
}: MyStatusCardProps) {
  // Local, editable copy of the ETA so typing doesn't fight server refreshes.
  const [eta, setEtaLocal] = useState(status.eta);
  useEffect(() => setEtaLocal(status.eta), [status.eta]);

  return (
    <section className="rounded-2xl bg-white px-4 py-3 shadow-sm">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">我的狀態</h2>
        <span className="text-xs text-gray-400">點一下切換開關</span>
      </header>

      <div className="mt-1 divide-y divide-gray-100">
        <Row title="我已到辦公室" subtitle="今日出勤打卡">
          <Toggle
            on={status.arrived}
            disabled={pending}
            ariaLabel="我已到辦公室"
            stateLabel={status.arrived ? "已到" : "未到"}
            onChange={(v) => onToggle("arrived", v)}
          />
        </Row>

        <Row title="遠端工作" subtitle="在家或外部工作,非辦公室">
          <Toggle
            on={status.remote}
            disabled={pending || !status.arrived}
            ariaLabel="遠端工作"
            stateLabel={status.remote ? "遠端" : "辦公室"}
            onChange={(v) => onToggle("remote", v)}
          />
        </Row>

        <Row title="目前正在工作" subtitle="對主管顯示為「工作中」">
          <Toggle
            on={status.working}
            disabled={pending || !status.arrived}
            ariaLabel="目前正在工作"
            stateLabel={status.working ? "工作中" : "暫停"}
            tone={status.away ? "warn" : "green"}
            onChange={(v) => onToggle("working", v)}
          />
        </Row>

        <Row title="暫離座位" subtitle="短暫離開座位,稍後回來">
          <Toggle
            on={status.away}
            disabled={pending || !status.arrived}
            ariaLabel="暫離座位"
            stateLabel={status.away ? "暫離" : "在座"}
            tone="away"
            onChange={(v) => onToggle("away", v)}
          />
        </Row>

        <Row title="處理私人事務" subtitle="暫停工作計時,主管顯示「私人時間」">
          <Toggle
            on={status.personal}
            disabled={pending || !status.arrived}
            ariaLabel="處理私人事務"
            stateLabel={status.personal ? "進行中" : "關閉"}
            onChange={(v) => onToggle("personal", v)}
          />
        </Row>

        <Row title="預計到達時間" subtitle="尚未到辦公室時填寫">
          <div className="flex items-center gap-1.5">
            <EtaPicker value={eta} onChange={setEtaLocal} />
            <button
              type="button"
              disabled={pending || eta === status.eta}
              onClick={() => onEta(eta)}
              className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 active:bg-gray-600 disabled:opacity-30"
            >
              更新
            </button>
          </div>
        </Row>
      </div>
    </section>
  );
}
