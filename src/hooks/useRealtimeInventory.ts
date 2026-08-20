import { useState, useEffect, useCallback } from "react";
import {
  listenProducts,
  listenProductLots,
  listenInstruments,
  listenDiscards,
  listenKits,
  createProduct as fsCreateProduct,
  updateProduct as fsUpdateProduct,
  deleteProduct as fsDeleteProduct,
  createProductLot as fsCreateProductLot,
  updateProductLot as fsUpdateProductLot,
  deleteProductLot as fsDeleteProductLot,
  createInstrument as fsCreateInstrument,
  updateInstrument as fsUpdateInstrument,
  deleteInstrument as fsDeleteInstrument,
  createDiscard as fsCreateDiscard,
  createKit as fsCreateKit,
  updateKit as fsUpdateKit,
  deleteKit as fsDeleteKit,
  dispenseProcedureKit as fsDispenseProcedureKit,
  getAllExpiryAlerts,
  type DispenseResult,
  type ExpiryAlert,
} from "../services/inventoryService";
import type {
  InventoryProduct,
  ProductLot,
  SurgicalInstrument,
  TechnicalDiscard,
  ProcedureKit,
} from "../types";

export function useRealtimeInventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [instruments, setInstruments] = useState<SurgicalInstrument[]>([]);
  const [discards, setDiscards] = useState<TechnicalDiscard[]>([]);
  const [kits, setKits] = useState<ProcedureKit[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");

  useEffect(() => {
    let loadedCount = 0;
    const totalCollections = 5;

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalCollections) {
        setIsLoading(false);
      }
    };

    const safetyTimer = setTimeout(() => {
      if (loadedCount < totalCollections) {
        setIsLoading(false);
      }
    }, 3000);

    const unsubProducts = listenProducts(
      (data) => {
        setProducts(data);
        setSyncStatus("synced");
        checkLoaded();
      },
      (err) => {
        console.error("[useRealtimeInventory] products listener error:", err);
        setSyncStatus("error");
        checkLoaded();
      }
    );

    const unsubLots = listenProductLots(
      (data) => {
        setLots(data);
        setSyncStatus("synced");
        checkLoaded();
      },
      (err) => {
        console.error("[useRealtimeInventory] lots listener error:", err);
        setSyncStatus("error");
        checkLoaded();
      }
    );

    const unsubInstruments = listenInstruments(
      (data) => {
        setInstruments(data);
        setSyncStatus("synced");
        checkLoaded();
      },
      (err) => {
        console.error("[useRealtimeInventory] instruments listener error:", err);
        setSyncStatus("error");
        checkLoaded();
      }
    );

    const unsubDiscards = listenDiscards(
      (data) => {
        setDiscards(data);
        setSyncStatus("synced");
        checkLoaded();
      },
      (err) => {
        console.error("[useRealtimeInventory] discards listener error:", err);
        setSyncStatus("error");
        checkLoaded();
      }
    );

    const unsubKits = listenKits(
      (data) => {
        setKits(data);
        setSyncStatus("synced");
        checkLoaded();
      },
      (err) => {
        console.error("[useRealtimeInventory] kits listener error:", err);
        setSyncStatus("error");
        checkLoaded();
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubProducts();
      unsubLots();
      unsubInstruments();
      unsubDiscards();
      unsubKits();
    };
  }, []);

  // Load expiry alerts when products or instruments change
  useEffect(() => {
    if (products.length === 0 && instruments.length === 0) return;
    getAllExpiryAlerts().then(setExpiryAlerts).catch(console.error);
  }, [products, instruments]);

  // ---- PRODUCT HANDLERS ----
  const handleAddProduct = useCallback(async (productData: Omit<InventoryProduct, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    setSyncStatus("syncing");
    const product: InventoryProduct = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await fsCreateProduct(product);
      setSyncStatus("synced");
    } catch (e) {
      console.error("[useRealtimeInventory] Error creating product:", e);
      setSyncStatus("error");
      throw e;
    }
    return product.id;
  }, []);

  const handleUpdateProduct = useCallback(async (product: InventoryProduct) => {
    setSyncStatus("syncing");
    try {
      await fsUpdateProduct({ ...product, updatedAt: new Date().toISOString() });
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      throw e;
    }
  }, []);

  const handleDeleteProduct = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    try {
      await fsDeleteProduct(id);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      throw e;
    }
  }, []);

  // ---- LOT HANDLERS ----
  const handleAddLot = useCallback(async (lotData: Omit<ProductLot, "id" | "receivedAt">): Promise<string> => {
    setSyncStatus("syncing");
    const lot: ProductLot = {
      ...lotData,
      id: `lot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      receivedAt: new Date().toISOString(),
    };
    try {
      await fsCreateProductLot(lot);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
    return lot.id;
  }, []);

  const handleUpdateLot = useCallback(async (lot: ProductLot) => {
    setSyncStatus("syncing");
    try {
      await fsUpdateProductLot(lot);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      throw e;
    }
  }, []);

  const handleDeleteLot = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    try {
      await fsDeleteProductLot(id);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      throw e;
    }
  }, []);

  // ---- INSTRUMENT HANDLERS ----
  const handleAddInstrument = useCallback(async (instrumentData: Omit<SurgicalInstrument, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    setSyncStatus("syncing");
    const instrument: SurgicalInstrument = {
      ...instrumentData,
      id: `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await fsCreateInstrument(instrument);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
    return instrument.id;
  }, []);

  const handleUpdateInstrument = useCallback(async (instrument: SurgicalInstrument) => {
    setSyncStatus("syncing");
    try {
      await fsUpdateInstrument({ ...instrument, updatedAt: new Date().toISOString() });
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      throw e;
    }
  }, []);

  const handleDeleteInstrument = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    try {
      await fsDeleteInstrument(id);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      throw e;
    }
  }, []);

  // ---- DISCARD HANDLERS ----
  const handleAddDiscard = useCallback(async (discardData: Omit<TechnicalDiscard, "id" | "discardedAt">): Promise<string> => {
    setSyncStatus("syncing");
    const discard: TechnicalDiscard = {
      ...discardData,
      id: `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      discardedAt: new Date().toISOString(),
    };
    try {
      await fsCreateDiscard(discard);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
    return discard.id;
  }, []);

  // ---- KIT HANDLERS ----
  const handleAddKit = useCallback(async (kitData: Omit<ProcedureKit, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    setSyncStatus("syncing");
    const kit: ProcedureKit = {
      ...kitData,
      id: `kit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await fsCreateKit(kit);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
    return kit.id;
  }, []);

  const handleUpdateKit = useCallback(async (kit: ProcedureKit) => {
    setSyncStatus("syncing");
    try {
      await fsUpdateKit({ ...kit, updatedAt: new Date().toISOString() });
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      throw e;
    }
  }, []);

  const handleDeleteKit = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    try {
      await fsDeleteKit(id);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      throw e;
    }
  }, []);

  // ---- DISPENSING ----
  const handleDispenseKit = useCallback(async (kitId: string): Promise<DispenseResult> => {
    setSyncStatus("syncing");
    try {
      const result = await fsDispenseProcedureKit(kitId);
      setSyncStatus(result.success ? "synced" : "error");
      return result;
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      return { success: false, dispensedItems: [], errors: ["Erro ao dispensar kit"] };
    }
  }, []);

  return {
    products,
    lots,
    instruments,
    discards,
    kits,
    expiryAlerts,
    isLoading,
    syncStatus,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddLot,
    handleUpdateLot,
    handleDeleteLot,
    handleAddInstrument,
    handleUpdateInstrument,
    handleDeleteInstrument,
    handleAddDiscard,
    handleAddKit,
    handleUpdateKit,
    handleDeleteKit,
    handleDispenseKit,
  };
}
