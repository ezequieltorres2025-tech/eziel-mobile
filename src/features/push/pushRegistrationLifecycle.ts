import { PermissionsAndroid, Platform } from "react-native";
import { deleteToken, getMessaging, getToken, onMessage, onTokenRefresh } from "@react-native-firebase/messaging";
import { auth } from "@/lib/firebase";
import { registerDevice, revokeDevice } from "./deviceRegistrationService";
import { installationStorage, type InstallationState } from "./installationStorage";

export type PushStatus = "idle" | "working" | "active" | "denied" | "error";
interface Dependencies {
  storage: typeof installationStorage;
  getUid: () => string | null;
  getToken: () => Promise<string>;
  deleteToken: () => Promise<void>;
  register: typeof registerDevice;
  revoke: typeof revokeDevice;
  hasPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  subscribeToken: (callback: () => void) => () => void;
  subscribeMessage: () => () => void;
  timeoutMs?: number;
}

// A deadline stops waiting, not the native operation. Keep pending mutations
// tracked so another session cannot register while deleteToken is unresolved.
function deadline<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Tiempo de espera agotado.")), milliseconds);
    promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

export function createPushRegistrationLifecycle(deps: Dependencies) {
  const timeout = deps.timeoutMs ?? 5000;
  let generation = 0;
  let stop = () => {};
  let registration: Promise<void> | null = null;
  let deletion: Promise<void> | null = null;
  let loggingOut = 0;
  let unsafeStorage = false;

  function resetToken(): Promise<void> {
    if (!deletion) {
      const pending = Promise.resolve().then(() => deps.deleteToken());
      deletion = pending;
      void pending.then(() => { if (deletion === pending) deletion = null; },
        () => { if (deletion === pending) deletion = null; });
    }
    return deadline(deletion, timeout);
  }

  function start(uid: string, publish: (status: PushStatus) => void) {
    stop();
    const epoch = ++generation;
    let disposed = false;
    let busy = false;
    let queued = false;
    const current = () => !disposed && epoch === generation && deps.getUid() === uid;
    const emit = (status: PushStatus) => { if (current()) publish(status); };
    const check = () => { if (!current()) throw new Error("La sesión cambió."); };

    async function reconcile(activate = false): Promise<void> {
      if (!current()) return;
      if (busy) { if (!activate) queued = true; return; }
      busy = true;
      emit("working");
      try {
        let state = await deps.storage.read();
        check();
        if (!activate && !state.consented) { emit("idle"); return; }
        const permitted = await (activate ? deps.requestPermission() : deps.hasPermission());
        check();
        if (!permitted) { emit("denied"); return; }
        state = await deps.storage.update(value => { check(); return { ...value, consented: true }; });
        check();
        if (registration || deletion || loggingOut) throw new Error("Hay una operación anterior pendiente.");
        let token = await deadline(deps.getToken(), timeout);
        check();
        const previous = state.association;
        const otherAccount = previous !== null && previous.uid !== uid;
        if (unsafeStorage || state.requiresTokenReset || otherAccount) {
          // A different current token proves the old association cannot receive
          // this registration. Unknown/corrupt history requires an explicit reset.
          if (unsafeStorage || !previous || token === previous.token) {
            await resetToken();
            check();
            token = await deadline(deps.getToken(), timeout);
            check();
            if (previous && token === previous.token) throw new Error("El token anterior sigue vigente.");
          }
        }
        if (!token || token.length > 4096) throw new Error("Token inválido.");
        // Write-ahead association: even an uncertain transaction belongs to uid.
        await deps.storage.update(value => {
          check();
          return { ...value, association: { uid, token }, requiresTokenReset: false };
        });
        check();
        unsafeStorage = false;
        const pending = deps.register(uid, state.installationId, token, current);
        registration = pending;
        void pending.then(() => { if (registration === pending) registration = null; },
          () => { if (registration === pending) registration = null; });
        await deadline(pending, timeout);
        check();
        emit("active");
      } catch {
        emit("error");
      } finally {
        busy = false;
        if (queued && current()) {
          queued = false;
          // One coalesced event, never a timer-driven retry loop.
          void reconcile();
        }
      }
    }

    let unsubscribeToken = () => {};
    let unsubscribeMessage = () => {};
    stop = () => { disposed = true; unsubscribeToken(); unsubscribeMessage(); };
    try {
      unsubscribeToken = deps.subscribeToken(() => { if (current()) void reconcile(); });
      unsubscribeMessage = deps.subscribeMessage();
      void reconcile();
    } catch { emit("error"); }
    return {
      activate: () => reconcile(true),
      resume: () => reconcile(),
      dispose() {
        disposed = true;
        unsubscribeToken(); unsubscribeMessage();
        if (epoch === generation) generation += 1;
      },
    };
  }

  async function prepareLogout(uid: string): Promise<void> {
    stop();
    const epoch = ++generation;
    loggingOut += 1;
    try {
      let state: InstallationState | null = null;
      // Persist uncertainty before starting remote work, including before timeout.
      try {
        state = await deps.storage.update(value => ({ ...value, requiresTokenReset: true }));
      } catch { unsafeStorage = true; }
      try {
        if (state && deps.getUid() === uid) {
          await deadline(deps.revoke(uid, state.installationId), timeout);
        }
      } catch { /* Token invalidation can still make a stale remote document harmless. */ }
      try {
        await resetToken();
        // Keep the old token as evidence until the next registration sees a new one.
        if (epoch === generation && state) {
          await deps.storage.update(value => ({ ...value, requiresTokenReset: value.association !== null }));
          unsafeStorage = false;
        }
      } catch { /* Retain write-ahead uncertainty; logout must still complete. */ }
    } finally { loggingOut -= 1; }
  }

  return { start, prepareLogout };
}

export async function hasAndroidPushPermission(): Promise<boolean> {
  return Platform.OS === "android" && (Number(Platform.Version) < 33 ||
    await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS));
}

export async function requestAndroidPushPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  if (await hasAndroidPushPermission()) return true;
  return await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) ===
    PermissionsAndroid.RESULTS.GRANTED;
}

export const pushRegistrationLifecycle = createPushRegistrationLifecycle({
  storage: installationStorage,
  getUid: () => auth.currentUser?.uid ?? null,
  getToken: () => getToken(getMessaging()),
  deleteToken: () => deleteToken(getMessaging()),
  register: registerDevice,
  revoke: revokeDevice,
  hasPermission: hasAndroidPushPermission,
  requestPermission: requestAndroidPushPermission,
  subscribeToken: callback => onTokenRefresh(getMessaging(), callback),
  subscribeMessage: () => onMessage(getMessaging(), async () => {
    // No local notification, navigation or artificial read/unread changes.
  }),
});

export async function preparePushLogout(uid: string | null): Promise<void> {
  if (Platform.OS === "android" && uid) {
    try { await pushRegistrationLifecycle.prepareLogout(uid); } catch { /* Auth logout remains available. */ }
  }
}
