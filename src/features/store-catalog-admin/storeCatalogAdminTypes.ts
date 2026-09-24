import type { StoreAdmin } from "../store-admin/storeAdminTypes";

export type CatalogItemType = "product" | "service";

export interface CatalogItemInput {
  type: CatalogItemType;
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
}

export interface OwnerCatalogItem {
  id: string;
  storeId: string;
  name: string;
  type: CatalogItemType;
  price: number;
  stock: number;
  category: string;
  active: boolean;
  imageUrl: string;
  createdAtMillis: number;
}

export interface OwnerCatalogData {
  store: StoreAdmin;
  items: OwnerCatalogItem[];
}

export type OwnerCatalogResult =
  | { kind: "empty" }
  | { kind: "multiple" }
  | ({ kind: "single" } & OwnerCatalogData);

export const EMPTY_CATALOG_INPUT: CatalogItemInput = {
  type: "product", name: "", description: "", price: "", category: "Otros", stock: "0",
};

export type CatalogEditPatch = Partial<{
  name: string; description: string; category: string;
  price: number; type: CatalogItemType; stock: number;
}>;

export interface CatalogItemDetail {
  id: string;
  storeId: string;
  storeOwnerId: string;
  storeName: unknown;
  input: CatalogItemInput;
  active: boolean;
  featured: unknown;
  imageUrl: unknown;
  imageUrls: unknown;
  city: unknown;
  province: unknown;
  createdAt: unknown;
  updatedAt: unknown;
  // Valores originales: los fallbacks de presentación nunca son un patch.
  original: Readonly<Record<keyof CatalogItemInput | "active", unknown>>;
  offer: "none" | "inactive" | "blocked";
  offerFields: Readonly<Record<string, unknown>>;
}

export type CatalogMutation =
  | { kind: "edit"; input: CatalogItemInput }
  | { kind: "status"; active: boolean }
  | { kind: "delete" };

export type CatalogEditorState =
  | { kind: "closed" }
  | { kind: "loading"; id: string }
  | { kind: "error" | "missing" | "forbidden"; id: string; message: string }
  | { kind: "ready"; detail: CatalogItemDetail };
