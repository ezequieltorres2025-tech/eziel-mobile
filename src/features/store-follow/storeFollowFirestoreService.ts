import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "@react-native-firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase";

import {
  DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
} from "./storeFollowTypes";

import type {
  StoreFollow,
  StoreFollowNotificationKey,
  StoreFollowNotificationPreferences,
  StoreFollowState,
} from "./storeFollowTypes";

type FirestoreData =
  Record<string, unknown>;

function normalizeRequiredId(
  value: string,
  fieldName: string,
): string {
  const normalizedValue =
    String(value || "").trim();

  if (!normalizedValue) {
    throw new Error(
      `Falta ${fieldName}.`,
    );
  }

  if (
    normalizedValue.includes("/")
  ) {
    throw new Error(
      `${fieldName} no es válido.`,
    );
  }

  return normalizedValue;
}

function normalizeStoreName(
  value: unknown,
): string {
  const normalizedValue =
    typeof value === "string"
      ? value.trim()
      : "";

  return (
    normalizedValue.slice(
      0,
      120,
    ) || "Tienda"
  );
}

function normalizeFollowersCount(
  value: unknown,
): number {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue,
    ) ||
    !Number.isInteger(
      numericValue,
    ) ||
    numericValue < 0
  ) {
    return 0;
  }

  return numericValue;
}

function normalizeNotificationPreferences(
  value: unknown,
): StoreFollowNotificationPreferences {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return {
      ...DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
    };
  }

  const data =
    value as FirestoreData;

  return {
    newProducts:
      typeof data.newProducts ===
      "boolean"
        ? data.newProducts
        : true,

    offers:
      typeof data.offers ===
      "boolean"
        ? data.offers
        : true,

    clips:
      typeof data.clips ===
      "boolean"
        ? data.clips
        : true,
  };
}

function getStoreFollowId(
  storeId: string,
  userId: string,
): string {
  return `${storeId}_${userId}`;
}

function getContext(
  userId: string,
  storeId: string,
) {
  const normalizedUserId =
    normalizeRequiredId(
      userId,
      "el usuario",
    );

  const normalizedStoreId =
    normalizeRequiredId(
      storeId,
      "la tienda",
    );

  const followId =
    getStoreFollowId(
      normalizedStoreId,
      normalizedUserId,
    );

  return {
    userId: normalizedUserId,
    storeId:
      normalizedStoreId,

    storeRef: doc(
      db,
      "stores",
      normalizedStoreId,
    ),

    followRef: doc(
      db,
      "storeFollowers",
      followId,
    ),
  };
}

function assertCurrentUser(
  userId: string,
): void {
  if (
    auth.currentUser?.uid !==
    userId
  ) {
    throw new Error(
      "La sesión actual no coincide con el usuario.",
    );
  }
}

