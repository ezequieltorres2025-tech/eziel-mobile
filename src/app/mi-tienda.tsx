import { router } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOwnerStore } from "@/features/store-admin/useOwnerStore";
import { CreateStoreForm } from "@/features/store-admin/components/CreateStoreForm";
import { StoreAdminOverview } from "@/features/store-admin/components/StoreAdminOverview";
import { EditStoreInformationForm } from "@/features/store-admin/components/EditStoreInformationForm";

export default function MyStoreScreen() {
  const { state, saving, retry, create, editing, startEditing, cancelEditing, saveInformation } = useOwnerStore();
  const loading = state.kind === "auth-loading" || state.kind === "loading";
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {!editing ? <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Volver</Text></Pressable> : null}
          <Text style={styles.title}>Mi tienda</Text>
          <Text style={styles.subtitle}>Tu negocio en Eziel</Text>
          {loading ? <View style={styles.card}><ActivityIndicator size="large" color="#F97316" /><Text style={styles.text}>Cargando tu tienda…</Text></View> : null}
          {state.kind === "signed-out" ? <View style={styles.card}><Text style={styles.heading}>Iniciá sesión</Text><Text style={styles.text}>Ingresá desde Perfil para crear o consultar tu tienda.</Text><Pressable accessibilityRole="button" style={styles.button} onPress={() => router.replace("/(tabs)/perfil")}><Text style={styles.buttonText}>Ir a Perfil</Text></Pressable></View> : null}
          {state.kind === "empty" ? <CreateStoreForm saving={saving} onCreate={create} /> : null}
          {state.kind === "single" ? editing ? (
            <EditStoreInformationForm key={`${state.store.ownerId}:${state.store.id}`} store={state.store}
              saving={saving} onSave={saveInformation} onCancel={cancelEditing} />
          ) : <StoreAdminOverview store={state.store} onEdit={startEditing} /> : null}
          {state.kind === "error" || state.kind === "multiple" ? (
            <View style={styles.card} accessibilityLiveRegion="polite">
              <Text style={styles.heading}>{state.kind === "multiple" ? "Encontramos más de una tienda asociada a tu cuenta." : "No pudimos completar la operación"}</Text>
              <Text style={styles.text}>{state.kind === "multiple" ? "La asociación de tus tiendas requiere revisión antes de continuar. Podés volver a consultar su estado." : state.message}</Text>
              <Pressable accessibilityRole="button" onPress={() => void retry()} style={styles.button}><Text style={styles.buttonText}>Reintentar</Text></Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 40 },
  back: { minHeight: 48, justifyContent: "center", alignSelf: "flex-start", paddingRight: 24 },
  backText: { fontSize: 16, fontWeight: "700", color: "#C2410C" },
  title: { marginTop: 12, fontSize: 32, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 6, marginBottom: 24, color: "#64748B", fontSize: 16 },
  card: { padding: 24, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", gap: 16 },
  heading: { fontSize: 21, fontWeight: "800", color: "#0F172A" },
  text: { fontSize: 15, lineHeight: 23, color: "#475569" },
  button: { minHeight: 52, padding: 12, borderRadius: 14, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
});
