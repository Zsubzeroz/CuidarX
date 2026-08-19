const CLIENT_ID = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID || "";

const SCOPES = "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

const TOKEN_STORAGE_KEY = "google_calendar_access_token";
const TOKEN_EXPIRY_KEY = "google_calendar_token_expiry";
const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";

// Detecta se está rodando no Capacitor (Android/iOS)
export function isNativePlatform(): boolean {
  try {
    return !!(window as any).Capacitor || navigator.userAgent.includes("Capacitor");
  } catch { return false; }
}

let tokenClient: any = null;
let accessToken: string | null = (() => {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (stored && expiry && Date.now() < Number(expiry)) {
      return stored;
    }
    if (stored) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
  } catch {}
  return null;
})();

export type TokenCallback = (token: string) => void;
type ConnectingCallback = (connecting: boolean) => void;

let _onTokenAcquired: TokenCallback | null = null;
let _onConnectingChange: ConnectingCallback | null = null;

export function onTokenAcquired(cb: TokenCallback): void {
  _onTokenAcquired = cb;
}

export function onConnectingGoogleChange(cb: ConnectingCallback): void {
  _onConnectingChange = cb;
}

function setConnecting(v: boolean): void {
  try { _onConnectingChange?.(v); } catch {}
}

function saveToken(token: string): void {
  accessToken = token;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 3600 * 1000));
  } catch {}
  try { _onTokenAcquired?.(token); } catch {}
  try { if (window.opener && window.opener !== window) { window.close(); } } catch {}
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: any) => any;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

function loadGIScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      console.warn("[GIS] loadGIScript: already loaded, resolving immediately");
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existing) {
      console.warn("[GIS] loadGIScript: script tag exists but oauth2 not ready, polling...");
      let pollAttempts = 0;
      const poll = () => {
        if (window.google?.accounts?.oauth2) { console.warn("[GIS] loadGIScript: oauth2 ready after", pollAttempts, "poll attempts"); resolve(); return; }
        if (pollAttempts++ >= 50) { console.warn("[GIS] loadGIScript: poll timeout after 50 attempts"); reject(new Error("GIS script tag exists but oauth2 not available after 5s")); return; }
        setTimeout(poll, 100);
      };
      poll();
      return;
    }
    console.warn("[GIS] loadGIScript: loading GIS script from network...");
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let attempts = 0;
      const poll = () => {
        if (window.google?.accounts?.oauth2) { console.warn("[GIS] loadGIScript: oauth2 ready after onload, attempts:", attempts); resolve(); return; }
        if (attempts++ < 50) { setTimeout(poll, 100); return; }
        reject(new Error("GIS loaded but oauth2 not available"));
      };
      poll();
    };
    script.onerror = () => reject(new Error("Falha ao carregar GIS"));
    document.head.appendChild(script);
  });
}

function getTokenClient(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (tokenClient) { resolve(tokenClient); return; }
    if (!CLIENT_ID) { reject(new Error("GOOGLE_CALENDAR_CLIENT_ID não configurado")); return; }
    if (!window.google?.accounts?.oauth2) { reject(new Error("GIS não carregada")); return; }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {},
    });
    resolve(tokenClient);
  });
}

export function isGoogleCalendarConfigured(): boolean {
  return !!CLIENT_ID;
}

export function isGoogleCalendarConnected(): boolean {
  return !!accessToken;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function persistGoogleToken(token: string): void {
  saveToken(token);
}

export function hasPersistedToken(): boolean {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return !!(stored && expiry && Date.now() < Number(expiry));
  } catch { return false; }
}

