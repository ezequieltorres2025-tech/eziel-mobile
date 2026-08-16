export const MAX_LISTING_IMAGES = 8;

export const MAX_LISTING_IMAGE_SIZE_MB = 5;

export const MAX_LISTING_IMAGE_SIZE_BYTES =
  MAX_LISTING_IMAGE_SIZE_MB * 1024 * 1024;

export const ACCEPTED_LISTING_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
