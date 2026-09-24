import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CreateCatalogItemForm } from "@/features/store-catalog-admin/components/CreateCatalogItemForm";
import { useOwnerCatalog } from "@/features/store-catalog-admin/useOwnerCatalog";
import type { OwnerCatalogItem } from "@/features/store-catalog-admin/storeCatalogAdminTypes";
import { catalogPlanLimit } from "@/features/store-catalog-admin/storeCatalogAdminValidation";
import { effectiveStorePlan } from "@/features/store-admin/storeAdminValidation";

const priceLabel = (value: number) => `$ ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OwnerCatalogScreen() {
  const catalog = useOwnerCatalog();
  const { state, saving, editing } = catalog;
  const header = <View style={styles.header}>
    <Pressable accessibilityRole="button" disabled={saving} onPress={() => router.back()} style={styles.back}>
      <Text style={styles.backText}>‹ Mi tienda</Text>
    </Pressable>
    <Text style={styles.title}>Catálogo</Text>
    <Text style={styles.subtitle}>Administrá los productos y servicios de tu tienda.</Text>
  </View>;

  if (state.kind === "single" && editing) {
    return <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {header}
          <CreateCatalogItemForm key={`${state.store.ownerId}:${state.store.id}`} ownerId={state.store.ownerId}
            saving={saving} onSave={catalog.create} onCancel={catalog.cancelCreating} onReview={catalog.reviewCatalog} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>;
  }

  if (state.kind !== "single") {
    const loading = state.kind === "loading" || state.kind === "auth-loading";
    const message = state.kind === "signed-out" ? "Iniciá sesión para administrar tu catálogo."
      : state.kind === "empty" ? "Primero creá tu tienda desde Mi tienda."
      : state.kind === "multiple" ? "Encontramos más de una tienda asociada a tu cuenta. Revisá la asociación antes de agregar ítems."
      : state.kind === "error" ? state.message : "Cargando tu catálogo…";
    return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content}>
      {header}
      <View style={styles.card}>
        {loading ? <ActivityIndicator size="large" color="#F97316" /> : null}
        <Text accessibilityLiveRegion="polite" style={styles.subtitle}>{message}</Text>
        {!loading ? <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
          if (state.kind === "signed-out") router.push("/(tabs)/perfil");
          else if (state.kind === "empty") router.back();
          else void catalog.reload();
        }}><Text style={styles.buttonText}>{state.kind === "signed-out" ? "Ir a Perfil" : state.kind === "empty" ? "Volver a Mi tienda" : "Reintentar"}</Text></Pressable> : null}
      </View>
    </ScrollView></SafeAreaView>;
  }

  const products = state.items.filter((item) => item.type === "product").length;
  const limit = catalogPlanLimit(effectiveStorePlan(state.store));
  const reachedLimit = state.items.length >= limit;
  return <SafeAreaView style={styles.root}>
    <FlatList data={state.items} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
      refreshing={false} onRefresh={() => void catalog.reload()}
      ListHeaderComponent={<View style={styles.listHeader}>
        {header}
        <View style={styles.card}>
          <Text style={styles.storeName}>{state.store.name}</Text>
          <View style={styles.summary}>
            {[['Total', state.items.length], ['Productos', products], ['Servicios', state.items.length - products]].map(([label, count]) => (
              <View key={label} style={styles.stat}><Text style={styles.count}>{count}</Text><Text style={styles.meta}>{label}</Text></View>
            ))}
          </View>
          {reachedLimit ? <Text style={styles.subtitle}>Tu plan permite hasta {limit} ítems, incluidos los pausados. Alcanzaste ese límite.</Text> : null}
          <Pressable accessibilityRole="button" disabled={reachedLimit} accessibilityState={{ disabled: reachedLimit }}
            onPress={catalog.startCreating} style={[styles.button, reachedLimit && styles.dim]}>
            <Text style={styles.buttonText}>+ Agregar</Text>
          </Pressable>
        </View>
        {catalog.notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{catalog.notice}</Text> : null}
      </View>}
      ListEmptyComponent={<View style={styles.card}><Text style={styles.storeName}>Tu catálogo empieza acá</Text><Text style={styles.subtitle}>Agregá tu primer producto o servicio para mostrarlo en tu tienda.</Text></View>}
      renderItem={({ item }) => <CatalogRow item={item} />} />
  </SafeAreaView>;
}

function CatalogRow({ item }: { item: OwnerCatalogItem }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const service = item.type === "service";
  return <View style={styles.item}>
    {item.imageUrl && failedUrl !== item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image}
      accessibilityLabel={`Imagen de ${item.name}`} onError={() => setFailedUrl(item.imageUrl)} />
      : <View style={[styles.image, styles.fallback]}><Text style={styles.fallbackIcon}>{service ? "◇" : "□"}</Text><Text style={styles.meta}>Sin imagen</Text></View>}
    <View style={styles.itemBody}>
      <View style={styles.badges}><Text style={styles.type}>{service ? "Servicio" : "Producto"}</Text><Text style={[styles.status, !item.active && styles.paused]}>{item.active ? "Activo" : "Pausado"}</Text></View>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.meta}>{item.category}</Text>
      <Text style={styles.price}>{priceLabel(item.price)}</Text>
      {!service ? <Text style={styles.meta}>Stock: {item.stock}</Text> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 36, gap: 16 },
  header: { gap: 8, marginBottom: 8 },
  back: { minHeight: 48, justifyContent: "center", alignSelf: "flex-start", paddingRight: 24 },
  backText: { color: "#C2410C", fontSize: 16, fontWeight: "700" },
  title: { color: "#0F172A", fontSize: 32, fontWeight: "900" },
  subtitle: { color: "#64748B", fontSize: 15, lineHeight: 23 },
  listHeader: { gap: 16 },
  card: { padding: 22, gap: 18, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  storeName: { color: "#0F172A", fontSize: 21, fontWeight: "800" },
  summary: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, gap: 4 },
  count: { color: "#C2410C", fontSize: 26, fontWeight: "800" },
  meta: { color: "#64748B", fontSize: 13, lineHeight: 19 },
  button: { minHeight: 54, padding: 14, borderRadius: 16, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  dim: { opacity: 0.55 },
  notice: { color: "#9A3412", padding: 16, borderRadius: 16, backgroundColor: "#FFF7ED", lineHeight: 21 },
  item: { borderRadius: 22, overflow: "hidden", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  image: { width: "100%", height: 150, backgroundColor: "#FFF7ED" },
  fallback: { alignItems: "center", justifyContent: "center", gap: 8 },
  fallbackIcon: { color: "#C2410C", fontSize: 42 },
  itemBody: { padding: 18, gap: 8 },
  badges: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  type: { color: "#C2410C", fontSize: 13, fontWeight: "700" },
  status: { color: "#15803D", fontSize: 13, fontWeight: "700" },
  paused: { color: "#64748B" },
  itemName: { color: "#0F172A", fontSize: 20, fontWeight: "800" },
  price: { color: "#0F172A", fontSize: 21, fontWeight: "800" },
});
