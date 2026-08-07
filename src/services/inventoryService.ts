import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDoc,
  getDocs,
  writeBatch,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type {
  InventoryProduct,
  ProductLot,
  SurgicalInstrument,
  TechnicalDiscard,
  ProcedureKit,
} from "../types";

type Unsubscribe = () => void;

// Remove undefined values to prevent Firestore setDoc errors
function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) cleaned[key] = value;
  }
  return cleaned as T;
}

// ============================================================
// GENERIC REAL-TIME LISTENER
// ============================================================

function listenCollection<T extends { id: string }>(
  collectionName: string,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    console.warn(`[InventoryService] Firestore not configured. Skipping ${collectionName}.`);
    callback([]);
    return () => {};
  }

  const q = query(collection(db, collectionName));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as T);
      });
      callback(items);
    },
    (error) => {
      console.error(`[InventoryService] Listener error [${collectionName}]:`, error);
      onError?.(error);
    }
  );
}

// ============================================================
// PRODUCTS — CRUD
// ============================================================

export function listenProducts(
  callback: (products: InventoryProduct[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<InventoryProduct>("inventoryProducts", callback, onError);
}

export async function createProduct(product: InventoryProduct): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado. Verifique as variáveis de ambiente VITE_FIREBASE_* no .env");
  }
  const docRef = doc(db, "inventoryProducts", product.id);
  const { id, ...data } = product;
  await setDoc(docRef, cleanUndefined(data));
}

export async function updateProduct(product: InventoryProduct): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  const docRef = doc(db, "inventoryProducts", product.id);
  const { id, ...data } = product;
  await updateDoc(docRef, cleanUndefined(data) as any);
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  await deleteDoc(doc(db, "inventoryProducts", id));
}

// ============================================================
// PRODUCT LOTS — CRUD
// ============================================================

export function listenProductLots(
  callback: (lots: ProductLot[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<ProductLot>("inventoryLots", callback, onError);
}

export async function createProductLot(lot: ProductLot): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  const docRef = doc(db, "inventoryLots", lot.id);
  const { id, ...data } = lot;
  await setDoc(docRef, cleanUndefined(data));
}

export async function updateProductLot(lot: ProductLot): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  const docRef = doc(db, "inventoryLots", lot.id);
  const { id, ...data } = lot;
  await updateDoc(docRef, cleanUndefined(data) as any);
}

export async function deleteProductLot(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  await deleteDoc(doc(db, "inventoryLots", id));
}

// ============================================================
// SURGICAL INSTRUMENTS — CRUD
// ============================================================

export function listenInstruments(
  callback: (instruments: SurgicalInstrument[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<SurgicalInstrument>("inventoryInstruments", callback, onError);
}

export async function createInstrument(instrument: SurgicalInstrument): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  const docRef = doc(db, "inventoryInstruments", instrument.id);
  const { id, ...data } = instrument;
  await setDoc(docRef, cleanUndefined(data));
}

export async function updateInstrument(instrument: SurgicalInstrument): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  const docRef = doc(db, "inventoryInstruments", instrument.id);
  const { id, ...data } = instrument;
  await updateDoc(docRef, cleanUndefined(data) as any);
}

export async function deleteInstrument(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  await deleteDoc(doc(db, "inventoryInstruments", id));
}

// ============================================================
// TECHNICAL DISCARDS — CRUD
// ============================================================

export function listenDiscards(
  callback: (discards: TechnicalDiscard[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<TechnicalDiscard>("inventoryDiscards", callback, onError);
}

export async function createDiscard(discard: TechnicalDiscard): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  const docRef = doc(db, "inventoryDiscards", discard.id);
  const { id, ...data } = discard;
  await setDoc(docRef, cleanUndefined(data));
}

// ============================================================
// PROCEDURE KITS — CRUD
// ============================================================

export function listenKits(
  callback: (kits: ProcedureKit[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<ProcedureKit>("inventoryKits", callback, onError);
}

export async function createKit(kit: ProcedureKit): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  const docRef = doc(db, "inventoryKits", kit.id);
  const { id, ...data } = kit;
  await setDoc(docRef, cleanUndefined(data));
}

export async function updateKit(kit: ProcedureKit): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  const docRef = doc(db, "inventoryKits", kit.id);
  const { id, ...data } = kit;
  await updateDoc(docRef, cleanUndefined(data) as any);
}

export async function deleteKit(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  await deleteDoc(doc(db, "inventoryKits", id));
}

// ============================================================
// DISPENSING — Baixa por Kit de Procedimento (atômica)
// ============================================================

export interface DispenseResult {
  success: boolean;
  dispensedItems: { productId: string; productName: string; quantity: number }[];
  errors: string[];
}

/**
 * Realiza a baixa de todos os itens de um Kit de Procedimento de forma atômica.
 * Para cada item do kit, decrementa `currentStock` do produto correspondente.
 * Se o estoque de qualquer item for insuficiente, a operação NÃO é executada.
 */
export async function dispenseProcedureKit(kitId: string): Promise<DispenseResult> {
  if (!isFirebaseConfigured || !db) {
    return { success: false, dispensedItems: [], errors: ["Firestore não configurado"] };
  }

  const kitSnap = await getDoc(doc(db, "inventoryKits", kitId));
  if (!kitSnap.exists()) {
    return { success: false, dispensedItems: [], errors: ["Kit não encontrado"] };
  }

  const kit = { id: kitSnap.id, ...kitSnap.data() } as ProcedureKit;

  if (!kit.items || kit.items.length === 0) {
    return { success: false, dispensedItems: [], errors: ["Kit não possui itens"] };
  }

  const batch = writeBatch(db);
  const dispensedItems: DispenseResult["dispensedItems"] = [];
  const errors: string[] = [];

  for (const kitItem of kit.items) {
    const productRef = doc(db, "inventoryProducts", kitItem.productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      errors.push(`Produto ${kitItem.productId} não encontrado no estoque`);
      continue;
    }

    const product = { id: productSnap.id, ...productSnap.data() } as InventoryProduct;
    const newStock = product.currentStock - kitItem.quantityNeeded;

    if (newStock < 0) {
      errors.push(
        `Estoque insuficiente para "${product.name}": ` +
        `disponível ${product.currentStock}, necessário ${kitItem.quantityNeeded}`
      );
      continue;
    }

    batch.update(productRef, {
      currentStock: newStock,
      updatedAt: new Date().toISOString(),
    });

    dispensedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: kitItem.quantityNeeded,
    });
  }

  if (errors.length > 0) {
    return { success: false, dispensedItems: [], errors };
  }

  await batch.commit();

  return { success: true, dispensedItems, errors: [] };
}

