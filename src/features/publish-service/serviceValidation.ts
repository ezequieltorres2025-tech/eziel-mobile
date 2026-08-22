import {
  SERVICE_PRICE_TYPES,
  SERVICE_RESPONSE_TIMES,
} from "./serviceConstants";

import type {
  NormalizedServiceCoreData,
  ServiceCoreInput,
  ServicePriceType,
  ServiceResponseTime,
} from "./serviceTypes";

const SERVICE_PRICE_TYPE_SET = new Set<string>(SERVICE_PRICE_TYPES);

const SERVICE_RESPONSE_TIME_SET = new Set<string>(SERVICE_RESPONSE_TIMES);

export function normalizeRequiredText(
  value: unknown,
  fieldName: string,
): string {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  return normalizedValue;
}

export function normalizeOptionalText(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizeStringList(
  values: readonly unknown[] | null | undefined,
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values ?? []) {
    const normalized = String(value ?? "").trim();

    if (!normalized) {
      continue;
    }

    const comparisonKey = normalized.toLocaleLowerCase("es");

    if (seen.has(comparisonKey)) {
      continue;
    }

    seen.add(comparisonKey);
    result.push(normalized);
  }

  return result;
}

export function normalizeServicePriceType(
  value: unknown,
): ServicePriceType {
  const normalizedValue = String(value ?? "").trim();

  if (!SERVICE_PRICE_TYPE_SET.has(normalizedValue)) {
    throw new Error("La modalidad de precio del servicio es inválida.");
  }

  return normalizedValue as ServicePriceType;
}

export function normalizeServiceResponseTime(
  value: unknown,
): ServiceResponseTime {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return "unknown";
  }

  if (!SERVICE_RESPONSE_TIME_SET.has(normalizedValue)) {
    throw new Error("El tiempo de respuesta seleccionado es inválido.");
  }

  return normalizedValue as ServiceResponseTime;
}

function normalizeServicePrice(
  priceType: ServicePriceType,
  value: number,
): number {
  if (priceType === "quote") {
    return 0;
  }

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      "Ingresá un precio válido o elegí la opción A consultar.",
    );
  }

  return value;
}

function normalizeExperienceYears(value: number | undefined): number {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isFinite(value) || value < 0 || value > 80) {
    throw new Error(
      "Los años de experiencia deben estar entre 0 y 80.",
    );
  }

  return value;
}

export function validateAndNormalizeServiceCore(
  data: ServiceCoreInput,
): NormalizedServiceCoreData {
  const title = normalizeRequiredText(data.title, "El título");

  if (title.length < 5) {
    throw new Error("El título debe tener al menos 5 caracteres.");
  }

  const specialty = normalizeRequiredText(
    data.specialty,
    "La especialidad",
  );

  if (specialty.length < 3) {
    throw new Error(
      "La especialidad debe tener al menos 3 caracteres.",
    );
  }

  const description = normalizeRequiredText(
    data.description,
    "La descripción",
  );

  if (description.length < 15) {
    throw new Error(
      "La descripción debe tener al menos 15 caracteres.",
    );
  }

  const category = normalizeRequiredText(data.category, "La categoría");

  const city = normalizeRequiredText(data.city, "La ciudad");

  const province = normalizeOptionalText(data.province) || "Argentina";

  const whatsapp = normalizeOptionalText(data.whatsapp);

  const phone = normalizeOptionalText(data.phone);

  if (!whatsapp && !phone) {
    throw new Error("Agregá al menos WhatsApp o teléfono.");
  }

  const priceType = normalizeServicePriceType(data.priceType);

  const price = normalizeServicePrice(priceType, data.price);

  const experienceYears = normalizeExperienceYears(data.experienceYears);

  const responseTime = normalizeServiceResponseTime(data.responseTime);

  return {
    title,
    description,
    category,
    specialty,
    keywords: normalizeStringList(data.keywords),
    city,
    province,
    zones: normalizeStringList(data.zones),
    priceType,
    price,
    whatsapp,
    phone,
    experienceYears,
    responseTime,
  };
}
