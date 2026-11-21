import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useRootNavigationState, useRouter } from "expo-router";
import { getInitialNotification, getMessaging, onNotificationOpenedApp } from "@react-native-firebase/messaging";
import { useAuth } from "@/features/auth/AuthProvider";
import { auth } from "@/lib/firebase";
import { isNotificationResourceId, notificationDestination,
  type NotificationDestination } from "@/features/notifications/notificationNavigation";
import { NOTIFICATION_TYPES } from "@/features/notifications/notificationTypes";

interface PushTap {
  notificationId: string;
  recipientId: string;
  destination: NotificationDestination;
}
type RemoteMessage = NonNullable<Awaited<ReturnType<typeof getInitialNotification>>>;
const MAX_SEEN_TAPS = 64;

function parseTap(message: RemoteMessage): PushTap | null {
  const data = message.data;
  if (!data || !isNotificationResourceId(data.notificationId) ||
      !isNotificationResourceId(data.recipientId)) return null;
  const type = NOTIFICATION_TYPES.find(value => value === data.type);
  if (!type) return null;
  const destination = notificationDestination({ type,
    listingId: typeof data.listingId === "string" ? data.listingId : undefined,
    storeId: typeof data.storeId === "string" ? data.storeId : undefined });
  return destination ? { notificationId: data.notificationId, recipientId: data.recipientId, destination } : null;
}

export function PushNotificationNavigationHandler() {
  const { user, isLoading } = useAuth();
  const uid = user?.uid ?? null;
  const router = useRouter();
  const navigation = useRootNavigationState();
  const [pending, setPending] = useState<(PushTap & { generation: number }) | null>(null);
  const seen = useRef(new Set<string>());
  const initial = useRef<ReturnType<typeof getInitialNotification> | null>(null);
  const backgroundVersion = useRef(0);
  const session = useRef({ uid, resolved: false, generation: 0 });
  // Synchronize committed auth state before the receiving/navigation effects.
  // Replaying this effect in Strict Mode must not advance the generation twice.
  useEffect(() => {
    if (session.current.resolved && session.current.uid !== uid) session.current.generation += 1;
    session.current.uid = uid;
    if (!isLoading) session.current.resolved = true;
  }, [uid, isLoading]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    let disposed = false;
    let unsubscribe = () => {};
    const generation = session.current.generation;
    const version = backgroundVersion.current;
    const receive = (message: RemoteMessage) => {
      if (disposed) return;
      const tap = parseTap(message);
      if (!tap) return;
      if (session.current.resolved && auth.currentUser?.uid !== tap.recipientId) return;
      const key = JSON.stringify([tap.recipientId, tap.notificationId]);
      if (seen.current.has(key)) return;
      seen.current.add(key);
      if (seen.current.size > MAX_SEEN_TAPS) {
        const oldest = seen.current.values().next().value;
        if (oldest !== undefined) seen.current.delete(oldest);
      }
      setPending({ ...tap, generation: session.current.generation });
    };
    try {
      const messaging = getMessaging();
      unsubscribe = onNotificationOpenedApp(messaging, message => {
        backgroundVersion.current += 1;
        receive(message);
      });
      // Reuse the promise across Strict Mode effect replay: native initial reads are consumptive.
      initial.current ??= getInitialNotification(messaging);
      void initial.current.then(message => {
        if (message && generation === session.current.generation && version === backgroundVersion.current) receive(message);
      }).catch(() => { /* No initial tap available; the inbox remains usable. */ });
    } catch { /* An older development binary may not contain Messaging. */ }
    return () => { disposed = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!pending) return;
    if (pending.generation !== session.current.generation) { setPending(null); return; }
    if (isLoading) return;
    if (!uid || pending.recipientId !== uid || auth.currentUser?.uid !== uid) {
      setPending(null);
      return;
    }
    if (!navigation?.key) return;
    setPending(null);
    router.push(pending.destination);
  }, [pending, isLoading, uid, navigation?.key, router]);

  return null;
}
