import {
  Alert,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useAuth,
} from "@/features/auth/AuthProvider";

import type {
  ExploreListing,
} from "@/features/explore/exploreTypes";

import {
  ListingReviewCard,
} from "@/features/listing-review/ListingReviewCard";

import {
  useListingSale,
} from "./useListingSale";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const SUCCESS = "#15803D";
const SUCCESS_SOFT = "#F0FDF4";
const ERROR = "#B91C1C";
const ERROR_SOFT = "#FEF2F2";

interface ListingSaleCardProps {
  listing: ExploreListing;
  onListingChanged?: () =>
    | void
    | Promise<void>;
}

export function ListingSaleCard({
  listing,
  onListingChanged,
}: ListingSaleCardProps) {
  const { user } =
    useAuth();

  const buyerId =
    user?.uid?.trim() ?? "";

  const enabled =
    Boolean(
      buyerId &&
      listing.userId !== buyerId,
    );

  const {
    sale,
    isLoading,
    error,
    message,
    isConfirming,
    isCancelling,
    confirm,
    cancel,
  } = useListingSale(
    listing.id,
    buyerId,
    enabled,
  );

  if (!enabled) {
    return null;
  }

  if (
    isLoading &&
    !sale
  ) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator
          size="small"
          color={ORANGE}
        />

        <Text style={styles.loadingText}>
          Revisando si tenés una operación asociada...
        </Text>
      </View>
    );
  }

  if (
    !sale &&
    !error
  ) {
    return null;
  }

  const quantity =
    Math.max(
      sale?.quantity || 1,
      1,
    );

  const isBusy =
    isConfirming ||
    isCancelling;

  const refreshListing =
    async () => {
      if (
        onListingChanged
      ) {
        await onListingChanged();
      }
    };

  const executeConfirm =
    async () => {
      try {
        await confirm();
        await refreshListing();
      } catch {
        // El hook ya expone el error
        // para mantener el feedback dentro de la pantalla.
      }
    };

  const executeCancel =
    async () => {
      try {
        await cancel();
        await refreshListing();
      } catch {
        // El hook ya expone el error
        // para mantener el feedback dentro de la pantalla.
      }
    };

  const askForConfirmation =
    () => {
      Alert.alert(
        "Confirmar operación",
        `Confirmá únicamente si reconocés un trato por ${quantity} ${
          quantity === 1
            ? "unidad"
            : "unidades"
        } de esta publicación. Eziel no verifica pagos, entregas ni el estado del producto.`,
        [
          {
            text: "Volver",
            style: "cancel",
          },
          {
            text:
              "Confirmar trato",
            onPress: () => {
              void executeConfirm();
            },
          },
        ],
      );
    };

  const askForCancellation =
    () => {
      Alert.alert(
        "No reconozco esta operación",
        `¿Querés rechazar esta solicitud? ${
          quantity === 1
            ? "La unidad reservada volverá"
            : `Las ${quantity} unidades reservadas volverán`
        } a quedar disponibles.`,
        [
          {
            text: "Volver",
            style: "cancel",
          },
          {
            text:
              "Rechazar solicitud",
            style: "destructive",
            onPress: () => {
              void executeCancel();
            },
          },
        ],
      );
    };

  if (
    sale?.status ===
    "pending_confirmation"
  ) {
    return (
      <View style={styles.pendingCard}>
        <View style={styles.eyebrowRow}>
          <View style={styles.pendingDot} />

          <Text style={styles.pendingEyebrow}>
            CONFIRMACIÓN PENDIENTE
          </Text>
        </View>

        <Text style={styles.title}>
          El vendedor indicó que hubo un trato con vos
        </Text>

        <View style={styles.quantityBox}>
          <Text style={styles.quantityLabel}>
            Cantidad
          </Text>

          <Text style={styles.quantityValue}>
            {quantity}{" "}
            {quantity === 1
              ? "unidad"
              : "unidades"}
          </Text>
        </View>

        <Text style={styles.description}>
          Confirmá solamente si reconocés esta operación.
          Eziel no interviene en el pago, la entrega ni
          verifica el estado del producto.
        </Text>

        {message ? (
          <Feedback
            tone="success"
            text={message}
          />
        ) : null}

        {error ? (
          <Feedback
            tone="error"
            text={error}
          />
        ) : null}

        <Pressable
          disabled={isBusy}
          onPress={
            askForConfirmation
          }
          style={({ pressed }) => [
            styles.primaryButton,
            pressed &&
              !isBusy &&
              styles.buttonPressed,
            isBusy &&
              styles.buttonDisabled,
          ]}
        >
          {isConfirming ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : null}

          <Text style={styles.primaryButtonText}>
            {isConfirming
              ? "Confirmando..."
              : "Confirmar que hubo trato"}
          </Text>
        </Pressable>

        <Pressable
          disabled={isBusy}
          onPress={
            askForCancellation
          }
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed &&
              !isBusy &&
              styles.buttonPressed,
            isBusy &&
              styles.buttonDisabled,
          ]}
        >
          {isCancelling ? (
            <ActivityIndicator
              size="small"
              color={TEXT}
            />
          ) : null}

          <Text style={styles.secondaryButtonText}>
            {isCancelling
              ? "Rechazando..."
              : "No reconozco esta operación"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (
    sale?.status ===
    "confirmed"
  ) {
    return (
      <View style={styles.confirmedCard}>
        <View style={styles.eyebrowRow}>
          <View style={styles.confirmedDot} />

          <Text style={styles.confirmedEyebrow}>
            OPERACIÓN CONFIRMADA
          </Text>
        </View>

        <Text style={styles.title}>
          Ambas partes reconocieron el trato
        </Text>

        <Text style={styles.confirmedQuantity}>
          {quantity}{" "}
          {quantity === 1
            ? "unidad"
            : "unidades"}
        </Text>

        <Text style={styles.description}>
          La operación quedó registrada en Eziel. Esto no
          certifica pagos, entregas ni el estado del producto.
        </Text>

        {message ? (
          <Feedback
            tone="success"
            text={message}
          />
        ) : null}

        {error ? (
          <Feedback
            tone="error"
            text={error}
          />
        ) : null}

        <ListingReviewCard
          listing={listing}
          sale={sale}
        />
      </View>
    );
  }

  if (
    message ||
    sale?.status === "cancelled"
  ) {
    return (
      <View style={styles.cancelledCard}>
        <Text style={styles.cancelledTitle}>
          Solicitud rechazada
        </Text>

        <Text style={styles.description}>
          {message ||
            "La solicitud ya no está pendiente y el stock reservado fue liberado."}
        </Text>

        {error ? (
          <Feedback
            tone="error"
            text={error}
          />
        ) : null}
      </View>
    );
  }

  if (error) {
    return (
      <Feedback
        tone="error"
        text={error}
      />
    );
  }

  return null;
}

