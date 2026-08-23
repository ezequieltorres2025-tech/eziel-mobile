import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase";

import type {
  CreateListingReviewData,
  ListingReview,
} from "./listingReviewTypes";

type FirestoreData =
  Record<string, unknown>;

const BUYER_NAME_MAX_LENGTH = 100;
const LISTING_TITLE_MAX_LENGTH = 180;
const COMMENT_MAX_LENGTH = 1000;
const NOTIFICATION_TITLE_MAX_LENGTH = 120;
const NOTIFICATION_BODY_MAX_LENGTH = 500;
const NOTIFICATION_HREF_MAX_LENGTH = 500;

function normalizeRequiredId(
  value: string,
  fieldName: string,
): string {
  const normalized =
    String(value || "").trim();

  if (!normalized) {
    throw new Error(
      `Falta ${fieldName}.`,
    );
  }

  if (normalized.includes("/")) {
    throw new Error(
      `${fieldName} no es válido.`,
    );
  }

  return normalized;
}

function normalizeRequiredText(
  value: string,
  fieldName: string,
  maxLength: number,
): string {
  const normalized =
    String(value || "").trim();

  if (!normalized) {
    throw new Error(
      `Falta ${fieldName}.`,
    );
  }

  return normalized.slice(
    0,
    maxLength,
  );
}

function normalizeComment(
  value: string,
): string {
  return String(value || "")
    .trim()
    .slice(
      0,
      COMMENT_MAX_LENGTH,
    );
}

function normalizeRating(
  value: number,
): number {
  const normalized =
    Number(value);

  if (
    !Number.isFinite(normalized) ||
    !Number.isInteger(normalized) ||
    normalized < 1 ||
    normalized > 5
  ) {
    throw new Error(
      "La calificación debe ser un número entero entre 1 y 5.",
    );
  }

  return normalized;
}

function assertCurrentUser(
  expectedUserId: string,
): void {
  const currentUserId =
    auth.currentUser?.uid?.trim() ?? "";

  if (
    !currentUserId ||
    currentUserId !== expectedUserId
  ) {
    throw new Error(
      "La sesión actual no coincide con el comprador de esta operación.",
    );
  }
}

