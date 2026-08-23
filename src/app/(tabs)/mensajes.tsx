import {
  SymbolView,
} from "expo-symbols";
import {
  router,
} from "expo-router";
import {
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useAuth,
} from "@/features/auth/AuthProvider";
import {
  getChatTimestampMillis,
} from "@/features/chat/chatFirestoreService";
import type {
  ChatConversation,
} from "@/features/chat/chatTypes";
import {
  useUserConversations,
} from "@/features/chat/useUserConversations";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const RED = "#EF4444";

function getOtherName(
  conversation:
    ChatConversation,
  userId: string,
): string {
  if (
    conversation.buyerId ===
    userId
  ) {
    return (
      conversation.sellerName ||
      "Vendedor"
    );
  }

  return (
    conversation.buyerName ||
    "Comprador"
  );
}

function getInitials(
  value: string,
): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0),
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatConversationTime(
  conversation:
    ChatConversation,
): string {
  const millis =
    getChatTimestampMillis(
      conversation.lastMessageAt,
    );

  if (!millis) {
    return "";
  }

  const date =
    new Date(millis);

  const now =
    new Date();

  const sameDay =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(
      "es-AR",
      {
        hour: "2-digit",
        minute:
          "2-digit",
      },
    );
  }

  return date.toLocaleDateString(
    "es-AR",
    {
      day: "2-digit",
      month:
        "2-digit",
    },
  );
}

