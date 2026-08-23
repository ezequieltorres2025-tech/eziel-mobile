import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createListingReview,
  subscribeToListingReviewForSale,
} from "./listingReviewFirestoreService";

import type {
  CreateListingReviewData,
  ListingReview,
} from "./listingReviewTypes";

interface UseListingReviewState {
  review: ListingReview | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  submitReview: (
    data: CreateListingReviewData,
  ) => Promise<void>;
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "No se pudo enviar la reseña.";
}

export function useListingReview(
  buyerId: string,
  saleId: string,
  enabled: boolean,
): UseListingReviewState {
  const [
    review,
    setReview,
  ] =
    useState<ListingReview | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    setReview(null);
    setError(null);

    if (
      !enabled ||
      !buyerId.trim() ||
      !saleId.trim()
    ) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe =
      subscribeToListingReviewForSale(
        buyerId,
        saleId,
        (nextReview) => {
          setReview(
            nextReview,
          );

          setError(null);
          setIsLoading(false);
        },
        (subscriptionError) => {
          console.error(
            "Error cargando reseña de la operación:",
            subscriptionError,
          );

          setError(
            getErrorMessage(
              subscriptionError,
            ),
          );

          setIsLoading(false);
        },
      );

    return unsubscribe;
  }, [
    buyerId,
    enabled,
    saleId,
  ]);

  const submitReview =
    useCallback(
      async (
        data:
          CreateListingReviewData,
      ) => {
        if (review) {
          throw new Error(
            "Ya calificaste esta operación.",
          );
        }

        try {
          setIsSubmitting(true);
          setError(null);

          await createListingReview(
            data,
          );
        } catch (submitError) {
          const nextError =
            getErrorMessage(
              submitError,
            );

          setError(
            nextError,
          );

          throw submitError;
        } finally {
          setIsSubmitting(false);
        }
      },
      [review],
    );

  return {
    review,
    isLoading,
    isSubmitting,
    error,
    submitReview,
  };
}
