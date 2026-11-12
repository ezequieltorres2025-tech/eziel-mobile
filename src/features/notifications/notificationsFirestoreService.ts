import {
  collection, doc, getDocsFromServer, limit, onSnapshot, orderBy,
  query, serverTimestamp, startAfter, updateDoc, where,
  type QueryDocumentSnapshot, type QuerySnapshot,
} from "@react-native-firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { NOTIFICATION_TYPES, type AppNotification, type NotificationType } from "./notificationTypes";

export const NOTIFICATION_PAGE_SIZE = 20;
export type NotificationCursor = QueryDocumentSnapshot;
export interface NotificationPage {
  items: AppNotification[];
  cursor: NotificationCursor | null;
  hasMore: boolean;
  fromCache: boolean;
}

function text(value: unknown): string { return typeof value === "string" ? value : ""; }

function timestampMillis(value: unknown): number | null {
  if (!value || typeof value !== "object" || !("toMillis" in value) ||
    typeof value.toMillis !== "function") return null;
  try {
    const millis: unknown = value.toMillis();
    return typeof millis === "number" && Number.isFinite(millis) &&
      Math.abs(millis) <= 8.64e15 ? millis : null;
  } catch { return null; }
}

export function mapNotification(id: string, data: Record<string, unknown>): AppNotification {
  return {
    id, recipientId: text(data.recipientId), actorId: text(data.actorId),
    actorName: text(data.actorName),
    type: (NOTIFICATION_TYPES as readonly unknown[]).includes(data.type)
      ? data.type as NotificationType : "unknown",
    title: text(data.title), body: text(data.body), href: text(data.href),
    referenceId: text(data.referenceId), read: data.read === true,
    createdAt: timestampMillis(data.createdAt), readAt: timestampMillis(data.readAt),
    listingId: text(data.listingId) || undefined,
    conversationId: text(data.conversationId) || undefined,
    saleId: text(data.saleId) || undefined, reviewId: text(data.reviewId) || undefined,
    reportId: text(data.reportId) || undefined, storeId: text(data.storeId) || undefined,
    productId: text(data.productId) || undefined, clipId: text(data.clipId) || undefined,
  };
}

function assertUser(uid: string) {
  if (!uid || auth.currentUser?.uid !== uid) throw new Error("La sesión cambió. Volvé a abrir las notificaciones.");
}

function notificationsQuery(uid: string, size: number, cursor?: NotificationCursor) {
  return query(collection(db, "notifications"), where("recipientId", "==", uid),
    orderBy("createdAt", "desc"), ...(cursor ? [startAfter(cursor)] : []), limit(size));
}

function mapPage(snapshot: QuerySnapshot, size: number): NotificationPage {
  const pending = snapshot.metadata.hasPendingWrites;
  return {
    items: snapshot.docs.map(item => mapNotification(item.id, item.data())),
    // Nunca convertir una fecha visual/fallback en cursor. El snapshot conserva
    // el valor original y el desempate por ID, incluso para createdAt null.
    cursor: pending ? null : snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.size === size,
    fromCache: snapshot.metadata.fromCache,
  };
}

export function subscribeNotificationWindow(uid: string, size: number,
  receive: (page: NotificationPage) => void, fail: (error: Error) => void): () => void {
  assertUser(uid);
  return onSnapshot(notificationsQuery(uid, size), { includeMetadataChanges: true },
    snapshot => receive(mapPage(snapshot, size)), fail);
}

export async function getNotificationPage(uid: string, cursor?: NotificationCursor,
  size = NOTIFICATION_PAGE_SIZE): Promise<NotificationPage> {
  assertUser(uid);
  const snapshot = await getDocsFromServer(notificationsQuery(uid, size, cursor));
  assertUser(uid);
  return mapPage(snapshot, size);
}

export function subscribeUnreadNotifications(uid: string,
  receive: (ids: ReadonlySet<string>) => void, fail: (error: Error) => void): () => void {
  assertUser(uid);
  // Sin límite: limitar esta consulta convertiría el badge en un subtotal.
  // Dos igualdades, sin orderBy: no exige el índice cronológico de la bandeja.
  return onSnapshot(query(collection(db, "notifications"),
    where("recipientId", "==", uid), where("read", "==", false)),
  snapshot => receive(new Set(snapshot.docs.map(item => item.id))), fail);
}

export async function markNotificationRead(uid: string, item: AppNotification): Promise<void> {
  assertUser(uid);
  if (item.recipientId !== uid || !item.id || item.id.includes("/")) {
    throw new Error("La notificación no pertenece a tu cuenta.");
  }
  if (item.read) return;
  await updateDoc(doc(db, "notifications", item.id), { read: true, readAt: serverTimestamp() });
}
