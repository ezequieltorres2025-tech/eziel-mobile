import { useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { auth } from "@/lib/firebase";
import { UnconfirmedCatalogCreationError } from "../storeCatalogAdminFirestoreService";
import { EMPTY_CATALOG_INPUT, type CatalogItemInput } from "../storeCatalogAdminTypes";
import { validateCatalogInput } from "../storeCatalogAdminValidation";

interface Props {
  ownerId: string;
  saving: boolean;
  onSave: (input: CatalogItemInput) => Promise<void>;
  onCancel: () => void;
  onReview: () => void;
}

export function CreateCatalogItemForm({ ownerId, saving, onSave, onCancel, onReview }: Props) {
  const [form, setForm] = useState<CatalogItemInput>({ ...EMPTY_CATALOG_INPUT });
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const mounted = useRef(false);
  const operation = useRef(0);
  const busy = useRef(false);
  const navigation = useNavigation();
  const errors = validateCatalogInput(form);
  const dirty = (Object.keys(form) as (keyof CatalogItemInput)[]).some((field) => form[field] !== EMPTY_CATALOG_INPUT[field]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; operation.current += 1; };
  }, []);
  const current = (token: number) => mounted.current && token === operation.current && auth.currentUser?.uid === ownerId;
  const discard = (proceed: () => void) => {
    if (busy.current || saving) return;
    if (!dirty) { proceed(); return; }
    const token = ++operation.current;
    Alert.alert("Descartar cambios", "Los cambios sin guardar se perderán.", [
      { text: "Seguir editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: () => { if (current(token) && !busy.current) proceed(); } },
    ]);
  };
  usePreventRemove(dirty || saving, ({ data }) => discard(() => navigation.dispatch(data.action)));

  const submit = async () => {
    if (saving || busy.current || uncertain) return;
    setAttempted(true);
    if (Object.keys(errors).length) return;
    busy.current = true;
    const token = ++operation.current;
    setError(null);
    try { await onSave({ ...form }); }
    catch (saveError) {
      if (current(token)) {
        setUncertain(saveError instanceof UnconfirmedCatalogCreationError);
        setError(saveError instanceof Error ? saveError.message : "No pudimos guardar. Intentá nuevamente.");
      }
    } finally { if (current(token)) busy.current = false; }
  };

  const fields: { key: Exclude<keyof CatalogItemInput, "type">; label: string; numeric?: boolean }[] = [
    { key: "name", label: "Nombre" }, { key: "description", label: "Descripción" },
    { key: "price", label: "Precio" , numeric: true }, { key: "category", label: "Categoría" },
    ...(form.type === "product" ? [{ key: "stock" as const, label: "Stock", numeric: true }] : []),
  ];
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Agregar al catálogo</Text>
      <Text style={styles.help}>Completá los datos de tu producto o servicio. Todos los campos son obligatorios.</Text>
      <View style={styles.selector}>
        {(["product", "service"] as const).map((type) => (
          <Pressable key={type} accessibilityRole="radio" accessibilityState={{ checked: form.type === type, disabled: saving }}
            disabled={saving} onPress={() => { setForm((previous) => ({ ...previous, type })); if (!uncertain) setError(null); }}
            style={[styles.option, form.type === type && styles.selected]}>
            <Text style={[styles.optionText, form.type === type && styles.selectedText]}>{type === "product" ? "Producto" : "Servicio"}</Text>
          </Pressable>
        ))}
      </View>
      {fields.map(({ key, label, numeric }) => (
        <View style={styles.field} key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput accessibilityLabel={label} value={form[key]} editable={!saving}
            keyboardType={numeric ? key === "stock" ? "number-pad" : "decimal-pad" : "default"}
            multiline={key === "description"} style={[styles.input, key === "description" && styles.description]}
            onChangeText={(value) => { setForm((previous) => ({ ...previous, [key]: value })); if (!uncertain) setError(null); }} />
          {attempted && errors[key] ? <Text style={styles.error}>{errors[key]}</Text> : null}
        </View>
      ))}
      {form.type === "service" ? <Text style={styles.help}>Los servicios no llevan stock. La disponibilidad se coordina con la tienda.</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.errorBox}>{error}</Text> : null}
      {uncertain ? <Pressable accessibilityRole="button" onPress={() => discard(onReview)} style={styles.button}>
        <Text style={styles.buttonText}>Revisar catálogo</Text>
      </Pressable> : <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving, busy: saving }}
        onPress={() => void submit()} style={[styles.button, saving && styles.dim]}>
        {saving ? <ActivityIndicator color="#FFFFFF" /> : null}
        <Text style={styles.buttonText}>{saving ? "Guardando…" : "Guardar"}</Text>
      </Pressable>}
      <Pressable accessibilityRole="button" disabled={saving} onPress={() => discard(uncertain ? onReview : onCancel)} style={[styles.cancel, saving && styles.dim]}>
        <Text style={styles.optionText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 22, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", gap: 18 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  help: { fontSize: 14, color: "#64748B", lineHeight: 21 },
  selector: { flexDirection: "row", gap: 10 },
  option: { flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: "#FFF7ED", borderColor: "#F97316" },
  optionText: { color: "#475569", fontSize: 15, fontWeight: "700" },
  selectedText: { color: "#C2410C" },
  field: { gap: 8 },
  label: { color: "#0F172A", fontSize: 14, fontWeight: "700" },
  input: { minHeight: 52, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#F8FAFC", color: "#0F172A", fontSize: 16 },
  description: { minHeight: 112, textAlignVertical: "top" },
  error: { color: "#B91C1C", fontSize: 13 },
  errorBox: { color: "#B91C1C", backgroundColor: "#FEF2F2", borderRadius: 14, padding: 14, lineHeight: 21 },
  button: { minHeight: 54, padding: 14, borderRadius: 16, backgroundColor: "#F97316", flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  cancel: { minHeight: 52, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 16 },
  dim: { opacity: 0.55 },
});
