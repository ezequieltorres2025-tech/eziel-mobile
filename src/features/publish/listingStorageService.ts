import {
    deleteObject,
    getDownloadURL,
    putFile,
    ref,
    type UploadTaskSnapshot,
} from "@react-native-firebase/storage";

import type { PublishImage } from "./components/PublishImagePicker";
import {
    ACCEPTED_LISTING_IMAGE_MIME_TYPES,
    MAX_LISTING_IMAGES,
    MAX_LISTING_IMAGE_SIZE_BYTES,
    MAX_LISTING_IMAGE_SIZE_MB,
} from "./constants";

import { auth, storage } from "@/lib/firebase";

const ACCEPTED_IMAGE_TYPES = new Set<string>(ACCEPTED_LISTING_IMAGE_MIME_TYPES);

const LISTING_IMAGES_ROOT = "listing-images";

export interface UploadedListingImage {
  url: string;
  fullPath: string;
}

export interface ListingImageUploadProgress {
  imageIndex: number;
  totalImages: number;
  imageProgress: number;
  overallProgress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export type ListingImageUploadProgressCallback = (
  progress: ListingImageUploadProgress,
) => void;

function normalizeMimeType(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized === "image/jpg") {
    return "image/jpeg";
  }

  return normalized;
}

function extensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      throw new Error("Formato de imagen no soportado.");
  }
}

function sanitizeFileStem(value: string | null): string {
  const source = String(value ?? "")
    .trim()
    .replace(/\.[^.]+$/, "");

  const sanitized = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return sanitized || "imagen";
}

function createUniqueToken(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);

  return `${Date.now()}-${randomPart}`;
}

function validateOwner(ownerId: string): string {
  const normalizedOwnerId = ownerId.trim();

  if (!normalizedOwnerId) {
    throw new Error("Usuario no autenticado.");
  }

  if (normalizedOwnerId.includes("/")) {
    throw new Error("Identificador de usuario inválido.");
  }

  if (auth.currentUser?.uid !== normalizedOwnerId) {
    throw new Error(
      "La sesión actual no coincide con el propietario de la publicación.",
    );
  }

  return normalizedOwnerId;
}

function validateImage(image: PublishImage, index: number): void {
  const imageNumber = index + 1;

  if (!image.uri?.trim()) {
    throw new Error(`La imagen ${imageNumber} no tiene un archivo válido.`);
  }

  const mimeType = normalizeMimeType(image.mimeType);

  if (!ACCEPTED_IMAGE_TYPES.has(mimeType)) {
    throw new Error(`La imagen ${imageNumber} debe ser JPEG, PNG o WebP.`);
  }

  if (
    typeof image.fileSize !== "number" ||
    !Number.isFinite(image.fileSize) ||
    image.fileSize <= 0
  ) {
    throw new Error(
      `No se pudo determinar el tamaño de la imagen ${imageNumber}.`,
    );
  }

  if (image.fileSize > MAX_LISTING_IMAGE_SIZE_BYTES) {
    throw new Error(
      `La imagen ${imageNumber} supera el máximo de ${MAX_LISTING_IMAGE_SIZE_MB} MB.`,
    );
  }
}

function validateImages(images: PublishImage[]): void {
  if (images.length === 0) {
    throw new Error("Agregá al menos una imagen para publicar.");
  }

  if (images.length > MAX_LISTING_IMAGES) {
    throw new Error(
      `Podés subir hasta ${MAX_LISTING_IMAGES} imágenes por publicación.`,
    );
  }

  images.forEach(validateImage);
}

function createStorageFileName(image: PublishImage, index: number): string {
  const mimeType = normalizeMimeType(image.mimeType);

  const extension = extensionFromMimeType(mimeType);

  const stem = sanitizeFileStem(image.fileName);

  const position = String(index + 1).padStart(2, "0");

  return `${position}-${createUniqueToken()}-${stem}.${extension}`;
}

