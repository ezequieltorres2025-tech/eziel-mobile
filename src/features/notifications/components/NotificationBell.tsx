import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNotifications } from "../NotificationsProvider";
import { unreadBadgeLabel } from "../notificationTypes";

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const badge = unreadBadgeLabel(unreadCount);
  return <Pressable accessibilityRole="button"
    accessibilityLabel={badge ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}
    onPress={() => router.navigate("/notificaciones")}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
    <SymbolView name={{ ios: "bell.fill", android: "notifications", web: "notifications" }} size={22} tintColor="#0F172A" />
    {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  pressed: { opacity: 0.7 },
  badge: { position: "absolute", top: -4, right: -5, minWidth: 21, height: 21, paddingHorizontal: 5, borderRadius: 11, backgroundColor: "#EA580C", borderWidth: 2, borderColor: "#F8FAFC", alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
});