// ============================================================
// EXPIRY ALERTS — Produtos e Instrumentais
// ============================================================

export interface ExpiryAlert {
  type: "product_expiry" | "instrument_grade_expired" | "instrument_grade_expiring";
  severity: "critical" | "warning";
  itemName: string;
  itemId: string;
  expiryDate: string;
  daysUntilExpiry: number;
  lotNumber?: string;
  details?: string;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna alertas de produtos com estoque próximo do vencimento (≤ 30 dias).
 */
export async function getExpiringProductAlerts(): Promise<ExpiryAlert[]> {
  if (!isFirebaseConfigured || !db) return [];

  const alerts: ExpiryAlert[] = [];
  const lotsSnap = await getDocs(query(collection(db, "inventoryLots")));

  for (const lotDoc of lotsSnap.docs) {
    const lot = { id: lotDoc.id, ...lotDoc.data() } as ProductLot;
    if (lot.remainingQuantity <= 0) continue;

    const days = daysUntil(lot.expiryDate);

    if (days < 0) {
      const productSnap = await getDoc(doc(db, "inventoryProducts", lot.productId));
      const productName = productSnap.exists()
        ? (productSnap.data() as InventoryProduct).name
        : lot.productId;

      alerts.push({
        type: "product_expiry",
        severity: "critical",
        itemName: productName,
        itemId: lot.productId,
        expiryDate: lot.expiryDate,
        daysUntilExpiry: days,
        lotNumber: lot.lotNumber,
        details: `Lote vencido há ${Math.abs(days)} dia(s). ${lot.remainingQuantity} unidade(s) em estoque.`,
      });
    } else if (days <= 30) {
      const productSnap = await getDoc(doc(db, "inventoryProducts", lot.productId));
      const productName = productSnap.exists()
        ? (productSnap.data() as InventoryProduct).name
        : lot.productId;

      alerts.push({
        type: "product_expiry",
        severity: days <= 7 ? "critical" : "warning",
        itemName: productName,
        itemId: lot.productId,
        expiryDate: lot.expiryDate,
        daysUntilExpiry: days,
        lotNumber: lot.lotNumber,
        details: days === 0
          ? `Vence HOJE. ${lot.remainingQuantity} unidade(s) em estoque.`
          : `Vence em ${days} dia(s). ${lot.remainingQuantity} unidade(s) em estoque.`,
      });
    }
  }

  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

/**
 * Retorna alertas de instrumentais com grau cirúrgico vencido ou próximo do vencimento.
 */
export async function getInstrumentGradeAlerts(): Promise<ExpiryAlert[]> {
  if (!isFirebaseConfigured || !db) return [];

  const alerts: ExpiryAlert[] = [];
  const instrumentsSnap = await getDocs(
    query(collection(db, "inventoryInstruments"), where("isActive", "==", true))
  );

  for (const instrDoc of instrumentsSnap.docs) {
    const instrument = { id: instrDoc.id, ...instrDoc.data() } as SurgicalInstrument;
    const days = daysUntil(instrument.gradeExpiryDate);

    if (days < 0) {
      alerts.push({
        type: "instrument_grade_expired",
        severity: "critical",
        itemName: instrument.name,
        itemId: instrument.id,
        expiryDate: instrument.gradeExpiryDate,
        daysUntilExpiry: days,
        details: `${instrument.surgicalGrade} expirado há ${Math.abs(days)} dia(s). ` +
          `Última esterilização: ${instrument.sterilizationDate}.`,
      });
    } else if (days <= 30) {
      alerts.push({
        type: "instrument_grade_expiring",
        severity: days <= 7 ? "critical" : "warning",
        itemName: instrument.name,
        itemId: instrument.id,
        expiryDate: instrument.gradeExpiryDate,
        daysUntilExpiry: days,
        details: `${instrument.surgicalGrade} vence em ${days} dia(s). ` +
          `Última esterilização: ${instrument.sterilizationDate}.`,
      });
    }
  }

  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

/**
 * Retorna todos os alertas de validade (produtos + instrumentais) em uma única lista.
 */
export async function getAllExpiryAlerts(): Promise<ExpiryAlert[]> {
  const [productAlerts, instrumentAlerts] = await Promise.all([
    getExpiringProductAlerts(),
    getInstrumentGradeAlerts(),
  ]);
  return [...productAlerts, ...instrumentAlerts].sort(
    (a, b) => a.daysUntilExpiry - b.daysUntilExpiry
  );
}
