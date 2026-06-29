// Client for the office-log-wkr Cloudflare Worker API.
//
// Always talk to the deployed worker — in dev and in production alike — so the
// dashboard reflects the same shared state everywhere. Override with
// NEXT_PUBLIC_API_BASE only if you intentionally want a local `wrangler dev`.

const DEPLOYED_API = "https://office-log-wkr.jimmy-ce8.workers.dev";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || DEPLOYED_API;

export type ToggleKey = "arrived" | "remote" | "working" | "personal" | "away";
export type DisplayStatus = "working" | "personal" | "away" | "idle" | "offline";
export type EventKind = "work" | "personal" | "away" | "offline";

export interface StatusEvent {
  at: number;
  kind: EventKind;
  label: string;
}

export interface StatusResponse {
  user: string;
  name: string;
  org: string;
  arrived: boolean;
  remote: boolean;
  working: boolean;
  personal: boolean;
  away: boolean;
  eta: string;
  statusSince: number;
  updatedAt: number;
  day: string;
  events: StatusEvent[];
  status: DisplayStatus;
  durationMinutes: number;
  now: number;
}

const DEFAULT_USER = "jimmy";

/** Thrown when the worker rejects a mutation password (HTTP 401). */
export class AuthError extends Error {
  constructor() {
    super("密碼錯誤");
    this.name = "AuthError";
  }
}

async function asJson(res: Response): Promise<StatusResponse> {
  if (res.status === 401) throw new AuthError();
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as StatusResponse;
}

export function getStatus(
  user = DEFAULT_USER,
  signal?: AbortSignal,
): Promise<StatusResponse> {
  return fetch(`${API_BASE}/api/status?user=${encodeURIComponent(user)}`, {
    signal,
    cache: "no-store",
  }).then(asJson);
}

export function setToggle(
  key: ToggleKey,
  value: boolean,
  password: string,
  user = DEFAULT_USER,
): Promise<StatusResponse> {
  return fetch(`${API_BASE}/api/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, key, value, password }),
  }).then(asJson);
}

export function setEta(
  eta: string,
  password: string,
  user = DEFAULT_USER,
): Promise<StatusResponse> {
  return fetch(`${API_BASE}/api/eta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, eta, password }),
  }).then(asJson);
}
