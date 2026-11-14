import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { auth } from "@/lib/firebase";
import { pushRegistrationLifecycle, type PushStatus } from "./pushRegistrationLifecycle";

const PushContext = createContext<{ status: PushStatus; available: boolean; activate: () => Promise<void> }>({
  status: "idle", available: false, activate: async () => {},
});

export function PushRegistrationProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const currentUid = useRef(uid);
  currentUid.current = uid;
  const session = useRef<ReturnType<typeof pushRegistrationLifecycle.start> | null>(null);
  const [snapshot, setSnapshot] = useState<{ uid: string; status: PushStatus } | null>(null);
  useEffect(() => {
    if (Platform.OS !== "android" || !uid) return;
    const next = pushRegistrationLifecycle.start(uid, status => {
      if (currentUid.current === uid && auth.currentUser?.uid === uid) setSnapshot({ uid, status });
    });
    session.current = next;
    const subscription = AppState.addEventListener("change", value => {
      if (value === "active") void next.resume();
    });
    return () => { next.dispose(); subscription.remove(); session.current = null; };
  }, [uid]);
  return <PushContext.Provider value={{
    available: Platform.OS === "android" && !!uid,
    status: snapshot?.uid === uid ? snapshot.status : "idle",
    activate: async () => {
      if (currentUid.current === uid && auth.currentUser?.uid === uid) await session.current?.activate();
    },
  }}>{children}</PushContext.Provider>;
}

export const usePushRegistration = () => useContext(PushContext);
