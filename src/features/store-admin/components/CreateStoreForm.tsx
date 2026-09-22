import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { CreateStoreInput } from "../storeAdminTypes";
import { validateStoreInput } from "../storeAdminValidation";

const fields: { key: keyof CreateStoreInput; label: string; placeholder: string }[] = [
  { key: "name", label: "Nombre de la tienda *", placeholder: "Nombre de tu negocio" },
  { key: "city", label: "Ciudad *", placeholder: "Ciudad donde está tu tienda" },
  { key: "province", label: "Provincia", placeholder: "Neuquén" },
  { key: "category", label: "Categoría", placeholder: "Otros" },
  { key: "description", label: "Descripción", placeholder: "Contá qué ofrece tu tienda" },
  { key: "address", label: "Dirección", placeholder: "Calle, número, local" },
  { key: "phone", label: "Teléfono", placeholder: "Código de área y número" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "549299…" },
];

export function CreateStoreForm({ saving, onCreate }: { saving: boolean; onCreate: (input: CreateStoreInput) => Promise<void> }) {
  const [form, setForm] = useState<CreateStoreInput>({ name: "", city: "", province: "Neuquén", category: "Otros", description: "", address: "", phone: "", whatsapp: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateStoreInput, string>>>({});
  const submitting = useRef(false);
  const submit = async () => {
    if (saving || submitting.current) return;
    const nextErrors = validateStoreInput(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    submitting.current = true;
    try { await onCreate(form); } finally { submitting.current = false; }
  };
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Creá tu tienda</Text>
      <Text style={styles.subtitle}>Presentá tu negocio en Eziel. Los campos con * son obligatorios.</Text>
      {fields.map(({ key, label, placeholder }) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            accessibilityLabel={label}
            value={form[key]}
            placeholder={placeholder}
            placeholderTextColor="#64748B"
            editable={!saving}
            multiline={key === "description"}
            keyboardType={key === "phone" || key === "whatsapp" ? "phone-pad" : "default"}
            style={[styles.input, key === "description" && styles.description, errors[key] ? styles.invalid : null]}
            onChangeText={(value) => {
              setForm((previous) => ({ ...previous, [key]: value }));
              setErrors((previous) => ({ ...previous, [key]: undefined }));
            }}
          />
          {errors[key] ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errors[key]}</Text> : null}
        </View>
      ))}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }} disabled={saving} onPress={() => void submit()} style={({ pressed }) => [styles.button, (pressed || saving) && styles.dim]}>
        {saving ? <ActivityIndicator color="#FFFFFF" /> : null}
        <Text style={styles.buttonText}>{saving ? "Creando tienda…" : "Crear tienda"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#E2E8F0" },
  title: { fontSize: 23, fontWeight: "800", color: "#0F172A" },
  subtitle: { marginTop: 8, marginBottom: 8, fontSize: 14, lineHeight: 21, color: "#64748B" },
  field: { marginTop: 18, gap: 8 },
  label: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  input: { minHeight: 52, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 14, padding: 14, fontSize: 16, color: "#0F172A", backgroundColor: "#F8FAFC" },
  description: { minHeight: 112, textAlignVertical: "top" },
  invalid: { borderColor: "#B91C1C" },
  error: { color: "#B91C1C", fontSize: 13 },
  button: { minHeight: 54, marginTop: 24, borderRadius: 16, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  dim: { opacity: 0.65 },
});
