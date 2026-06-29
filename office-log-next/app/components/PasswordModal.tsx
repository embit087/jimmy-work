"use client";

import { useEffect, useRef, useState } from "react";

interface PasswordModalProps {
  open: boolean;
  error?: string;
  busy?: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export function PasswordModal({
  open,
  error,
  busy,
  onSubmit,
  onCancel,
}: PasswordModalProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      // Focus shortly after mount so mobile keyboards open reliably.
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (value) onSubmit(value);
        }}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 className="text-lg font-bold text-gray-900">需要密碼</h2>
        <p className="mt-1 text-sm text-gray-500">變更出勤狀態需輸入密碼。</p>

        <input
          ref={inputRef}
          type="password"
          inputMode="text"
          autoComplete="current-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="輸入密碼"
          className={`mt-4 w-full rounded-xl border bg-gray-50 px-3 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 ${
            error
              ? "border-red-300 focus:ring-red-500/30"
              : "border-gray-200 focus:border-green-500 focus:ring-green-500/30"
          }`}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-base font-medium text-gray-700 active:bg-gray-100"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!value || busy}
            className="flex-1 rounded-xl bg-green-600 py-2.5 text-base font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-40"
          >
            {busy ? "驗證中…" : "確認"}
          </button>
        </div>
      </form>
    </div>
  );
}
