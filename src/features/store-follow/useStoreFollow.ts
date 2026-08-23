import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "@react-native-firebase/auth";

import {
  auth,
} from "@/lib/firebase";

import {
  followStore,
  getStoreFollowState,
  unfollowStore,
  updateStoreFollowNotificationPreference,
} from "./storeFollowFirestoreService";

import {
  DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
} from "./storeFollowTypes";

import type {
  StoreFollowNotificationKey,
  StoreFollowNotificationPreferences,
} from "./storeFollowTypes";

interface UseStoreFollowOptions {
  storeId: string;
  storeOwnerId: string;
}

interface StoreFollowHookState {
  userId: string | null;
  isOwner: boolean;
  isFollowing: boolean;
  followersCount: number;
  notifications: StoreFollowNotificationPreferences;
  isLoading: boolean;
  isSaving: boolean;
  savingPreference: StoreFollowNotificationKey | null;
  error: string | null;
  toggleFollow: () => Promise<void>;
  toggleNotification: (
    preference: StoreFollowNotificationKey,
    enabled: boolean,
  ) => Promise<void>;
  reload: () => Promise<void>;
}

export function useStoreFollow({
  storeId,
  storeOwnerId,
}: UseStoreFollowOptions): StoreFollowHookState {
  const requestIdRef =
    useRef(0);

  const [userId, setUserId] =
    useState<string | null>(
      auth.currentUser?.uid ??
        null,
    );

  const [
    isFollowing,
    setIsFollowing,
  ] = useState(false);

  const [
    followersCount,
    setFollowersCount,
  ] = useState(0);

  const [
    notifications,
    setNotifications,
  ] =
    useState<StoreFollowNotificationPreferences>(
      {
        ...DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
      },
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    savingPreference,
    setSavingPreference,
  ] =
    useState<StoreFollowNotificationKey | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const normalizedStoreId =
    String(storeId ?? "").trim();

  const normalizedOwnerId =
    String(
      storeOwnerId ?? "",
    ).trim();

  const isOwner =
    Boolean(
      userId &&
        normalizedOwnerId &&
        userId ===
          normalizedOwnerId,
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

  const reload =
    useCallback(async () => {
      if (
        !normalizedStoreId
      ) {
        setIsFollowing(false);
        setFollowersCount(0);
        setNotifications({
          ...DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
        });
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
        const nextState =
          await getStoreFollowState(
            userId,
            normalizedStoreId,
          );

        if (
          requestIdRef.current !==
          requestId
        ) {
          return;
        }

        setIsFollowing(
          nextState.isFollowing,
        );

        setFollowersCount(
          nextState.followersCount,
        );

        setNotifications({
          ...nextState.notifications,
        });
      } catch (loadError) {
        if (
          requestIdRef.current !==
          requestId
        ) {
          return;
        }

        console.error(
          "Error cargando seguimiento de tienda:",
          loadError,
        );

        setError(
          loadError instanceof
              Error &&
            loadError.message.trim()
            ? loadError.message
            : "No pudimos cargar el seguimiento.",
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
      normalizedStoreId,
      userId,
    ]);

  useEffect(() => {
    void reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  const toggleFollow =
    useCallback(async () => {
      if (
        !userId ||
        !normalizedStoreId ||
        isOwner ||
        isSaving
      ) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const nextState =
          isFollowing
            ? await unfollowStore(
                userId,
                normalizedStoreId,
              )
            : await followStore(
                userId,
                normalizedStoreId,
              );

        setIsFollowing(
          nextState.isFollowing,
        );

        setFollowersCount(
          nextState.followersCount,
        );

        setNotifications({
          ...nextState.notifications,
        });
      } catch (saveError) {
        console.error(
          "Error actualizando seguimiento de tienda:",
          saveError,
        );

        setError(
          saveError instanceof
              Error &&
            saveError.message.trim()
            ? saveError.message
            : "No pudimos actualizar el seguimiento.",
        );
      } finally {
        setIsSaving(false);
      }
    }, [
      isFollowing,
      isOwner,
      isSaving,
      normalizedStoreId,
      userId,
    ]);

  const toggleNotification =
    useCallback(
      async (
        preference: StoreFollowNotificationKey,
        enabled: boolean,
      ) => {
        if (
          !userId ||
          !normalizedStoreId ||
          !isFollowing ||
          savingPreference
        ) {
          return;
        }

        setSavingPreference(
          preference,
        );

        setError(null);

        try {
          const nextNotifications =
            await updateStoreFollowNotificationPreference(
              userId,
              normalizedStoreId,
              preference,
              enabled,
            );

          setNotifications({
            ...nextNotifications,
          });
        } catch (saveError) {
          console.error(
            "Error actualizando avisos de tienda:",
            saveError,
          );

          setError(
            saveError instanceof
                Error &&
              saveError.message.trim()
              ? saveError.message
              : "No pudimos actualizar los avisos.",
          );
        } finally {
          setSavingPreference(
            null,
          );
        }
      },
      [
        isFollowing,
        normalizedStoreId,
        savingPreference,
        userId,
      ],
    );

  return {
    userId,
    isOwner,
    isFollowing,
    followersCount,
    notifications,
    isLoading,
    isSaving,
    savingPreference,
    error,
    toggleFollow,
    toggleNotification,
    reload,
  };
}
