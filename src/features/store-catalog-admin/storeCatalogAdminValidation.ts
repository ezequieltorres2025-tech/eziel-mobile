import type { StorePlan } from "../store-admin/storeAdminTypes";
import type { CatalogEditPatch, CatalogItemDetail, CatalogItemInput } from "./storeCatalogAdminTypes";

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

export function catalogEditPatch(detail: CatalogItemDetail, input: CatalogItemInput): CatalogEditPatch {
  const patch: CatalogEditPatch = {};
  for (const key of ["name", "description", "category"] as const) {
    if (input[key].trim() !== detail.input[key].trim()) patch[key] = input[key].trim();
  }
  if (input.price !== detail.input.price && parseCatalogNumber(input.price) !== parseCatalogNumber(detail.input.price)) {
    patch.price = parseCatalogNumber(input.price);
  }
  if (input.type !== detail.input.type) {
    patch.type = input.type;
    patch.stock = input.type === "service" ? 0 : parseCatalogNumber(input.stock);
  } else if (input.type === "product" && input.stock !== detail.input.stock &&
      parseCatalogNumber(input.stock) !== parseCatalogNumber(detail.input.stock)) {
    patch.stock = parseCatalogNumber(input.stock);
  }
  return patch;
}

export function validateCatalogEdit(detail: CatalogItemDetail, input: CatalogItemInput): string | null {
  const patch = catalogEditPatch(detail, input);
  const errors = validateCatalogInput(input);
  // Un stock legacy inválido que no se edita no se normaliza ni bloquea otro campo.
  for (const key of Object.keys(patch) as (keyof CatalogItemInput)[]) {
    if (errors[key]) return errors[key]!;
  }
  return null;
}
