import { useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { auth } from "@/lib/firebase";
import { CatalogReviewRequiredError } from "../storeCatalogAdminFirestoreService";
import type { CatalogItemDetail, CatalogItemInput, CatalogMutation } from "../storeCatalogAdminTypes";
import { catalogEditPatch, validateCatalogEdit } from "../storeCatalogAdminValidation";

interface Props {
  detail: CatalogItemDetail;
  saving: boolean;
  onMutate: (mutation: CatalogMutation) => Promise<void>;
  onCancel: () => void;
  onReload: () => void;
}

export function EditCatalogItemForm({ detail, saving, onMutate, onCancel, onReload }: Props) {
  const [form, setForm] = useState<CatalogItemInput>({ ...detail.input });
  const [error, setError] = useState<string | null>(null);
  const [reviewRequired, setReviewRequired] = useState(false);
  const mounted = useRef(false);
  const operation = useRef(0);
  const busy = useRef(false);
  const navigation = useNavigation();
  const blocked = detail.offer === "blocked";
  const dirty = (Object.keys(form) as (keyof CatalogItemInput)[]).some((key) => form[key] !== detail.input[key]);
  const hasPatch = Object.keys(catalogEditPatch(detail, form)).length > 0;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; operation.current += 1; };
  }, []);
  const current = (token: number) => mounted.current && operation.current === token && auth.currentUser?.uid === detail.storeOwnerId;
  const discard = (proceed: () => void) => {
    if (saving || busy.current) return;
    if (!dirty) { proceed(); return; }
    const token = ++operation.current;
    Alert.alert("Descartar cambios", "Los cambios sin guardar se perderán.", [
      { text: "Seguir editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: () => { if (current(token) && !busy.current) proceed(); } },
    ]);
  };
  usePreventRemove(dirty || saving, ({ data }) => discard(() => navigation.dispatch(data.action)));

  const run = async (mutation: CatalogMutation) => {
    if (saving || busy.current || reviewRequired || auth.currentUser?.uid !== detail.storeOwnerId) return;
    if (mutation.kind === "edit") {
      const validation = validateCatalogEdit(detail, mutation.input);
      if (validation) { setError(validation); return; }
    }
    busy.current = true;
    const token = ++operation.current;
    setError(null);
    try { await onMutate(mutation); }
    catch (failure) {
      if (current(token)) {
        setReviewRequired(failure instanceof CatalogReviewRequiredError);
        setError(failure instanceof Error ? failure.message : "No pudimos completar la operación.");
      }
    } finally { if (current(token)) busy.current = false; }
  };

  const requireClean = () => {
    if (!dirty) return true;
    setError("Guardá los cambios o descartá el borrador antes de cambiar el estado o eliminar.");
    return false;
  };
  const confirmDelete = () => {
    if (saving || busy.current || reviewRequired || !requireClean()) return;
    const token = ++operation.current;
    Alert.alert("Eliminar del catálogo", `¿Eliminar “${detail.input.name}”? Es permanente: lo quitará de la tienda y no se puede deshacer desde Mobile.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => { if (current(token)) void run({ kind: "delete" }); } },
    ]);
  };
  const disabled = saving || blocked || reviewRequired;
  const field = (key: Exclude<keyof CatalogItemInput, "type">, label: string, numeric = false) => (
    <View style={styles.field} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} value={form[key]} editable={!disabled}
        keyboardType={numeric ? "decimal-pad" : "default"} multiline={key === "description"}
        style={[styles.input, key === "description" && styles.description]}
        onChangeText={(value) => { setForm((previous) => ({ ...previous, [key]: value })); setError(null); }} />
    </View>
  );
  return <View style={styles.container}>
    <View style={styles.card}>
      <Text style={styles.title}>Editar ítem</Text>
      {blocked ? <Text style={styles.warning}>Este ítem tiene una configuración de oferta que todavía se administra desde la versión Web de Eziel.</Text> : null}
      <Text style={styles.heading}>Información</Text>
      {field("name", "Nombre")}
      {field("category", "Categoría")}
      {field("description", "Descripción")}
      <Text style={styles.heading}>Venta</Text>
      <View style={styles.selector}>
        {(["product", "service"] as const).map((type) => <Pressable key={type} accessibilityRole="radio"
          accessibilityState={{ checked: form.type === type, disabled }} disabled={disabled}
          style={[styles.option, form.type === type && styles.selected]}
          onPress={() => setForm((previous) => ({ ...previous, type }))}>
          <Text style={styles.optionText}>{type === "product" ? "Producto" : "Servicio"}</Text>
        </Pressable>)}
      </View>
      {field("price", "Precio", true)}
      {form.type === "product" ? field("stock", "Stock", true) : <Text style={styles.help}>Los servicios no llevan stock.</Text>}
      <Text style={styles.heading}>Estado: {detail.active ? "Activo" : "Pausado"}</Text>
      <Pressable accessibilityRole="button" disabled={disabled} style={[styles.option, disabled && styles.dim]}
        onPress={() => { if (requireClean()) void run({ kind: "status", active: !detail.active }); }}>
        <Text style={styles.optionText}>{detail.active ? "Pausar" : "Reactivar"}</Text>
      </Pressable>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      {reviewRequired ? <Pressable accessibilityRole="button" disabled={saving} style={styles.option} onPress={() => discard(onReload)}>
        <Text style={styles.optionText}>Recargar ítem</Text>
      </Pressable> : null}
      <Pressable accessibilityRole="button" disabled={disabled || !hasPatch}
        style={[styles.button, (disabled || !hasPatch) && styles.dim]} onPress={() => void run({ kind: "edit", input: { ...form } })}>
        {saving ? <ActivityIndicator color="#FFFFFF" /> : null}<Text style={styles.buttonText}>{saving ? "Procesando…" : "Guardar cambios"}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={saving} style={styles.option} onPress={() => discard(onCancel)}>
        <Text style={styles.optionText}>Cancelar</Text>
      </Pressable>
      {dirty && !saving ? <Pressable accessibilityRole="button" style={styles.option}
        onPress={() => discard(() => { setForm({ ...detail.input }); if (!reviewRequired) setError(null); })}>
        <Text style={styles.optionText}>Descartar borrador</Text>
      </Pressable> : null}
    </View>
    <View style={[styles.card, styles.danger]}>
      <Text style={styles.heading}>Zona de peligro</Text>
      <Text style={styles.help}>La eliminación es permanente y quita el ítem de tu tienda.</Text>
      <Pressable accessibilityRole="button" disabled={saving || reviewRequired} onPress={confirmDelete}
        style={[styles.option, (saving || reviewRequired) && styles.dim]}>
        <Text style={styles.dangerText}>Eliminar del catálogo</Text>
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  card: { padding: 22, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", gap: 18 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  heading: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  help: { fontSize: 14, color: "#64748B", lineHeight: 21 },
  warning: { padding: 14, borderRadius: 14, color: "#9A3412", backgroundColor: "#FFF7ED", lineHeight: 21 },
  field: { gap: 8 },
  label: { color: "#0F172A", fontSize: 14, fontWeight: "700" },
  input: { minHeight: 52, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#F8FAFC", color: "#0F172A", fontSize: 16 },
  description: { minHeight: 112, textAlignVertical: "top" },
  selector: { flexDirection: "row", gap: 10 },
  option: { flexGrow: 1, minHeight: 52, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center" },
  selected: { borderColor: "#F97316", backgroundColor: "#FFF7ED" },
  optionText: { color: "#475569", fontSize: 15, fontWeight: "700" },
  button: { minHeight: 54, padding: 14, borderRadius: 16, backgroundColor: "#F97316", flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  error: { color: "#B91C1C", backgroundColor: "#FEF2F2", borderRadius: 14, padding: 14, lineHeight: 21 },
  danger: { borderColor: "#FECACA" },
  dangerText: { color: "#B91C1C", fontWeight: "700", fontSize: 15 },
  dim: { opacity: 0.55 },
});
