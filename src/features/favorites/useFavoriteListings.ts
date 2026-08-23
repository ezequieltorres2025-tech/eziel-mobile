import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getExploreListingById,
} from "@/features/explore/exploreFirestoreService";
import type {
  ExploreListing,
} from "@/features/explore/exploreTypes";

import {
  getUserListingFavoriteIds,
  removeListingFavorite,
  subscribeToUserListingFavoriteIds,
} from "./favoritesFirestoreService";

export interface FavoriteListingItem {
  listingId: string;
  listing: ExploreListing | null;
}

interface FavoriteListingsState {
  items: FavoriteListingItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  removingId: string | null;
  error: string | null;
  refresh: () => Promise<void>;
  removeFavorite: (
    listingId: string,
  ) => Promise<void>;
}

async function resolveFavoriteListings(
  listingIds: string[],
): Promise<
  FavoriteListingItem[]
> {
  return Promise.all(
    listingIds.map(
      async (
        listingId,
      ) => {
        try {
          const listing =
            await getExploreListingById(
              listingId,
            );

          return {
            listingId,
            listing,
          };
        } catch (error) {
          console.error(
            `Error cargando publicación favorita ${listingId}:`,
            error,
          );

          return {
            listingId,
            listing: null,
          };
        }
      },
    ),
  );
}

export function useFavoriteListings(
  userId: string | null,
): FavoriteListingsState {
  const [
    items,
    setItems,
  ] = useState<
    FavoriteListingItem[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    Boolean(userId),
  );

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    removingId,
    setRemovingId,
  ] = useState<
    string | null
  >(null);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const requestIdRef =
    useRef(0);

  const loadResolvedItems =
    useCallback(
      async (
        listingIds: string[],
      ) => {
        const requestId =
          ++requestIdRef.current;

        const nextItems =
          await resolveFavoriteListings(
            listingIds,
          );

        if (
          requestId !==
          requestIdRef.current
        ) {
          return;
        }

        setItems(
          nextItems,
        );
      },
      [],
    );

  useEffect(() => {
    requestIdRef.current += 1;

    if (!userId) {
      setItems([]);
      setIsLoading(false);
      setIsRefreshing(false);
      setRemovingId(null);
      setError(null);

      return;
    }

    setIsLoading(true);
    setError(null);

    let active = true;

    const unsubscribe =
      subscribeToUserListingFavoriteIds(
        userId,
        (listingIds) => {
          void (async () => {
            try {
              await loadResolvedItems(
                listingIds,
              );

              if (active) {
                setError(null);
              }
            } catch (
              loadError
            ) {
              console.error(
                "Error resolviendo favoritos:",
                loadError,
              );

              if (active) {
                setError(
                  "No pudimos cargar todas tus publicaciones guardadas.",
                );
              }
            } finally {
              if (active) {
                setIsLoading(
                  false,
                );
              }
            }
          })();
        },
        (
          subscriptionError,
        ) => {
          if (!active) {
            return;
          }

          setIsLoading(false);

          setError(
            subscriptionError
              .message
              .trim()
              ? subscriptionError.message
              : "No pudimos cargar tus favoritos.",
          );
        },
      );

    return () => {
      active = false;
      requestIdRef.current += 1;
      unsubscribe();
    };
  }, [
    loadResolvedItems,
    userId,
  ]);

  const refresh =
    useCallback(async () => {
      if (
        !userId ||
        isRefreshing
      ) {
        return;
      }

      setIsRefreshing(true);
      setError(null);

      try {
        const listingIds =
          await getUserListingFavoriteIds(
            userId,
          );

        await loadResolvedItems(
          listingIds,
        );
      } catch (
        refreshError
      ) {
        console.error(
          "Error actualizando favoritos:",
          refreshError,
        );

        setError(
          refreshError instanceof Error &&
            refreshError.message.trim()
            ? refreshError.message
            : "No pudimos actualizar tus favoritos.",
        );
      } finally {
        setIsRefreshing(false);
      }
    }, [
      isRefreshing,
      loadResolvedItems,
      userId,
    ]);

  const removeFavorite =
    useCallback(
      async (
        listingId: string,
      ) => {
        if (
          !userId ||
          removingId
        ) {
          return;
        }

        setRemovingId(
          listingId,
        );

        setError(null);

        try {
          await removeListingFavorite(
            userId,
            listingId,
          );

          setItems(
            (current) =>
              current.filter(
                (item) =>
                  item.listingId !==
                  listingId,
              ),
          );
        } catch (
          removeError
        ) {
          console.error(
            "Error quitando favorito:",
            removeError,
          );

          setError(
            removeError instanceof Error &&
              removeError.message.trim()
              ? removeError.message
              : "No pudimos quitar esta publicación de favoritos.",
          );
        } finally {
          setRemovingId(
            null,
          );
        }
      },
      [
        removingId,
        userId,
      ],
    );

  return {
    items,
    isLoading,
    isRefreshing,
    removingId,
    error,
    refresh,
    removeFavorite,
  };
}
