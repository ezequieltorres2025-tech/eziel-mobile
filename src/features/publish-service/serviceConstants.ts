import type {
  ServicePriceType,
  ServiceResponseTime,
} from "./serviceTypes";

export const SERVICE_PUBLICATION_PRICE_ARS = 12_000;

export const SERVICE_PUBLICATION_DURATION_DAYS = 30;

export const MAX_SERVICE_IMAGES = 6;

export const MAX_SERVICE_IMAGE_SIZE_MB = 10;

export const MAX_SERVICE_IMAGE_SIZE_BYTES =
  MAX_SERVICE_IMAGE_SIZE_MB * 1024 * 1024;

export const ACCEPTED_SERVICE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const SERVICE_PRICE_TYPES = [
  "fixed",
  "from",
  "quote",
  "hourly",
] as const satisfies readonly ServicePriceType[];

export const SERVICE_RESPONSE_TIMES = [
  "fast",
  "normal",
  "slow",
  "unknown",
] as const satisfies readonly ServiceResponseTime[];
