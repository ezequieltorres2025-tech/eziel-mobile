import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  StoreCatalogItem,
  StoreCatalogItemType,
  StoreDetailPlan,
  StoreDetailStore,
} from "./storeDetailTypes";

type FirestoreData =
  Record<string, unknown>;

const STORE_VIEW_COOLDOWN_MS =
  24 * 60 * 60 * 1000;

const storeViewClaims =
  new Map<string, number>();

function normalizeString(
  value: unknown,
): string {
  return String(value ?? "").trim();
}

function normalizeNumber(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function normalizeCoordinate(
  value: unknown,
  min: number,
  max: number,
): number | null {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" &&
      !value.trim())
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    return null;
  }

  return parsed;
}

function normalizeStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) =>
          normalizeString(item),
        )
        .filter(Boolean),
    ),
  );
}

function normalizeImageUrls(
  data: FirestoreData,
): string[] {
  return Array.from(
    new Set(
      [
        ...normalizeStringArray(
          data.imageUrls,
        ),
        normalizeString(data.imageUrl),
      ].filter(Boolean),
    ),
  );
}

function normalizeStorePlan(
  value: unknown,
): StoreDetailPlan {
  if (
    value === "premium_plus" ||
    value === "premium"
  ) {
    return value;
  }

  return "free";
}

function getTimestampMillis(
  value: unknown,
): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const candidate = value as {
      toDate?: () => Date;
      toMillis?: () => number;
    };

    if (
      typeof candidate.toMillis ===
      "function"
    ) {
      const millis =
        candidate.toMillis();

      return Number.isFinite(millis)
        ? millis
        : 0;
    }

    if (
      typeof candidate.toDate ===
      "function"
    ) {
      return candidate
        .toDate()
        .getTime();
    }
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function isStorePlanExpired(
  plan: StoreDetailPlan,
  planExpiresAt: unknown,
): boolean {
  if (plan === "free") {
    return false;
  }

  const expiresAt =
    getTimestampMillis(
      planExpiresAt,
    );

  if (!expiresAt) {
    return true;
  }

  return expiresAt <= Date.now();
}

function getEffectiveStorePlan(
  plan: StoreDetailPlan,
  planExpiresAt: unknown,
): StoreDetailPlan {
  return isStorePlanExpired(
    plan,
    planExpiresAt,
  )
    ? "free"
    : plan;
}

function normalizeVisibleSections(
  value: unknown,
): Record<string, boolean> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const result: Record<string, boolean> =
    {};

  for (
    const [key, rawValue]
    of Object.entries(
      value as Record<
        string,
        unknown
      >,
    )
  ) {
    if (
      typeof rawValue === "boolean"
    ) {
      result[key] = rawValue;
    }
  }

  return result;
}

