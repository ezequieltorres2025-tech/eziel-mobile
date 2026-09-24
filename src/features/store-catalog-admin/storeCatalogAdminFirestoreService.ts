import { addDoc, collection, deleteDoc, doc, getDocFromServer, getDocsFromServer, query, serverTimestamp, updateDoc, where } from "@react-native-firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getOwnerStore } from "../store-admin/storeAdminFirestoreService";
import { effectiveStorePlan } from "../store-admin/storeAdminValidation";
import type { CatalogItemDetail, CatalogItemInput, CatalogMutation, OwnerCatalogData, OwnerCatalogItem, OwnerCatalogResult } from "./storeCatalogAdminTypes";
import { catalogEditPatch, catalogPlanLimit, parseCatalogNumber, validateCatalogEdit, validateCatalogInput } from "./storeCatalogAdminValidation";

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

export class CatalogAccessError extends Error {
  constructor(readonly kind: "missing" | "forbidden", message: string) { super(message); }
}

export class CatalogReviewRequiredError extends Error {}

const canonicalOffers = ["offerActive", "oldPrice", "discountPercent", "offerEndsAt", "offerStartedAt"];
const legacyOffers = ["originalPrice", "compareAtPrice", "priceBeforeDiscount", "offerExpiresAt",
  "discountEndsAt", "saleEndsAt", "saleStartedAt", "isOffer", "onSale", "saleActive"];

function mapDetail(id: string, data: Record<string, unknown>): CatalogItemDetail {
  const has = (key: string) => Object.prototype.hasOwnProperty.call(data, key);
  const offerFields: Record<string, unknown> = {};
  for (const key of [...canonicalOffers, ...legacyOffers]) if (has(key)) offerFields[key] = data[key];
  const offer = legacyOffers.some(has) ? "blocked"
    : !canonicalOffers.some(has) ? "none"
    : canonicalOffers.every(has) && data.offerActive === false && data.oldPrice === null &&
      data.discountPercent === 0 && data.offerEndsAt === null && data.offerStartedAt === null ? "inactive" : "blocked";
  const text = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";
  return {
    id, storeId: String(data.storeId), storeOwnerId: String(data.storeOwnerId), storeName: data.storeName,
    input: { name: text(data.name), description: text(data.description), category: text(data.category),
      type: data.type === "service" ? "service" : "product", price: text(data.price), stock: text(data.stock) },
    original: { name: data.name, description: data.description, category: data.category,
      type: data.type, price: data.price, stock: data.stock, active: data.active },
    active: data.active !== false, featured: data.featured, imageUrl: data.imageUrl, imageUrls: data.imageUrls,
    city: data.city, province: data.province, createdAt: data.createdAt, updatedAt: data.updatedAt,
    offer, offerFields,
  };
}

async function readOwnedItem(uid: string, storeId: string, id: string) {
  assertSession(uid);
  const owner = await getOwnerStore(uid);
  assertSession(uid);
  if (owner.kind !== "single" || owner.store.id !== storeId || owner.store.ownerId !== uid) {
    throw new CatalogAccessError("forbidden", "No se pudo verificar una única tienda propia. Volvé a abrir Mi tienda.");
  }
  const snapshot = await getDocFromServer(doc(db, "products", id));
  assertSession(uid);
  if (!snapshot.exists()) throw new CatalogAccessError("missing", "Este ítem ya no existe en el catálogo.");
  const data = snapshot.data()!;
  if (data.storeId !== storeId || data.storeOwnerId !== uid) {
    throw new CatalogAccessError("forbidden", "Este ítem no pertenece a tu tienda.");
  }
  return { data, detail: mapDetail(id, data) };
}

export async function getOwnerCatalogItem(uid: string, storeId: string, id: string): Promise<CatalogItemDetail> {
  return (await readOwnedItem(uid, storeId, id)).detail;
}

export async function mutateOwnerCatalogItem(
  uid: string, initial: CatalogItemDetail, mutation: CatalogMutation, isCurrent: () => boolean,
): Promise<OwnerCatalogItem | null> {
  assertSession(uid);
  if (pending.has(uid)) throw new Error("Ya hay un guardado en curso.");
  pending.add(uid);
  try {
    const { data, detail: fresh } = await readOwnedItem(uid, initial.storeId, initial.id);
    const patch: Record<string, string | number | boolean> = {};
    if (mutation.kind !== "delete") {
      if (fresh.offer === "blocked") throw new CatalogReviewRequiredError("Este ítem tiene una configuración de oferta que todavía se administra desde la versión Web de Eziel. Recargá el ítem.");
      if (mutation.kind === "edit") {
        const error = validateCatalogEdit(initial, mutation.input);
        if (error) throw new Error(error);
        Object.assign(patch, catalogEditPatch(initial, mutation.input));
        const keys = new Set(Object.keys(patch) as (keyof CatalogItemInput)[]);
        if (keys.has("type") || keys.has("stock")) { keys.add("type"); keys.add("stock"); }
        if ([...keys].some((key) => !Object.is(initial.original[key], fresh.original[key]))) {
          throw new CatalogReviewRequiredError("El ítem cambió desde otro dispositivo en un campo que estás editando. Conservamos tu borrador; recargá el ítem antes de volver a guardar.");
        }
      } else {
        if (!Object.is(initial.original.active, fresh.original.active)) {
          throw new CatalogReviewRequiredError("El estado cambió desde otro dispositivo. Recargá el ítem.");
        }
        if (mutation.active && fresh.input.type === "product" &&
            (!Number.isFinite(Number(fresh.original.stock)) || Number(fresh.original.stock) <= 0)) {
          throw new Error("Para reactivar este producto, primero guardá un stock mayor a cero.");
        }
        if (fresh.active !== mutation.active) patch.active = mutation.active;
      }
      if (!Object.keys(patch).length) return mapItem(initial.id, data);
    }
    assertSession(uid);
    if (!isCurrent()) throw new Error("Esta operación ya no está vigente.");
    const reference = doc(db, "products", initial.id);
    try {
      if (mutation.kind === "delete") await deleteDoc(reference);
      else await updateDoc(reference, { ...patch, updatedAt: serverTimestamp() });
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code).replace(/^firestore\//, "") : "";
      if (["permission-denied", "unauthenticated", "invalid-argument", "not-found"].includes(code)) throw error;
      // Una sola comprobación del estado observable; nunca se repite la escritura.
      if (isCurrent() && auth.currentUser?.uid === uid) {
        try {
          const snapshot = await getDocFromServer(reference);
          assertSession(uid);
          if (isCurrent()) {
            if (mutation.kind === "delete" && !snapshot.exists()) return null;
            const observed = snapshot.data();
            if (mutation.kind !== "delete" && observed?.storeId === initial.storeId && observed.storeOwnerId === uid &&
                Object.entries(patch).every(([key, value]) => Object.is(observed[key], value))) {
              return mapItem(initial.id, observed);
            }
          }
        } catch { /* La falta de lectura mantiene el resultado incierto. */ }
      }
      throw new CatalogReviewRequiredError("Resultado incierto: no pudimos confirmar la operación. Revisá o recargá el ítem antes de volver a intentar. No repetimos la escritura.");
    }
    // El ACK es suficiente; no convertir un fallo posterior de lectura en fallo de escritura.
    return mutation.kind === "delete" ? null : mapItem(initial.id, { ...data, ...patch });
  } finally { pending.delete(uid); }
}

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
