import { STORE_INFORMATION_FIELDS, type CreateStoreInput, type StoreAdmin, type StorePlan, type StoreInformation, type StoreInformationChanges } from "./storeAdminTypes";

export function normalizeStoreInput(input: CreateStoreInput): CreateStoreInput {
  return {
    name: input.name.trim(), city: input.city.trim(),
    province: input.province.trim() || "Neuquén",
    category: input.category.trim() || "Otros",
    description: input.description.trim(), address: input.address.trim(),
    phone: input.phone.trim(), whatsapp: input.whatsapp.trim(),
  };
}

export function validateStoreInput(input: CreateStoreInput): Partial<Record<keyof CreateStoreInput, string>> {
  const errors: Partial<Record<keyof CreateStoreInput, string>> = {};
  if (!input.name.trim()) errors.name = "Ingresá el nombre de tu tienda.";
  // El nombre se reutiliza en el contrato de seguimiento de tiendas (120 caracteres).
  if (input.name.trim().length > 120) errors.name = "Usá hasta 120 caracteres.";
  if (!input.city.trim()) errors.city = "Ingresá la ciudad de tu tienda.";
  return errors;
}

export function getStoreInformationChanges(
  initial: StoreInformation,
  values: StoreInformation,
): StoreInformationChanges {
  const normalized = normalizeStoreInput(values);
  const changes: StoreInformationChanges = {};
  for (const field of STORE_INFORMATION_FIELDS) {
    if (initial[field] !== normalized[field]) changes[field] = normalized[field];
  }
  return changes;
}

function timestampMillis(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const millis = Date.parse(value);
    return Number.isFinite(millis) ? millis : null;
  }
  if (value && typeof value === "object") {
    if ("toMillis" in value && typeof value.toMillis === "function") {
      const millis: unknown = value.toMillis();
      return typeof millis === "number" && Number.isFinite(millis) ? millis : null;
    }
    if ("toDate" in value && typeof value.toDate === "function") {
      const date: unknown = value.toDate();
      return date instanceof Date ? date.getTime() : null;
    }
  }
  return null;
}

export function effectiveStorePlan(store: StoreAdmin): StorePlan {
  const expires = timestampMillis(store.planExpiresAt);
  return store.plan !== "free" && expires !== null && expires > Date.now() ? store.plan : "free";
}
