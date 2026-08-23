export type StoreDetailPlan =
  | "free"
  | "premium"
  | "premium_plus";

export type StoreCatalogItemType =
  | "product"
  | "service";

export interface StoreDetailStore {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;

  phone: string;
  whatsapp: string;

  address: string;
  city: string;
  province: string;
  latitude: number | null;
  longitude: number | null;

  category: string;

  instagram: string;
  facebook: string;
  website: string;

  verified: boolean;
  featured: boolean;
  views: number;

  plan: StoreDetailPlan;
  planExpiresAt?: unknown;
  planExpired: boolean;

  promoText: string;
  promoEnabled: boolean;

  visibleSections: Record<string, boolean>;

  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StoreCatalogItem {
  id: string;

  storeId: string;
  storeOwnerId: string;
  storeName: string;

  type: StoreCatalogItemType;

  name: string;
  description: string;
  price: number;
  stock: number;

  category: string;

  imageUrl: string;
  imageUrls: string[];

  city: string;
  province: string;

  active: boolean;
  featured: boolean;

  offerActive: boolean;
  oldPrice: number | null;
  discountPercent: number;

  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StoreDetailData {
  store: StoreDetailStore;
  catalog: StoreCatalogItem[];
}
