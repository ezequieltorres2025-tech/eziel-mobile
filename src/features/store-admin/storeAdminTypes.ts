export type StorePlan = "free" | "premium" | "premium_plus";

export interface StoreAdmin {
  id: string;
  ownerId: string;
  name: string;
  category: string;
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
  instagram: string;
  facebook: string;
  website: string;
  verified: boolean;
  featured: boolean;
  views: number;
  plan: StorePlan;
  planExpiresAt: unknown;
  themeColor: string;
  heroStyle: string;
  promoText: string;
  promoEnabled: boolean;
  featuredProductIds: string[];
  visibleSections: Record<"products" | "services" | "stories" | "location" | "reviews", boolean>;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CreateStoreInput {
  name: string;
  city: string;
  province: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
}

export const STORE_INFORMATION_FIELDS = [
  "name", "category", "description", "city", "province", "address", "phone", "whatsapp",
] as const;

export type StoreInformation = Pick<StoreAdmin, typeof STORE_INFORMATION_FIELDS[number]>;
export type StoreInformationChanges = Partial<StoreInformation>;

export type OwnerStoreResult =
  | { kind: "empty" }
  | { kind: "single"; store: StoreAdmin }
  | { kind: "multiple" };

export const DEFAULT_VISIBLE_SECTIONS: StoreAdmin["visibleSections"] = {
  products: true,
  services: true,
  stories: true,
  location: true,
  reviews: true,
};
