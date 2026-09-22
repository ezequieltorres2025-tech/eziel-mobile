import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { auth } from "@/lib/firebase";
import { createOwnerStore, getOwnerStore, MultipleStoresError } from "./storeAdminFirestoreService";
import type { CreateStoreInput, OwnerStoreResult } from "./storeAdminTypes";

type State = OwnerStoreResult | { kind: "auth-loading" | "signed-out" | "loading" } | { kind: "error"; message: string };

export function useOwnerStore() {
  const { user, isLoading } = useAuth();
  const uid = user?.uid ?? "";
  const request = useRef(0);
  const mounted = useRef(false);
  const submitting = useRef(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ uid: string; state: State }>({ uid: "", state: { kind: "loading" } });

  const retry = useCallback(async () => {
    if (isLoading || !uid || submitting.current) return;
    const token = ++request.current;
    const current = () => mounted.current && token === request.current && auth.currentUser?.uid === uid;
    setResult({ uid, state: { kind: "loading" } });
    try {
      const state = await getOwnerStore(uid);
      if (current()) setResult({ uid, state });
    } catch (error) {
      if (current()) setResult({ uid, state: { kind: "error", message: error instanceof Error ? error.message : "No pudimos consultar tu tienda." } });
    }
  }, [uid, isLoading]);

  useEffect(() => {
    mounted.current = true;
    submitting.current = false;
    setSaving(false);
    void retry();
    return () => { mounted.current = false; request.current += 1; };
  }, [retry]);

  const create = async (input: CreateStoreInput) => {
    if (!uid || isLoading || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    const token = ++request.current;
    const current = () => mounted.current && token === request.current && auth.currentUser?.uid === uid;
    try {
      const store = await createOwnerStore(uid, input);
      if (current()) setResult({ uid, state: { kind: "single", store } });
    } catch (error) {
      if (current()) setResult({ uid, state: error instanceof MultipleStoresError
        ? { kind: "multiple" }
        : { kind: "error", message: error instanceof Error ? error.message : "No pudimos crear tu tienda." } });
    } finally {
      if (current()) { submitting.current = false; setSaving(false); }
    }
  };

  const state: State = isLoading ? { kind: "auth-loading" } : !uid ? { kind: "signed-out" }
    : result.uid !== uid ? { kind: "loading" } : result.state;
  return { state, saving, retry, create };
}
