import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase";

function normalizeRequiredId(
  value: string,
  fieldName: string,
): string {
  const normalized =
    String(value ?? "").trim();

  if (!normalized) {
    throw new Error(
      `Falta ${fieldName}.`,
    );
  }

  if (normalized.includes("/")) {
    throw new Error(
      `${fieldName} no es válido.`,
    );
  }

  return normalized;
}

function getFavoriteRef(
  userId: string,
  listingId: string,
) {
  const normalizedUserId =
    normalizeRequiredId(
      userId,
      "el usuario",
    );

  const normalizedListingId =
    normalizeRequiredId(
      listingId,
      "la publicación",
    );

  return {
    userId: normalizedUserId,
    listingId:
      normalizedListingId,

    favoriteRef: doc(
      db,
      "users",
      normalizedUserId,
      "favorites",
      normalizedListingId,
    ),
  };
}

function getFavoritesCollectionRef(
  userId: string,
) {
  const normalizedUserId =
    normalizeRequiredId(
      userId,
      "el usuario",
    );

  return {
    userId: normalizedUserId,

    favoritesRef: collection(
      db,
      "users",
      normalizedUserId,
      "favorites",
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

function getTimestampMillis(
  value: unknown,
): number {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return 0;
  }

  const candidate =
    value as {
      toMillis?: () => number;
      seconds?: number;
    };

  if (
    typeof candidate.toMillis ===
    "function"
  ) {
    try {
      const millis =
        candidate.toMillis();

      return Number.isFinite(millis)
        ? millis
        : 0;
    } catch {
      return 0;
    }
  }

  if (
    typeof candidate.seconds ===
      "number" &&
    Number.isFinite(
      candidate.seconds,
    )
  ) {
    return (
      candidate.seconds * 1000
    );
  }

  return 0;
}

function mapFavoriteIds(
  documents: Array<{
    id: string;
    data: () => unknown;
  }>,
): string[] {
  return documents
    .map((document) => {
      const data =
        document.data() as
          | Record<
              string,
              unknown
            >
          | undefined;

      return {
        listingId:
          String(
            document.id ?? "",
          ).trim(),

        createdAtMillis:
          getTimestampMillis(
            data?.createdAt,
          ),
      };
    })
    .filter(
      (favorite) =>
        Boolean(
          favorite.listingId,
        ),
    )
    .sort((a, b) => {
      const timeDifference =
        b.createdAtMillis -
        a.createdAtMillis;

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return a.listingId.localeCompare(
        b.listingId,
      );
    })
    .map(
      (favorite) =>
        favorite.listingId,
    );
}

export function subscribeToListingFavorite(
  userId: string,
  listingId: string,
  onChange: (
    isFavorited: boolean,
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): () => void {
  const context =
    getFavoriteRef(
      userId,
      listingId,
    );

  assertCurrentUser(
    context.userId,
  );

  return onSnapshot(
    context.favoriteRef,
    (snapshot) => {
      onChange(
        snapshot.exists(),
      );
    },
    (error) => {
      console.error(
        "Error escuchando favorito:",
        error,
      );

      onError?.(
        error instanceof Error
          ? error
          : new Error(
              "No pudimos cargar el favorito.",
            ),
      );
    },
  );
}

export function subscribeToUserListingFavoriteIds(
  userId: string,
  onChange: (
    listingIds: string[],
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): () => void {
  const context =
    getFavoritesCollectionRef(
      userId,
    );

  assertCurrentUser(
    context.userId,
  );

  return onSnapshot(
    context.favoritesRef,
    (snapshot) => {
      onChange(
        mapFavoriteIds(
          snapshot.docs,
        ),
      );
    },
    (error) => {
      console.error(
        "Error escuchando lista de favoritos:",
        error,
      );

      onError?.(
        error instanceof Error
          ? error
          : new Error(
              "No pudimos cargar tus favoritos.",
            ),
      );
    },
  );
}

export async function getUserListingFavoriteIds(
  userId: string,
): Promise<string[]> {
  const context =
    getFavoritesCollectionRef(
      userId,
    );

  assertCurrentUser(
    context.userId,
  );

  const snapshot =
    await getDocs(
      context.favoritesRef,
    );

  return mapFavoriteIds(
    snapshot.docs,
  );
}

export async function isListingFavorite(
  userId: string,
  listingId: string,
): Promise<boolean> {
  const context =
    getFavoriteRef(
      userId,
      listingId,
    );

  assertCurrentUser(
    context.userId,
  );

  const snapshot =
    await getDoc(
      context.favoriteRef,
    );

  return snapshot.exists();
}

export async function toggleListingFavorite(
  userId: string,
  listingId: string,
): Promise<boolean> {
  const context =
    getFavoriteRef(
      userId,
      listingId,
    );

  assertCurrentUser(
    context.userId,
  );

  const snapshot =
    await getDoc(
      context.favoriteRef,
    );

  if (snapshot.exists()) {
    await deleteDoc(
      context.favoriteRef,
    );

    return false;
  }

  await setDoc(
    context.favoriteRef,
    {
      listingId:
        context.listingId,

      createdAt:
        serverTimestamp(),
    },
  );

  return true;
}

export async function removeListingFavorite(
  userId: string,
  listingId: string,
): Promise<void> {
  const context =
    getFavoriteRef(
      userId,
      listingId,
    );

  assertCurrentUser(
    context.userId,
  );

  const snapshot =
    await getDoc(
      context.favoriteRef,
    );

  if (!snapshot.exists()) {
    return;
  }

  await deleteDoc(
    context.favoriteRef,
  );
}
