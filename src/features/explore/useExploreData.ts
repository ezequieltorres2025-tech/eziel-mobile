import { useCallback, useEffect, useRef, useState } from "react";

import { getExploreData } from "./exploreFirestoreService";

import type { ExploreData } from "./exploreTypes";

interface UseExploreDataResult {
  data: ExploreData | null;
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "No pudimos cargar el contenido de Eziel.";
}

export function useExploreData(): UseExploreDataResult {
  const requestIdRef = useRef(0);

  const [data, setData] = useState<ExploreData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const nextData = await getExploreData();

      if (requestIdRef.current !== requestId) {
        return;
      }

      setData(nextData);
    } catch (loadError) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      console.error("Error cargando Explorar:", loadError);

      setError(getErrorMessage(loadError));
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return {
    data,
    error,
    isLoading,
    reload,
  };
}
