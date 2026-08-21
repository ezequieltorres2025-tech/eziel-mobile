import type { UserProfile } from "@/features/auth/userProfileService";
import { auth } from "@/lib/firebase";

import type { PublishImage } from "./components/PublishImagePicker";
import type { ListingCategory } from "./constants";
import { createListing, getStoreByOwnerId } from "./listingFirestoreService";
import {
    deleteListingImages,
    uploadListingImages,
    type ListingImageUploadProgressCallback,
} from "./listingStorageService";

export interface PublishProductData {
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  location: string;
  images: PublishImage[];
}

export interface PublishProductOptions {
  userProfile?: UserProfile | null;
  onUploadProgress?: ListingImageUploadProgressCallback;
}

export interface PublishProductResult {
  listingId: string;
  imageUrl: string;
  imageUrls: string[];
}

function normalizeRequiredText(value: unknown, fieldName: string): string {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  return normalizedValue;
}

function normalizePrice(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("El precio de la publicación es inválido.");
  }

  if (value < 0) {
    throw new Error("El precio no puede ser negativo.");
  }

  return value;
}

export async function publishProduct(
  data: PublishProductData,
  options: PublishProductOptions = {},
): Promise<PublishProductResult> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Debes iniciar sesión para publicar.");
  }

  const title = normalizeRequiredText(data.title, "El título");

  const description = normalizeRequiredText(data.description, "La descripción");

  const location = normalizeRequiredText(data.location, "La ubicación");

  const price = normalizePrice(data.price);

  const userName =
    String(
      options.userProfile?.displayName ?? currentUser.displayName ?? "Usuario",
    ).trim() || "Usuario";

  /*
   * La consulta de tienda se hace antes de Storage.
   * Si Firestore no puede resolver la tienda del propietario,
   * no dejamos archivos innecesarios subidos.
   */
  const userStore = await getStoreByOwnerId(currentUser.uid);

  /*
   * uploadListingImages ya hace rollback de las imágenes subidas
   * parcialmente si alguna subida falla.
   */
  const uploadedImages = await uploadListingImages(
    currentUser.uid,
    data.images,
    options.onUploadProgress,
  );

  const imageUrls = uploadedImages.map((image) => image.url);

  const uploadedPaths = uploadedImages.map((image) => image.fullPath);

  try {
    const listingId = await createListing({
      title,
      description,
      price,
      category: data.category,
      location,
      imageUrl: imageUrls[0],
      imageUrls,
      userId: currentUser.uid,
      userName,

      ...(userStore
        ? {
            storeId: userStore.id,
            storeName: userStore.name,
          }
        : {}),

      stockTotal: 1,
    });

    return {
      listingId,
      imageUrl: imageUrls[0],
      imageUrls,
    };
  } catch (error) {
    /*
     * Si Storage terminó correctamente pero la creación del
     * documento falla, intentamos eliminar todos los archivos
     * para no dejar imágenes huérfanas.
     *
     * El error original de publicación siempre tiene prioridad:
     * un eventual fallo del rollback se registra pero no lo oculta.
     */
    try {
      await deleteListingImages(uploadedPaths);
    } catch (rollbackError) {
      console.error(
        "Error eliminando imágenes después de fallar la publicación:",
        rollbackError,
      );
    }

    throw error;
  }
}
