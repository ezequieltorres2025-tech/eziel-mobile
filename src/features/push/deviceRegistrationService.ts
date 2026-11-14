import { deleteDoc, doc, runTransaction, serverTimestamp } from "@react-native-firebase/firestore";
import { auth, db } from "@/lib/firebase";

function assertSession(uid: string, current: () => boolean) {
  if (!uid || auth.currentUser?.uid !== uid || !current()) throw new Error("La sesión cambió.");
}

export async function registerDevice(uid: string, installationId: string, token: string,
  current: () => boolean): Promise<void> {
  assertSession(uid, current);
  if (!installationId || installationId.includes("/") || !token || token.length > 4096) {
    throw new Error("Registro de dispositivo inválido.");
  }
  const reference = doc(db, "users", uid, "devices", installationId);
  await runTransaction(db, async transaction => {
    assertSession(uid, current);
    const snapshot = await transaction.get(reference);
    assertSession(uid, current);
    if (!snapshot.exists()) {
      transaction.set(reference, { token, platform: "android", enabled: true,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      return;
    }
    const data = snapshot.data();
    if (data?.platform !== "android") throw new Error("La instalación tiene otra plataforma.");
    if (data.token === token && data.enabled === true) return;
    transaction.update(reference, { token, enabled: true, updatedAt: serverTimestamp() });
  });
}

export async function revokeDevice(uid: string, installationId: string): Promise<void> {
  assertSession(uid, () => true);
  if (!installationId || installationId.includes("/")) throw new Error("Instalación inválida.");
  // deleteDoc is idempotent for a missing document. It must start before signOut.
  await deleteDoc(doc(db, "users", uid, "devices", installationId));
}
