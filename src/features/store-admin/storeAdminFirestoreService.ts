import { addDoc, collection, doc, getDocsFromServer, query, serverTimestamp, updateDoc, where } from "@react-native-firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_VISIBLE_SECTIONS, STORE_INFORMATION_FIELDS, type CreateStoreInput, type OwnerStoreResult, type StoreAdmin, type StoreInformationChanges } from "./storeAdminTypes";
import { normalizeStoreInput, validateStoreInput } from "./storeAdminValidation";

export class MultipleStoresError extends Error {
  constructor() { super("Encontramos más de una tienda asociada a tu cuenta."); }
}

export class StoreGpsConfirmationRequiredError extends Error {
  constructor() { super("Es necesario confirmar la ubicación GPS guardada."); }
}

export class UnconfirmedStoreCreationError extends Error {
  constructor() { super("No pudimos confirmar si tu tienda se creó. Reintentá la consulta antes de volver a crearla."); }
}

function assertOwner(ownerId: string): void {
  if (!ownerId || ownerId.includes("/") || auth.currentUser?.uid !== ownerId) {
    throw new Error("La sesión cambió. Volvé a ingresar para administrar tu tienda.");
  }
}

function mapStore(id: string, data: Record<string, unknown>): StoreAdmin {
  const text = (key: string) => String(data[key] ?? "");
  const coordinate = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(String(value).replace(",", "."));
    return Number.isFinite(number) ? number : null;
  };
  const sections = data.visibleSections && typeof data.visibleSections === "object"
    ? data.visibleSections as Record<string, unknown> : {};
  const visibleSections = { ...DEFAULT_VISIBLE_SECTIONS };
  for (const key of Object.keys(visibleSections) as (keyof typeof visibleSections)[]) {
    if (typeof sections[key] === "boolean") visibleSections[key] = sections[key];
  }
  return {
    id, ownerId: text("ownerId"), name: text("name"), category: text("category") || "Otros",
    description: text("description"), logoUrl: text("logoUrl"), bannerUrl: text("bannerUrl"),
    phone: text("phone"), whatsapp: text("whatsapp"), address: text("address"),
    city: text("city") || "Neuquén", province: text("province") || "Neuquén",
    latitude: coordinate(data.latitude), longitude: coordinate(data.longitude),
    instagram: text("instagram"), facebook: text("facebook"), website: text("website"),
    verified: Boolean(data.verified), featured: data.featured === true, views: Number(data.views ?? 0),
    plan: data.plan === "premium" || data.plan === "premium_plus" ? data.plan : "free",
    planExpiresAt: data.planExpiresAt ?? null, themeColor: text("themeColor") || "orange",
    heroStyle: text("heroStyle") || "classic", promoText: text("promoText"), promoEnabled: data.promoEnabled === true,
    featuredProductIds: Array.isArray(data.featuredProductIds) ? data.featuredProductIds.map(String) : [],
    visibleSections, createdAt: data.createdAt, updatedAt: data.updatedAt,
  };
}

export async function getOwnerStore(ownerId: string): Promise<OwnerStoreResult> {
  assertOwner(ownerId);
  const snapshot = await getDocsFromServer(query(collection(db, "stores"), where("ownerId", "==", ownerId)));
  assertOwner(ownerId);
  if (snapshot.empty) return { kind: "empty" };
  if (snapshot.size > 1) return { kind: "multiple" };
  return { kind: "single", store: mapStore(snapshot.docs[0].id, snapshot.docs[0].data()) };
}

const pendingCreations = new Set<string>();

export async function updateOwnerStoreInformation(
  ownerId: string,
  storeId: string,
  changes: StoreInformationChanges,
  gpsChangeConfirmed = false,
): Promise<StoreAdmin> {
  assertOwner(ownerId);
  if (!storeId.trim() || storeId.includes("/")) throw new Error("La tienda no es válida.");
  const result = await getOwnerStore(ownerId);
  if (result.kind === "multiple") throw new MultipleStoresError();
  if (result.kind === "empty") throw new Error("No encontramos una tienda asociada a tu cuenta.");
  const current = result.store;
  if (current.id !== storeId) throw new Error("La tienda ya no coincide con la asociada a tu cuenta.");

  const patch: StoreInformationChanges = {};
  // Solo se leen claves propias de la whitelist; nunca se copia el objeto del caller.
  for (const field of STORE_INFORMATION_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(changes, field)) continue;
    const value: unknown = changes[field];
    if (typeof value !== "string") throw new Error("Los datos comerciales deben ser texto.");
    let normalized = value.trim();
    if (field === "category" && !normalized) normalized = "Otros";
    if (field === "province" && !normalized) normalized = "Neuquén";
    if (normalized !== current[field]) patch[field] = normalized;
  }
  if (Object.keys(patch).length === 0) return current;
  const errors = validateStoreInput({ ...current, ...patch });
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const locationChanged = "address" in patch || "city" in patch || "province" in patch;
  const hasCoordinates = current.latitude !== null && current.longitude !== null &&
    Number.isFinite(current.latitude) && Number.isFinite(current.longitude) &&
    Math.abs(current.latitude) <= 90 && Math.abs(current.longitude) <= 180;
  if (locationChanged && hasCoordinates && !gpsChangeConfirmed) {
    throw new StoreGpsConfirmationRequiredError();
  }
  assertOwner(ownerId);
  await updateDoc(doc(db, "stores", storeId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
  // No se inventa un timestamp local ni se exige una segunda lectura tras el ACK.
  return { ...current, ...patch, updatedAt: undefined };
}

export async function createOwnerStore(ownerId: string, input: CreateStoreInput): Promise<StoreAdmin> {
  assertOwner(ownerId);
  const normalized = normalizeStoreInput(input);
  const errors = validateStoreInput(normalized);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  if (pendingCreations.has(ownerId)) throw new Error("Ya hay una creación en curso. Esperá su resultado.");
  pendingCreations.add(ownerId);
  try {
    const existing = await getOwnerStore(ownerId);
    if (existing.kind === "multiple") throw new MultipleStoresError();
    if (existing.kind === "single") return existing.store;
    assertOwner(ownerId);
    const data = {
      ownerId, ...normalized, logoUrl: "", bannerUrl: "", latitude: null, longitude: null,
      instagram: "", facebook: "", website: "", verified: false, featured: false,
      views: 0, plan: "free", planExpiresAt: null, themeColor: "orange", heroStyle: "classic",
      promoText: "", promoEnabled: false, featuredProductIds: [],
      visibleSections: { ...DEFAULT_VISIBLE_SECTIONS },
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    };
    try {
      const created = await addDoc(collection(db, "stores"), data);
      return mapStore(created.id, data);
    } catch {
      let reconciled: OwnerStoreResult;
      try { reconciled = await getOwnerStore(ownerId); }
      catch { throw new UnconfirmedStoreCreationError(); }
      if (reconciled.kind === "single") return reconciled.store;
      if (reconciled.kind === "multiple") throw new MultipleStoresError();
      throw new UnconfirmedStoreCreationError();
    }
  } finally {
    pendingCreations.delete(ownerId);
  }
}
