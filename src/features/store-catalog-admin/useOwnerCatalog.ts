import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { auth } from "@/lib/firebase";
import { CatalogAccessError, createOwnerCatalogItem, getOwnerCatalog, getOwnerCatalogItem, mutateOwnerCatalogItem, UnconfirmedCatalogCreationError } from "./storeCatalogAdminFirestoreService";
import type { CatalogEditorState, CatalogItemInput, CatalogMutation, OwnerCatalogResult } from "./storeCatalogAdminTypes";

type State = OwnerCatalogResult | { kind: "auth-loading" | "signed-out" | "loading" } | { kind: "error"; message: string };

export function useOwnerCatalog() {
  const { user, isLoading } = useAuth();
  const uid = user?.uid ?? "";
  const mounted = useRef(false);
  const request = useRef(0);
  const busy = useRef(false);
  const session = useRef<{ uid: string; storeId: string } | null>(null);
  const [result, setResult] = useState<{ uid: string; state: State }>({ uid: "", state: { kind: "loading" } });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<CatalogEditorState>({ kind: "closed" });

  const reload = useCallback(async () => {
    if (!uid || isLoading || busy.current || session.current) return;
    const token = ++request.current;
    const current = () => mounted.current && request.current === token && auth.currentUser?.uid === uid;
    setResult({ uid, state: { kind: "loading" } });
    try {
      const state = await getOwnerCatalog(uid);
      if (current()) setResult({ uid, state });
    } catch (error) {
      if (current()) setResult({ uid, state: { kind: "error", message: error instanceof Error ? error.message : "No pudimos cargar el catálogo." } });
    }
  }, [uid, isLoading]);

  useEffect(() => {
    mounted.current = true;
    session.current = null;
    busy.current = false;
    setSaving(false);
    setEditing(false);
    setEditor({ kind: "closed" });
    setNotice(null);
    void reload();
    return () => { mounted.current = false; request.current += 1; session.current = null; };
  }, [reload]);

  const state: State = isLoading ? { kind: "auth-loading" } : !uid ? { kind: "signed-out" }
    : result.uid !== uid ? { kind: "loading" } : result.state;

  const startCreating = () => {
    if (state.kind !== "single" || busy.current) return;
    request.current += 1;
    session.current = { uid, storeId: state.store.id };
    setNotice(null);
    setEditing(true);
    setEditor({ kind: "closed" });
  };

  const cancelCreating = () => {
    if (busy.current) return;
    request.current += 1;
    session.current = null;
    setEditing(false);
  };

  const reviewCatalog = () => {
    if (busy.current) return;
    cancelCreating();
    setNotice("Revisá si el ítem ya aparece antes de volver a agregarlo.");
    void reload();
  };

  const create = async (input: CatalogItemInput): Promise<void> => {
    const activeSession = session.current;
    if (!activeSession || activeSession.uid !== uid || state.kind !== "single" ||
        state.store.id !== activeSession.storeId || busy.current || isLoading) return;
    busy.current = true;
    setSaving(true);
    const token = ++request.current;
    const current = () => mounted.current && token === request.current &&
      auth.currentUser?.uid === uid && session.current === activeSession;
    try {
      const data = await createOwnerCatalogItem(uid, activeSession.storeId, input, current);
      if (current()) {
        setResult({ uid, state: { kind: "single", ...data } });
        setEditing(false);
        setNotice("El ítem se guardó correctamente.");
      }
    } catch (error) {
      if (current()) {
        if (error instanceof UnconfirmedCatalogCreationError && error.catalog) {
          setResult({ uid, state: { kind: "single", ...error.catalog } });
        }
        throw error;
      }
    } finally {
      if (current()) { busy.current = false; setSaving(false); }
    }
  };

  // La sesión permanece durante el finally; se descarta antes de otra carga.
  useEffect(() => { if (!editing && !saving && editor.kind === "closed") session.current = null; }, [editing, saving, editor.kind]);

  const openItem = async (id: string) => {
    if (state.kind !== "single" || busy.current || isLoading) return;
    const activeSession = { uid, storeId: state.store.id };
    session.current = activeSession;
    const token = ++request.current;
    const current = () => mounted.current && token === request.current &&
      auth.currentUser?.uid === uid && session.current === activeSession;
    setEditing(false);
    setNotice(null);
    setEditor({ kind: "loading", id });
    try {
      const detail = await getOwnerCatalogItem(uid, activeSession.storeId, id);
      if (current()) setEditor({ kind: "ready", detail });
    } catch (error) {
      if (current()) setEditor({ kind: error instanceof CatalogAccessError ? error.kind : "error", id,
        message: error instanceof Error ? error.message : "No pudimos cargar el ítem." });
    }
  };

  const closeItem = () => {
    if (busy.current) return;
    request.current += 1;
    session.current = null;
    setEditor({ kind: "closed" });
  };

  const mutateItem = async (mutation: CatalogMutation) => {
    const activeSession = session.current;
    if (!activeSession || activeSession.uid !== uid || state.kind !== "single" || editor.kind !== "ready" ||
        state.store.id !== activeSession.storeId || busy.current || isLoading) throw new Error("Volvé a abrir el ítem.");
    const detail = editor.detail;
    const token = ++request.current;
    const current = () => mounted.current && token === request.current &&
      auth.currentUser?.uid === uid && session.current === activeSession;
    busy.current = true;
    setSaving(true);
    try {
      const item = await mutateOwnerCatalogItem(uid, detail, mutation, current);
      if (current()) {
        setResult((previous) => previous.uid !== uid || previous.state.kind !== "single" ? previous : {
          uid, state: { ...previous.state, items: item
            ? previous.state.items.map((entry) => entry.id === item.id ? item : entry)
            : previous.state.items.filter((entry) => entry.id !== detail.id) },
        });
        setEditor({ kind: "closed" });
        setNotice(mutation.kind === "delete" ? "El ítem se eliminó del catálogo." : "Los cambios se guardaron correctamente.");
      }
    } catch (error) { if (current()) throw error; }
    finally { if (current()) { busy.current = false; setSaving(false); } }
  };

  return { state, saving, editing: editing && state.kind === "single" && session.current?.uid === uid,
    editor: state.kind === "single" && session.current?.uid === uid ? editor : { kind: "closed" } as CatalogEditorState,
    openItem, closeItem, mutateItem, notice, reload, startCreating, cancelCreating, reviewCatalog, create };
}
