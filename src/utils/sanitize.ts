const HTML_TAG_RE = /<[^>]*>/g;
const NULL_BYTE_RE = /\0/g;
const MULTIPLE_SPACES_RE = / {2,}/g;
const NAME_ALLOWED_RE = /[^a-zA-ZÀ-ÿ\s'-]/g;
const NOTES_ALLOWED_RE = /[^a-zA-ZÀ-ÿ0-9\s.,;:!?\-()'"\/]/g;

const MAX_NAME = 120;
const MAX_PHONE = 15;
const MAX_NOTES = 500;

export function sanitizeInput(raw: string): string {
  return raw
    .replace(NULL_BYTE_RE, "")
    .replace(HTML_TAG_RE, "")
    .replace(MULTIPLE_SPACES_RE, " ")
    .trim();
}

export function sanitizeName(raw: string): string {
  return sanitizeInput(raw)
    .replace(NAME_ALLOWED_RE, "")
    .slice(0, MAX_NAME);
}

export function sanitizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, MAX_PHONE);
  return digits;
}

export function formatPhoneBR(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function isValidPhoneBR(digits: string): boolean {
  const d = digits.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 11;
}

export function sanitizeNotes(raw: string): string {
  return sanitizeInput(raw)
    .replace(NOTES_ALLOWED_RE, "")
    .slice(0, MAX_NOTES);
}

export function validateName(raw: string): string | null {
  const v = sanitizeName(raw);
  if (v.length < 2) return "Nome deve ter pelo menos 2 caracteres.";
  return null;
}

export function validatePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length < 10) return "Telefone deve ter pelo menos 10 dígitos (DDD + número).";
  if (d.length > 11) return "Telefone deve ter no máximo 11 dígitos.";
  return null;
}

export function validateNotes(raw: string): string | null {
  if (raw.length > MAX_NOTES) return `Observações devem ter no máximo ${MAX_NOTES} caracteres.`;
  return null;
}
