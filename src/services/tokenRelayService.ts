import { db } from "./firebase";
import { doc, setDoc, getDoc, deleteDoc, onSnapshot } from "firebase/firestore";

const COLLECTION = "oauth_sessions";
const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos

export function generateSessionId(): string {
  return `gsession_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function writeTokenToFirestore(sessionId: string, token: string): Promise<void> {
  await setDoc(doc(db, COLLECTION, sessionId), {
    token,
    createdAt: Date.now(),
    used: false,
  });
}

export async function pollTokenFromFirestore(
  sessionId: string,
  timeoutMs: number = 120000
): Promise<string | null> {
  const start = Date.now();
  return new Promise((resolve) => {
    const unsub = onSnapshot(doc(db, COLLECTION, sessionId), (snap) => {
      const data = snap.data();
      if (data?.token && !data?.used) {
        clearTimeout(timer);
        unsub();
        // Mark as used and clean up
        setDoc(doc(db, COLLECTION, sessionId), { used: true }, { merge: true }).catch(() => {});
        resolve(data.token);
      }
    }, () => {});

    const timer = setTimeout(() => {
      unsub();
      resolve(null);
    }, timeoutMs);

    // Cleanup old sessions periodically
    cleanupOldSessions().catch(() => {});
  });
}

export async function handleAuthCallbackRedirect(): Promise<boolean> {
  try {
    const url = new URL(window.location.href);
    const hash = window.location.hash;

    if (!hash || !hash.includes("access_token=")) return false;

    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");
    const sessionId = params.get("state") || url.searchParams.get("session_id");

    if (!token || !sessionId) return false;

    await writeTokenToFirestore(sessionId, token);

    // Show confirmation
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0fdf4;">
        <div style="text-align:center;padding:2rem;">
          <h1 style="color:#16a34a;font-size:1.5rem;">Autenticado com sucesso!</h1>
          <p style="color:#666;margin-top:1rem;">Pode fechar esta janela e voltar ao app.</p>
        </div>
      </div>
    `;
    window.history.replaceState({}, "", window.location.pathname);

    return true;
  } catch {
    return false;
  }
}

async function cleanupOldSessions(): Promise<void> {
  // Only cleanup occasionally (1 in 20 calls)
  if (Math.random() > 0.05) return;
  try {
    const cutoff = Date.now() - TOKEN_EXPIRY_MS;
    const { collection, query, where, getDocs, deleteDoc: delDoc } = await import("firebase/firestore");
    const q = query(collection(db, COLLECTION), where("createdAt", "<", cutoff));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      await delDoc(d.ref).catch(() => {});
    }
  } catch {}
}
