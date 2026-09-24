import type { StorePlan } from "../store-admin/storeAdminTypes";
import type { CatalogItemInput } from "./storeCatalogAdminTypes";

export function catalogPlanLimit(plan: StorePlan): number {
  return plan === "premium_plus" ? Infinity : plan === "premium" ? 100 : 10;
}

export function parseCatalogNumber(value: string): number {
  const text = value.trim().replace(",", ".");
  return text ? Number(text) : NaN;
}

export function validateCatalogInput(input: CatalogItemInput): Partial<Record<keyof CatalogItemInput, string>> {
  const errors: Partial<Record<keyof CatalogItemInput, string>> = {};
  if (input.type !== "product" && input.type !== "service") errors.type = "Elegí Producto o Servicio.";
  if (!input.name.trim()) errors.name = "Ingresá el nombre.";
  if (!input.description.trim()) errors.description = "Ingresá una descripción.";
  if (!input.category.trim()) errors.category = "Ingresá una categoría.";
  const price = parseCatalogNumber(input.price);
  if (!Number.isFinite(price) || price <= 0) errors.price = "Ingresá un precio mayor a cero.";
  const stock = parseCatalogNumber(input.stock);
  if (input.type === "product" && (!Number.isSafeInteger(stock) || stock < 0)) {
    errors.stock = "Ingresá un stock entero igual o mayor a cero.";
  }
  return errors;
}
