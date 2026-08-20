import type { User } from "@react-native-firebase/auth";

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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  role: "user" | "seller" | "admin";
  verified: boolean;
  bio?: string;
  location?: string;
}

function normalizeText(value: unknown, fallback = ""): string {
  const normalizedValue = String(value ?? "").trim();

  return normalizedValue || fallback;
}

function normalizeOptionalText(value: unknown): string | undefined {
  const normalizedValue = String(value ?? "").trim();

  return normalizedValue || undefined;
}

function normalizeUserProfile(uid: string, data: DocumentData): UserProfile {
  return {
    ...data,
    uid: normalizeText(data.uid, uid),
    displayName: normalizeText(data.displayName, "Usuario"),
    email: normalizeText(data.email),
    photoURL: normalizeOptionalText(data.photoURL) ?? null,
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    updatedAt:
      data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
    role: data.role === "seller" || data.role === "admin" ? data.role : "user",
    verified: data.verified === true,
    bio: normalizeOptionalText(data.bio),
    location: normalizeOptionalText(data.location),
  };
}

export async function saveOrUpdateUserProfile(
  firebaseUser: User,
): Promise<UserProfile> {
  const userRef = doc(db, "users", firebaseUser.uid);

  const userSnapshot = await getDoc(userRef);

  const now = Timestamp.now();

  if (userSnapshot.exists()) {
    await updateDoc(userRef, {
      displayName: normalizeText(firebaseUser.displayName, "Usuario"),
      email: normalizeText(firebaseUser.email),
      photoURL: normalizeOptionalText(firebaseUser.photoURL) ?? null,
      updatedAt: now,
    });

    const updatedSnapshot = await getDoc(userRef);

    if (!updatedSnapshot.exists()) {
      throw new Error("El perfil actualizado no pudo recuperarse.");
    }

    return normalizeUserProfile(firebaseUser.uid, updatedSnapshot.data());
  }

  const userProfile: UserProfile = {
    uid: firebaseUser.uid,
    displayName: normalizeText(firebaseUser.displayName, "Usuario"),
    email: normalizeText(firebaseUser.email),
    photoURL: normalizeOptionalText(firebaseUser.photoURL) ?? null,
    createdAt: now,
    updatedAt: now,
    role: "user",
    verified: false,
  };

  await setDoc(userRef, userProfile);

  return userProfile;
}

export async function syncUserProfile(
  firebaseUser: User,
): Promise<UserProfile> {
  return saveOrUpdateUserProfile(firebaseUser);
}
