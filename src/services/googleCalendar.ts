const CLIENT_ID = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID || "";

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let tokenClient: any = null;
let accessToken: string | null = null;

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

function getTokenClient(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (tokenClient) {
      resolve(tokenClient);
      return;
    }

    if (!CLIENT_ID) {
      reject(new Error("GOOGLE_CALENDAR_CLIENT_ID não configurado"));
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Biblioteca Google Identity Services não carregada"));
      return;
    }

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

export async function connectGoogleCalendar(): Promise<string> {
  const client = await getTokenClient();

  return new Promise((resolve, reject) => {
    client.callback = (response: any) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      accessToken = response.access_token;
      resolve(accessToken);
    };

    client.errorCallback = (err: any) => {
      reject(err);
    };

    client.requestAccessToken({ prompt: "consent" });
  });
}

export function disconnectGoogleCalendar(): void {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
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
    maxResults: "100",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      accessToken = null;
      throw new Error("TOKEN_EXPIRED");
    }
    throw new Error(`Erro ao buscar eventos: ${response.status}`);
  }

  const data = await response.json();

  return (data.items || []).map((event: any) => ({
    id: event.id,
    summary: event.summary || "(Sem título)",
    description: event.description || "",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    startTimeRaw: event.start?.dateTime || "",
    endTimeRaw: event.end?.dateTime || "",
    colorId: event.colorId,
    calendarEventId: event.id,
  }));
}

export async function createGoogleCalendarEvent(
  summary: string,
  description: string,
  startTime: string,
  endTime: string
): Promise<string | null> {
  if (!accessToken) return null;

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startTime, timeZone: "America/Sao_Paulo" },
        end: { dateTime: endTime, timeZone: "America/Sao_Paulo" },
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      accessToken = null;
      throw new Error("TOKEN_EXPIRED");
    }
    console.error("Erro ao criar evento no Google Calendar:", response.status);
    return null;
  }

  const event = await response.json();
  return event.id || null;
}

export async function updateGoogleCalendarEvent(
  eventId: string,
  summary: string,
  description: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  if (!accessToken) return false;

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startTime, timeZone: "America/Sao_Paulo" },
        end: { dateTime: endTime, timeZone: "America/Sao_Paulo" },
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      accessToken = null;
      throw new Error("TOKEN_EXPIRED");
    }
    console.error("Erro ao atualizar evento no Google Calendar:", response.status);
    return false;
  }

  return true;
}

export async function deleteGoogleCalendarEvent(
  eventId: string
): Promise<void> {
  if (!accessToken) return;

  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}
