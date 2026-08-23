export type ListingStatus =
  | "active"
  | "pending_confirmation"
  | "sold";

export interface ExploreListing {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  location: string;
  imageUrl: string;
  imageUrls: string[];
  userId: string;
  userName: string;
  storeId?: string;
  storeName?: string;
  views: number;
  sold: boolean;
  status: ListingStatus;
  stockTotal: number;
  reservedUnits: number;
  soldUnits: number;
  availableUnits: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ServicePriceType =
  | "fixed"
  | "from"
  | "quote"
  | "hourly";

export type ServiceResponseTime =
  | "fast"
  | "normal"
  | "slow"
  | "unknown";

export type ServicePaymentStatus =
  | "pending_payment"
  | "approved"
  | "rejected"
  | "cancelled";

export interface ExploreService {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  specialty: string;
  keywords: string[];
  city: string;
  province: string;
  zones: string[];
  priceType: ServicePriceType;
  price: number;
  imageUrl: string;
  imageUrls: string[];
  experienceYears: number;
  responseTime: ServiceResponseTime;
  completedJobs: number;
  active: boolean;
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  views: number;
  paymentRequired: boolean;
  paymentStatus: ServicePaymentStatus;
  publicationExpiresAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type StorePlan =
  | "free"
  | "premium"
  | "premium_plus";

export interface ExploreStore {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  address: string;
  city: string;
  province: string;
  category: string;
  verified: boolean;
  featured: boolean;
  views: number;
  plan: StorePlan;
  planExpiresAt?: unknown;
  planExpired: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExploreData {
  listings: ExploreListing[];
  services: ExploreService[];
  stores: ExploreStore[];
}
