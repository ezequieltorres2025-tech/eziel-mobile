import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "@react-native-firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  SERVICE_PUBLICATION_DURATION_DAYS,
  SERVICE_PUBLICATION_PRICE_ARS,
} from "./serviceConstants";

import type {
  CreatePendingServiceData,
  PendingServiceCreationResult,
} from "./serviceTypes";

import {
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeStringList,
  validateAndNormalizeServiceCore,
} from "./serviceValidation";

function normalizeImageUrls(values: readonly unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );
}

export async function createPendingServiceWithPayment(
  data: CreatePendingServiceData,
): Promise<PendingServiceCreationResult> {
  const userId = normalizeRequiredText(data.userId, "El usuario");

  if (auth.currentUser?.uid !== userId) {
    throw new Error(
      "La sesión actual no coincide con el propietario del servicio.",
    );
  }

  const userName =
    normalizeOptionalText(data.userName) || "Profesional";

  const userEmail = normalizeOptionalText(data.userEmail);

  const normalized = validateAndNormalizeServiceCore({
    title: data.title,
    description: data.description,
    category: data.category,
    specialty: data.specialty,
    keywords: data.keywords,
    city: data.city,
    province: data.province,
    zones: data.zones,
    priceType: data.priceType,
    price: data.price,
    whatsapp: data.whatsapp,
    phone: data.phone,
    experienceYears: data.experienceYears,
    responseTime: data.responseTime,
  });

  const imageUrls = normalizeImageUrls([
    ...(Array.isArray(data.imageUrls) ? data.imageUrls : []),
    data.imageUrl,
  ]);

  const serviceReference = doc(collection(db, "services"));

  const paymentRequestReference = doc(
    collection(db, "servicePaymentRequests"),
  );

  const batch = writeBatch(db);

  batch.set(serviceReference, {
    userId,
    userName,
    userEmail,

    title: normalized.title,
    description: normalized.description,
    category: normalized.category,
    specialty: normalized.specialty,

    keywords: normalizeStringList(normalized.keywords),

    city: normalized.city,
    province: normalized.province,

    zones: normalizeStringList(normalized.zones),

    priceType: normalized.priceType,
    price: normalized.price,

    whatsapp: normalized.whatsapp,
    phone: normalized.phone,

    imageUrl: imageUrls[0] || "",
    imageUrls,

    experienceYears: normalized.experienceYears,
    responseTime: normalized.responseTime,

    completedJobs: 0,

    active: false,
    verified: false,
    featured: false,

    rating: 0,
    reviewCount: 0,
    views: 0,

    paymentRequired: true,

    publicationPrice: SERVICE_PUBLICATION_PRICE_ARS,
    paymentCurrency: "ARS",
    paymentMethod: "manual",
    paymentStatus: "pending_payment",

    paymentRequestId: paymentRequestReference.id,

    publicationDurationDays: SERVICE_PUBLICATION_DURATION_DAYS,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(paymentRequestReference, {
    ownerId: userId,
    ownerName: userName,
    ownerEmail: userEmail,

    serviceId: serviceReference.id,
    serviceTitle: normalized.title,

    amount: SERVICE_PUBLICATION_PRICE_ARS,
    currency: "ARS",
    paymentMethod: "manual",
    status: "pending_payment",

    periodDays: SERVICE_PUBLICATION_DURATION_DAYS,

    notes:
      "Solicitud manual de pago para publicar un servicio. Activar únicamente después de validar el pago.",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  return {
    serviceId: serviceReference.id,
    paymentRequestId: paymentRequestReference.id,
  };
}
