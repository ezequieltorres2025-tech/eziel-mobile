import type { PublishImage } from "@/features/publish/components/PublishImagePicker";

export type ServicePriceType = "fixed" | "from" | "quote" | "hourly";

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

export type ServicePaymentMethod =
  | "manual"
  | "transfer"
  | "mercadopago";

export interface ServiceCoreInput {
  title: string;
  description: string;
  category: string;
  specialty: string;
  keywords?: readonly string[];
  city: string;
  province?: string;
  zones?: readonly string[];
  priceType: ServicePriceType;
  price: number;
  whatsapp: string;
  phone: string;
  experienceYears?: number;
  responseTime?: ServiceResponseTime;
}

export interface NormalizedServiceCoreData {
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
  whatsapp: string;
  phone: string;
  experienceYears: number;
  responseTime: ServiceResponseTime;
}

export interface PublishServiceData extends ServiceCoreInput {
  images: PublishImage[];
}

export interface CreatePendingServiceData extends NormalizedServiceCoreData {
  userId: string;
  userName: string;
  userEmail: string;
  imageUrl: string;
  imageUrls: string[];
}

export interface PendingServiceCreationResult {
  serviceId: string;
  paymentRequestId: string;
}

export interface PublishServiceResult extends PendingServiceCreationResult {
  imageUrl: string;
  imageUrls: string[];
  paymentStatus: "pending_payment";
  publicationPrice: number;
  publicationDurationDays: number;
}
