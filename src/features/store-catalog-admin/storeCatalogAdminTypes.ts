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
