export type WhatsAppProvider = "z-api" | "ultramsg" | "evolution" | "";

export interface WhatsAppAutoConfig {
  enabled: boolean;
  provider: WhatsAppProvider;
  apiKey: string;
  instanceId?: string;
  evolutionUrl?: string;
  clinicPhone?: string;
}

const STORAGE_KEY = "whatsapp_auto_config";

export function getConfig(): WhatsAppAutoConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, provider: "", apiKey: "", clinicPhone: "19997270910" };
}

export function saveConfig(config: WhatsAppAutoConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function getClinicWhatsApp(): string {
  try {
    const config = getConfig();
    if (config.clinicPhone) return config.clinicPhone;
  } catch {}
  return "19997270910";
}

export function getClinicWhatsAppLink(): string {
  const phone = getClinicWhatsApp();
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

export function getClinicWhatsAppDisplay(): string {
  const phone = getClinicWhatsApp();
  const digits = phone.replace(/\D/g, "");
  const justDigits = digits.replace(/^55/, "");
  if (justDigits.length === 11) {
    return `(${justDigits.slice(0, 2)}) ${justDigits.slice(2, 7)}-${justDigits.slice(7)}`;
  }
  return digits;
}

function buildPayload(
  provider: WhatsAppProvider,
  apiKey: string,
  instanceId: string | undefined,
  evolutionUrl: string | undefined,
  phone: string,
  message: string
): { url: string; body: any; headers: Record<string, string> } {
  const digits = phone.replace(/\D/g, "");
  const fullPhone = digits.startsWith("55") ? digits : `55${digits}`;

  switch (provider) {
    case "z-api":
      return {
        url: `https://api.z-api.io/instances/${instanceId}/token/${apiKey}/send-text`,
        body: { phone: fullPhone, message },
        headers: { "Content-Type": "application/json" },
      };
    case "ultramsg":
      return {
        url: `https://api.ultramsg.com/${instanceId}/messages/chat`,
        body: { token: apiKey, to: fullPhone, body: message },
        headers: { "Content-Type": "application/json" },
      };
    case "evolution":
      return {
        url: `${evolutionUrl || "http://localhost:8080"}/message/sendText/${instanceId}`,
        body: { number: fullPhone, text: message },
        headers: { "Content-Type": "application/json", "apiKey": apiKey },
      };
    default:
      throw new Error("Provedor WhatsApp não configurado");
  }
}

export async function sendConfirmation(
  phone: string,
  patientName: string,
  date: string,
  time: string
): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  if (!config.enabled || !config.provider || !config.apiKey) {
    return { success: false, error: "Automação WhatsApp desligada ou não configurada" };
  }

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
  const message = `Olá ${patientName}! Confirmando sua consulta de Podologia com a Dra. Fabrícia Rodrigues amanhã, ${formattedDate} às ${time}. Podemos confirmar? Responda com SIM.`;

  try {
    const { url, body, headers } = buildPayload(
      config.provider,
      config.apiKey,
      config.instanceId,
      config.evolutionUrl,
      phone,
      message
    );
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendReminder(
  phone: string,
  patientName: string,
  date: string,
  time: string
): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  if (!config.enabled || !config.provider || !config.apiKey) {
    return { success: false, error: "Automação WhatsApp desligada ou não configurada" };
  }

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
  const message = `🔔 *Lembrete - Dra. Fabrícia Rodrigues* 🐾\n\nOlá *${patientName}*! Passando para lembrar da sua consulta de Podologia amanhã, *${formattedDate}* às *${time}*.\n\n_Qualquer imprevisto, avise-nos com antecedência._ 😊`;

  try {
    const { url, body, headers } = buildPayload(
      config.provider,
      config.apiKey,
      config.instanceId,
      config.evolutionUrl,
      phone,
      message
    );
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendFollowUp(
  phone: string,
  patientName: string
): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  if (!config.enabled || !config.provider || !config.apiKey) {
    return { success: false, error: "Automação WhatsApp desligada ou não configurada" };
  }

  const message = `👋 *Dra. Fabrícia Rodrigues* 🐾\n\nOlá *${patientName}*! Esperamos que tenha gostado do seu atendimento. Se precisar de qualquer suporte ou quiser agendar um retorno, estamos à disposição!\n\nAgende online: https://podologa-fabricia.web.app/cliente`;

  try {
    const { url, body, headers } = buildPayload(
      config.provider,
      config.apiKey,
      config.instanceId,
      config.evolutionUrl,
      phone,
      message
    );
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
