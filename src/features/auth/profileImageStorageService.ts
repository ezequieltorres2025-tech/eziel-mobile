import type { ImagePickerAsset } from "expo-image-picker";
import {
  deleteObject,
  getDownloadURL,
  putFile,
  ref,
} from "@react-native-firebase/storage";

import { auth, storage } from "@/lib/firebase";

const PROFILE_IMAGES_ROOT = "profile-images";

const MAX_PROFILE_IMAGE_SIZE_BYTES =
  5 * 1024 * 1024;

const MAX_PROFILE_IMAGE_SIZE_MB = 5;

const ACCEPTED_PROFILE_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

export interface PreparedProfileImage {
  uri: string;
  fileName: string | null;
  fileSize: number;
  mimeType: string;
}

export interface UploadedProfileImage {
  url: string;
  fullPath: string;
}

function normalizeMimeType(
  value: string | null | undefined,
): string | null {
  const normalized =
    value?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return null;
  }

  if (normalized === "image/jpg") {
    return "image/jpeg";
  }

  return normalized;
}

function getFileNameFromUri(
  uri: string,
): string | null {
  try {
    const cleanUri = decodeURIComponent(
      uri.split("?")[0].split("#")[0],
    );

    const fileName =
      cleanUri.split("/").pop()?.trim() ?? "";

    return fileName || null;
  } catch {
    const cleanUri =
      uri.split("?")[0].split("#")[0];

    const fileName =
      cleanUri.split("/").pop()?.trim() ?? "";

    return fileName || null;
  }
}

function inferMimeTypeFromName(
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .split("?")[0]
    .split("#")[0];

  if (
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg")
  ) {
    return "image/jpeg";
  }

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  return null;
}

function extensionFromMimeType(
  mimeType: string,
): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      throw new Error(
        "Formato de imagen no soportado.",
      );
  }
}

function validateOwner(
  ownerId: string,
): string {
  const normalizedOwnerId =
    ownerId.trim();

  if (!normalizedOwnerId) {
    throw new Error(
      "Usuario no autenticado.",
    );
  }

  if (normalizedOwnerId.includes("/")) {
    throw new Error(
      "Identificador de usuario inválido.",
    );
  }

  if (
    auth.currentUser?.uid !==
    normalizedOwnerId
  ) {
    throw new Error(
      "La sesión actual no coincide con el perfil.",
    );
  }

  return normalizedOwnerId;
}

function createUniqueToken(): string {
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 10);

  return `${Date.now()}-${randomPart}`;
}

export function prepareProfileImageAsset(
  asset: ImagePickerAsset,
): PreparedProfileImage {
  if (!asset.uri?.trim()) {
    throw new Error(
      "La imagen seleccionada no tiene un archivo válido.",
    );
  }

  const fileName =
    asset.fileName?.trim() ||
    getFileNameFromUri(asset.uri);

  const reportedMimeType =
    normalizeMimeType(asset.mimeType);

  const mimeType =
    reportedMimeType ??
    inferMimeTypeFromName(fileName) ??
    inferMimeTypeFromName(asset.uri);

  if (
    !mimeType ||
    !ACCEPTED_PROFILE_IMAGE_TYPES.has(
      mimeType,
    )
  ) {
    throw new Error(
      "La foto debe ser JPG, PNG o WebP.",
    );
  }

  const fileSize =
    typeof asset.fileSize === "number" &&
    Number.isFinite(asset.fileSize)
      ? asset.fileSize
      : null;

  if (
    fileSize === null ||
    fileSize <= 0
  ) {
    throw new Error(
      "No pudimos verificar el tamaño de la foto. Elegí otra imagen.",
    );
  }

  if (
    fileSize >
    MAX_PROFILE_IMAGE_SIZE_BYTES
  ) {
    throw new Error(
      `La foto supera el máximo de ${MAX_PROFILE_IMAGE_SIZE_MB} MB.`,
    );
  }

  return {
    uri: asset.uri,
    fileName,
    fileSize,
    mimeType,
  };
}

export function isOwnedProfileImagePath(
  ownerId: string,
  fullPath: string | null | undefined,
): boolean {
  const normalizedOwnerId =
    ownerId.trim();

  const normalizedPath =
    fullPath?.trim() ?? "";

  if (
    !normalizedOwnerId ||
    !normalizedPath
  ) {
    return false;
  }

  return normalizedPath.startsWith(
    `${PROFILE_IMAGES_ROOT}/${normalizedOwnerId}/`,
  );
}

export async function uploadProfileImage(
  ownerId: string,
  image: PreparedProfileImage,
): Promise<UploadedProfileImage> {
  const normalizedOwnerId =
    validateOwner(ownerId);

  if (!image.uri?.trim()) {
    throw new Error(
      "La foto seleccionada no es válida.",
    );
  }

  const mimeType =
    normalizeMimeType(image.mimeType);

  if (
    !mimeType ||
    !ACCEPTED_PROFILE_IMAGE_TYPES.has(
      mimeType,
    )
  ) {
    throw new Error(
      "La foto debe ser JPG, PNG o WebP.",
    );
  }

  if (
    !Number.isFinite(image.fileSize) ||
    image.fileSize <= 0 ||
    image.fileSize >
      MAX_PROFILE_IMAGE_SIZE_BYTES
  ) {
    throw new Error(
      `La foto debe pesar hasta ${MAX_PROFILE_IMAGE_SIZE_MB} MB.`,
    );
  }

  const extension =
    extensionFromMimeType(mimeType);

  const fileName =
    `profile-${createUniqueToken()}.${extension}`;

  const fullPath =
    `${PROFILE_IMAGES_ROOT}/${normalizedOwnerId}/${fileName}`;

  const storageReference =
    ref(storage, fullPath);

  try {
    await putFile(
      storageReference,
      image.uri,
      {
        contentType: mimeType,
        customMetadata: {
          ownerId: normalizedOwnerId,
          source: "marketplace-profile",
        },
      },
    );

    const url =
      await getDownloadURL(
        storageReference,
      );

    return {
      url,
      fullPath,
    };
  } catch (error) {
    try {
      await deleteObject(
        storageReference,
      );
    } catch {
      // La subida pudo haber fallado antes
      // de que existiera un objeto remoto.
    }

    console.error(
      "Error subiendo foto de perfil:",
      error,
    );

    throw new Error(
      "No pudimos subir la foto de perfil. Intentá nuevamente.",
    );
  }
}

export async function deleteOwnedProfileImage(
  ownerId: string,
  fullPath: string | null | undefined,
): Promise<void> {
  const normalizedOwnerId =
    validateOwner(ownerId);

  const normalizedPath =
    fullPath?.trim() ?? "";

  if (!normalizedPath) {
    return;
  }

  if (
    !isOwnedProfileImagePath(
      normalizedOwnerId,
      normalizedPath,
    )
  ) {
    throw new Error(
      "La imagen no pertenece al perfil actual.",
    );
  }

  await deleteObject(
    ref(storage, normalizedPath),
  );
}