function Feedback({
  tone,
  text,
}: {
  tone: "success" | "error";
  text: string;
}) {
  return (
    <View
      style={[
        styles.feedback,
        tone === "success"
          ? styles.successFeedback
          : styles.errorFeedback,
      ]}
    >
      <Text
        style={[
          styles.feedbackText,
          tone === "success"
            ? styles.successFeedbackText
            : styles.errorFeedbackText,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    loadingCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: "#FFFFFF",
    },

    loadingText: {
      flex: 1,
      color: MUTED,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
    },

    pendingCard: {
      padding: 18,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#FED7AA",
      backgroundColor: ORANGE_SOFT,
      gap: 14,
    },

    confirmedCard: {
      padding: 18,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#BBF7D0",
      backgroundColor: SUCCESS_SOFT,
      gap: 13,
    },

    cancelledCard: {
      padding: 18,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: "#FFFFFF",
      gap: 10,
    },

    eyebrowRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    pendingDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: ORANGE,
    },

    confirmedDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: SUCCESS,
    },

    pendingEyebrow: {
      color: ORANGE_DARK,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    confirmedEyebrow: {
      color: SUCCESS,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    title: {
      color: TEXT,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "900",
      letterSpacing: -0.25,
    },

    quantityBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 15,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#FFEDD5",
    },

    quantityLabel: {
      color: MUTED,
      fontSize: 13,
      fontWeight: "700",
    },

    quantityValue: {
      color: TEXT,
      fontSize: 15,
      fontWeight: "900",
    },

    confirmedQuantity: {
      color: SUCCESS,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "900",
    },

    description: {
      color: MUTED,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: "500",
    },

    primaryButton: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: ORANGE,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      paddingHorizontal: 16,
    },

    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
    },

    secondaryButton: {
      minHeight: 50,
      borderRadius: 16,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#CBD5E1",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      paddingHorizontal: 16,
    },

    secondaryButtonText: {
      color: TEXT,
      fontSize: 14,
      fontWeight: "800",
    },

    buttonPressed: {
      opacity: 0.78,
    },

    buttonDisabled: {
      opacity: 0.62,
    },

    cancelledTitle: {
      color: TEXT,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "900",
    },

    feedback: {
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderRadius: 13,
      borderWidth: 1,
    },

    successFeedback: {
      backgroundColor: SUCCESS_SOFT,
      borderColor: "#BBF7D0",
    },

    errorFeedback: {
      backgroundColor: ERROR_SOFT,
      borderColor: "#FECACA",
    },

    feedbackText: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "700",
    },

    successFeedbackText: {
      color: SUCCESS,
    },

    errorFeedbackText: {
      color: ERROR,
    },
  });
