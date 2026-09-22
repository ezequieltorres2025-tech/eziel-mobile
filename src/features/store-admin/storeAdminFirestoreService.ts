import { addDoc, collection, getDocsFromServer, query, serverTimestamp, where } from "@react-native-firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_VISIBLE_SECTIONS, type CreateStoreInput, type OwnerStoreResult, type StoreAdmin } from "./storeAdminTypes";
import { normalizeStoreInput, validateStoreInput } from "./storeAdminValidation";

export class MultipleStoresError extends Error {
  constructor() { super("Encontramos más de una tienda asociada a tu cuenta."); }
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
