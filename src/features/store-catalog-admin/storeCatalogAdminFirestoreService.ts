import { addDoc, collection, getDocsFromServer, query, serverTimestamp, where } from "@react-native-firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getOwnerStore } from "../store-admin/storeAdminFirestoreService";
import { effectiveStorePlan } from "../store-admin/storeAdminValidation";
import type { CatalogItemInput, OwnerCatalogData, OwnerCatalogItem, OwnerCatalogResult } from "./storeCatalogAdminTypes";
import { catalogPlanLimit, parseCatalogNumber, validateCatalogInput } from "./storeCatalogAdminValidation";

export class UnconfirmedCatalogCreationError extends Error {
  constructor(readonly catalog: OwnerCatalogData | null) {
    super("No pudimos confirmar el guardado. Revisá el catálogo antes de intentar crear nuevamente; el ítem podría haberse guardado.");
  }
}

function assertSession(uid: string): void {
  if (!uid || auth.currentUser?.uid !== uid) throw new Error("La sesión cambió. Volvé a ingresar a tu catálogo.");
}

function timestampMillis(value: unknown): number {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    const result: unknown = value.toMillis();
    return typeof result === "number" && Number.isFinite(result) ? result : 0;
  }
  return 0;
}

function mapItem(id: string, data: Record<string, unknown>): OwnerCatalogItem {
  const text = (value: unknown) => String(value ?? "").trim();
  const number = (value: unknown) => {
    const result = Number(value ?? 0);
    return Number.isFinite(result) ? Math.max(0, result) : 0;
  };
  const images = [...(Array.isArray(data.imageUrls) ? data.imageUrls : []), data.imageUrl]
    .map(text).filter(Boolean);
  const type = data.type === "service" ? "service" : "product";
  return {
    id, storeId: text(data.storeId), name: text(data.name), type,
    price: number(data.price), stock: type === "service" ? 0 : Math.trunc(number(data.stock)),
    category: text(data.category) || "Otros", active: data.active !== false,
    imageUrl: images[0] || "", createdAtMillis: timestampMillis(data.createdAt),
  };
}

async function readStoreItems(uid: string, storeId: string): Promise<OwnerCatalogItem[]> {
  assertSession(uid);
  const snapshot = await getDocsFromServer(query(collection(db, "products"), where("storeId", "==", storeId)));
  assertSession(uid);
  return snapshot.docs.map((item) => mapItem(item.id, item.data()))
    .filter((item) => item.storeId === storeId)
    .sort((a, b) => b.createdAtMillis - a.createdAtMillis || a.id.localeCompare(b.id));
}

export async function getOwnerCatalog(uid: string): Promise<OwnerCatalogResult> {
  assertSession(uid);
  const result = await getOwnerStore(uid);
  if (result.kind !== "single") return result;
  if (result.store.ownerId !== uid) throw new Error("No podés administrar esta tienda.");
  const items = await readStoreItems(uid, result.store.id);
  return { kind: "single", store: result.store, items };
}

const pending = new Set<string>();

export async function createOwnerCatalogItem(
  uid: string,
  expectedStoreId: string,
  input: CatalogItemInput,
  isCurrent: () => boolean,
): Promise<OwnerCatalogData> {
  assertSession(uid);
  if (pending.has(uid)) throw new Error("Ya hay un guardado en curso.");
  const errors = validateCatalogInput(input);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  pending.add(uid);
  try {
    const fresh = await getOwnerCatalog(uid);
    if (fresh.kind === "multiple") throw new Error("Hay más de una tienda asociada a tu cuenta. Volvé al catálogo y revisá la asociación.");
    if (fresh.kind === "empty") throw new Error("Tu cuenta ya no tiene una tienda. Volvé a Mi tienda.");
    if (fresh.store.id !== expectedStoreId) throw new Error("La tienda cambió. Volvé a abrir el catálogo.");
    const limit = catalogPlanLimit(effectiveStorePlan(fresh.store));
    if (fresh.items.length >= limit) throw new Error(`Tu plan permite hasta ${limit} ítems, incluidos productos, servicios y pausados. Alcanzaste ese límite.`);
    assertSession(uid);
    if (!isCurrent()) throw new Error("Esta operación ya no está vigente.");
    const payload = {
      storeId: fresh.store.id, storeOwnerId: fresh.store.ownerId, storeName: fresh.store.name,
      city: fresh.store.city, province: fresh.store.province,
      type: input.type, name: input.name.trim(), description: input.description.trim(),
      price: parseCatalogNumber(input.price), category: input.category.trim(),
      stock: input.type === "service" ? 0 : parseCatalogNumber(input.stock),
      active: true, featured: false, imageUrl: "", imageUrls: [],
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    };
    let id: string;
    try {
      id = (await addDoc(collection(db, "products"), payload)).id;
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (["permission-denied", "unauthenticated", "invalid-argument"].some((value) => code === value || code === `firestore/${value}`)) throw error;
      // addDoc no entrega el autoId si rechaza. Coincidencias de contenido no
      // identifican de forma segura una escritura frente a altas concurrentes.
      let reconciled: OwnerCatalogData | null = null;
      if (isCurrent() && auth.currentUser?.uid === uid) {
        try {
          const result = await getOwnerCatalog(uid);
          if (result.kind === "single" && result.store.id === expectedStoreId) reconciled = result;
        } catch { /* Se conserva el resultado incierto y nunca se repite el alta. */ }
      }
      throw new UnconfirmedCatalogCreationError(reconciled);
    }
    // El ACK confirma la creación; una lectura posterior fallida no debe
    // presentarla como fallida ni habilitar un alta duplicada.
    const item = mapItem(id, { ...payload, createdAt: undefined });
    return { store: fresh.store, items: [item, ...fresh.items.filter((entry) => entry.id !== id)] };
  } finally {
    pending.delete(uid);
  }
}
