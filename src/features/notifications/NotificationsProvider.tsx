import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { AppState } from "react-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { auth } from "@/lib/firebase";
import type { AppNotification } from "./notificationTypes";
import {
  getNotificationPage, markNotificationRead, NOTIFICATION_PAGE_SIZE,
  subscribeNotificationWindow, subscribeUnreadNotifications,
  type NotificationCursor, type NotificationPage,
} from "./notificationsFirestoreService";

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
}

const EMPTY: NotificationsState = {
  notifications: [], unreadCount: 0, loading: false, refreshing: false,
  loadingMore: false, hasMore: false, error: null,
};

interface NotificationsContextValue extends NotificationsState {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (item: AppNotification) => Promise<void>;
}

// Una sesión por UID. El coordinador permite probar las carreras sin montar
// pantallas ni acceder a Firebase; todos los callbacks pasan por current().
export function createNotificationsSession(uid: string, isCurrent: () => boolean,
  publish: (state: NotificationsState) => void) {
  let active = true;
  let generation = 0;
  let windowGeneration = 0;
  let operation = 0;
  let windowSize = NOTIFICATION_PAGE_SIZE;
  let cursor: NotificationCursor | null = null;
  let serverWindow = false;
  let state = { ...EMPTY, loading: true };
  let listError: string | null = null;
  let unreadError: string | null = null;
  let unread: ReadonlySet<string> = new Set();
  const acknowledged = new Set<string>();
  const marking = new Map<string, Promise<void>>();
  let stopWindow = () => {};
  let stopUnread = () => {};
  const current = () => active && isCurrent();
  const emit = (patch: Partial<NotificationsState> = {}) => {
    if (!current()) return;
    state = { ...state, ...patch, error: listError ?? unreadError,
      unreadCount: [...unread].filter(id => !acknowledged.has(id)).length };
    publish(state);
  };
  const displayItems = (items: AppNotification[]) =>
    [...new Map(items.map(item => [item.id, acknowledged.has(item.id)
      ? { ...item, read: true } : item])).values()];

  function attachUnread() {
    stopUnread();
    const epoch = generation;
    stopUnread = subscribeUnreadNotifications(uid, ids => {
      if (!current() || epoch !== generation) return;
      unread = ids;
      unreadError = null;
      emit();
    }, () => {
      if (!current() || epoch !== generation) return;
      unreadError = "No pudimos actualizar el contador. Deslizá para reintentar.";
      emit();
    });
  }

  function applyWindow(page: NotificationPage) {
    // No reemplazar una página confirmada por una vista parcial de caché.
    if (page.fromCache && serverWindow) return;
    if (!page.fromCache) serverWindow = true;
    if (cursor?.id !== page.cursor?.id) {
      operation += 1;
      state = { ...state, loadingMore: false };
    }
    cursor = page.fromCache ? null : page.cursor;
    listError = null;
    emit({ notifications: displayItems(page.items), loading: false,
      hasMore: page.hasMore });
  }

  function attachWindow() {
    stopWindow();
    const epoch = ++windowGeneration;
    stopWindow = subscribeNotificationWindow(uid, windowSize, page => {
      if (current() && epoch === windowGeneration) applyWindow(page);
    }, () => {
      if (!current() || epoch !== windowGeneration) return;
      listError = "No pudimos actualizar tus notificaciones. Podés reintentar.";
      emit({ loading: false });
    });
  }

  const session = {
    start() { emit(); attachUnread(); attachWindow(); },
    dispose() {
      active = false;
      generation += 1;
      windowGeneration += 1;
      operation += 1;
      stopWindow(); stopUnread();
    },
    async refresh() {
      if (!current() || state.refreshing) return;
      const request = ++operation;
      generation += 1;
      windowGeneration += 1;
      stopWindow();
      attachUnread();
      emit({ refreshing: true, loadingMore: false });
      try {
        const page = await getNotificationPage(uid);
        if (!current() || request !== operation) return;
        windowSize = NOTIFICATION_PAGE_SIZE;
        serverWindow = true;
        cursor = page.cursor;
        listError = null;
        emit({ notifications: displayItems(page.items), hasMore: page.hasMore, loading: false });
      } catch {
        if (!current() || request !== operation) return;
        listError = "No pudimos refrescar la bandeja. Tus avisos siguen disponibles.";
      } finally {
        if (current() && request === operation) {
          emit({ refreshing: false, loading: false });
          attachWindow();
        }
      }
    },
    async loadMore() {
      if (!current() || state.loading || state.refreshing || state.loadingMore ||
        !state.hasMore || !cursor) return;
      const request = ++operation;
      const boundary = cursor;
      emit({ loadingMore: true });
      try {
        const page = await getNotificationPage(uid, boundary);
        if (!current() || request !== operation) return;
        listError = null;
        const items = displayItems([...state.notifications, ...page.items]);
        cursor = page.cursor ?? boundary;
        windowSize = Math.max(NOTIFICATION_PAGE_SIZE,
          Math.ceil(items.length / NOTIFICATION_PAGE_SIZE) * NOTIFICATION_PAGE_SIZE);
        emit({ notifications: items, hasMore: page.hasMore, loadingMore: false });
        // Realtime cubre exactamente la ventana cargada. Si entra un aviso al
        // principio, el cursor se mueve con el último documento visible: no hay
        // huecos entre una primera página viva y páginas antiguas desconectadas.
        if (page.items.length) attachWindow();
      } catch {
        if (!current() || request !== operation) return;
        listError = "No pudimos cargar más notificaciones. Intentá nuevamente.";
      } finally {
        if (current() && request === operation) emit({ loadingMore: false });
      }
    },
    async markAsRead(item: AppNotification) {
      if (!current() || item.recipientId !== uid) return;
      if (item.read || acknowledged.has(item.id) ||
        state.notifications.find(value => value.id === item.id)?.read) return;
      const existing = marking.get(item.id);
      if (existing) return existing;
      const promise = (async () => {
        try {
          await markNotificationRead(uid, item);
          if (!current()) return;
          acknowledged.add(item.id);
          emit({ notifications: displayItems(state.notifications) });
        } catch {
          if (!current()) return;
          listError = "No pudimos confirmar la lectura. Podés volver a intentarlo.";
          emit();
        } finally { marking.delete(item.id); }
      })();
      marking.set(item.id, promise);
      return promise;
    },
  };
  return session;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const currentUid = useRef(uid);
  currentUid.current = uid;
  const session = useRef<ReturnType<typeof createNotificationsSession> | null>(null);
  const [snapshot, setSnapshot] = useState<{ uid: string | null; state: NotificationsState }>({ uid: null, state: EMPTY });

  useEffect(() => {
    if (!uid) { session.current = null; setSnapshot({ uid: null, state: EMPTY }); return; }
    const next = createNotificationsSession(uid,
      () => currentUid.current === uid && auth.currentUser?.uid === uid,
      state => setSnapshot({ uid, state }));
    session.current = next;
    next.start();
    const subscription = AppState.addEventListener("change", status => {
      if (status === "active") void next.refresh();
    });
    return () => { next.dispose(); subscription.remove(); session.current = null; };
  }, [uid]);

  // En el primer render de B no se expone el estado de A, aun antes del cleanup.
  const state = snapshot.uid === uid ? snapshot.state : { ...EMPTY, loading: !!uid };
  const usable = () => snapshot.uid === uid && auth.currentUser?.uid === uid ? session.current : null;
  return <NotificationsContext.Provider value={{ ...state,
    refresh: async () => { await usable()?.refresh(); },
    loadMore: async () => { await usable()?.loadMore(); },
    markAsRead: async item => { await usable()?.markAsRead(item); },
  }}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error("NotificationsProvider no está disponible.");
  return value;
}
