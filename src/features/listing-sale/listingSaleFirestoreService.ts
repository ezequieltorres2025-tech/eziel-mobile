import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "@react-native-firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase";

import type {
  CancelListingSaleData,
  ConfirmListingSaleData,
  ListingSale,
  ListingSaleStatus,
} from "./listingSaleTypes";

type FirestoreData =
  Record<string, unknown>;

type ListingStockState = {
  stockTotal: number;
  reservedUnits: number;
  soldUnits: number;
  availableUnits: number;
};

type SaleNotificationType =
  | "sale_confirmed"
  | "sale_cancelled";

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
      "La sesión actual no coincide con esta operación.",
    );
  }
}

function normalizePositiveInteger(
  value: unknown,
  fallback = 1,
): number {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(numericValue) ||
    !Number.isInteger(numericValue) ||
    numericValue < 1
  ) {
    return fallback;
  }

  return numericValue;
}

function normalizeNonNegativeInteger(
  value: unknown,
): number {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(numericValue) ||
    !Number.isInteger(numericValue) ||
    numericValue < 0
  ) {
    return 0;
  }

  return numericValue;
}

function normalizeOperationQuantity(
  value: unknown,
): number {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(numericValue) ||
    !Number.isInteger(numericValue) ||
    numericValue < 1
  ) {
    throw new Error(
      "La cantidad del trato no es válida.",
    );
  }

  return numericValue;
}

function normalizeSaleStatus(
  value: unknown,
): ListingSaleStatus {
  if (
    value === "confirmed" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "pending_confirmation";
}

function optionalText(
  value: unknown,
): string | undefined {
  const normalized =
    String(value ?? "").trim();

  return normalized || undefined;
}

function mapListingSale(
  id: string,
  data: FirestoreData,
): ListingSale {
  return {
    id,
    listingId:
      String(data.listingId ?? "").trim(),

    listingTitle:
      String(
        data.listingTitle ?? "Publicación",
      ).trim() || "Publicación",

    sellerId:
      String(data.sellerId ?? "").trim(),

    buyerId:
      String(data.buyerId ?? "").trim(),

    buyerName:
      String(
        data.buyerName ?? "Comprador",
      ).trim() || "Comprador",

    quantity:
      normalizePositiveInteger(
        data.quantity,
        1,
      ),

    status:
      normalizeSaleStatus(
        data.status,
      ),

    requestedAt:
      data.requestedAt,

    confirmedAt:
      data.confirmedAt,

    cancelledAt:
      data.cancelledAt,

    cancelledBy:
      optionalText(
        data.cancelledBy,
      ),

    createdAt:
      data.createdAt ??
      data.requestedAt,

    updatedAt:
      data.updatedAt,
  };
}

function getTimestampMillis(
  value: unknown,
): number {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return 0;
  }

  const candidate =
    value as {
      toMillis?: () => number;
      toDate?: () => Date;
    };

  if (
    typeof candidate.toMillis ===
    "function"
  ) {
    return candidate.toMillis();
  }

  if (
    typeof candidate.toDate ===
    "function"
  ) {
    return candidate
      .toDate()
      .getTime();
  }

  return 0;
}

function sortSalesByNewest(
  sales: ListingSale[],
): ListingSale[] {
  return [...sales].sort(
    (saleA, saleB) =>
      getTimestampMillis(
        saleB.createdAt ??
          saleB.requestedAt,
      ) -
      getTimestampMillis(
        saleA.createdAt ??
          saleA.requestedAt,
      ),
  );
}

function selectRelevantSale(
  sales: ListingSale[],
): ListingSale | null {
  const sorted =
    sortSalesByNewest(sales);

  return (
    sorted.find(
      (sale) =>
        sale.status ===
        "pending_confirmation",
    ) ??
    sorted.find(
      (sale) =>
        sale.status === "confirmed",
    ) ??
    sorted[0] ??
    null
  );
}

function getLegacySaleId(
  listingId: string,
  buyerId: string,
): string {
  return `${listingId}_${buyerId}`;
}

function getListingStockState(
  data: FirestoreData,
): ListingStockState {
  const stockTotal =
    normalizePositiveInteger(
      data.stockTotal,
      1,
    );

  const soldUnits = Math.min(
    normalizeNonNegativeInteger(
      data.soldUnits,
    ),
    stockTotal,
  );

  const reservedUnits = Math.min(
    normalizeNonNegativeInteger(
      data.reservedUnits,
    ),
    Math.max(
      stockTotal - soldUnits,
      0,
    ),
  );

  return {
    stockTotal,
    soldUnits,
    reservedUnits,
    availableUnits: Math.max(
      stockTotal -
        soldUnits -
        reservedUnits,
      0,
    ),
  };
}