async function rollbackUploadedImages(
  uploadedImages: UploadedListingImage[],
): Promise<void> {
  if (uploadedImages.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    uploadedImages.map((image) => deleteObject(ref(storage, image.fullPath))),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `No se pudo eliminar la imagen de rollback ${uploadedImages[index].fullPath}:`,
        result.reason,
      );
    }
  });
}

async function uploadSingleListingImage(
  ownerId: string,
  image: PublishImage,
  index: number,
  totalImages: number,
  completedBytes: number,
  allImagesBytes: number,
  onProgress?: ListingImageUploadProgressCallback,
): Promise<UploadedListingImage> {
  const mimeType = normalizeMimeType(image.mimeType);

  const fileName = createStorageFileName(image, index);

  const fullPath = `${LISTING_IMAGES_ROOT}/${ownerId}/${fileName}`;

  const storageReference = ref(storage, fullPath);

  const uploadTask = putFile(storageReference, image.uri, {
    contentType: mimeType,
    customMetadata: {
      ownerId,
      source: "marketplace-listing",
    },
  });

  const unsubscribe = uploadTask.on(
    "state_changed",
    (snapshot: UploadTaskSnapshot) => {
      if (!onProgress) {
        return;
      }

      const imageProgress =
        snapshot.totalBytes > 0
          ? snapshot.bytesTransferred / snapshot.totalBytes
          : 0;

      const transferredBytes = completedBytes + snapshot.bytesTransferred;

      const overallProgress =
        allImagesBytes > 0 ? transferredBytes / allImagesBytes : 0;

      onProgress({
        imageIndex: index,
        totalImages,
        imageProgress: Math.min(Math.max(imageProgress, 0), 1),
        overallProgress: Math.min(Math.max(overallProgress, 0), 1),
        bytesTransferred: snapshot.bytesTransferred,
        totalBytes: snapshot.totalBytes,
      });
    },
  );

  try {
    await uploadTask;

    const url = await getDownloadURL(storageReference);

    return {
      url,
      fullPath,
    };
  } finally {
    unsubscribe();
  }
}

export async function uploadListingImages(
  ownerId: string,
  images: PublishImage[],
  onProgress?: ListingImageUploadProgressCallback,
): Promise<UploadedListingImage[]> {
  const normalizedOwnerId = validateOwner(ownerId);

  validateImages(images);

  const totalBytes = images.reduce(
    (sum, image) => sum + (image.fileSize ?? 0),
    0,
  );

  const uploadedImages: UploadedListingImage[] = [];

  let completedBytes = 0;

  try {
    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];

      const uploadedImage = await uploadSingleListingImage(
        normalizedOwnerId,
        image,
        index,
        images.length,
        completedBytes,
        totalBytes,
        onProgress,
      );

      uploadedImages.push(uploadedImage);

      completedBytes += image.fileSize ?? 0;

      onProgress?.({
        imageIndex: index,
        totalImages: images.length,
        imageProgress: 1,
        overallProgress:
          totalBytes > 0 ? Math.min(completedBytes / totalBytes, 1) : 1,
        bytesTransferred: image.fileSize ?? 0,
        totalBytes: image.fileSize ?? 0,
      });
    }

    return uploadedImages;
  } catch (error) {
    await rollbackUploadedImages(uploadedImages);

    throw error;
  }
}

export async function deleteListingImage(fullPath: string): Promise<void> {
  const normalizedPath = fullPath.trim();

  if (
    !normalizedPath ||
    !normalizedPath.startsWith(`${LISTING_IMAGES_ROOT}/`)
  ) {
    throw new Error("Ruta de imagen de publicación inválida.");
  }

  await deleteObject(ref(storage, normalizedPath));
}

export async function deleteListingImages(fullPaths: string[]): Promise<void> {
  const uniquePaths = Array.from(
    new Set(fullPaths.map((fullPath) => fullPath.trim()).filter(Boolean)),
  );

  await Promise.all(
    uniquePaths.map((fullPath) => deleteListingImage(fullPath)),
  );
}
