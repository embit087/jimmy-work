"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AuthError,
  getStatus,
  setEta as apiSetEta,
  setToggle,
  type StatusResponse,
  type ToggleKey,
} from "./lib/api";
import { formatTime } from "./lib/format";
import { MyStatusCard } from "./components/MyStatusCard";
import { ManagerCard } from "./components/ManagerCard";
import { PasswordModal } from "./components/PasswordModal";

const POLL_MS = 5000;
const PWD_KEY = "office-log-pwd";

/** A mutation to run once we have a valid password. */
type Mutation = (password: string) => Promise<StatusResponse>;

export default function Home() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(false);
  // Skip the background poll from clobbering an in-flight mutation.
  const mutating = useRef(false);

  // Cached password (per browser session) + the modal/queued-action state.
  const pwd = useRef<string | null>(null);
  const queued = useRef<Mutation | null>(null);
  const [modal, setModal] = useState<{ error?: string; busy?: boolean } | null>(
    null,
  );

  useEffect(() => {
    pwd.current = sessionStorage.getItem(PWD_KEY);
  }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await getStatus("jimmy", signal);
      if (!mutating.current) setStatus(data);
      setOnline(true);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") setOnline(false);
    }
  }, []);

  // Initial load + polling.
  useEffect(() => {
    const ctrl = new AbortController();
    refresh(ctrl.signal);
    const id = setInterval(() => refresh(), POLL_MS);
    return () => {
      ctrl.abort();
      clearInterval(id);
    };
  }, [refresh]);

  // Run a password-protected mutation, prompting if needed. We never apply an
  // optimistic change — the server response is the single source of truth, so
  // the toggles, banner, and log always reflect the same state together.
  const protect = useCallback(async (run: Mutation) => {
    mutating.current = true;
    setPending(true);
    try {
      if (!pwd.current) {
        queued.current = run;
        setModal({});
        return;
      }
      const data = await run(pwd.current);
      setStatus(data);
      setOnline(true);
    } catch (err) {
      if (err instanceof AuthError) {
        pwd.current = null;
        sessionStorage.removeItem(PWD_KEY);
        queued.current = run;
        setModal({ error: "密碼錯誤,請重新輸入" });
      } else {
        setOnline(false);
      }
    } finally {
      if (!queued.current) {
        mutating.current = false;
        setPending(false);
      }
    }
  }, []);

  const finishMutation = useCallback(() => {
    queued.current = null;
    setModal(null);
    mutating.current = false;
    setPending(false);
  }, []);

  const submitPassword = useCallback(
    async (password: string) => {
      const run = queued.current;
      if (!run) return finishMutation();
      setModal({ busy: true });
      try {
        const data = await run(password);
        pwd.current = password;
        sessionStorage.setItem(PWD_KEY, password);
        setStatus(data);
        setOnline(true);
        finishMutation();
      } catch (err) {
        if (err instanceof AuthError) {
          // Wrong password: keep the modal open and the action queued.
          setModal({ error: "密碼錯誤,請重新輸入" });
        } else {
          setOnline(false);
          finishMutation();
          await refresh();
        }
      }
    },
    [refresh, finishMutation],
  );

  const cancelPassword = useCallback(() => {
    queued.current = null;
    setModal(null);
    mutating.current = false;
    setPending(false);
  }, []);

  const handleToggle = useCallback(
    (key: ToggleKey, value: boolean) => {
      protect((p) => setToggle(key, value, p, "jimmy"));
    },
    [protect],
  );

  const handleEta = useCallback(
    (eta: string) => protect((p) => apiSetEta(eta, p, "jimmy")),
    [protect],
  );

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-2xl flex-col gap-2.5 overflow-hidden px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]">
      <Header status={status} online={online} />

      {status ? (
        <>
          <MyStatusCard
            status={status}
            onToggle={handleToggle}
            onEta={handleEta}
            pending={pending}
          />
          <ManagerCard status={status} />
        </>
      ) : online ? (
        <SkeletonCard />
      ) : (
        <OfflineCard onRetry={() => refresh()} />
      )}

      <PasswordModal
        open={modal !== null}
        error={modal?.error}
        busy={modal?.busy}
        onSubmit={submitPassword}
        onCancel={cancelPassword}
      />
    </main>
  );
}

function Header({
  status,
  online,
}: {
  status: StatusResponse | null;
  online: boolean;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2">
      <h1 className="flex min-w-0 items-baseline gap-2">
        <span className="shrink-0 text-lg font-bold tracking-tight text-white">
          出勤狀態看板
        </span>
        <span className="truncate text-xs text-gray-400">
          {status ? `${status.name} · ${status.org}` : "Jimmy · F(SYNC)"}
        </span>
      </h1>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            online
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              online ? "animate-pulse bg-green-400" : "bg-red-400"
            }`}
          />
          {online ? "即時同步" : "連線中斷"}
        </span>
        {status && (
          <span className="text-xs tabular-nums text-gray-400">
            {formatTime(status.updatedAt)}
          </span>
        )}
      </div>
    </header>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-1 animate-pulse rounded-2xl bg-white/5" aria-hidden />
  );
}

function OfflineCard({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-2xl bg-white p-7 text-center shadow-sm">
      <p className="text-lg font-semibold text-gray-900">無法連線到後端</p>
      <p className="mt-1 text-sm text-gray-500">請稍後再試。</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl bg-green-600 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-green-700"
      >
        重新嘗試
      </button>
    </section>
  );
}
