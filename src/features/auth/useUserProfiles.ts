import {
  useEffect,
  useState,
} from "react";

import {
  subscribeToUserProfiles,
  type UserProfilesById,
} from "./userProfileService";

interface UserProfilesState {
  profilesById: UserProfilesById;
  isLoading: boolean;
  error: string | null;
}

function buildUserIdsKey(
  userIds:
    readonly (
      | string
      | null
      | undefined
    )[],
): string {
  return Array.from(
    new Set(
      userIds
        .map((userId) =>
          String(
            userId ?? "",
          ).trim(),
        )
        .filter(Boolean),
    ),
  )
    .sort()
    .join("\n");
}

export function useUserProfiles(
  userIds:
    readonly (
      | string
      | null
      | undefined
    )[],
): UserProfilesState {
  const userIdsKey =
    buildUserIdsKey(
      userIds,
    );

  const [
    profilesById,
    setProfilesById,
  ] = useState<
    UserProfilesById
  >({});

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    Boolean(userIdsKey),
  );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    const normalizedUserIds =
      userIdsKey
        ? userIdsKey.split("\n")
        : [];

    if (
      normalizedUserIds.length === 0
    ) {
      setProfilesById({});
      setIsLoading(false);
      setError(null);

      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe =
      subscribeToUserProfiles(
        normalizedUserIds,
        (nextProfiles) => {
          setProfilesById(
            nextProfiles,
          );

          setIsLoading(false);
          setError(null);
        },
        (
          subscriptionError,
        ) => {
          console.error(
            "Error cargando perfiles actuales:",
            subscriptionError,
          );

          setIsLoading(false);

          setError(
            subscriptionError
              .message
              .trim()
              ? subscriptionError.message
              : "No pudimos actualizar algunos perfiles.",
          );
        },
      );

    return unsubscribe;
  }, [
    userIdsKey,
  ]);

  return {
    profilesById,
    isLoading,
    error,
  };
}
