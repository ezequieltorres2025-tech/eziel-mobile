import {
  deleteDoc,
  doc,
  getDoc,
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
