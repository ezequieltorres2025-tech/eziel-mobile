import { useCallback, useEffect, useRef, useState } from "react";

import { getExploreServiceById } from "@/features/explore/exploreFirestoreService";

import type { ExploreService } from "@/features/explore/exploreTypes";

interface ServiceDetailState {
  service: ExploreService | null;
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useServiceDetail(
  serviceId: string,
): ServiceDetailState {
  const requestIdRef = useRef(0);

  const [service, setService] =
    useState<ExploreService | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const reload = useCallback(async () => {
    const normalizedServiceId =
      String(serviceId ?? "").trim();

    if (!normalizedServiceId) {
      setService(null);
      setError("El servicio no es válido.");
      setIsLoading(false);
      return;
    }

    const requestId =
      requestIdRef.current + 1;

    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const nextService =
        await getExploreServiceById(
          normalizedServiceId,
        );

      if (
        requestIdRef.current !== requestId
      ) {
        return;
      }

      if (!nextService) {
        setService(null);
        setError(
          "El servicio no existe o ya no está disponible.",
        );
        return;
      }

      setService(nextService);
    } catch (loadError) {
      if (
        requestIdRef.current !== requestId
      ) {
        return;
      }

      console.error(
        "Error cargando detalle de servicio:",
        loadError,
      );

      setService(null);

      setError(
        loadError instanceof Error &&
          loadError.message.trim()
          ? loadError.message
          : "No pudimos cargar este servicio.",
      );
    } finally {
      if (
        requestIdRef.current === requestId
      ) {
        setIsLoading(false);
      }
    }
  }, [serviceId]);

  useEffect(() => {
    void reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return {
    service,
    error,
    isLoading,
    reload,
  };
}
