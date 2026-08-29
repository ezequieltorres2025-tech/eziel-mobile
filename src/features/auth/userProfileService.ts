import {
  updateProfile as updateFirebaseAuthProfile,
  type User,
} from "@react-native-firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
} from "@react-native-firebase/firestore";

import { db } from "@/lib/firebase";

export interface UserProfile extends DocumentData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  photoPath?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  role: "user" | "seller" | "admin";
  verified: boolean;
  bio?: string;
  location?: string;
}

export interface UserProfileUpdates {
  displayName: string;
  photoURL: string | null;
  photoPath: string | null;
  bio: string;
  location: string;
}

function normalizeText(value: unknown, fallback = ""): string {
  const normalizedValue = String(value ?? "").trim();

  return normalizedValue || fallback;
}

function normalizeOptionalText(value: unknown): string | undefined {
  const normalizedValue = String(value ?? "").trim();

  return normalizedValue || undefined;
}

function normalizeUserProfile(
  uid: string,
  data: DocumentData,
): UserProfile {
  return {
    ...data,
    uid: normalizeText(data.uid, uid),
    displayName: normalizeText(data.displayName, "Usuario"),
    email: normalizeText(data.email),
    photoURL: normalizeOptionalText(data.photoURL) ?? null,
    photoPath: normalizeOptionalText(data.photoPath) ?? null,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt
        : Timestamp.now(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt
        : Timestamp.now(),
    role:
      data.role === "seller" || data.role === "admin"
        ? data.role
        : "user",
    verified: data.verified === true,
    bio: normalizeOptionalText(data.bio),
    location: normalizeOptionalText(data.location),
  };
}

export async function saveOrUpdateUserProfile(
  firebaseUser: User,
): Promise<UserProfile> {
  const userRef = doc(
    db,
    "users",
    firebaseUser.uid,
  );

  const userSnapshot = await getDoc(userRef);

  const now = Timestamp.now();

  if (userSnapshot.exists()) {
    const existingData =
      userSnapshot.data();

    const hasDisplayName =
      Object.prototype.hasOwnProperty.call(
        existingData,
        "displayName",
      );

    const hasPhotoURL =
      Object.prototype.hasOwnProperty.call(
        existingData,
        "photoURL",
      );

    const displayName =
      hasDisplayName
        ? normalizeText(
            existingData.displayName,
            "Usuario",
          )
        : normalizeText(
            firebaseUser.displayName,
            "Usuario",
          );

    const photoURL =
      hasPhotoURL
        ? normalizeOptionalText(
            existingData.photoURL,
          ) ?? null
        : normalizeOptionalText(
            firebaseUser.photoURL,
          ) ?? null;

    const email =
      normalizeText(firebaseUser.email);

    const shouldSeedDisplayName =
      !hasDisplayName;

    const shouldSeedPhotoURL =
      !hasPhotoURL;

    const shouldUpdateEmail =
      normalizeText(existingData.email) !==
      email;

    const shouldUpdateFirestore =
      shouldSeedDisplayName ||
      shouldSeedPhotoURL ||
      shouldUpdateEmail;

    if (shouldUpdateFirestore) {
      await updateDoc(userRef, {
        ...(shouldSeedDisplayName
          ? { displayName }
          : {}),
        ...(shouldSeedPhotoURL
          ? { photoURL }
          : {}),
        ...(shouldUpdateEmail
          ? { email }
          : {}),
        updatedAt: now,
      });
    }

    if (
      firebaseUser.displayName !== displayName ||
      firebaseUser.photoURL !== photoURL
    ) {
      try {
        await updateFirebaseAuthProfile(
          firebaseUser,
          {
            displayName,
            photoURL,
          },
        );
      } catch (authSyncError) {
        console.error(
          "No se pudo sincronizar Firebase Auth desde Firestore:",
          authSyncError,
        );
      }
    }

    return normalizeUserProfile(
      firebaseUser.uid,
      {
        ...existingData,
        ...(shouldSeedDisplayName
          ? { displayName }
          : {}),
        ...(shouldSeedPhotoURL
          ? { photoURL }
          : {}),
        ...(shouldUpdateEmail
          ? { email }
          : {}),
        ...(shouldUpdateFirestore
          ? { updatedAt: now }
          : {}),
      },
    );
  }

  const userProfile: UserProfile = {
    uid: firebaseUser.uid,
    displayName: normalizeText(
      firebaseUser.displayName,
      "Usuario",
    ),
    email: normalizeText(firebaseUser.email),
    photoURL:
      normalizeOptionalText(
        firebaseUser.photoURL,
      ) ?? null,
    createdAt: now,
    updatedAt: now,
    role: "user",
    verified: false,
  };

  await setDoc(userRef, userProfile);

  return userProfile;
}

export async function updateCurrentUserProfile(
  firebaseUser: User,
  updates: UserProfileUpdates,
): Promise<UserProfile> {
  const displayName = normalizeText(
    updates.displayName,
  );

  if (!displayName) {
    throw new Error(
      "El nombre visible es obligatorio.",
    );
  }

  const photoURL =
    normalizeOptionalText(
      updates.photoURL,
    ) ?? null;

  const photoPath =
    normalizeOptionalText(
      updates.photoPath,
    ) ?? null;

  const bio =
    normalizeOptionalText(
      updates.bio,
    ) ?? "";

  const location =
    normalizeOptionalText(
      updates.location,
    ) ?? "";

  const userRef = doc(
    db,
    "users",
    firebaseUser.uid,
  );

  const existingSnapshot = await getDoc(userRef);

  const previousDisplayName =
    firebaseUser.displayName;

  const previousPhotoURL =
    firebaseUser.photoURL;

  await updateFirebaseAuthProfile(
    firebaseUser,
    {
      displayName,
      photoURL,
    },
  );

  try {
    const now = Timestamp.now();

    if (existingSnapshot.exists()) {
      await updateDoc(userRef, {
        displayName,
        photoURL,
        photoPath,
        bio,
        location,
        updatedAt: now,
      });
    } else {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        displayName,
        email: normalizeText(
          firebaseUser.email,
        ),
        photoURL,
        photoPath,
        bio,
        location,
        createdAt: now,
        updatedAt: now,
        role: "user",
        verified: false,
      });
    }
  } catch (error) {
    try {
      await updateFirebaseAuthProfile(
        firebaseUser,
        {
          displayName: previousDisplayName,
          photoURL: previousPhotoURL,
        },
      );
    } catch (rollbackError) {
      console.error(
        "No se pudo revertir Firebase Auth después de fallar Firestore:",
        rollbackError,
      );
    }

    throw error;
  }

  const updatedSnapshot = await getDoc(userRef);

  if (!updatedSnapshot.exists()) {
    throw new Error(
      "El perfil actualizado no pudo recuperarse.",
    );
  }

  return normalizeUserProfile(
    firebaseUser.uid,
    updatedSnapshot.data(),
  );
}

export async function syncUserProfile(
  firebaseUser: User,
): Promise<UserProfile> {
  return saveOrUpdateUserProfile(firebaseUser);
}
