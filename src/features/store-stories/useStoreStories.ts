import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getStoreStoriesForDetail,
  isTemporaryStoryActive,
} from "./storeStoriesFirestoreService";

import type {
  StoreStory,
} from "./storeStoriesTypes";

interface StoreStoriesState {
  highlights: StoreStory[];
  temporary: StoreStory[];
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useStoreStories(
  storeId: string,
  enabled = true,
): StoreStoriesState {
  const requestIdRef =
    useRef(0);

  const [highlights, setHighlights] =
    useState<StoreStory[]>([]);

  const [temporary, setTemporary] =
    useState<StoreStory[]>([]);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(enabled);

  const reload =
    useCallback(async () => {
      const normalizedStoreId =
        String(
          storeId ?? "",
        ).trim();

      if (
        !enabled ||
        !normalizedStoreId
      ) {
        requestIdRef.current += 1;

        setHighlights([]);
        setTemporary([]);
        setError(null);
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
        const result =
          await getStoreStoriesForDetail(
            normalizedStoreId,
          );

        if (
          requestIdRef.current !==
          requestId
        ) {
          return;
        }

        setHighlights(
          result.highlights,
        );

        setTemporary(
          result.temporary,
        );
      } catch (loadError) {
        if (
          requestIdRef.current !==
          requestId
        ) {
          return;
        }

        console.error(
          "Error cargando historias de tienda:",
          loadError,
        );

        setHighlights([]);
        setTemporary([]);

        setError(
          "No pudimos cargar las historias.",
        );
      } finally {
        if (
          requestIdRef.current ===
          requestId
        ) {
          setIsLoading(false);
        }
      }
    }, [
      enabled,
      storeId,
    ]);

  useEffect(() => {
    void reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval =
      setInterval(() => {
        setTemporary(
          (current) =>
            current.filter(
              isTemporaryStoryActive,
            ),
        );
      }, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, [enabled]);

  return {
    highlights,
    temporary,
    error,
    isLoading,
    reload,
  };
}
