import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StoreAdmin } from "../storeAdminTypes";
import { effectiveStorePlan } from "../storeAdminValidation";

export function StoreAdminOverview({ store, onEdit }: { store: StoreAdmin; onEdit: () => void }) {
  const plan = effectiveStorePlan(store);
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>TU TIENDA</Text>
      <Text style={styles.title}>{store.name}</Text>
      <Text style={styles.category}>{store.category}</Text>
      {store.verified ? <Text style={styles.verified}>Tienda verificada</Text> : null}
      {store.description ? <Text style={styles.text}>{store.description}</Text> : null}
      <View style={styles.details}>
        <Text style={styles.text}>{[store.city, store.province].filter(Boolean).join(" · ")}</Text>
        {store.address ? <Text style={styles.text}>{store.address}</Text> : null}
        {store.phone ? <Text style={styles.text}>Teléfono: {store.phone}</Text> : null}
        {store.whatsapp ? <Text style={styles.text}>WhatsApp: {store.whatsapp}</Text> : null}
      </View>
      <Text style={styles.plan}>Plan actual: {plan === "premium_plus" ? "Premium Plus" : plan === "premium" ? "Premium" : "Gratis"}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push("/mi-tienda-catalogo")} style={({ pressed }) => [styles.button, pressed && { opacity: 0.75 }]}>
        <Text style={styles.buttonText}>Catálogo</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.button, pressed && { opacity: 0.75 }]}>
        <Text style={styles.buttonText}>Editar información</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/tienda/[id]", params: { id: store.id } })} style={({ pressed }) => [styles.button, pressed && { opacity: 0.75 }]}>
        <Text style={styles.buttonText}>Ver tienda pública</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 22, gap: 12, backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#E2E8F0" },
  eyebrow: { color: "#C2410C", fontWeight: "800", fontSize: 12, letterSpacing: 1.4 },
  title: { color: "#0F172A", fontWeight: "900", fontSize: 28 },
  category: { color: "#C2410C", fontWeight: "700", fontSize: 15 },
  verified: { color: "#15803D", fontWeight: "700" },
  text: { color: "#475569", fontSize: 15, lineHeight: 23 },
  details: { gap: 8, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  plan: { color: "#475569", fontWeight: "600", fontSize: 14 },
  button: { minHeight: 54, marginTop: 10, borderRadius: 16, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center", padding: 12 },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});
