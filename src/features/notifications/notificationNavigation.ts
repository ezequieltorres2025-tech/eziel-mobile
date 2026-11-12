import type { AppNotification } from "./notificationTypes";

export type NotificationDestination =
  | { pathname: "/explorar/[id]" | "/tienda/[id]"; params: { id: string } }
  | { pathname: "/mis-publicaciones" | "/mensajes" };

export function isNotificationResourceId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 1500 &&
    value === value.trim() && !/[\/\\?#%\u0000-\u001f\u007f]/.test(value) &&
    value !== "." && value !== "..";
}

export function notificationDestination(item: AppNotification): NotificationDestination | null {
  switch (item.type) {
    case "sale_confirmation_requested":
    case "review_received":
    // No inferimos el rol a partir de texto/href. El detalle es contexto general,
    // no una promesa de abrir una operación específica de esa publicación.
    case "sale_cancelled":
      return isNotificationResourceId(item.listingId)
        ? { pathname: "/explorar/[id]", params: { id: item.listingId } } : null;
    case "sale_confirmed": return { pathname: "/mis-publicaciones" };
    case "moderation_report_updated": return { pathname: "/mensajes" };
    case "store_new_product":
    case "store_offer":
    case "store_new_clip":
      return isNotificationResourceId(item.storeId)
        ? { pathname: "/tienda/[id]", params: { id: item.storeId } } : null;
    default: return null;
  }
}
