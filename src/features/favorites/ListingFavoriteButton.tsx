import {
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useAuth,
} from "@/features/auth/AuthProvider";

import {
  useListingFavorite,
} from "./useListingFavorite";

interface ListingFavoriteButtonProps {
  listingId: string;
}

export function ListingFavoriteButton({
  listingId,
}: ListingFavoriteButtonProps) {
  const {
    loginWithGoogle,
  } = useAuth();

  const [
    isSigningIn,
    setIsSigningIn,
  ] = useState(false);

  const {
    userId,
    isFavorited,
    isLoading,
    isSaving,
    error,
    toggleFavorite,
  } = useListingFavorite(
    listingId,
  );

  const handlePress =
    async () => {
      if (!userId) {
        if (isSigningIn) {
          return;
        }

        try {
          setIsSigningIn(true);

          const result =
            await loginWithGoogle();

          if (
            result === "success"
          ) {
            Alert.alert(
              "Sesión iniciada",
              "Ya podés guardar esta publicación en tus favoritos.",
            );
          }
        } catch {
          Alert.alert(
            "No pudimos iniciar sesión",
            "No fue posible ingresar con Google. Intentá nuevamente.",
          );
        } finally {
          setIsSigningIn(false);
        }

        return;
      }

      await toggleFavorite();
    };

  const isDisabled =
    isLoading ||
    isSaving ||
    isSigningIn;

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isFavorited
            ? "Quitar de favoritos"
            : "Agregar a favoritos"
        }
        accessibilityState={{
          selected:
            isFavorited,
          disabled:
            isDisabled,
        }}
        disabled={
          isDisabled
        }
        onPress={
          handlePress
        }
        style={({
          pressed,
        }) => [
          styles.button,
          isFavorited &&
            styles.buttonActive,
          pressed &&
            !isDisabled &&
            styles.buttonPressed,
          isDisabled &&
            styles.buttonDisabled,
        ]}
      >
        <View
          style={[
            styles.iconShell,
            isFavorited &&
              styles.iconShellActive,
          ]}
        >
          {isSaving || isSigningIn ? (
            <ActivityIndicator
              size="small"
              color={
                isFavorited
                  ? "#EF4444"
                  : "#F97316"
              }
            />
          ) : (
            <Text
              style={[
                styles.heart,
                isFavorited &&
                  styles.heartActive,
              ]}
            >
              {isFavorited
                ? "♥"
                : "♡"}
            </Text>
          )}
        </View>

        <View
          style={
            styles.copy
          }
        >
          <Text
            style={[
              styles.title,
              isFavorited &&
                styles.titleActive,
            ]}
          >
            {isFavorited
              ? "Guardado en favoritos"
              : "Guardar publicación"}
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            {isFavorited
              ? "La vas a encontrar rápidamente en tus favoritos."
              : "Guardala para encontrarla fácilmente más tarde."}
          </Text>
        </View>

        <View
          style={[
            styles.actionPill,
            isFavorited &&
              styles.actionPillActive,
          ]}
        >
          <Text
            style={[
              styles.actionText,
              isFavorited &&
                styles.actionTextActive,
            ]}
          >
            {isFavorited
              ? "Guardado"
              : "Guardar"}
          </Text>
        </View>
      </Pressable>

      {error && (
        <View
          style={
            styles.errorBox
          }
        >
          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    button: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
    },

    buttonActive: {
      borderColor: "#FECACA",
      backgroundColor: "#FEF2F2",
    },

    buttonPressed: {
      opacity: 0.76,
      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    buttonDisabled: {
      opacity: 0.72,
    },

    iconShell: {
      width: 46,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 15,
      backgroundColor: "#FFF7ED",
    },

    iconShellActive: {
      backgroundColor: "#FEE2E2",
    },

    heart: {
      color: "#F97316",
      fontSize: 27,
      lineHeight: 30,
      fontWeight: "700",
    },

    heartActive: {
      color: "#EF4444",
    },

    copy: {
      flex: 1,
      minWidth: 0,
    },

    title: {
      color: "#0F172A",
      fontSize: 14,
      fontWeight: "900",
    },

    titleActive: {
      color: "#991B1B",
    },

    subtitle: {
      marginTop: 3,
      color: "#64748B",
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "600",
    },

    actionPill: {
      minWidth: 68,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 11,
      backgroundColor: "#F97316",
      paddingHorizontal: 10,
    },

    actionPillActive: {
      borderWidth: 1,
      borderColor: "#FECACA",
      backgroundColor: "#FFFFFF",
    },

    actionText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
    },

    actionTextActive: {
      color: "#DC2626",
    },

    errorBox: {
      marginTop: 8,
      borderRadius: 12,
      backgroundColor: "#FFF7ED",
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    errorText: {
      color: "#C2410C",
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700",
    },
  });
