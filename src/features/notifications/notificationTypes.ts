export const NOTIFICATION_TYPES = [
  "sale_confirmation_requested", "sale_confirmed", "sale_cancelled",
  "review_received", "moderation_report_updated", "store_new_product",
  "store_offer", "store_new_clip",
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

export interface AppNotification {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  type: NotificationType | "unknown";
  title: string;
  body: string;
  href: string;
  referenceId: string;
  read: boolean;
  createdAt: number | null;
  readAt: number | null;
  listingId?: string;
  conversationId?: string;
  saleId?: string;
  reviewId?: string;
  reportId?: string;
  storeId?: string;
  productId?: string;
  clipId?: string;
}

export function unreadBadgeLabel(count: number): string | null {
  return count > 0 ? (count > 99 ? "99+" : String(count)) : null;
}
