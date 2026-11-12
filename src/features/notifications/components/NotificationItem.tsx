import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppNotification } from "../notificationTypes";
import { notificationDestination } from "../notificationNavigation";

function icon(type: AppNotification["type"]): SymbolViewProps["name"] {
  switch (type) {
    case "sale_confirmation_requested": return { ios: "person.crop.circle.badge.checkmark", android: "handshake", web: "handshake" };
    case "sale_confirmed": return { ios: "checkmark.circle", android: "check_circle", web: "check_circle" };
    case "sale_cancelled": return { ios: "xmark.circle", android: "cancel", web: "cancel" };
    case "review_received": return { ios: "star", android: "star", web: "star" };
    case "store_offer": return { ios: "tag", android: "local_offer", web: "local_offer" };
    case "store_new_product": return { ios: "bag", android: "shopping_bag", web: "shopping_bag" };
    case "store_new_clip": return { ios: "play.rectangle", android: "play_circle", web: "play_circle" };
    case "moderation_report_updated": return { ios: "shield", android: "shield", web: "shield" };
    default: return { ios: "bell", android: "notifications", web: "notifications" };
  }
}

export function NotificationItem({ item, onPress }: {
  item: AppNotification; onPress: () => void;
}) {
  const navigable = notificationDestination(item) !== null;
  const actor = item.actorName.trim();
  const showActor = actor && !item.title.includes(actor) && !item.body.includes(actor);
  const date = item.createdAt === null ? "Fecha no disponible" : new Date(item.createdAt).toLocaleString("es-AR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", year: "numeric",
  });
  return <Pressable onPress={onPress} accessibilityRole="button"
    accessibilityLabel={`${item.read ? "Leída" : "Sin leer"}. ${item.title || "Notificación"}. ${item.body}`}
    accessibilityHint={navigable ? "Abre el contenido relacionado" : item.read ? "Sin destino disponible" : "Marca la notificación como leída"}
    style={({ pressed }) => [styles.card, !item.read && styles.unread, pressed && styles.pressed]}>
    <View style={[styles.icon, !item.read && styles.unreadIcon]}>
      <SymbolView name={icon(item.type)} size={22} tintColor={item.read ? "#64748B" : "#EA580C"} />
    </View>
    <View style={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{item.title || "Notificación"}</Text>
        {!item.read && <View style={styles.dot} />}
      </View>
      {!!showActor && <Text style={styles.actor}>{actor}</Text>}
      {!!item.body && <Text style={styles.body}>{item.body}</Text>}
      <Text style={styles.date}>{date}</Text>
    </View>
    {navigable && <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={16} tintColor="#94A3B8" />}
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" },
  unread: { borderColor: "#FED7AA", backgroundColor: "#FFFBF7" },
  pressed: { opacity: 0.75 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  unreadIcon: { backgroundColor: "#FFEDD5" },
  content: { flex: 1, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, color: "#0F172A", fontSize: 15, fontWeight: "800", lineHeight: 21 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#F97316" },
  actor: { color: "#475569", fontSize: 12, fontWeight: "700" },
  body: { color: "#475569", fontSize: 14, lineHeight: 21 },
  date: { color: "#64748B", fontSize: 11, marginTop: 4 },
});
