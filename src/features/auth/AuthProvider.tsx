import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
} from "react-native-nitro-google-signin";

import {
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  type User,
} from "firebase/auth";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  syncUserProfile,
  type UserProfile,
} from "@/features/auth/userProfileService";
import { auth } from "@/lib/firebase";

export type GoogleLoginResult = "success" | "cancelled";

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<GoogleLoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

let isGoogleSignInConfigured = false;

function configureGoogleSignIn(): void {
  if (isGoogleSignInConfigured) {
    return;
  }

  GoogleOneTapSignIn.configure({
    webClientId: "autoDetect",
  });

  isGoogleSignInConfigured = true;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    configureGoogleSignIn();

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) {
        return;
      }

      setUser(currentUser);
      setIsLoading(true);

      if (!currentUser) {
        setUserProfile(null);
        setIsLoading(false);
        return;
      }

      const currentUid = currentUser.uid;

      try {
        const profile = await syncUserProfile(currentUser);

        if (isMounted && auth.currentUser?.uid === currentUid) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error sincronizando perfil:", error);

        if (isMounted && auth.currentUser?.uid === currentUid) {
          setUserProfile(null);
        }
      } finally {
        if (isMounted && auth.currentUser?.uid === currentUid) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<GoogleLoginResult> => {
    configureGoogleSignIn();

    await GoogleOneTapSignIn.checkPlayServices();

    let response = await GoogleOneTapSignIn.signIn();

    if (isNoSavedCredentialFoundResponse(response)) {
      response = await GoogleOneTapSignIn.createAccount();
    }

    if (isNoSavedCredentialFoundResponse(response)) {
      response = await GoogleOneTapSignIn.presentExplicitSignIn();
    }

    if (isCancelledResponse(response)) {
      return "cancelled";
    }

    if (!isSuccessResponse(response)) {
      throw new Error("Google Sign-In no pudo completar la autenticación.");
    }

    const idToken = response.data.idToken;

    if (!idToken) {
      throw new Error("Google no devolvió un ID token válido.");
    }

    const credential = GoogleAuthProvider.credential(idToken);

    await signInWithCredential(auth, credential);

    return "success";
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const [googleSignOutResult, firebaseSignOutResult] =
      await Promise.allSettled([
        GoogleOneTapSignIn.signOut(),
        firebaseSignOut(auth),
      ]);

    if (firebaseSignOutResult.status === "rejected") {
      throw firebaseSignOutResult.reason;
    }

    if (googleSignOutResult.status === "rejected") {
      throw googleSignOutResult.reason;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userProfile,
      isAuthenticated: user !== null,
      isLoading,
      loginWithGoogle,
      logout,
    }),
    [user, userProfile, isLoading, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