function getStatusFromStock(
  stock: ListingStockState,
):
  | "active"
  | "pending_confirmation"
  | "sold" {
  if (
    stock.soldUnits >=
    stock.stockTotal
  ) {
    return "sold";
  }

  if (
    stock.availableUnits === 0 &&
    stock.reservedUnits > 0
  ) {
    return "pending_confirmation";
  }

  return "active";
}

async function getListingSaleById(
  saleId: string,
): Promise<ListingSale | null> {
  const normalizedSaleId =
    normalizeRequiredId(
      saleId,
      "la operación",
    );

  const snapshot =
    await getDoc(
      doc(
        db,
        "listingSales",
        normalizedSaleId,
      ),
    );

  if (!snapshot.exists()) {
    return null;
  }

  return mapListingSale(
    snapshot.id,
    snapshot.data() as FirestoreData,
  );
}

async function getBuyerListingSales(
  listingId: string,
  buyerId: string,
): Promise<ListingSale[]> {
  const normalizedListingId =
    normalizeRequiredId(
      listingId,
      "la publicación",
    );

  const normalizedBuyerId =
    normalizeRequiredId(
      buyerId,
      "el comprador",
    );

  assertCurrentUser(
    normalizedBuyerId,
  );

  const salesQuery =
    query(
      collection(
        db,
        "listingSales",
      ),
      where(
        "buyerId",
        "==",
        normalizedBuyerId,
      ),
    );

  const snapshot =
    await getDocs(
      salesQuery,
    );

  return sortSalesByNewest(
    snapshot.docs
      .map((saleDoc) =>
        mapListingSale(
          saleDoc.id,
          saleDoc.data() as FirestoreData,
        ),
      )
      .filter(
        (sale) =>
          sale.listingId ===
          normalizedListingId,
      ),
  );
}

export async function getListingSale(
  listingId: string,
  buyerId: string,
): Promise<ListingSale | null> {
  const normalizedListingId =
    normalizeRequiredId(
      listingId,
      "la publicación",
    );

  const normalizedBuyerId =
    normalizeRequiredId(
      buyerId,
      "el comprador",
    );

  const sales =
    await getBuyerListingSales(
      normalizedListingId,
      normalizedBuyerId,
    );

  if (sales.length > 0) {
    return selectRelevantSale(
      sales,
    );
  }

  const legacyId =
    getLegacySaleId(
      normalizedListingId,
      normalizedBuyerId,
    );

  return getListingSaleById(
    legacyId,
  );
}

