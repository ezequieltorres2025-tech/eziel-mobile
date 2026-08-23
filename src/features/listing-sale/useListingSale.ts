import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  cancelListingSale,
  confirmListingSale,
  subscribeToListingSale,
} from "./listingSaleFirestoreService";

import type {
  ListingSale,
} from "./listingSaleTypes";

interface UseListingSaleState {
  sale: ListingSale | null;
  isLoading: boolean;
  error: string | null;
  message: string | null;
  isConfirming: boolean;
  isCancelling: boolean;
  confirm: () => Promise<void>;
  cancel: () => Promise<void>;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}

export function useListingSale(
  listingId: string,
  buyerId: string,
  enabled: boolean,
): UseListingSaleState {
  const [sale, setSale] =
    useState<ListingSale | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false);

  const [
    isCancelling,
    setIsCancelling,
  ] = useState(false);

  useEffect(() => {
    setSale(null);
    setError(null);
    setMessage(null);

    if (
      !enabled ||
      !listingId.trim() ||
      !buyerId.trim()
    ) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe =
      subscribeToListingSale(
        listingId,
        buyerId,
        (nextSale) => {
          setSale(nextSale);
          setError(null);
          setIsLoading(false);
        },
        (subscriptionError) => {
          console.error(
            "Error escuchando operación:",
            subscriptionError,
          );

          setError(
            getErrorMessage(
              subscriptionError,
              "No pudimos revisar esta operación.",
            ),
          );

          setIsLoading(false);
        },
      );

    return unsubscribe;
  }, [
    buyerId,
    enabled,
    listingId,
  ]);

  const confirm =
    useCallback(
      async () => {
        if (
          !sale ||
          sale.status !==
            "pending_confirmation"
        ) {
          throw new Error(
            "No hay una solicitud pendiente para confirmar.",
          );
        }

        const quantity =
          Math.max(
            sale.quantity || 1,
            1,
          );

        try {
          setIsConfirming(true);
          setError(null);
          setMessage(null);

          await confirmListingSale({
            listingId,
            buyerId,
            saleId:
              sale.id,
          });

          setMessage(
            `Operación confirmada por ${quantity} ${
              quantity === 1
                ? "unidad"
                : "unidades"
            }.`,
          );
        } catch (confirmError) {
          const nextError =
            getErrorMessage(
              confirmError,
              "No se pudo confirmar la operación.",
            );

          setError(nextError);
          throw confirmError;
        } finally {
          setIsConfirming(false);
        }
      },
      [
        buyerId,
        listingId,
        sale,
      ],
    );

  const cancel =
    useCallback(
      async () => {
        if (
          !sale ||
          sale.status !==
            "pending_confirmation"
        ) {
          throw new Error(
            "No hay una solicitud pendiente para rechazar.",
          );
        }

        const quantity =
          Math.max(
            sale.quantity || 1,
            1,
          );

        try {
          setIsCancelling(true);
          setError(null);
          setMessage(null);

          await cancelListingSale({
            listingId,
            buyerId,
            actorId:
              buyerId,
            saleId:
              sale.id,
          });

          setMessage(
            `Solicitud rechazada. ${
              quantity === 1
                ? "La unidad reservada volvió"
                : `Las ${quantity} unidades reservadas volvieron`
            } al stock disponible.`,
          );
        } catch (cancelError) {
          const nextError =
            getErrorMessage(
              cancelError,
              "No se pudo rechazar la solicitud.",
            );

          setError(nextError);
          throw cancelError;
        } finally {
          setIsCancelling(false);
        }
      },
      [
        buyerId,
        listingId,
        sale,
      ],
    );

  return {
    sale,
    isLoading,
    error,
    message,
    isConfirming,
    isCancelling,
    confirm,
    cancel,
  };
}
