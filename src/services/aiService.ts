// Serviço de IA do cliente (navegador):
// Uso EXCLUSIVO do Google AI Studio / Gemini na nuvem via VITE_GEMINI_API_KEY.
// (O Ollama local foi removido — o assistente funciona 100% na nuvem.)

const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-3.5-flash";

export interface AiRequestOptions {
  prompt: string;
  systemPrompt?: string;
  patientContext?: unknown;
  signal?: AbortSignal;
}

export function getGeminiKey(): string {
  return ((import.meta.env.VITE_GEMINI_API_KEY as string) || "").trim();
}

function buildUserContent(opts: AiRequestOptions): string {
  if (opts.patientContext) {
    return `Contexto do Paciente Específico Selecionado:\n${JSON.stringify(opts.patientContext, null, 2)}\n\nPergunta:\n${opts.prompt}`;
  }
  return opts.prompt;
}

async function generateWithGemini(key: string, opts: AiRequestOptions): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: opts.systemPrompt ? { parts: [{ text: opts.systemPrompt }] } : undefined,
      contents: [{ role: "user", parts: [{ text: buildUserContent(opts) }] }],
      generationConfig: { temperature: 0.7 },
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  if (!text.trim()) {
    throw new Error("Gemini resposta vazia");
  }
  return text;
}

/**
 * Gera resposta de IA usando exclusivamente o Gemini na nuvem.
 * Lança erro se a chave não estiver configurada ou a API falhar.
 */
export async function generateAIResponse(opts: AiRequestOptions): Promise<string> {
  const key = getGeminiKey();
  if (!key) {
    throw new Error("VITE_GEMINI_API_KEY não configurada no build.");
  }
  return generateWithGemini(key, opts);
}
