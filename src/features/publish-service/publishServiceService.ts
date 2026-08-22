import type { UserProfile } from "@/features/auth/userProfileService";
import { auth } from "@/lib/firebase";

import {
  SERVICE_PUBLICATION_DURATION_DAYS,
  SERVICE_PUBLICATION_PRICE_ARS,
} from "./serviceConstants";

import { createPendingServiceWithPayment } from "./serviceFirestoreService";

import {
  createServiceUploadGroupId,
  deleteServiceImages,
  uploadServiceImages,
  type ServiceImageUploadProgressCallback,
} from "./serviceStorageService";

import type {
  PublishServiceData,
  PublishServiceResult,
} from "./serviceTypes";

import {
  normalizeStringList,
  validateAndNormalizeServiceCore,
} from "./serviceValidation";

export interface PublishServiceOptions {
  userProfile?: UserProfile | null;
  onUploadProgress?: ServiceImageUploadProgressCallback;
}

export async function publishService(
  data: PublishServiceData,
  options: PublishServiceOptions = {},
): Promise<PublishServiceResult> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error(
      "Debes iniciar sesión para publicar un servicio.",
    );
  }

  /*
   * Primero validamos todo el dominio.
   * Si hay datos inválidos, Storage no recibe archivos.
   */
  const normalized = validateAndNormalizeServiceCore(data);

  const userName =
    String(
      options.userProfile?.displayName ??
        currentUser.displayName ??
        currentUser.email ??
        "Profesional",
    ).trim() || "Profesional";

  const userEmail = String(
    options.userProfile?.email ??
      currentUser.email ??
      "",
  ).trim();

  /*
   * Conservamos la misma estrategia de búsqueda que Web:
   * título, especialidad, categoría, ciudad, provincia,
   * keywords manuales y zonas.
   */
  const keywords = normalizeStringList([
    normalized.title,
    normalized.specialty,
    normalized.category,
    normalized.city,
    normalized.province,
    ...normalized.keywords,
    ...normalized.zones,
  ]);

  const uploadGroupId = createServiceUploadGroupId();

  /*
   * Los servicios pueden existir sin imagen.
   * Si hay imágenes y falla una subida intermedia,
   * uploadServiceImages hace rollback de las anteriores.
   */
  const uploadedImages = await uploadServiceImages(
    currentUser.uid,
    uploadGroupId,
    data.images,
    options.onUploadProgress,
  );

  const imageUrls = uploadedImages.map((image) => image.url);

  const uploadedPaths = uploadedImages.map((image) => image.fullPath);

  try {
    /*
     * Service + servicePaymentRequest se crean en un mismo
     * batch porque las reglas Firestore verifican ambos
     * documentos mediante getAfter/existsAfter.
     */
    const {
      serviceId,
      paymentRequestId,
    } = await createPendingServiceWithPayment({
      ...normalized,

      keywords,

      userId: currentUser.uid,
      userName,
      userEmail,

      imageUrl: imageUrls[0] || "",
      imageUrls,
    });

    return {
      serviceId,
      paymentRequestId,

      imageUrl: imageUrls[0] || "",
      imageUrls,

      paymentStatus: "pending_payment",

      publicationPrice: SERVICE_PUBLICATION_PRICE_ARS,

      publicationDurationDays:
        SERVICE_PUBLICATION_DURATION_DAYS,
    };
  } catch (error) {
    /*
     * Firestore batch es atómico, pero Storage no forma parte
     * de esa transacción. Si Firestore falla después del upload,
     * eliminamos las imágenes para no dejar archivos huérfanos.
     */
    try {
      await deleteServiceImages(uploadedPaths);
    } catch (rollbackError) {
      console.error(
        "Error eliminando imágenes después de fallar la publicación del servicio:",
        rollbackError,
      );
    }

    throw error;
  }
}
