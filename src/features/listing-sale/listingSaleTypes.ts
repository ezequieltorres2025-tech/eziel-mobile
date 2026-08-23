export type ListingSaleStatus =
  | "pending_confirmation"
  | "confirmed"
  | "cancelled";

export interface ListingSale {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  quantity: number;
  status: ListingSaleStatus;
  requestedAt?: unknown;
  confirmedAt?: unknown;
  cancelledAt?: unknown;
  cancelledBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ConfirmListingSaleData {
  listingId: string;
  buyerId: string;
  saleId?: string;
}

export interface CancelListingSaleData {
  listingId: string;
  buyerId: string;
  actorId: string;
  saleId?: string;
}
