import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "@react-native-firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  ExploreData,
  ExploreListing,
  ExploreService,
  ExploreStore,
  ListingStatus,
  ServicePaymentStatus,
  ServicePriceType,
  ServiceResponseTime,
  StorePlan,
} from "./exploreTypes";

type FirestoreData = Record<string, unknown>;

interface ListingStockState {
  stockTotal: number;
  reservedUnits: number;
  soldUnits: number;
  availableUnits: number;
}

function normalizeOptionalText(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim();

  return normalized || undefined;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function normalizeImageUrls(data: FirestoreData): string[] {
  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls.map((url) => String(url ?? "").trim())
    : [];

  const imageUrl = String(data.imageUrl ?? "").trim();

  return Array.from(
    new Set([...imageUrls, imageUrl].filter(Boolean)),
  );
}

function normalizePositiveInteger(
  value: unknown,
  fallback = 1,
): number {
  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    !Number.isInteger(numericValue) ||
    numericValue < 1
  ) {
    return fallback;
  }

  return numericValue;
}

function normalizeNonNegativeInteger(
  value: unknown,
  fallback = 0,
): number {
  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    !Number.isInteger(numericValue) ||
    numericValue < 0
  ) {
    return fallback;
  }

  return numericValue;
}

function getTimestampMillis(value: unknown): number {
  if (value instanceof Date) {
    const millis = value.getTime();

    return Number.isFinite(millis) ? millis : 0;
  }

  if (value && typeof value === "object") {
    const candidate = value as {
      toDate?: () => Date;
    };

    if (typeof candidate.toDate === "function") {
      const date = candidate.toDate();

      if (date instanceof Date) {
        const millis = date.getTime();

        return Number.isFinite(millis) ? millis : 0;
      }
    }
  }

  return 0;
}

// ============================================================
// Marketplace listings
// ============================================================

function getListingStockState(
  data: FirestoreData,
): ListingStockState {
  const stockTotal = normalizePositiveInteger(
    data.stockTotal,
    1,
  );

  const hasStoredSoldUnits =
    Number.isInteger(Number(data.soldUnits)) &&
    Number(data.soldUnits) >= 0;

  const hasStoredReservedUnits =
    Number.isInteger(Number(data.reservedUnits)) &&
    Number(data.reservedUnits) >= 0;

  const legacySold =
    data.sold === true ||
    data.status === "sold";

  const legacyPending =
    data.status === "pending_confirmation" &&
    !legacySold;

  const rawSoldUnits = hasStoredSoldUnits
    ? normalizeNonNegativeInteger(data.soldUnits)
    : legacySold
      ? 1
      : 0;

  const soldUnits = Math.min(
    rawSoldUnits,
    stockTotal,
  );

  const maxReservableUnits = Math.max(
    stockTotal - soldUnits,
    0,
  );

  const rawReservedUnits = hasStoredReservedUnits
    ? normalizeNonNegativeInteger(data.reservedUnits)
    : legacyPending
      ? 1
      : 0;

  const reservedUnits = Math.min(
    rawReservedUnits,
    maxReservableUnits,
  );

  const availableUnits = Math.max(
    stockTotal - soldUnits - reservedUnits,
    0,
  );

  return {
    stockTotal,
    reservedUnits,
    soldUnits,
    availableUnits,
  };
}

function getListingStatus(
  stock: ListingStockState,
): ListingStatus {
  if (stock.soldUnits >= stock.stockTotal) {
    return "sold";
  }

  if (
    stock.availableUnits === 0 &&
    stock.reservedUnits > 0
  ) {
    return "pending_confirmation";
  }

  return "active";
}

