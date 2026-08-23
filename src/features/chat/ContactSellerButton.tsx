import {
  SymbolView,
} from "expo-symbols";
import {
  router,
} from "expo-router";
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
import type {
  ExploreListing,
} from "@/features/explore/exploreTypes";
import {
  auth,
} from "@/lib/firebase";

import {
  createOrGetConversation,
} from "./chatFirestoreService";

interface ContactSellerButtonProps {
  listing: ExploreListing;
  sellerName: string;
}

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

function getUserName(
  displayName:
    | string
    | null
    | undefined,
  email:
    | string
    | null
    | undefined,
): string {
  return (
    displayName?.trim() ||
    email?.trim() ||
    "Comprador"
  );
}

export function ContactSellerButton({
  listing,
  sellerName,
}: ContactSellerButtonProps) {
  const {
    user,
    loginWithGoogle,
  } = useAuth();

  const [
    isStarting,
    setIsStarting,
  ] = useState(false);

  const isOwnListing =
    Boolean(
      user?.uid &&
        user.uid ===
          listing.userId,
    );

  const handlePress =
    async () => {
      if (isStarting) {
        return;
      }

      if (isOwnListing) {
        return;
      }

      try {
        setIsStarting(true);

        let buyer =
          auth.currentUser;

        if (!buyer) {
          const result =
            await loginWithGoogle();

          if (
            result ===
            "cancelled"
          ) {
            return;
          }

          buyer =
            auth.currentUser;
        }

        if (!buyer) {
          throw new Error(
            "No pudimos recuperar tu sesión.",
          );
        }

        if (
          buyer.uid ===
          listing.userId
        ) {
          Alert.alert(
            "Esta es tu publicación",
            "No podés iniciar una conversación con vos mismo.",
          );

          return;
        }

        const conversationId =
          await createOrGetConversation(
            {
              listingId:
                listing.id,
              listingTitle:
                listing.title,
              listingImageUrl:
                listing.imageUrl ||
                listing.imageUrls[0] ||
                "",
              buyerId:
                buyer.uid,
              buyerName:
                getUserName(
                  buyer.displayName,
                  buyer.email,
                ),
              sellerId:
                listing.userId,
              sellerName:
                sellerName.trim() ||
                listing.userName ||
                "Vendedor",
            },
          );

        router.push({
          pathname:
            "/chat/[id]",
          params: {
            id:
              conversationId,
          },
        });
      } catch (
        startError
      ) {
        console.error(
          "Error iniciando conversación:",
          startError,
        );

        Alert.alert(
          "No pudimos abrir el chat",
          startError instanceof Error &&
            startError.message.trim()
            ? startError.message
            : "Intentá nuevamente en unos segundos.",
        );
      } finally {
        setIsStarting(false);
      }
    };

  if (isOwnListing) {
    return (
      <View
        style={
          styles.ownerNotice
        }
      >
        <SymbolView
          name={{
            ios: "person.crop.circle.badge.checkmark",
            android:
              "verified_user",
            web: "verified_user",
          }}
          size={18}
          tintColor={
            ORANGE_DARK
          }
        />

        <Text
          style={
            styles.ownerNoticeText
          }
        >
          Esta publicación es tuya.
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Contactar al vendedor"
      accessibilityState={{
        disabled:
          isStarting,
        busy:
          isStarting,
      }}
      disabled={
        isStarting
      }
      onPress={() => {
        void handlePress();
      }}
      style={({
        pressed,
      }) => [
        styles.button,
        pressed &&
          !isStarting &&
          styles.buttonPressed,
        isStarting &&
          styles.buttonDisabled,
      ]}
    >
      <View
        style={
          styles.iconShell
        }
      >
        {isStarting ? (
          <ActivityIndicator
            size="small"
            color={ORANGE}
          />
        ) : (
          <SymbolView
            name={{
              ios: "message.fill",
              android:
                "chat",
              web: "chat",
            }}
            size={19}
            tintColor={
              ORANGE
            }
          />
        )}
      </View>

      <View
        style={
          styles.copy
        }
      >
        <Text
          style={
            styles.title
          }
        >
          {isStarting
            ? "Abriendo conversación"
            : "Contactar vendedor"}
        </Text>

        <Text
          style={
            styles.description
          }
        >
          Consultá directamente por esta publicación.
        </Text>
      </View>

      {!isStarting && (
        <SymbolView
          name={{
            ios: "chevron.right",
            android:
              "navigate_next",
            web: "chevron_right",
          }}
          size={21}
          tintColor={
            MUTED
          }
        />
      )}
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    button: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 18,
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        "#FAFAFA",
    },

    buttonPressed: {
      backgroundColor:
        ORANGE_SOFT,
    },

    buttonDisabled: {
      opacity: 0.7,
    },

    iconShell: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 14,
      backgroundColor:
        ORANGE_SOFT,
    },

    copy: {
      flex: 1,
    },

    title: {
      color: TEXT,
      fontSize: 13,
      fontWeight: "900",
    },

    description: {
      marginTop: 3,
      color: MUTED,
      fontSize: 10,
      lineHeight: 15,
    },

    ownerNotice: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: 18,
      paddingHorizontal: 13,
      borderRadius: 15,
      backgroundColor:
        ORANGE_SOFT,
    },

    ownerNoticeText: {
      flex: 1,
      color: ORANGE_DARK,
      fontSize: 11,
      fontWeight: "800",
    },
  });
