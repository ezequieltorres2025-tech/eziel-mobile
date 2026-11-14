import { File, Paths } from "expo-file-system";
import { uuid } from "expo-modules-core";

export interface InstallationState {
  installationId: string;
  consented: boolean;
  association: { uid: string; token: string } | null;
  // Also true after corruption: missing association data is not proof of safety.
  requiresTokenReset: boolean;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function createInstallationStorage(io: {
  read: () => string | null;
  write: (value: string) => void;
  newId: () => string;
}) {
  let queue = Promise.resolve();
  function load(): InstallationState {
    const raw = io.read();
    let data: unknown = null;
    try { if (raw !== null) data = JSON.parse(raw); } catch { /* Recover conservatively below. */ }
    const record = isRecord(data) ? data : {};
    const idValid = typeof record.installationId === "string" && UUID.test(record.installationId);
    const a = record.association;
    const associationValid = a === null || (isRecord(a) && typeof a.uid === "string" &&
      a.uid.length > 0 && !a.uid.includes("/") && typeof a.token === "string" && a.token.length > 0 && a.token.length <= 4096);
    const valid = idValid && associationValid && typeof record.consented === "boolean" &&
      typeof record.requiresTokenReset === "boolean";
    const state: InstallationState = {
      installationId: idValid ? record.installationId as string : io.newId(),
      consented: valid && record.consented === true,
      association: associationValid && a !== null ? a as InstallationState["association"] : null,
      requiresTokenReset: valid ? record.requiresTokenReset === true : raw !== null,
    };
    if (!valid) io.write(JSON.stringify(state));
    return state;
  }
  function update(change: (state: InstallationState) => InstallationState): Promise<InstallationState> {
    const task = queue.then(() => {
      const state = load();
      const next = change(state);
      if (JSON.stringify(next) !== JSON.stringify(state)) io.write(JSON.stringify(next));
      return next;
    });
    queue = task.then(() => {}, () => {});
    return task;
  }
  return { read: () => update(state => state), update };
}

export const installationStorage = createInstallationStorage({
  read() {
    const file = new File(Paths.document, "eziel-push-installation.json");
    return file.exists ? file.textSync() : null;
  },
  write(value) {
    const file = new File(Paths.document, "eziel-push-installation.json");
    const temporary = new File(Paths.document, "eziel-push-installation.tmp");
    temporary.write(value);
    temporary.moveSync(file, { overwrite: true });
  },
  newId: () => uuid.v4(),
});
