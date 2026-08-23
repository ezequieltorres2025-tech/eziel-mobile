import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useAuth,
} from "@/features/auth/AuthProvider";

import type {
  ExploreListing,
} from "@/features/explore/exploreTypes";

import type {
  ListingSale,
} from "@/features/listing-sale/listingSaleTypes";

import {
  useListingReview,
} from "./useListingReview";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const STAR_EMPTY = "#CBD5E1";
const ERROR = "#B91C1C";
const ERROR_SOFT = "#FEF2F2";
const SUCCESS = "#15803D";
const SUCCESS_SOFT = "#F0FDF4";

interface ListingReviewCardProps {
  listing: ExploreListing;
  sale: ListingSale;
}

export function ListingReviewCard({
  listing,
  sale,
}: ListingReviewCardProps) {
  const { user } =
    useAuth();

  const buyerId =
    user?.uid?.trim() ?? "";

  const enabled =
    Boolean(
      buyerId &&
      sale.status ===
        "confirmed" &&
      sale.buyerId ===
        buyerId &&
      listing.userId !==
        buyerId,
    );

  const {
    review,
    isLoading,
    isSubmitting,
    error,
    submitReview,
  } = useListingReview(
    buyerId,
    sale.id,
    enabled,
  );

  const [
    rating,
    setRating,
  ] =
    useState(5);

  const [
    comment,
    setComment,
  ] =
    useState("");

  useEffect(() => {
    if (review) {
      setRating(
        review.rating,
      );

      setComment("");
    }
  }, [review]);

  if (!enabled) {
    return null;
  }

  if (
    isLoading &&
    !review
  ) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="small"
          color={ORANGE}
        />

        <Text style={styles.loadingText}>
          Revisando tu reseña...
        </Text>
      </View>
    );
  }

  if (review) {
    return (
      <View style={styles.reviewedCard}>
        <View style={styles.reviewedHeader}>
          <View style={styles.successDot} />

          <Text style={styles.reviewedEyebrow}>
            TU RESEÑA
          </Text>
        </View>

        <Text style={styles.reviewedTitle}>
          Ya calificaste esta operación
        </Text>

        <View style={styles.starsReadOnly}>
          {[1, 2, 3, 4, 5].map(
            (star) => (
              <Text
                key={star}
                style={[
                  styles.readOnlyStar,
                  star <=
                    review.rating
                    ? styles.filledStar
                    : styles.emptyStar,
                ]}
              >
                ★
              </Text>
            ),
          )}
        </View>

        <Text style={styles.reviewComment}>
          {review.comment ||
            "Sin comentario."}
        </Text>

        <Text style={styles.reviewThanks}>
          Gracias por ayudar a construir la reputación de la comunidad.
        </Text>
      </View>
    );
  }

  const trimmedComment =
    comment.trim();

  const canSubmit =
    !isSubmitting &&
    trimmedComment.length > 0;

  const handleSubmit =
    async () => {
      if (!canSubmit) {
        return;
      }

      try {
        await submitReview({
          sellerId:
            listing.userId,

          buyerId,

          buyerName:
            user?.displayName ||
            user?.email ||
            sale.buyerName ||
            "Usuario",

          listingId:
            listing.id,

          listingTitle:
            listing.title,

          saleId:
            sale.id,

          rating,

          comment:
            trimmedComment,
        });
      } catch {
        // El hook expone el error
        // dentro de esta misma tarjeta.
      }
    };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            RESEÑA DE LA OPERACIÓN
          </Text>

          <Text style={styles.title}>
            ¿Cómo fue tu experiencia?
          </Text>
        </View>

        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedBadgeText}>
            Trato confirmado
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        Tu opinión ayuda a otros usuarios a conocer la experiencia real con este vendedor.
      </Text>

      <View style={styles.ratingArea}>
        <Text style={styles.ratingLabel}>
          Tu calificación
        </Text>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map(
            (star) => (
              <Pressable
                key={star}
                disabled={
                  isSubmitting
                }
                accessibilityRole="button"
                accessibilityLabel={`Calificar con ${star} ${
                  star === 1
                    ? "estrella"
                    : "estrellas"
                }`}
                onPress={() =>
                  setRating(
                    star,
                  )
                }
                hitSlop={7}
                style={({ pressed }) => [
                  styles.starButton,
                  pressed &&
                    !isSubmitting &&
                    styles.starPressed,
                ]}
              >
                <Text
                  style={[
                    styles.star,
                    star <= rating
                      ? styles.filledStar
                      : styles.emptyStar,
                  ]}
                >
                  ★
                </Text>
              </Pressable>
            ),
          )}
        </View>

        <Text style={styles.ratingValue}>
          {rating} de 5
        </Text>
      </View>

      <View style={styles.commentArea}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentLabel}>
            Contá tu experiencia
          </Text>

          <Text style={styles.counter}>
            {comment.length}/1000
          </Text>
        </View>

        <TextInput
          value={comment}
          onChangeText={setComment}
          editable={
            !isSubmitting
          }
          multiline
          maxLength={1000}
          textAlignVertical="top"
          placeholder="¿Cómo fue el trato con este vendedor?"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />
      </View>

      <View style={styles.safetyNotice}>
        <Text style={styles.safetyText}>
          Publicá únicamente información sobre tu experiencia con esta operación.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : null}

      <Pressable
        disabled={!canSubmit}
        onPress={() => {
          void handleSubmit();
        }}
        style={({ pressed }) => [
          styles.submitButton,

          pressed &&
            canSubmit &&
            styles.submitPressed,

          !canSubmit &&
            styles.submitDisabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
          />
        ) : null}

        <Text style={styles.submitText}>
          {isSubmitting
            ? "Enviando..."
            : "Enviar reseña"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles =
  StyleSheet.create({
    loading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 16,
      backgroundColor: "#FFFFFF",
    },

    loadingText: {
      color: MUTED,
      fontSize: 13,
      fontWeight: "600",
    },

    card: {
      padding: 16,
      borderWidth: 1,
      borderColor: "#FED7AA",
      borderRadius: 18,
      backgroundColor: "#FFFFFF",
      gap: 15,
    },

    header: {
      gap: 10,
    },

    eyebrow: {
      color: ORANGE_DARK,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    title: {
      marginTop: 3,
      color: TEXT,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900",
      letterSpacing: -0.3,
    },

    verifiedBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: SUCCESS_SOFT,
    },

    verifiedBadgeText: {
      color: SUCCESS,
      fontSize: 11,
      fontWeight: "800",
    },

    description: {
      color: MUTED,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: "500",
    },

    ratingArea: {
      gap: 8,
    },

    ratingLabel: {
      color: TEXT,
      fontSize: 13,
      fontWeight: "800",
    },

    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    starButton: {
      minWidth: 40,
      minHeight: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
    },

    starPressed: {
      backgroundColor: "#FFF7ED",
      transform: [
        {
          scale: 0.94,
        },
      ],
    },

    star: {
      fontSize: 34,
      lineHeight: 39,
    },

    filledStar: {
      color: ORANGE,
    },

    emptyStar: {
      color: STAR_EMPTY,
    },

    ratingValue: {
      color: MUTED,
      fontSize: 12,
      fontWeight: "700",
    },

    commentArea: {
      gap: 8,
    },

    commentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },

    commentLabel: {
      color: TEXT,
      fontSize: 13,
      fontWeight: "800",
    },

    counter: {
      color: MUTED,
      fontSize: 11,
      fontWeight: "700",
    },

    input: {
      minHeight: 120,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 15,
      backgroundColor: "#F8FAFC",
      color: TEXT,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "500",
    },

    safetyNotice: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: "#F8FAFC",
    },

    safetyText: {
      color: MUTED,
      fontSize: 11,
      lineHeight: 17,
      fontWeight: "600",
    },

    errorBox: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: "#FECACA",
      borderRadius: 12,
      backgroundColor: ERROR_SOFT,
    },

    errorText: {
      color: ERROR,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "700",
    },

    submitButton: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: ORANGE,
    },

    submitPressed: {
      opacity: 0.82,
    },

    submitDisabled: {
      opacity: 0.46,
    },

    submitText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
    },

    reviewedCard: {
      padding: 16,
      borderWidth: 1,
      borderColor: "#BBF7D0",
      borderRadius: 18,
      backgroundColor: "#FFFFFF",
      gap: 11,
    },

    reviewedHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    successDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: SUCCESS,
    },

    reviewedEyebrow: {
      color: SUCCESS,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    reviewedTitle: {
      color: TEXT,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900",
    },

    starsReadOnly: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },

    readOnlyStar: {
      fontSize: 23,
      lineHeight: 28,
    },

    reviewComment: {
      color: TEXT,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "600",
    },

    reviewThanks: {
      color: MUTED,
      fontSize: 11,
      lineHeight: 17,
      fontWeight: "600",
    },
  });
