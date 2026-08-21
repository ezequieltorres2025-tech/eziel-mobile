import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "@react-native-firebase/firestore";

import { db } from "@/lib/firebase";

export type ListingStatus = "active" | "pending_confirmation" | "sold";

export interface CreateListingData {
  title: string;
  price: number;
  description: string;
  category: string;
  location: string;
  imageUrl: string;
  imageUrls?: string[];
  userId: string;
  userName: string;
  storeId?: string;
  storeName?: string;
  stockTotal?: number;
}

export interface OwnerStore {
  id: string;
  name: string;
}

function normalizeRequiredText(value: unknown, fieldName: string): string {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: unknown): string | undefined {
  const normalizedValue = String(value ?? "").trim();

  return normalizedValue || undefined;
}

function normalizeImageUrls(values: unknown[]): string[] {
  return Array.from(
    new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );
}

function normalizeStockTotal(value: number | undefined): number {
  if (value === undefined) {
    return 1;
  }

  if (!Number.isFinite(value)) {
    return 1;
  }

  const normalizedValue = Math.trunc(value);

  return normalizedValue >= 1 ? normalizedValue : 1;
}

function normalizePrice(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("El precio de la publicación es inválido.");
  }

  if (value < 0) {
    throw new Error("El precio no puede ser negativo.");
  }

  return value;
}

export async function getStoreByOwnerId(
  ownerId: string,
): Promise<OwnerStore | null> {
  const normalizedOwnerId = ownerId.trim();

  if (!normalizedOwnerId) {
    return null;
  }

  const storesQuery = query(
    collection(db, "stores"),
    where("ownerId", "==", normalizedOwnerId),
  );

  const snapshot = await getDocs(storesQuery);

  if (snapshot.empty) {
    return null;
  }

  const storeDocument = snapshot.docs[0];

  const storeData = storeDocument.data();

  const storeName = normalizeOptionalText(storeData.name);

  if (!storeName) {
    return null;
  }

  return {
    id: storeDocument.id,
    name: storeName,
  };
}

export async function createListing(data: CreateListingData): Promise<string> {
  const title = normalizeRequiredText(data.title, "El título");

  const description = normalizeRequiredText(data.description, "La descripción");

  const category = normalizeRequiredText(data.category, "La categoría");

  const location = normalizeRequiredText(data.location, "La ubicación");

  const userId = normalizeRequiredText(data.userId, "El usuario");

  const userName = normalizeOptionalText(data.userName) ?? "Usuario";

  const price = normalizePrice(data.price);

  const stockTotal = normalizeStockTotal(data.stockTotal);

  const imageUrls = normalizeImageUrls([
    ...(Array.isArray(data.imageUrls) ? data.imageUrls : []),
    data.imageUrl,
  ]);

  if (imageUrls.length === 0) {
    throw new Error("La publicación debe tener al menos una imagen.");
  }

  const storeId = normalizeOptionalText(data.storeId);

  const storeName = normalizeOptionalText(data.storeName);

  const listingData = {
    title,
    price,
    description,
    category,
    location,
    imageUrl: imageUrls[0],
    imageUrls,
    userId,
    userName,

    ...(storeId && storeName
      ? {
          storeId,
          storeName,
        }
      : {}),

    stockTotal,
    views: 0,
    sold: false,
    status: "active" as ListingStatus,
    reservedUnits: 0,
    soldUnits: 0,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const listingReference = await addDoc(
    collection(db, "listings"),
    listingData,
  );

  return listingReference.id;
}