export function subscribeToListingSale(
  listingId: string,
  buyerId: string,
  callback: (
    sale: ListingSale | null,
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): () => void {
  const normalizedListingId =
    String(
      listingId || "",
    ).trim();

  const normalizedBuyerId =
    String(
      buyerId || "",
    ).trim();

  if (
    !normalizedListingId ||
    !normalizedBuyerId
  ) {
    callback(null);
    return () => undefined;
  }

  assertCurrentUser(
    normalizedBuyerId,
  );

  const salesQuery =
    query(
      collection(
        db,
        "listingSales",
      ),
      where(
        "buyerId",
        "==",
        normalizedBuyerId,
      ),
    );

  let active = true;
  let requestId = 0;

  const unsubscribe =
    onSnapshot(
      salesQuery,
      (snapshot) => {
        const currentRequestId =
          requestId + 1;

        requestId =
          currentRequestId;

        const sales =
          snapshot.docs
            .map((saleDoc) =>
              mapListingSale(
                saleDoc.id,
                saleDoc.data() as FirestoreData,
              ),
            )
            .filter(
              (sale) =>
                sale.listingId ===
                normalizedListingId,
            );

        if (
          sales.length > 0
        ) {
          callback(
            selectRelevantSale(
              sales,
            ),
          );

          return;
        }

        void (async () => {
          try {
            const legacySale =
              await getListingSaleById(
                getLegacySaleId(
                  normalizedListingId,
                  normalizedBuyerId,
                ),
              );

            if (
              active &&
              requestId ===
                currentRequestId
            ) {
              callback(
                legacySale,
              );
            }
          } catch (error) {
            if (
              active &&
              requestId ===
                currentRequestId
            ) {
              onError?.(
                error instanceof Error
                  ? error
                  : new Error(
                      "No se pudo revisar la operación.",
                    ),
              );
            }
          }
        })();
      },
      (error) => {
        if (!active) {
          return;
        }

        onError?.(
          error instanceof Error
            ? error
            : new Error(
                "No se pudo revisar la operación.",
              ),
        );
      },
    );

  return () => {
    active = false;
    requestId += 1;
    unsubscribe();
  };
}

async function createSaleNotification(
  input: {
    recipientId: string;
    actorId: string;
    actorName: string;
    type: SaleNotificationType;
    title: string;
    body: string;
    href: string;
    referenceId: string;
    listingId: string;
    saleId: string;
  },
): Promise<void> {
  const recipientId =
    normalizeRequiredId(
      input.recipientId,
      "el destinatario",
    );

  const actorId =
    normalizeRequiredId(
      input.actorId,
      "el usuario",
    );

  assertCurrentUser(
    actorId,
  );

  if (
    recipientId === actorId
  ) {
    throw new Error(
      "No se crean notificaciones para acciones propias.",
    );
  }

  const actorName =
    String(
      input.actorName || "",
    )
      .trim()
      .slice(0, 100);

  const title =
    String(
      input.title || "",
    )
      .trim()
      .slice(0, 120);

  const body =
    String(
      input.body || "",
    )
      .trim()
      .slice(0, 500);

  const href =
    String(
      input.href || "",
    )
      .trim()
      .slice(0, 500);

  const referenceId =
    normalizeRequiredId(
      input.referenceId,
      "la referencia",
    );

  if (
    !title ||
    !body ||
    !href
  ) {
    throw new Error(
      "La notificación no es válida.",
    );
  }

  const notificationId =
    `${input.type}_${referenceId}_${recipientId}`;

  await setDoc(
    doc(
      db,
      "notifications",
      notificationId,
    ),
    {
      recipientId,
      actorId,
      actorName,
      type:
        input.type,
      title,
      body,
      href,
      referenceId,
      listingId:
        normalizeRequiredId(
          input.listingId,
          "la publicación",
        ),
      saleId:
        normalizeRequiredId(
          input.saleId,
          "la operación",
        ),
      read: false,
      createdAt:
        serverTimestamp(),
      readAt: null,
    },
  );
}

async function resolveSaleForAction(
  listingId: string,
  buyerId: string,
  saleId?: string,
): Promise<ListingSale | null> {
  const requestedSaleId =
    String(
      saleId || "",
    ).trim();

  if (requestedSaleId) {
    return getListingSaleById(
      requestedSaleId,
    );
  }

  const sales =
    await getBuyerListingSales(
      listingId,
      buyerId,
    );

  return (
    sales.find(
      (sale) =>
        sale.status ===
        "pending_confirmation",
    ) ??
    null
  );
}

export async function confirmListingSale(
  input: ConfirmListingSaleData,
): Promise<string> {
  const listingId =
    normalizeRequiredId(
      input.listingId,
      "la publicación",
    );

  const buyerId =
    normalizeRequiredId(
      input.buyerId,
      "el comprador",
    );

  assertCurrentUser(
    buyerId,
  );

  const resolvedSale =
    await resolveSaleForAction(
      listingId,
      buyerId,
      input.saleId,
    );

  if (!resolvedSale) {
    throw new Error(
      "No existe una operación pendiente para confirmar.",
    );
  }

  const saleId =
    resolvedSale.id;

  const listingRef =
    doc(
      db,
      "listings",
      listingId,
    );

  const saleRef =
    doc(
      db,
      "listingSales",
      saleId,
    );

  const notificationContext =
    await runTransaction(
      db,
      async (transaction) => {
        const saleSnapshot =
          await transaction.get(
            saleRef,
          );

        if (
          !saleSnapshot.exists()
        ) {
          throw new Error(
            "No existe una operación pendiente para confirmar.",
          );
        }

        const listingSnapshot =
          await transaction.get(
            listingRef,
          );

        if (
          !listingSnapshot.exists()
        ) {
          throw new Error(
            "La publicación no existe.",
          );
        }

        const sale =
          mapListingSale(
            saleSnapshot.id,
            saleSnapshot.data() as FirestoreData,
          );

        const listingData =
          listingSnapshot.data() as FirestoreData;

        if (
          sale.listingId !==
            listingId ||
          sale.buyerId !==
            buyerId
        ) {
          throw new Error(
            "No tenés permiso para confirmar esta operación.",
          );
        }

        const listingSellerId =
          String(
            listingData.userId ?? "",
          ).trim();

        if (
          sale.sellerId !==
          listingSellerId
        ) {
          throw new Error(
            "La operación no coincide con el vendedor.",
          );
        }

        if (
          sale.status ===
          "cancelled"
        ) {
          throw new Error(
            "La solicitud fue cancelada.",
          );
        }

        if (
          sale.status ===
          "confirmed"
        ) {
          return {
            shouldNotify: false,
            sellerId:
              sale.sellerId,
            buyerName:
              sale.buyerName,
            listingTitle:
              sale.listingTitle,
            quantity:
              sale.quantity,
          };
        }

        const quantity =
          normalizeOperationQuantity(
            sale.quantity,
          );

        const currentStock =
          getListingStockState(
            listingData,
          );

        if (
          currentStock.reservedUnits <
          quantity
        ) {
          throw new Error(
            "La publicación ya no conserva el stock reservado para esta operación.",
          );
        }

        const nextReservedUnits =
          Math.max(
            currentStock.reservedUnits -
              quantity,
            0,
          );

        const nextSoldUnits =
          Math.min(
            currentStock.soldUnits +
              quantity,
            currentStock.stockTotal,
          );

        const nextStock:
          ListingStockState = {
          stockTotal:
            currentStock.stockTotal,

          reservedUnits:
            nextReservedUnits,

          soldUnits:
            nextSoldUnits,

          availableUnits:
            Math.max(
              currentStock.stockTotal -
                nextSoldUnits -
                nextReservedUnits,
              0,
            ),
        };

        const nextStatus =
          getStatusFromStock(
            nextStock,
          );

        transaction.update(
          saleRef,
          {
            status:
              "confirmed",
            confirmedAt:
              serverTimestamp(),
            updatedAt:
              serverTimestamp(),
          },
        );

        transaction.update(
          listingRef,
          {
            stockTotal:
              nextStock.stockTotal,

            reservedUnits:
              nextStock.reservedUnits,

            soldUnits:
              nextStock.soldUnits,

            sold:
              nextStatus ===
              "sold",

            status:
              nextStatus,

            saleId,

            saleMode:
              nextStock.stockTotal ===
              1
                ? "marketplace_user"
                : deleteField(),

            soldAt:
              nextStatus ===
              "sold"
                ? serverTimestamp()
                : deleteField(),

            updatedAt:
              serverTimestamp(),
          },
        );

        return {
          shouldNotify: true,
          sellerId:
            sale.sellerId,
          buyerName:
            sale.buyerName,
          listingTitle:
            sale.listingTitle,
          quantity,
        };
      },
    );

  if (
    notificationContext.shouldNotify
  ) {
    try {
      await createSaleNotification({
        recipientId:
          notificationContext.sellerId,

        actorId:
          buyerId,

        actorName:
          notificationContext.buyerName,

        type:
          "sale_confirmed",

        title:
          "Operación confirmada",

        body:
          notificationContext.quantity ===
          1
            ? `${notificationContext.buyerName} confirmó que hubo un trato por "${notificationContext.listingTitle}".`
            : `${notificationContext.buyerName} confirmó el trato por ${notificationContext.quantity} unidades de "${notificationContext.listingTitle}".`,

        href:
          "/mis-publicaciones",

        referenceId:
          `${saleId}_confirmed`,

        listingId,
        saleId,
      });
    } catch (notificationError) {
      console.warn(
        "La operación quedó confirmada, pero no se pudo crear la notificación:",
        notificationError,
      );
    }
  }

  return saleId;
}

export async function cancelListingSale(
  input: CancelListingSaleData,
): Promise<void> {
  const listingId =
    normalizeRequiredId(
      input.listingId,
      "la publicación",
    );

  const buyerId =
    normalizeRequiredId(
      input.buyerId,
      "el comprador",
    );

  const actorId =
    normalizeRequiredId(
      input.actorId,
      "el usuario",
    );

  assertCurrentUser(
    actorId,
  );

  const resolvedSale =
    await resolveSaleForAction(
      listingId,
      buyerId,
      input.saleId,
    );

  if (!resolvedSale) {
    throw new Error(
      "La operación no existe.",
    );
  }

  const saleId =
    resolvedSale.id;

  const listingRef =
    doc(
      db,
      "listings",
      listingId,
    );

  const saleRef =
    doc(
      db,
      "listingSales",
      saleId,
    );

  const notificationContext =
    await runTransaction(
      db,
      async (transaction) => {
        const saleSnapshot =
          await transaction.get(
            saleRef,
          );

        if (
          !saleSnapshot.exists()
        ) {
          throw new Error(
            "La operación no existe.",
          );
        }

        const listingSnapshot =
          await transaction.get(
            listingRef,
          );

        if (
          !listingSnapshot.exists()
        ) {
          throw new Error(
            "La publicación no existe.",
          );
        }

        const sale =
          mapListingSale(
            saleSnapshot.id,
            saleSnapshot.data() as FirestoreData,
          );

        const listingData =
          listingSnapshot.data() as FirestoreData;

        if (
          sale.listingId !==
            listingId ||
          sale.buyerId !==
            buyerId
        ) {
          throw new Error(
            "La operación no coincide con este comprador.",
          );
        }

        if (
          actorId !==
            sale.sellerId &&
          actorId !==
            sale.buyerId
        ) {
          throw new Error(
            "No tenés permiso para cancelar esta solicitud.",
          );
        }

        if (
          sale.status ===
          "confirmed"
        ) {
          throw new Error(
            "Una operación confirmada no puede cancelarse.",
          );
        }

        const sellerName =
          String(
            listingData.userName ??
              "Vendedor",
          )
            .trim()
            .slice(0, 100) ||
          "Vendedor";

        const actorIsBuyer =
          actorId ===
          sale.buyerId;

        const recipientId =
          actorIsBuyer
            ? sale.sellerId
            : sale.buyerId;

        const actorName =
          actorIsBuyer
            ? sale.buyerName
            : sellerName;

        if (
          sale.status ===
          "cancelled"
        ) {
          return {
            shouldNotify: false,
            actorIsBuyer,
            recipientId,
            actorName,
            listingTitle:
              sale.listingTitle,
            quantity:
              sale.quantity,
          };
        }

        const quantity =
          normalizeOperationQuantity(
            sale.quantity,
          );

        const currentStock =
          getListingStockState(
            listingData,
          );

        if (
          currentStock.reservedUnits <
          quantity
        ) {
          throw new Error(
            "La publicación ya no conserva el stock reservado para esta operación.",
          );
        }

        const nextReservedUnits =
          Math.max(
            currentStock.reservedUnits -
              quantity,
            0,
          );

        const nextStock:
          ListingStockState = {
          stockTotal:
            currentStock.stockTotal,

          soldUnits:
            currentStock.soldUnits,

          reservedUnits:
            nextReservedUnits,

          availableUnits:
            Math.max(
              currentStock.stockTotal -
                currentStock.soldUnits -
                nextReservedUnits,
              0,
            ),
        };

        const nextStatus =
          getStatusFromStock(
            nextStock,
          );

        transaction.update(
          saleRef,
          {
            status:
              "cancelled",

            cancelledAt:
              serverTimestamp(),

            cancelledBy:
              actorId,

            updatedAt:
              serverTimestamp(),
          },
        );

        transaction.update(
          listingRef,
          {
            stockTotal:
              nextStock.stockTotal,

            reservedUnits:
              nextStock.reservedUnits,

            soldUnits:
              nextStock.soldUnits,

            sold:
              nextStatus ===
              "sold",

            status:
              nextStatus,

            saleId,

            saleMode:
              nextStock.stockTotal ===
                1 &&
              nextStatus ===
                "sold"
                ? listingData.saleMode
                : deleteField(),

            soldAt:
              nextStatus ===
              "sold"
                ? listingData.soldAt ??
                  serverTimestamp()
                : deleteField(),

            updatedAt:
              serverTimestamp(),
          },
        );

        return {
          shouldNotify: true,
          actorIsBuyer,
          recipientId,
          actorName,
          listingTitle:
            sale.listingTitle,
          quantity,
        };
      },
    );

  if (
    notificationContext.shouldNotify
  ) {
    try {
      const quantityText =
        notificationContext.quantity ===
        1
          ? ""
          : ` (${notificationContext.quantity} unidades)`;

      await createSaleNotification({
        recipientId:
          notificationContext.recipientId,

        actorId,

        actorName:
          notificationContext.actorName,

        type:
          "sale_cancelled",

        title:
          notificationContext.actorIsBuyer
            ? "Solicitud rechazada"
            : "Solicitud cancelada",

        body:
          notificationContext.actorIsBuyer
            ? `${notificationContext.actorName} indicó que no reconoce el trato por "${notificationContext.listingTitle}"${quantityText}.`
            : `${notificationContext.actorName} canceló la solicitud de confirmación por "${notificationContext.listingTitle}"${quantityText}.`,

        href:
          notificationContext.actorIsBuyer
            ? "/mis-publicaciones"
            : `/explorar/${listingId}`,

        referenceId:
          `${saleId}_cancelled`,

        listingId,
        saleId,
      });
    } catch (notificationError) {
      console.warn(
        "La solicitud quedó cancelada, pero no se pudo crear la notificación:",
        notificationError,
      );
    }
  }
}