export async function silentConnectGoogle(): Promise<boolean> {
  console.warn("[GoogleCalendar] silentConnectGoogle START");
  if (!CLIENT_ID) { console.warn("[GoogleCalendar] silentConnectGoogle: no CLIENT_ID"); return false; }
  if (accessToken) { console.warn("[GoogleCalendar] silentConnectGoogle: already have token"); return true; }

  // On native platforms, first try to restore a persisted token quickly
  if (isNativePlatform()) {
    if (hasPersistedToken()) {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        accessToken = stored;
        console.warn("[GoogleCalendar] silentConnectGoogle: restored persisted token");
        return true;
      }
    }
  }

  // Try GIS silent connect on ALL platforms (popup works in Capacitor WebView via Chrome)
  try {
    console.warn("[GoogleCalendar] silentConnectGoogle: loading GIS...");
    await loadGIScript();
    console.warn("[GoogleCalendar] silentConnectGoogle: getting token client...");
    const client = await getTokenClient();
    console.warn("[GoogleCalendar] silentConnectGoogle: requesting access token...");

    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn("[GoogleCalendar] silentConnectGoogle: TIMEOUT after 10s — no callback received");
        resolve(false);
      }, 10000);

      client.callback = (response: any) => {
        clearTimeout(timeout);
        console.warn(`[GoogleCalendar] silentConnectGoogle callback: access_token=${!!response.access_token}, error=${response.error || "none"}`);
        if (response.access_token) {
          saveToken(response.access_token);
          resolve(true);
        } else {
          resolve(false);
        }
      };
      client.errorCallback = (err: any) => {
        clearTimeout(timeout);
        console.warn("[GoogleCalendar] silentConnectGoogle errorCallback:", err);
        resolve(false);
      };

      try {
        client.requestAccessToken({ prompt: "" });
      } catch (e) {
        clearTimeout(timeout);
        console.warn("[GoogleCalendar] silentConnectGoogle requestAccessToken threw:", e);
        resolve(false);
      }
    });
  } catch (e) {
    console.warn("[GoogleCalendar] silentConnectGoogle caught:", e);
    return false;
  }
}

export async function tryAutoConnect(): Promise<boolean> {
  if (!accessToken || !CLIENT_ID) return false;
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=" + accessToken);
    return r.ok;
  } catch { return true; }
}

export async function connectGoogleCalendar(): Promise<string> {
  setConnecting(true);

  try {
    // On native: open OAuth in system browser, relay token via Firestore
    if (isNativePlatform()) {
      const token = await connectGoogleCalendarNative();
      setConnecting(false);
      return token;
    }

    // Web: use GIS popup
    await loadGIScript();
    const client = await getTokenClient();

    const token = await Promise.race([
      requestToken(client),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("CONNECT_TIMEOUT")), 60000)
      ),
    ]);

    saveToken(token);
    setConnecting(false);
    return token;
  } catch (err: any) {
    setConnecting(false);
    throw err;
  }
}

