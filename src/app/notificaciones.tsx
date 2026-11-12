import { router, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useRef } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/features/auth/AuthProvider";
import { useNotifications } from "@/features/notifications/NotificationsProvider";
import { NotificationItem } from "@/features/notifications/components/NotificationItem";
import { notificationDestination } from "@/features/notifications/notificationNavigation";
import type { AppNotification } from "@/features/notifications/notificationTypes";

export default function NotificationsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, loading, refreshing, loadingMore, hasMore,
    error, refresh, loadMore, markAsRead } = useNotifications();
  const tapping = useRef(false);
  const focused = useRef(false);
  const focusGeneration = useRef(0);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    tapping.current = false;
    return () => { focused.current = false; focusGeneration.current += 1; };
  }, [user?.uid]));

  function open(item: AppNotification) {
    if (!focused.current || tapping.current || item.recipientId !== user?.uid) return;
    tapping.current = true;
    const generation = focusGeneration.current;
    const destination = notificationDestination(item);
    // Iniciar la escritura antes de navegar, sin esperar indefinidamente un ACK
    // cuando no hay red. El provider conserva errores y reconcilia por listener.
    const marking = markAsRead(item);
    if (destination) router.push(destination);
    else void marking.finally(() => {
      if (focused.current && generation === focusGeneration.current) tapping.current = false;
    });
  }

  const busy = authLoading || loading;
  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver"
        onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
        style={styles.back}>
        <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={22} tintColor="#0F172A" />
      </Pressable>
      <View style={styles.heading}>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.subtitle}>{!user ? "Tu actividad en Eziel" : unreadCount > 0 ? `${unreadCount} sin leer` : "Tus novedades, en un solo lugar"}</Text>
      </View>
    </View>
    <FlatList data={user ? notifications : []} keyExtractor={item => item.id}
      contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => <NotificationItem item={item} onPress={() => open(item)} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} tintColor="#F97316" colors={["#F97316"]} enabled={!!user} />}
      ListHeaderComponent={error && user ? <View style={styles.error} accessibilityLiveRegion="polite">
        <Text style={styles.errorText}>{error}</Text>
        <Pressable accessibilityRole="button" disabled={refreshing} onPress={() => { void refresh(); }} style={styles.retry}>
          <Text style={styles.actionText}>Reintentar</Text>
        </Pressable>
      </View> : null}
      ListEmptyComponent={<View style={styles.empty}>
        {busy ? <ActivityIndicator size="large" color="#F97316" /> : <>
          <View style={styles.emptyIcon}><SymbolView name={{ ios: "bell", android: "notifications_none", web: "notifications_none" }} size={32} tintColor="#EA580C" /></View>
          <Text style={styles.emptyTitle}>{!user ? "Tus novedades te esperan" : error ? "No pudimos cargar la bandeja" : "Todavía no tenés notificaciones"}</Text>
          <Text style={styles.emptyBody}>{!user ? "Iniciá sesión desde tu perfil para ver tu actividad." : error ? "Volvé a intentarlo cuando tengas conexión." : "Los avisos de tus operaciones y tiendas aparecerán acá."}</Text>
          {!user && <Pressable accessibilityRole="button" onPress={() => router.push("/perfil")} style={styles.primary}><Text style={styles.primaryText}>Ir a mi perfil</Text></Pressable>}
        </>}
      </View>}
      ListFooterComponent={user && notifications.length > 0 ? <View style={styles.footer}>
        {loadingMore ? <ActivityIndicator color="#F97316" /> : hasMore ?
          <Pressable accessibilityRole="button" disabled={refreshing} onPress={() => { void loadMore(); }} style={styles.more}><Text style={styles.actionText}>Cargar más</Text></Pressable> :
          <Text style={styles.end}>Llegaste al final de tus notificaciones</Text>}
      </View> : null}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 18 },
  back: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  heading: { flex: 1, gap: 5 },
  title: { fontSize: 25, fontWeight: "800", letterSpacing: -0.6, color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#64748B", lineHeight: 18 },
  list: { padding: 20, paddingTop: 6, flexGrow: 1 },
  separator: { height: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 70, paddingHorizontal: 22, gap: 14 },
  emptyIcon: { width: 76, height: 76, borderRadius: 26, backgroundColor: "#FFEDD5", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  emptyBody: { fontSize: 14, lineHeight: 22, color: "#64748B", textAlign: "center" },
  error: { padding: 16, borderRadius: 16, backgroundColor: "#FFF7ED", marginBottom: 16 },
  errorText: { color: "#9A3412", fontSize: 13, lineHeight: 20 },
  retry: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
  actionText: { color: "#C2410C", fontSize: 14, fontWeight: "800" },
  primary: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, backgroundColor: "#EA580C" },
  primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  footer: { paddingVertical: 24, alignItems: "center", minHeight: 80 },
  more: { minHeight: 48, paddingHorizontal: 28, justifyContent: "center", borderWidth: 1, borderColor: "#FED7AA", borderRadius: 16, backgroundColor: "#FFFFFF" },
  end: { fontSize: 12, color: "#64748B", textAlign: "center" },
});