function mapListing(
  id: string,
  data: FirestoreData,
): ExploreListing {
  const imageUrls = normalizeImageUrls(data);
  const stock = getListingStockState(data);
  const status = getListingStatus(stock);

  return {
    id,
    title: String(data.title ?? ""),
    price: Number(data.price ?? 0),
    description: String(data.description ?? ""),
    category: String(data.category ?? "Otros"),
    location: String(data.location ?? ""),
    imageUrl: imageUrls[0] || "",
    imageUrls,
    userId: String(data.userId ?? ""),
    userName: String(data.userName ?? "Usuario"),
    storeId: normalizeOptionalText(data.storeId),
    storeName: normalizeOptionalText(data.storeName),
    views: Number(data.views ?? 0),
    sold: status === "sold",
    status,
    stockTotal: stock.stockTotal,
    reservedUnits: stock.reservedUnits,
    soldUnits: stock.soldUnits,
    availableUnits: stock.availableUnits,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getExploreListings(): Promise<ExploreListing[]> {
  const listingsQuery = query(
    collection(db, "listings"),
    orderBy("createdAt", "desc"),
  );

  const snapshot = await getDocs(listingsQuery);

  return snapshot.docs
    .map((document) =>
      mapListing(
        document.id,
        document.data() as FirestoreData,
      ),
    )
    .filter((listing) => listing.availableUnits > 0);
}

export async function getExploreListingById(
  listingId: string,
): Promise<ExploreListing | null> {
  const normalizedListingId = String(listingId ?? "").trim();

  if (!normalizedListingId) {
    return null;
  }

  const snapshot = await getDoc(
    doc(db, "listings", normalizedListingId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return mapListing(
    snapshot.id,
    snapshot.data() as FirestoreData,
  );
}

// ============================================================
// Professional services
// ============================================================

function normalizeServicePriceType(
  value: unknown,
): ServicePriceType {
  if (
    value === "fixed" ||
    value === "from" ||
    value === "quote" ||
    value === "hourly"
  ) {
    return value;
  }

  return "from";
}

function normalizeServiceResponseTime(
  value: unknown,
): ServiceResponseTime {
  if (
    value === "fast" ||
    value === "normal" ||
    value === "slow" ||
    value === "unknown"
  ) {
    return value;
  }

  return "unknown";
}

function normalizeServicePaymentStatus(
  value: unknown,
  active: boolean,
  paymentRequired: boolean,
): ServicePaymentStatus {
  if (
    value === "pending_payment" ||
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled"
  ) {
    return value;
  }

  if (!paymentRequired) {
    return "approved";
  }

  return active
    ? "approved"
    : "pending_payment";
}

function mapService(
  id: string,
  data: FirestoreData,
): ExploreService {
  const imageUrls = normalizeImageUrls(data);
  const active = data.active !== false;
  const paymentRequired =
    data.paymentRequired === true;

  return {
    id,
    userId: String(data.userId ?? ""),
    userName: String(
      data.userName ?? "Profesional",
    ),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? "Otros"),
    specialty: String(data.specialty ?? ""),
    keywords: normalizeStringArray(data.keywords),
    city: String(data.city ?? "Neuquén"),
    province: String(data.province ?? "Neuquén"),
    zones: normalizeStringArray(data.zones),
    priceType: normalizeServicePriceType(
      data.priceType,
    ),
    price: Number(data.price ?? 0),
    whatsapp: String(data.whatsapp ?? "").trim(),
    phone: String(data.phone ?? "").trim(),
    imageUrl: imageUrls[0] || "",
    imageUrls,
    experienceYears: Number(
      data.experienceYears ?? 0,
    ),
    responseTime: normalizeServiceResponseTime(
      data.responseTime,
    ),
    completedJobs: Number(
      data.completedJobs ?? 0,
    ),
    active,
    verified: data.verified === true,
    featured: data.featured === true,
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    views: Number(data.views ?? 0),
    paymentRequired,
    paymentStatus:
      normalizeServicePaymentStatus(
        data.paymentStatus,
        active,
        paymentRequired,
      ),
    publicationExpiresAt:
      data.publicationExpiresAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function isServicePublicationAvailable(
  service: ExploreService,
  now = new Date(),
): boolean {
  if (!service.active) {
    return false;
  }

  if (!service.paymentRequired) {
    return true;
  }

  if (service.paymentStatus !== "approved") {
    return false;
  }

  const expirationMillis = getTimestampMillis(
    service.publicationExpiresAt,
  );

  // Compatibilidad con servicios aprobados antes
  // de incorporar fecha de vencimiento.
  if (expirationMillis === 0) {
    return true;
  }

  return expirationMillis > now.getTime();
}

function getServiceScore(
  service: ExploreService,
): number {
  let score = 0;

  if (service.featured) {
    score += 1000;
  }

  if (service.verified) {
    score += 700;
  }

  score += service.rating * 120;
  score += Math.min(service.reviewCount, 100) * 8;
  score += Math.min(service.completedJobs, 100) * 6;
  score += Math.min(service.experienceYears, 30) * 10;
  score += Math.min(service.views, 1000) * 0.2;

  if (service.responseTime === "fast") {
    score += 160;
  }

  if (service.responseTime === "normal") {
    score += 80;
  }

  if (service.responseTime === "slow") {
    score += 20;
  }

  score +=
    getTimestampMillis(service.createdAt) /
    100000000000;

  return score;
}

function sortServicesByProfessionalRanking(
  services: ExploreService[],
): ExploreService[] {
  return [...services].sort(
    (serviceA, serviceB) =>
      getServiceScore(serviceB) -
      getServiceScore(serviceA),
  );
}

export async function getExploreServices(): Promise<ExploreService[]> {
  const servicesQuery = query(
    collection(db, "services"),
    where("active", "==", true),
  );

  const snapshot = await getDocs(servicesQuery);

  const services = snapshot.docs
    .map((document) =>
      mapService(
        document.id,
        document.data() as FirestoreData,
      ),
    )
    .filter((service) =>
      isServicePublicationAvailable(service),
    );

  return sortServicesByProfessionalRanking(
    services,
  );
}

export async function getExploreServiceById(
  serviceId: string,
): Promise<ExploreService | null> {
  const normalizedServiceId =
    String(serviceId ?? "").trim();

  if (!normalizedServiceId) {
    return null;
  }

  const snapshot = await getDoc(
    doc(db, "services", normalizedServiceId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  const service = mapService(
    snapshot.id,
    snapshot.data() as FirestoreData,
  );

  if (!isServicePublicationAvailable(service)) {
    return null;
  }

  return service;
}

// ============================================================
// Stores
// ============================================================

function normalizeStorePlan(
  value: unknown,
): StorePlan {
  if (
    value === "premium" ||
    value === "premium_plus"
  ) {
    return value;
  }

  return "free";
}

function isStorePlanExpired(
  plan: StorePlan,
  planExpiresAt: unknown,
): boolean {
  if (plan === "free") {
    return false;
  }

  const expiresAtMillis =
    getTimestampMillis(planExpiresAt);

  if (expiresAtMillis === 0) {
    return true;
  }

  return expiresAtMillis <= Date.now();
}

function getEffectiveStorePlan(
  plan: StorePlan,
  planExpiresAt: unknown,
): StorePlan {
  if (plan === "free") {
    return "free";
  }

  return isStorePlanExpired(
    plan,
    planExpiresAt,
  )
    ? "free"
    : plan;
}

function mapStore(
  id: string,
  data: FirestoreData,
): ExploreStore {
  const rawPlan = normalizeStorePlan(data.plan);
  const planExpiresAt =
    data.planExpiresAt ?? null;

  const planExpired = isStorePlanExpired(
    rawPlan,
    planExpiresAt,
  );

  const effectivePlan = getEffectiveStorePlan(
    rawPlan,
    planExpiresAt,
  );

  return {
    id,
    ownerId: String(data.ownerId ?? ""),
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    logoUrl: String(data.logoUrl ?? ""),
    bannerUrl: String(data.bannerUrl ?? ""),
    address: String(data.address ?? ""),
    city: String(data.city ?? "Neuquén"),
    province: String(data.province ?? "Neuquén"),
    category: String(data.category ?? "Otros"),
    verified: Boolean(data.verified),
    featured:
      effectivePlan === "free"
        ? false
        : data.featured === true,
    views: Number(data.views ?? 0),
    plan: effectivePlan,
    planExpiresAt,
    planExpired,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getExploreStores(): Promise<ExploreStore[]> {
  const snapshot = await getDocs(
    collection(db, "stores"),
  );

  return snapshot.docs
    .map((document) =>
      mapStore(
        document.id,
        document.data() as FirestoreData,
      ),
    )
    .sort((storeA, storeB) =>
      storeA.name.localeCompare(
        storeB.name,
        "es",
        {
          sensitivity: "base",
        },
      ),
    );
}

export async function getExploreStoreById(
  storeId: string,
): Promise<ExploreStore | null> {
  const normalizedStoreId = String(storeId ?? "").trim();

  if (!normalizedStoreId) {
    return null;
  }

  const snapshot = await getDoc(
    doc(db, "stores", normalizedStoreId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return mapStore(
    snapshot.id,
    snapshot.data() as FirestoreData,
  );
}

// ============================================================
// Combined Explore load
// ============================================================

export async function getExploreData(): Promise<ExploreData> {
  const [
    listings,
    services,
    stores,
  ] = await Promise.all([
    getExploreListings(),
    getExploreServices(),
    getExploreStores(),
  ]);

  return {
    listings,
    services,
    stores,
  };
}