function mapReview(
  id: string,
  data: FirestoreData,
): ListingReview {
  const rawRating =
    Number(data.rating ?? 0);

  return {
    id,

    sellerId:
      String(
        data.sellerId ?? "",
      ).trim(),

    buyerId:
      String(
        data.buyerId ?? "",
      ).trim(),

    buyerName:
      String(
        data.buyerName ??
          "Usuario",
      ).trim() || "Usuario",

    listingId:
      String(
        data.listingId ?? "",
      ).trim(),

    listingTitle:
      String(
        data.listingTitle ??
          "Publicación",
      ).trim() || "Publicación",

    saleId:
      String(
        data.saleId ?? id,
      ).trim(),

    rating:
      Number.isFinite(
        rawRating,
      ) &&
      rawRating >= 1 &&
      rawRating <= 5
        ? rawRating
        : 0,

    comment:
      String(
        data.comment ?? "",
      ).trim(),

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}

function isValidReview(
  review: ListingReview,
): boolean {
  return Boolean(
    review.sellerId &&
      review.buyerId &&
      review.listingId &&
      review.saleId &&
      Number.isInteger(
        review.rating,
      ) &&
      review.rating >= 1 &&
      review.rating <= 5,
  );
}

export async function getListingReviewForSale(
  buyerId: string,
  saleId: string,
): Promise<ListingReview | null> {
  const normalizedBuyerId =
    normalizeRequiredId(
      buyerId,
      "el comprador",
    );

  const normalizedSaleId =
    normalizeRequiredId(
      saleId,
      "la operación",
    );

  assertCurrentUser(
    normalizedBuyerId,
  );

  const snapshot =
    await getDoc(
      doc(
        db,
        "reviews",
        normalizedSaleId,
      ),
    );

  if (!snapshot.exists()) {
    return null;
  }

  const review =
    mapReview(
      snapshot.id,
      snapshot.data() as FirestoreData,
    );

  if (
    !isValidReview(review) ||
    review.buyerId !==
      normalizedBuyerId ||
    review.saleId !==
      normalizedSaleId
  ) {
    return null;
  }

  return review;
}

export function subscribeToListingReviewForSale(
  buyerId: string,
  saleId: string,
  callback: (
    review: ListingReview | null,
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): () => void {
  const normalizedBuyerId =
    String(
      buyerId || "",
    ).trim();

  const normalizedSaleId =
    String(
      saleId || "",
    ).trim();

  if (
    !normalizedBuyerId ||
    !normalizedSaleId
  ) {
    callback(null);

    return () =>
      undefined;
  }

  assertCurrentUser(
    normalizedBuyerId,
  );

  return onSnapshot(
    doc(
      db,
      "reviews",
      normalizedSaleId,
    ),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const review =
        mapReview(
          snapshot.id,
          snapshot.data() as FirestoreData,
        );

      if (
        !isValidReview(review) ||
        review.buyerId !==
          normalizedBuyerId ||
        review.saleId !==
          normalizedSaleId
      ) {
        callback(null);
        return;
      }

      callback(review);
    },
    (error) => {
      onError?.(
        error instanceof Error
          ? error
          : new Error(
              "No se pudo cargar la reseña.",
            ),
      );
    },
  );
}

async function createReviewNotification(
  input: {
    sellerId: string;
    buyerId: string;
    buyerName: string;
    listingId: string;
    listingTitle: string;
    reviewId: string;
    rating: number;
  },
): Promise<void> {
  const sellerId =
    normalizeRequiredId(
      input.sellerId,
      "el vendedor",
    );

  const buyerId =
    normalizeRequiredId(
      input.buyerId,
      "el comprador",
    );

  assertCurrentUser(
    buyerId,
  );

  if (
    sellerId === buyerId
  ) {
    throw new Error(
      "No se crean notificaciones para acciones propias.",
    );
  }

  const buyerName =
    normalizeRequiredText(
      input.buyerName,
      "el nombre del comprador",
      BUYER_NAME_MAX_LENGTH,
    );

  const listingId =
    normalizeRequiredId(
      input.listingId,
      "la publicación",
    );

  const listingTitle =
    normalizeRequiredText(
      input.listingTitle,
      "el título de la publicación",
      LISTING_TITLE_MAX_LENGTH,
    );

  const reviewId =
    normalizeRequiredId(
      input.reviewId,
      "la reseña",
    );

  const rating =
    normalizeRating(
      input.rating,
    );

  const type =
    "review_received";

  const referenceId =
    reviewId;

  const title =
    "Nueva reseña recibida"
      .slice(
        0,
        NOTIFICATION_TITLE_MAX_LENGTH,
      );

  const body =
    `${buyerName} dejó una reseña de ${rating} ${
      rating === 1
        ? "estrella"
        : "estrellas"
    } sobre el trato por "${listingTitle}".`
      .slice(
        0,
        NOTIFICATION_BODY_MAX_LENGTH,
      );

  const href =
    `/explorar/${listingId}`
      .slice(
        0,
        NOTIFICATION_HREF_MAX_LENGTH,
      );

  const notificationId =
    `${type}_${referenceId}_${sellerId}`;

  await setDoc(
    doc(
      db,
      "notifications",
      notificationId,
    ),
    {
      recipientId:
        sellerId,

      actorId:
        buyerId,

      actorName:
        buyerName,

      type,

      title,

      body,

      href,

      referenceId,

      listingId,

      reviewId,

      read: false,

      createdAt:
        serverTimestamp(),

      readAt: null,
    },
  );
}

export async function createListingReview(
  input: CreateListingReviewData,
): Promise<string> {
  const sellerId =
    normalizeRequiredId(
      input.sellerId,
      "el vendedor",
    );

  const buyerId =
    normalizeRequiredId(
      input.buyerId,
      "el comprador",
    );

  assertCurrentUser(
    buyerId,
  );

  if (
    sellerId === buyerId
  ) {
    throw new Error(
      "No podés calificarte a vos mismo.",
    );
  }

  const listingId =
    normalizeRequiredId(
      input.listingId,
      "la publicación",
    );

  const saleId =
    normalizeRequiredId(
      input.saleId,
      "la operación",
    );

  const buyerName =
    normalizeRequiredText(
      input.buyerName,
      "el nombre del comprador",
      BUYER_NAME_MAX_LENGTH,
    );

  const listingTitle =
    normalizeRequiredText(
      input.listingTitle,
      "el título de la publicación",
      LISTING_TITLE_MAX_LENGTH,
    );

  const rating =
    normalizeRating(
      input.rating,
    );

  const comment =
    normalizeComment(
      input.comment,
    );

  if (!comment) {
    throw new Error(
      "Escribí un comentario para la reseña.",
    );
  }

  /*
   * Contrato actual de Eziel:
   * reviewId == saleId.
   * Firestore Rules verifican además
   * que la operación esté confirmada
   * y pertenezca al mismo comprador,
   * vendedor y publicación.
   */
  const reviewId =
    saleId;

  const reviewRef =
    doc(
      db,
      "reviews",
      reviewId,
    );

  await runTransaction(
    db,
    async (transaction) => {
      const existingReview =
        await transaction.get(
          reviewRef,
        );

      if (
        existingReview.exists()
      ) {
        throw new Error(
          "Ya calificaste esta operación.",
        );
      }

      transaction.set(
        reviewRef,
        {
          sellerId,
          buyerId,
          buyerName,
          listingId,
          listingTitle,
          saleId,
          rating,
          comment,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );
    },
  );

  /*
   * Igual que Web:
   * una falla del aviso no invalida
   * una reseña que ya fue guardada.
   */
  try {
    await createReviewNotification({
      sellerId,
      buyerId,
      buyerName,
      listingId,
      listingTitle,
      reviewId,
      rating,
    });
  } catch (notificationError) {
    console.warn(
      "La reseña se guardó, pero no se pudo crear la notificación:",
      notificationError,
    );
  }

  return reviewId;
}
