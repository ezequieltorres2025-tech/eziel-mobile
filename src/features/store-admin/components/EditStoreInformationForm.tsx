import { useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { auth } from "@/lib/firebase";
import { StoreGpsConfirmationRequiredError } from "../storeAdminFirestoreService";
import type { StoreAdmin, StoreInformation, StoreInformationChanges } from "../storeAdminTypes";
import { getStoreInformationChanges, normalizeStoreInput, validateStoreInput } from "../storeAdminValidation";

const sections: {
  title: string;
  fields: { key: keyof StoreInformation; label: string }[];
}[] = [
  { title: "Información", fields: [
    { key: "name", label: "Nombre de la tienda *" },
    { key: "category", label: "Categoría" },
    { key: "description", label: "Descripción" },
  ] },
  { title: "Ubicación", fields: [
    { key: "city", label: "Ciudad *" },
    { key: "province", label: "Provincia" },
    { key: "address", label: "Dirección" },
  ] },
  { title: "Contacto", fields: [
    { key: "phone", label: "Teléfono" },
    { key: "whatsapp", label: "WhatsApp" },
  ] },
];

interface Props {
  store: StoreAdmin;
  saving: boolean;
  onSave: (changes: StoreInformationChanges, gpsChangeConfirmed?: boolean) => Promise<void>;
  onCancel: () => void;
}

export function EditStoreInformationForm({ store, saving, onSave, onCancel }: Props) {
  const [initial] = useState(() => normalizeStoreInput(store));
  const [form, setForm] = useState<StoreInformation>(initial);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const mounted = useRef(false);
  const operation = useRef(0);
  const busy = useRef(false);
  const navigation = useNavigation();
  const changes = getStoreInformationChanges(initial, form);
  const dirty = Object.keys(changes).length > 0;
  const errors = validateStoreInput(form);
  const locked = saving || confirming;
  const canSave = dirty && Object.keys(errors).length === 0 && !locked;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; operation.current += 1; };
  }, [store.ownerId, store.id]);

  const isCurrent = (token: number) => mounted.current &&
    operation.current === token && auth.currentUser?.uid === store.ownerId;

  const requestDiscard = (proceed: () => void) => {
    if (busy.current || saving) return;
    if (!dirty) { proceed(); return; }
    const token = ++operation.current;
    Alert.alert("Descartar cambios", "Los cambios sin guardar se perderán.", [
      { text: "Seguir editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: () => {
        if (isCurrent(token) && !busy.current) proceed();
      } },
    ]);
  };

  usePreventRemove(dirty || locked, ({ data }) => {
    requestDiscard(() => navigation.dispatch(data.action));
  });

  const submit = () => {
    if (!canSave || busy.current) return;
    busy.current = true;
    const token = ++operation.current;
    setError(null);

    const save = async (gpsChangeConfirmed = false) => {
      if (!isCurrent(token)) return;
      setConfirming(false);
      let awaitingConfirmation = false;
      try {
        await onSave(changes, gpsChangeConfirmed);
      } catch (saveError) {
        if (isCurrent(token) && saveError instanceof StoreGpsConfirmationRequiredError && !gpsChangeConfirmed) {
          awaitingConfirmation = true;
          setConfirming(true);
          Alert.alert(
            "Ubicación GPS guardada",
            "Tu tienda tiene una ubicación GPS guardada. Estos cambios no modificarán ese punto en el mapa. Si cambiaste de ubicación, deberás actualizar el GPS más adelante.",
            [
              { text: "Cancelar", style: "cancel", onPress: () => {
                if (isCurrent(token)) { busy.current = false; setConfirming(false); }
              } },
              { text: "Guardar cambios", onPress: () => { void save(true); } },
            ],
            { cancelable: false },
          );
          return;
        }
        if (isCurrent(token)) setError(saveError instanceof Error
          ? saveError.message : "No pudimos guardar los cambios. Intentá nuevamente.");
      } finally {
        if (isCurrent(token) && !awaitingConfirmation) busy.current = false;
      }
    };

    void save();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Editar información</Text>
      <Text style={styles.intro}>Actualizá los datos comerciales de tu tienda. Los campos con * son obligatorios.</Text>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.fields.map(({ key, label }) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                accessibilityLabel={label}
                value={form[key]}
                editable={!locked}
                multiline={key === "description"}
                keyboardType={key === "phone" || key === "whatsapp" ? "phone-pad" : "default"}
                style={[styles.input, key === "description" && styles.description, errors[key] && styles.invalid]}
                onChangeText={(value) => {
                  setForm((previous) => ({ ...previous, [key]: value }));
                  setError(null);
                }}
              />
              {key === "whatsapp" ? <Text style={styles.help}>Conviene incluir el código de país para que puedan contactarte.</Text> : null}
              {errors[key] ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errors[key]}</Text> : null}
            </View>
          ))}
        </View>
      ))}
      {error ? <View style={styles.errorBox}><Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text></View> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSave, busy: saving }}
        disabled={!canSave} onPress={submit}
        style={({ pressed }) => [styles.button, (!canSave || pressed) && styles.dim]}>
        {saving ? <ActivityIndicator color="#FFFFFF" /> : null}
        <Text style={styles.buttonText}>{saving ? "Guardando cambios…" : "Guardar cambios"}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={locked} accessibilityState={{ disabled: locked }}
        onPress={() => requestDiscard(onCancel)}
        style={({ pressed }) => [styles.cancel, (locked || pressed) && styles.dim]}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#E2E8F0" },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  intro: { marginTop: 8, color: "#64748B", fontSize: 14, lineHeight: 21 },
  section: { marginTop: 24, gap: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#C2410C" },
  field: { gap: 8 },
  label: { color: "#0F172A", fontSize: 14, fontWeight: "700" },
  input: { minHeight: 52, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#F8FAFC", color: "#0F172A", fontSize: 16 },
  description: { minHeight: 112, textAlignVertical: "top" },
  invalid: { borderColor: "#B91C1C" },
  help: { color: "#64748B", fontSize: 13, lineHeight: 19 },
  error: { color: "#B91C1C", fontSize: 13, lineHeight: 20 },
  errorBox: { padding: 14, marginTop: 20, borderRadius: 14, backgroundColor: "#FEF2F2" },
  button: { minHeight: 54, marginTop: 24, borderRadius: 16, backgroundColor: "#F97316", flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  cancel: { minHeight: 52, marginTop: 10, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#CBD5E1" },
  cancelText: { color: "#475569", fontSize: 16, fontWeight: "700" },
  dim: { opacity: 0.55 },
});
