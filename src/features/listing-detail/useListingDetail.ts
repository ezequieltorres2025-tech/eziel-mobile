import { useCallback, useEffect, useRef, useState } from "react";

import {
  getExploreListingById,
  getExploreStoreById,
} from "@/features/explore/exploreFirestoreService";

import type {
  ExploreListing,
  ExploreStore,
} from "@/features/explore/exploreTypes";

interface ListingDetailState {
  listing: ExploreListing | null;
  store: ExploreStore | null;
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useListingDetail(
  listingId: string,
): ListingDetailState {
  const requestIdRef = useRef(0);

  const [listing, setListing] =
    useState<ExploreListing | null>(null);

  const [store, setStore] =
    useState<ExploreStore | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const reload = useCallback(async () => {
    const normalizedListingId =
      String(listingId ?? "").trim();

    if (!normalizedListingId) {
      setListing(null);
      setStore(null);
      setError("La publicación no es válida.");
      setIsLoading(false);
      return;
    }

    const requestId =
      requestIdRef.current + 1;

    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const nextListing =
        await getExploreListingById(
          normalizedListingId,
        );

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (!nextListing) {
        setListing(null);
        setStore(null);
        setError("Publicación no encontrada.");
        return;
      }

      let nextStore: ExploreStore | null = null;

      if (nextListing.storeId) {
        try {
          nextStore =
            await getExploreStoreById(
              nextListing.storeId,
            );
        } catch (storeError) {
          console.error(
            "Error cargando tienda de la publicación:",
            storeError,
          );
        }
      }

      if (requestIdRef.current !== requestId) {
        return;
      }

      setListing(nextListing);
      setStore(nextStore);
    } catch (loadError) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      console.error(
        "Error cargando detalle de publicación:",
        loadError,
      );

      setListing(null);
      setStore(null);
      setError(
        loadError instanceof Error &&
          loadError.message.trim()
          ? loadError.message
          : "No pudimos cargar esta publicación.",
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [listingId]);

  useEffect(() => {
    void reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return {
    listing,
    store,
    error,
    isLoading,
    reload,
  };
}