function mapStore(
  id: string,
  data: FirestoreData,
): StoreDetailStore {
  const rawPlan =
    normalizeStorePlan(data.plan);

  const planExpiresAt =
    data.planExpiresAt ?? null;

  const plan =
    getEffectiveStorePlan(
      rawPlan,
      planExpiresAt,
    );

  const planExpired =
    isStorePlanExpired(
      rawPlan,
      planExpiresAt,
    );

  return {
    id,
    ownerId:
      normalizeString(data.ownerId),

    name:
      normalizeString(data.name),

    description:
      normalizeString(
        data.description,
      ),

    logoUrl:
      normalizeString(data.logoUrl),

    bannerUrl:
      normalizeString(
        data.bannerUrl,
      ),

    phone:
      normalizeString(data.phone),

    whatsapp:
      normalizeString(
        data.whatsapp,
      ),

    address:
      normalizeString(
        data.address,
      ),

    city:
      normalizeString(data.city) ||
      "Neuquén",

    province:
      normalizeString(
        data.province,
      ) || "Neuquén",

    latitude:
      normalizeCoordinate(
        data.latitude,
        -90,
        90,
      ),

    longitude:
      normalizeCoordinate(
        data.longitude,
        -180,
        180,
      ),

    category:
      normalizeString(
        data.category,
      ) || "Otros",

    instagram:
      normalizeString(
        data.instagram,
      ),

    facebook:
      normalizeString(
        data.facebook,
      ),

    website:
      normalizeString(
        data.website,
      ),

    verified:
      Boolean(data.verified),

    featured:
      plan === "free"
        ? false
        : data.featured === true,

    views:
      Math.max(
        0,
        normalizeNumber(
          data.views,
        ),
      ),

    plan,
    planExpiresAt,
    planExpired,

    promoText:
      normalizeString(
        data.promoText,
      ),

    promoEnabled:
      data.promoEnabled === true,

    visibleSections:
      normalizeVisibleSections(
        data.visibleSections,
      ),

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}

function normalizeCatalogType(
  value: unknown,
): StoreCatalogItemType {
  return value === "service"
    ? "service"
    : "product";
}

function mapCatalogItem(
  id: string,
  data: FirestoreData,
): StoreCatalogItem {
  const imageUrls =
    normalizeImageUrls(data);

  const oldPriceValue =
    data.oldPrice === null ||
    data.oldPrice === undefined
      ? null
      : normalizeNumber(
          data.oldPrice,
          0,
        );

  return {
    id,

    storeId:
      normalizeString(
        data.storeId,
      ),

    storeOwnerId:
      normalizeString(
        data.storeOwnerId,
      ),

    storeName:
      normalizeString(
        data.storeName,
      ),

    type:
      normalizeCatalogType(
        data.type,
      ),

    name:
      normalizeString(data.name),

    description:
      normalizeString(
        data.description,
      ),

    price:
      Math.max(
        0,
        normalizeNumber(
          data.price,
        ),
      ),

    stock:
      Math.max(
        0,
        Math.trunc(
          normalizeNumber(
            data.stock,
          ),
        ),
      ),

    category:
      normalizeString(
        data.category,
      ) || "Otros",

    imageUrl:
      imageUrls[0] || "",

    imageUrls,

    city:
      normalizeString(data.city),

    province:
      normalizeString(
        data.province,
      ),

    active:
      data.active !== false,

    featured:
      data.featured === true,

    offerActive:
      data.offerActive === true,

    oldPrice:
      oldPriceValue !== null &&
      oldPriceValue > 0
        ? oldPriceValue
        : null,

    discountPercent:
      Math.max(
        0,
        normalizeNumber(
          data.discountPercent,
        ),
      ),

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}

export async function getStoreDetailById(
  storeId: string,
): Promise<StoreDetailStore | null> {
  const normalizedStoreId =
    normalizeString(storeId);

  if (!normalizedStoreId) {
    return null;
  }

  const snapshot = await getDoc(
    doc(
      db,
      "stores",
      normalizedStoreId,
    ),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return mapStore(
    snapshot.id,
    snapshot.data() as FirestoreData,
  );
}

export async function getActiveStoreCatalog(
  storeId: string,
): Promise<StoreCatalogItem[]> {
  const normalizedStoreId =
    normalizeString(storeId);

  if (!normalizedStoreId) {
    return [];
  }

  const catalogQuery = query(
    collection(db, "products"),
    where(
      "storeId",
      "==",
      normalizedStoreId,
    ),
    where(
      "active",
      "==",
      true,
    ),
  );

  const snapshot =
    await getDocs(catalogQuery);

  return snapshot.docs
    .map((document) =>
      mapCatalogItem(
        document.id,
        document.data() as FirestoreData,
      ),
    )
    .filter(
      (item) =>
        item.active &&
        item.storeId ===
          normalizedStoreId,
    )
    .sort(
      (itemA, itemB) =>
        getTimestampMillis(
          itemB.createdAt,
        ) -
        getTimestampMillis(
          itemA.createdAt,
        ),
    );
}

export async function incrementStoreView(
  storeId: string,
): Promise<void> {
  const normalizedStoreId =
    normalizeString(storeId);

  if (!normalizedStoreId) {
    return;
  }

  const now = Date.now();

  const lastClaim =
    storeViewClaims.get(
      normalizedStoreId,
    ) ?? 0;

  if (
    now - lastClaim <
    STORE_VIEW_COOLDOWN_MS
  ) {
    return;
  }

  storeViewClaims.set(
    normalizedStoreId,
    now,
  );

  try {
    await updateDoc(
      doc(
        db,
        "stores",
        normalizedStoreId,
      ),
      {
        views: increment(1),
      },
    );
  } catch (error) {
    storeViewClaims.delete(
      normalizedStoreId,
    );

    console.error(
      "Error incrementando vistas de tienda:",
      error,
    );
  }
}