async function connectGoogleCalendarNative(): Promise<string> {
  const { generateSessionId, pollTokenFromFirestore } = await import("./tokenRelayService");
  const { Browser } = await import("@capacitor/browser");
  const { App } = await import("@capacitor/app");

  const sessionId = generateSessionId();
  const redirectUri = "https://podologa-fabricia.web.app";

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&prompt=consent` +
    `&include_granted_scopes=true` +
    `&state=${encodeURIComponent(sessionId)}`;

  console.warn("[GoogleCalendar] Opening system browser for OAuth...");
  await Browser.open({ url: authUrl });

  // Poll Firestore for the token (written by SPA at redirect_uri)
  console.warn("[GoogleCalendar] Polling Firestore for token...");
  const token = await pollTokenFromFirestore(sessionId, 120000);

  await Browser.close().catch(() => {});

  if (!token) {
    throw new Error("CONNECT_TIMEOUT");
  }

  saveToken(token);
  return token;
}

function requestToken(client: any): Promise<string> {
  return new Promise((resolve, reject) => {
    client.callback = (response: any) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response.access_token);
    };

    client.errorCallback = (err: any) => {
      reject(err);
    };

    try {
      client.requestAccessToken({ prompt: "consent" });
    } catch (e) {
      reject(new Error("Popup bloqueado"));
    }
  });
}

export function extractTokenFromUrl(): boolean {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token=")) return false;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");
    if (!token) return false;
    saveToken(token);
    window.history.replaceState({}, "", window.location.pathname + window.location.search);
    console.log("[GoogleCalendar] Token extracted from URL");
    return true;
  } catch { return false; }
}

export function disconnectGoogleCalendar(): void {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch {}
}

export async function renewTokenOnNative(): Promise<boolean> {
  return silentConnectGoogle();
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  startTimeRaw: string;
  endTimeRaw: string;
  colorId?: string;
  calendarEventId?: string;
  calendarName?: string;
}

const SP_TZ_OFFSET = "-03:00";

export function getEventLocalDate(isoString: string): string {
  if (!isoString) return "";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
      return isoString;
    }
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.slice(0, 10);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(d);
    let year = "", month = "", day = "";
    for (const part of parts) {
      if (part.type === "year") year = part.value;
      if (part.type === "month") month = part.value;
      if (part.type === "day") day = part.value;
    }
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
    return isoString.slice(0, 10);
  } catch {
    return isoString.slice(0, 10);
  }
}

export function buildEventTimeRange(
  date: string,
  time: string,
  durationMinutes: number
): { start: string; end: string } {
  const start = `${date}T${time}:00${SP_TZ_OFFSET}`;
  const startMs = Date.parse(`${date}T${time}:00Z`);
  const endDate = new Date(startMs + durationMinutes * 60000);
  const end = endDate.toISOString().slice(0, 19) + SP_TZ_OFFSET;
  return { start, end };
}

export async function fetchGoogleCalendarEvents(
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  if (!accessToken) return [];

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  let calendarIds: { id: string; summary?: string }[] = [{ id: "primary", summary: "Principal" }];
  try {
    const listResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (listResponse.ok) {
      const listData = await listResponse.json();
      if (Array.isArray(listData.items) && listData.items.length > 0) {
        calendarIds = listData.items.map((item: any) => ({
          id: item.id,
          summary: item.summary || item.id,
        }));
      }
    } else if (listResponse.status === 401) {
      accessToken = null;
      throw new Error("TOKEN_EXPIRED");
    } else if (listResponse.status === 403) {
      throw new Error("PERMISSION_ERROR");
    }
  } catch (err: any) {
    if (err?.message === "TOKEN_EXPIRED") throw err;
    if (err?.message === "PERMISSION_ERROR") throw err;
    console.warn("Não foi possível listar sub-agendas, fallback para 'primary':", err);
  }

  // Only the primary calendar is a hard requirement. If a sub-agenda denies
  // access (403) we skip just that calendar and keep everything else — a single
  // unauthorized sub-calendar must never wipe out the whole agenda.
  const fetchPromises = calendarIds.map(async (cal) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.status === 403) {
        if (cal.id === "primary") {
          throw new Error("PERMISSION_ERROR");
        }
        console.warn(`[GoogleCalendar] Sem permissão na sub-agenda "${cal.id}" — ignorando, mantendo as demais.`);
        return [];
      }
      if (response.status === 401) {
        accessToken = null;
        throw new Error("TOKEN_EXPIRED");
      }
      if (!response.ok) return [];
      const data = (await response.json()) as { items?: Array<Record<string, unknown>> };
      return (data.items || []).reduce<GoogleCalendarEvent[]>((acc, event: any) => {
        const startStr = event.start?.dateTime || event.start?.date || "";
        const endStr = event.end?.dateTime || event.end?.date || "";
        if (!startStr) return acc;
        acc.push({
          id: event.id,
          summary: event.summary || "(Sem título)",
          description: event.description || "",
          start: startStr,
          end: endStr,
          startTimeRaw: startStr,
          endTimeRaw: endStr,
          colorId: event.colorId,
          calendarEventId: event.id,
          calendarName: cal.summary || cal.id,
        });
        return acc;
      }, []);
    } catch (err: any) {
      if (err?.message === "TOKEN_EXPIRED") throw err;
      if (err?.message === "PERMISSION_ERROR") throw err;
      console.warn(`[GoogleCalendar] Falha ao ler a sub-agenda "${cal.id}" — ignorando:`, err);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);

  const allEvents = results.flat();

  const seenIds = new Set<string>();
  const uniqueEvents: GoogleCalendarEvent[] = [];
  for (const evt of allEvents) {
    if (!seenIds.has(evt.id)) {
      seenIds.add(evt.id);
      uniqueEvents.push(evt);
    }
  }
  uniqueEvents.sort((a, b) => (new Date(a.start).getTime() || 0) - (new Date(b.start).getTime() || 0));
  return uniqueEvents;
}

export const BLOCK_EVENT_PREFIX = "Bloqueio:";
export const BLOCK_COLOR_ID = "11"; // tomato/red — used to visually identify blocks in Google Calendar

// ── Event Category by Google Calendar colorId ──
export type EventCategory = "block" | "patient" | "personal" | "task" | "vacation" | "commitment";

export const EVENT_CATEGORY_CONFIG: Record<
  EventCategory,
  { colorId: string | null; label: string; blocksPortal: boolean; syncToAppointments: boolean }
> = {
  block:      { colorId: "11", label: "Bloqueio",  blocksPortal: true,  syncToAppointments: false },
  personal:   { colorId: "3",  label: "Família",    blocksPortal: true,  syncToAppointments: false },
  vacation:   { colorId: "1",  label: "Férias",     blocksPortal: true,  syncToAppointments: false },
  task:       { colorId: "4",  label: "Tarefa",     blocksPortal: false, syncToAppointments: true },
  commitment: { colorId: null, label: "Compromisso", blocksPortal: false, syncToAppointments: false },
  patient:    { colorId: null, label: "Paciente",   blocksPortal: false, syncToAppointments: true },
};

export function getEventCategory(colorId?: string | null): EventCategory {
  if (!colorId) return "patient";
  for (const [cat, cfg] of Object.entries(EVENT_CATEGORY_CONFIG)) {
    if (cfg.colorId === colorId) return cat as EventCategory;
  }
  return "patient";
}

export function isBlockEventSummary(summary: string | null | undefined): boolean {
  if (!summary) return false;
  return summary.trim().toLowerCase().startsWith("bloqueio");
}

export function parseBlockReason(summary: string | null | undefined): string {
  if (!summary) return "Bloqueio";
  const trimmed = summary.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "bloqueio" || lower === "bloqueio:") return "Bloqueio";
  if (lower.startsWith("bloqueio:")) return trimmed.slice("bloqueio:".length).trim() || "Bloqueio";
  return trimmed;
}

export function buildBlockEventSummary(reason: string): string {
  return `${BLOCK_EVENT_PREFIX} ${reason.trim()}`.trim();
}

export async function createGoogleCalendarEvent(
  summary: string, description: string, startTime: string, endTime: string, colorId?: string
): Promise<string | null> {
  if (!accessToken) return null;
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary, description,
        start: { dateTime: startTime, timeZone: "America/Sao_Paulo" },
        end: { dateTime: endTime, timeZone: "America/Sao_Paulo" },
        ...(colorId ? { colorId } : {}),
      }),
    }
  );
  if (!response.ok) {
    if (response.status === 401) { accessToken = null; throw new Error("TOKEN_EXPIRED"); }
    if (response.status === 403) { throw new Error("PERMISSION_ERROR"); }
    return null;
  }
  return (await response.json()).id || null;
}

export async function updateGoogleCalendarEvent(
  eventId: string, summary: string, description: string, startTime: string, endTime: string
): Promise<boolean> {
  if (!accessToken) return false;
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary, description,
        start: { dateTime: startTime, timeZone: "America/Sao_Paulo" },
        end: { dateTime: endTime, timeZone: "America/Sao_Paulo" },
      }),
    }
  );
  if (!response.ok) {
    if (response.status === 401) { accessToken = null; throw new Error("TOKEN_EXPIRED"); }
    return false;
  }
  return true;
}

export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  if (!accessToken) return;
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
}
