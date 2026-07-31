const CLIENT_ID = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID || "";

const SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

const TOKEN_STORAGE_KEY = "google_calendar_access_token";
const TOKEN_EXPIRY_KEY = "google_calendar_token_expiry";
const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";

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
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existing) {
      const poll = () => {
        if (window.google?.accounts?.oauth2) { resolve(); return; }
        setTimeout(poll, 100);
      };
      poll();
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let attempts = 0;
      const poll = () => {
        if (window.google?.accounts?.oauth2) { resolve(); return; }
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

export function hasPersistedToken(): boolean {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return !!(stored && expiry && Date.now() < Number(expiry));
  } catch { return false; }
}

export async function silentConnectGoogle(): Promise<boolean> {
  if (!CLIENT_ID) return false;
  if (accessToken) return true;

  try {
    await loadGIScript();
    const client = await getTokenClient();

    return new Promise<boolean>((resolve) => {
      client.callback = (response: any) => {
        if (response.access_token) {
          saveToken(response.access_token);
          resolve(true);
        } else {
          resolve(false);
        }
      };
      client.errorCallback = () => resolve(false);

      try {
        client.requestAccessToken({ prompt: "" });
      } catch {
        resolve(false);
      }
    });
  } catch {
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
    await loadGIScript();
    const client = await getTokenClient();

    const token = await Promise.race([
      requestToken(client),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("CONNECT_TIMEOUT")), 4000)
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

  let permissionDenied = false;
  const fetchPromises = calendarIds.map(async (cal) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.status === 403) {
        permissionDenied = true;
        return [];
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
          calendarName: cal.summary,
        });
        return acc;
      }, []);
    } catch { return []; }
  });

  const results = await Promise.all(fetchPromises);

  if (permissionDenied) {
    throw new Error("PERMISSION_ERROR");
  }

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

export async function createGoogleCalendarEvent(
  summary: string, description: string, startTime: string, endTime: string
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
