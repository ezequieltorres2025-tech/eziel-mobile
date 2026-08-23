export interface ListingReview {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  listingId: string;
  listingTitle: string;
  saleId: string;
  rating: number;
  comment: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CreateListingReviewData {
  sellerId: string;
  buyerId: string;
  buyerName: string;
  listingId: string;
  listingTitle: string;
  saleId: string;
  rating: number;
  comment: string;
}
