import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getActiveStoreCatalog,
  getStoreDetailById,
  incrementStoreView,
} from "./storeDetailFirestoreService";

import type {
  StoreCatalogItem,
  StoreDetailStore,
} from "./storeDetailTypes";

interface StoreDetailState {
  store: StoreDetailStore | null;
  catalog: StoreCatalogItem[];
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useStoreDetail(
  storeId: string,
): StoreDetailState {
  const requestIdRef = useRef(0);

  const [store, setStore] =
    useState<StoreDetailStore | null>(
      null,
    );

  const [catalog, setCatalog] =
    useState<StoreCatalogItem[]>(
      [],
    );

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const reload = useCallback(
    async () => {
      const normalizedStoreId =
        String(storeId ?? "").trim();

      if (!normalizedStoreId) {
        setStore(null);
        setCatalog([]);
        setError(
          "La tienda no es válida.",
        );
        setIsLoading(false);
        return;
      }

      const requestId =
        requestIdRef.current + 1;

      requestIdRef.current =
        requestId;

      setIsLoading(true);
      setError(null);

      try {
        const nextStore =
          await getStoreDetailById(
            normalizedStoreId,
          );

        if (
          requestIdRef.current !==
          requestId
        ) {
          return;
        }

        if (!nextStore) {
          setStore(null);
          setCatalog([]);
          setError(
            "La tienda no existe o ya no está disponible.",
          );
          return;
        }

        const nextCatalog =
          await getActiveStoreCatalog(
            normalizedStoreId,
          );

        if (
          requestIdRef.current !==
          requestId
        ) {
          return;
        }

        setStore(nextStore);
        setCatalog(nextCatalog);

        void incrementStoreView(
          normalizedStoreId,
        );
      } catch (loadError) {
        if (
          requestIdRef.current !==
          requestId
        ) {
          return;
        }

        console.error(
          "Error cargando detalle de tienda:",
          loadError,
        );

        setStore(null);
        setCatalog([]);

        setError(
          loadError instanceof Error &&
            loadError.message.trim()
            ? loadError.message
            : "No pudimos cargar esta tienda.",
        );
      } finally {
        if (
          requestIdRef.current ===
          requestId
        ) {
          setIsLoading(false);
        }
      }
    },
    [storeId],
  );

  useEffect(() => {
    void reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return {
    store,
    catalog,
    error,
    isLoading,
    reload,
  };
}
