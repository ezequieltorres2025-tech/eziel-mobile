import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "@react-native-firebase/auth";

import {
  auth,
} from "@/lib/firebase";

import {
  subscribeToListingFavorite,
  toggleListingFavorite,
} from "./favoritesFirestoreService";

interface ListingFavoriteState {
  userId: string | null;
  isFavorited: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  toggleFavorite: () => Promise<void>;
}

export function useListingFavorite(
  listingId: string,
): ListingFavoriteState {
  const normalizedListingId =
    String(
      listingId ?? "",
    ).trim();

  const [userId, setUserId] =
    useState<string | null>(
      auth.currentUser?.uid ??
        null,
    );

  const [
    isFavorited,
    setIsFavorited,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    Boolean(
      auth.currentUser?.uid &&
        normalizedListingId,
    ),
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUserId(
            currentUser?.uid ??
              null,
          );
        },
      );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (
      !userId ||
      !normalizedListingId
    ) {
      setIsFavorited(false);
      setIsLoading(false);
      setError(null);

      return;
    }

    setIsLoading(true);
    setError(null);

    let receivedInitialState =
      false;

    const unsubscribe =
      subscribeToListingFavorite(
        userId,
        normalizedListingId,
        (nextIsFavorited) => {
          receivedInitialState =
            true;

          setIsFavorited(
            nextIsFavorited,
          );

          setIsLoading(false);
          setError(null);
        },
        (subscriptionError) => {
          console.error(
            "Error cargando favorito de publicación:",
            subscriptionError,
          );

          if (
            !receivedInitialState
          ) {
            setIsLoading(false);
          }

          setError(
            subscriptionError.message.trim()
              ? subscriptionError.message
              : "No pudimos cargar el favorito.",
          );
        },
      );

    return unsubscribe;
  }, [
    normalizedListingId,
    userId,
  ]);

  const toggleFavorite =
    useCallback(async () => {
      if (
        !userId ||
        !normalizedListingId ||
        isSaving
      ) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const nextIsFavorited =
          await toggleListingFavorite(
            userId,
            normalizedListingId,
          );

        setIsFavorited(
          nextIsFavorited,
        );
      } catch (saveError) {
        console.error(
          "Error actualizando favorito:",
          saveError,
        );

        setError(
          saveError instanceof Error &&
            saveError.message.trim()
            ? saveError.message
            : "No pudimos actualizar favoritos.",
        );
      } finally {
        setIsSaving(false);
      }
    }, [
      isSaving,
      normalizedListingId,
      userId,
    ]);

  return {
    userId,
    isFavorited,
    isLoading,
    isSaving,
    error,
    toggleFavorite,
  };
}