export default function MessagesScreen() {
  const {
    user,
    isLoading:
      isAuthLoading,
    loginWithGoogle,
  } = useAuth();

  const [
    isSigningIn,
    setIsSigningIn,
  ] = useState(false);

  const {
    conversations,
    isLoading,
    error,
  } = useUserConversations(
    user?.uid ?? null,
  );

  const unreadTotal =
    useMemo(
      () =>
        conversations.reduce(
          (
            total,
            conversation,
          ) =>
            total +
            conversation.unreadCount,
          0,
        ),
      [
        conversations,
      ],
    );

  const handleLogin =
    async () => {
      if (isSigningIn) {
        return;
      }

      try {
        setIsSigningIn(true);

        await loginWithGoogle();
      } catch {
        Alert.alert(
          "No pudimos iniciar sesión",
          "No fue posible ingresar con Google. Intentá nuevamente.",
        );
      } finally {
        setIsSigningIn(false);
      }
    };

  const renderConversation =
    ({
      item,
    }: {
      item:
        ChatConversation;
    }) => {
      if (!user) {
        return null;
      }

      const otherName =
        getOtherName(
          item,
          user.uid,
        );

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir conversación con ${otherName}`}
          onPress={() =>
            router.push({
              pathname:
                "/chat/[id]",
              params: {
                id:
                  item.id,
              },
            })
          }
          style={({
            pressed,
          }) => [
            styles.conversationCard,
            pressed &&
              styles.pressed,
          ]}
        >
          <View
            style={
              styles.avatarShell
            }
          >
            {item.listingImageUrl ? (
              <Image
                source={{
                  uri:
                    item.listingImageUrl,
                }}
                style={
                  styles.avatarImage
                }
                resizeMode="cover"
                accessibilityLabel={`Publicación ${item.listingTitle}`}
              />
            ) : (
              <Text
                style={
                  styles.avatarInitials
                }
              >
                {getInitials(
                  otherName,
                ) ||
                  "EZ"}
              </Text>
            )}
          </View>

          <View
            style={
              styles.conversationCopy
            }
          >
            <View
              style={
                styles.conversationTop
              }
            >
              <Text
                numberOfLines={1}
                style={
                  styles.otherName
                }
              >
                {otherName}
              </Text>

              <Text
                style={
                  styles.time
                }
              >
                {formatConversationTime(
                  item,
                )}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={
                styles.listingTitle
              }
            >
              {item.listingTitle}
            </Text>

            <View
              style={
                styles.messageRow
              }
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.lastMessage,
                  item.unreadCount >
                    0 &&
                    styles.lastMessageUnread,
                ]}
              >
                {item.lastMessage ||
                  "Conversación iniciada"}
              </Text>

              {item.unreadCount >
                0 && (
                <View
                  style={
                    styles.unreadBadge
                  }
                >
                  <Text
                    style={
                      styles.unreadBadgeText
                    }
                  >
                    {item.unreadCount >
                    99
                      ? "99+"
                      : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <SymbolView
            name={{
              ios: "chevron.right",
              android:
                "navigate_next",
              web: "chevron_right",
            }}
            size={20}
            tintColor={
              MUTED
            }
          />
        </Pressable>
      );
    };

  return (
    <SafeAreaView
      edges={[
        "top",
      ]}
      style={
        styles.safeArea
      }
    >
      <View
        style={
          styles.header
        }
      >
        <View>
          <Text
            style={
              styles.brand
            }
          >
            EZIEL
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Mensajes
          </Text>

          <Text
            style={
              styles.description
            }
          >
            Conversaciones sobre tus compras y publicaciones.
          </Text>
        </View>

        {user &&
          unreadTotal >
            0 && (
            <View
              style={
                styles.headerBadge
              }
            >
              <Text
                style={
                  styles.headerBadgeText
                }
              >
                {unreadTotal >
                99
                  ? "99+"
                  : unreadTotal}
              </Text>
            </View>
          )}
      </View>

      {isAuthLoading ? (
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color={ORANGE}
          />

          <Text
            style={
              styles.stateTitle
            }
          >
            Cargando tu cuenta
          </Text>
        </View>
      ) : !user ? (
        <View
          style={
            styles.centerState
          }
        >
          <View
            style={
              styles.stateIcon
            }
          >
            <SymbolView
              name={{
                ios: "message.fill",
                android:
                  "chat",
                web: "chat",
              }}
              size={34}
              tintColor={
                ORANGE
              }
            />
          </View>

          <Text
            style={
              styles.stateTitle
            }
          >
            Tus conversaciones
          </Text>

          <Text
            style={
              styles.stateText
            }
          >
            Ingresá para consultar vendedores y responder mensajes.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ingresar con Google"
            disabled={
              isSigningIn
            }
            onPress={() => {
              void handleLogin();
            }}
            style={({
              pressed,
            }) => [
              styles.loginButton,
              pressed &&
                !isSigningIn &&
                styles.pressed,
              isSigningIn &&
                styles.disabled,
            ]}
          >
            {isSigningIn ? (
              <ActivityIndicator
                size="small"
                color={
                  SURFACE
                }
              />
            ) : (
              <Text
                style={
                  styles.loginButtonText
                }
              >
                Ingresar con Google
              </Text>
            )}
          </Pressable>
        </View>
      ) : isLoading ? (
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color={ORANGE}
          />

          <Text
            style={
              styles.stateTitle
            }
          >
            Cargando mensajes
          </Text>
        </View>
      ) : (
        <FlatList
          data={
            conversations
          }
          keyExtractor={(
            item,
          ) => item.id}
          renderItem={
            renderConversation
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            conversations.length >
            0
              ? styles.listContent
              : styles.emptyListContent
          }
          ListHeaderComponent={
            error ? (
              <View
                style={
                  styles.errorCard
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
            ) : null
          }
          ListEmptyComponent={
            <View
              style={
                styles.emptyCard
              }
            >
              <View
                style={
                  styles.stateIcon
                }
              >
                <SymbolView
                  name={{
                    ios: "bubble.left.and.bubble.right",
                    android:
                      "forum",
                    web: "forum",
                  }}
                  size={34}
                  tintColor={
                    ORANGE
                  }
                />
              </View>

              <Text
                style={
                  styles.stateTitle
                }
              >
                Todavía no tenés conversaciones
              </Text>

              <Text
                style={
                  styles.stateText
                }
              >
                Abrí una publicación y tocá Contactar vendedor para empezar.
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ir a Explorar"
                onPress={() =>
                  router.push(
                    "/explorar",
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.exploreButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.exploreButtonText
                  }
                >
                  Explorar publicaciones
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
    },

    header: {
      minHeight: 130,
      flexDirection: "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
      paddingHorizontal: 22,
      paddingTop: 20,
      paddingBottom: 19,
      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
      backgroundColor:
        SURFACE,
    },

    brand: {
      color: ORANGE,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 2,
    },

    title: {
      marginTop: 7,
      color: TEXT,
      fontSize: 28,
      fontWeight: "900",
      letterSpacing: -0.7,
    },

    description: {
      maxWidth: 300,
      marginTop: 5,
      color: MUTED,
      fontSize: 11,
      lineHeight: 16,
    },

    headerBadge: {
      minWidth: 31,
      height: 31,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 8,
      marginBottom: 4,
      borderRadius: 999,
      backgroundColor:
        RED,
    },

    headerBadgeText: {
      color: SURFACE,
      fontSize: 11,
      fontWeight: "900",
    },

    listContent: {
      padding: 16,
      gap: 10,
      paddingBottom: 32,
    },

    emptyListContent: {
      flexGrow: 1,
      padding: 18,
    },

    conversationCard: {
      minHeight: 94,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 13,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        SURFACE,
    },

    avatarShell: {
      width: 64,
      height: 64,
      overflow: "hidden",
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 19,
      backgroundColor:
        ORANGE_SOFT,
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarInitials: {
      color: ORANGE_DARK,
      fontSize: 18,
      fontWeight: "900",
    },

    conversationCopy: {
      flex: 1,
      minWidth: 0,
    },

    conversationTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    otherName: {
      flex: 1,
      color: TEXT,
      fontSize: 14,
      fontWeight: "900",
    },

    time: {
      color: MUTED,
      fontSize: 9,
      fontWeight: "700",
    },

    listingTitle: {
      marginTop: 4,
      color: ORANGE_DARK,
      fontSize: 10,
      fontWeight: "800",
    },

    messageRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
    },

    lastMessage: {
      flex: 1,
      color: MUTED,
      fontSize: 11,
    },

    lastMessageUnread: {
      color: TEXT,
      fontWeight: "800",
    },

    unreadBadge: {
      minWidth: 22,
      height: 22,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 6,
      borderRadius: 999,
      backgroundColor:
        ORANGE,
    },

    unreadBadgeText: {
      color: SURFACE,
      fontSize: 9,
      fontWeight: "900",
    },

    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 32,
    },

    emptyCard: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 26,
    },

    stateIcon: {
      width: 72,
      height: 72,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 24,
      backgroundColor:
        ORANGE_SOFT,
    },

    stateTitle: {
      marginTop: 18,
      color: TEXT,
      fontSize: 19,
      fontWeight: "900",
      textAlign: "center",
    },

    stateText: {
      maxWidth: 310,
      marginTop: 8,
      color: MUTED,
      fontSize: 12,
      lineHeight: 19,
      textAlign: "center",
    },

    loginButton: {
      minHeight: 50,
      justifyContent:
        "center",
      marginTop: 22,
      paddingHorizontal: 25,
      borderRadius: 15,
      backgroundColor:
        ORANGE,
    },

    loginButtonText: {
      color: SURFACE,
      fontSize: 13,
      fontWeight: "900",
    },

    exploreButton: {
      minHeight: 47,
      justifyContent:
        "center",
      marginTop: 22,
      paddingHorizontal: 22,
      borderRadius: 14,
      backgroundColor:
        ORANGE,
    },

    exploreButtonText: {
      color: SURFACE,
      fontSize: 12,
      fontWeight: "900",
    },

    errorCard: {
      padding: 13,
      marginBottom: 10,
      borderRadius: 15,
      backgroundColor:
        ORANGE_SOFT,
    },

    errorText: {
      color: ORANGE_DARK,
      fontSize: 11,
      lineHeight: 17,
      fontWeight: "700",
    },

    pressed: {
      opacity: 0.7,
    },

    disabled: {
      opacity: 0.55,
    },
  });