function mapStoreFollow(
  id: string,
  data: FirestoreData,
): StoreFollow {
  return {
    id,

    storeId:
      typeof data.storeId ===
      "string"
        ? data.storeId
        : "",

    storeOwnerId:
      typeof data.storeOwnerId ===
      "string"
        ? data.storeOwnerId
        : "",

    storeName:
      normalizeStoreName(
        data.storeName,
      ),

    userId:
      typeof data.userId ===
      "string"
        ? data.userId
        : "",

    notifications:
      normalizeNotificationPreferences(
        data.notifications,
      ),

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}

export async function getStoreFollowState(
  userId: string | null,
  storeId: string,
): Promise<StoreFollowState> {
  const normalizedStoreId =
    normalizeRequiredId(
      storeId,
      "la tienda",
    );

  const storeRef = doc(
    db,
    "stores",
    normalizedStoreId,
  );

  const storeSnapshot =
    await getDoc(storeRef);

  if (!storeSnapshot.exists()) {
    throw new Error(
      "La tienda no existe.",
    );
  }

  const followersCount =
    normalizeFollowersCount(
      storeSnapshot.data()
        .followersCount,
    );

  const normalizedUserId =
    String(
      userId ?? "",
    ).trim();

  if (
    !normalizedUserId ||
    auth.currentUser?.uid !==
      normalizedUserId
  ) {
    return {
      isFollowing: false,
      followersCount,
      notifications: {
        ...DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
      },
    };
  }

  const context =
    getContext(
      normalizedUserId,
      normalizedStoreId,
    );

  const followSnapshot =
    await getDoc(
      context.followRef,
    );

  if (
    !followSnapshot.exists()
  ) {
    return {
      isFollowing: false,
      followersCount,
      notifications: {
        ...DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
      },
    };
  }

  const follow =
    mapStoreFollow(
      followSnapshot.id,
      followSnapshot.data() as FirestoreData,
    );

  if (
    follow.userId !==
      normalizedUserId ||
    follow.storeId !==
      normalizedStoreId
  ) {
    throw new Error(
      "El seguimiento guardado no coincide con la tienda o el usuario.",
    );
  }

  return {
    isFollowing: true,
    followersCount,
    notifications: {
      ...follow.notifications,
    },
  };
}

export async function followStore(
  userId: string,
  storeId: string,
): Promise<StoreFollowState> {
  const context =
    getContext(
      userId,
      storeId,
    );

  assertCurrentUser(
    context.userId,
  );

  return runTransaction(
    db,
    async (transaction) => {
      const storeSnapshot =
        await transaction.get(
          context.storeRef,
        );

      const followSnapshot =
        await transaction.get(
          context.followRef,
        );

      if (
        !storeSnapshot.exists()
      ) {
        throw new Error(
          "La tienda no existe.",
        );
      }

      const storeData =
        storeSnapshot.data() as FirestoreData;

      const storeOwnerId =
        typeof storeData.ownerId ===
        "string"
          ? storeData.ownerId.trim()
          : "";

      if (!storeOwnerId) {
        throw new Error(
          "La tienda no tiene un propietario válido.",
        );
      }

      if (
        storeOwnerId ===
        context.userId
      ) {
        throw new Error(
          "No podés seguir tu propia tienda.",
        );
      }

      const followersCount =
        normalizeFollowersCount(
          storeData.followersCount,
        );

      if (
        followSnapshot.exists()
      ) {
        const existingFollow =
          mapStoreFollow(
            followSnapshot.id,
            followSnapshot.data() as FirestoreData,
          );

        return {
          isFollowing: true,
          followersCount,
          notifications: {
            ...existingFollow.notifications,
          },
        };
      }

      transaction.set(
        context.followRef,
        {
          storeId:
            context.storeId,

          storeOwnerId,

          storeName:
            normalizeStoreName(
              storeData.name,
            ),

          userId:
            context.userId,

          notifications: {
            ...DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
          },

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );

      transaction.update(
        context.storeRef,
        {
          followersCount:
            followersCount + 1,

          updatedAt:
            serverTimestamp(),
        },
      );

      return {
        isFollowing: true,
        followersCount:
          followersCount + 1,

        notifications: {
          ...DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
        },
      };
    },
  );
}

export async function unfollowStore(
  userId: string,
  storeId: string,
): Promise<StoreFollowState> {
  const context =
    getContext(
      userId,
      storeId,
    );

  assertCurrentUser(
    context.userId,
  );

  return runTransaction(
    db,
    async (transaction) => {
      const storeSnapshot =
        await transaction.get(
          context.storeRef,
        );

      const followSnapshot =
        await transaction.get(
          context.followRef,
        );

      if (
        !storeSnapshot.exists()
      ) {
        throw new Error(
          "La tienda no existe.",
        );
      }

      const storeData =
        storeSnapshot.data() as FirestoreData;

      const followersCount =
        normalizeFollowersCount(
          storeData.followersCount,
        );

      if (
        !followSnapshot.exists()
      ) {
        return {
          isFollowing: false,
          followersCount,
          notifications: {
            ...DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
          },
        };
      }

      transaction.delete(
        context.followRef,
      );

      transaction.update(
        context.storeRef,
        {
          followersCount:
            Math.max(
              followersCount - 1,
              0,
            ),

          updatedAt:
            serverTimestamp(),
        },
      );

      return {
        isFollowing: false,

        followersCount:
          Math.max(
            followersCount - 1,
            0,
          ),

        notifications: {
          ...DEFAULT_STORE_FOLLOW_NOTIFICATIONS,
        },
      };
    },
  );
}

export async function updateStoreFollowNotificationPreference(
  userId: string,
  storeId: string,
  preference: StoreFollowNotificationKey,
  enabled: boolean,
): Promise<StoreFollowNotificationPreferences> {
  const context =
    getContext(
      userId,
      storeId,
    );

  assertCurrentUser(
    context.userId,
  );

  const snapshot =
    await getDoc(
      context.followRef,
    );

  if (!snapshot.exists()) {
    throw new Error(
      "Primero tenés que seguir la tienda.",
    );
  }

  const currentFollow =
    mapStoreFollow(
      snapshot.id,
      snapshot.data() as FirestoreData,
    );

  if (
    currentFollow.userId !==
      context.userId ||
    currentFollow.storeId !==
      context.storeId
  ) {
    throw new Error(
      "El seguimiento guardado no coincide con la tienda o el usuario.",
    );
  }

  const nextNotifications: StoreFollowNotificationPreferences =
    {
      ...currentFollow.notifications,
      [preference]:
        enabled === true,
    };

  await updateDoc(
    context.followRef,
    {
      notifications:
        nextNotifications,

      updatedAt:
        serverTimestamp(),
    },
  );

  return {
    ...nextNotifications,
  };
}
