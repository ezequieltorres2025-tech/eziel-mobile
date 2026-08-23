import {
  SymbolView,
} from "expo-symbols";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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
  ChatMessage,
} from "@/features/chat/chatTypes";
import {
  useConversation,
} from "@/features/chat/useConversation";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

function getSenderName(
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
    "Usuario"
  );
}

function formatMessageTime(
  message: ChatMessage,
): string {
  const millis =
    getChatTimestampMillis(
      message.createdAt,
    );

  if (!millis) {
    return "";
  }

  return new Date(
    millis,
  ).toLocaleTimeString(
    "es-AR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export default function ChatScreen() {
  const params =
    useLocalSearchParams<{
      id?: string;
    }>();

  const conversationId =
    typeof params.id ===
    "string"
      ? params.id.trim()
      : "";

  const {
    user,
    isLoading:
      isAuthLoading,
  } = useAuth();

  const senderName =
    useMemo(
      () =>
        getSenderName(
          user?.displayName,
          user?.email,
        ),
      [
        user?.displayName,
        user?.email,
      ],
    );

  const {
    conversation,
    messages,
    typingUsers,
    isLoading,
    isSending,
    error,
    sendMessage,
    updateTyping,
  } = useConversation(
    conversationId,
    user?.uid ?? null,
    senderName,
  );

  const [
    text,
    setText,
  ] = useState("");

  const listRef =
    useRef<
      FlatList<ChatMessage>
    >(null);

  const typingTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const typingActiveRef =
    useRef(false);

  const otherName =
    useMemo(() => {
      if (
        !conversation ||
        !user
      ) {
        return "";
      }

      return conversation.buyerId ===
        user.uid
        ? conversation.sellerName ||
            "Vendedor"
        : conversation.buyerName ||
            "Comprador";
    }, [
      conversation,
      user,
    ]);

  useEffect(() => {
    return () => {
      if (
        typingTimerRef.current
      ) {
        clearTimeout(
          typingTimerRef.current,
        );
      }
    };
  }, []);

  const stopTyping =
    () => {
      if (
        typingTimerRef.current
      ) {
        clearTimeout(
          typingTimerRef.current,
        );

        typingTimerRef.current =
          null;
      }

      if (
        typingActiveRef.current
      ) {
        typingActiveRef.current =
          false;

        void updateTyping(
          false,
        );
      }
    };

  const handleChangeText =
    (
      nextText: string,
    ) => {
      setText(
        nextText,
      );

      if (
        !nextText.trim()
      ) {
        stopTyping();
        return;
      }

      if (
        !typingActiveRef.current
      ) {
        typingActiveRef.current =
          true;

        void updateTyping(
          true,
        );
      }

      if (
        typingTimerRef.current
      ) {
        clearTimeout(
          typingTimerRef.current,
        );
      }

      typingTimerRef.current =
        setTimeout(
          () => {
            typingActiveRef.current =
              false;

            void updateTyping(
              false,
            );
          },
          1200,
        );
    };

  const handleSend =
    async () => {
      const cleanText =
        text.trim();

      if (
        !cleanText ||
        isSending
      ) {
        return;
      }

      try {
        setText("");
        stopTyping();

        await sendMessage(
          cleanText,
        );
      } catch (
        sendError
      ) {
        setText(
          cleanText,
        );

        Alert.alert(
          "No pudimos enviar el mensaje",
          sendError instanceof Error &&
            sendError.message.trim()
            ? sendError.message
            : "Intentá nuevamente.",
        );
      }
    };

  const renderMessage =
    ({
      item,
    }: {
      item: ChatMessage;
    }) => {
      const isMine =
        item.senderId ===
        user?.uid;

      const isRead =
        isMine &&
        item.readBy.some(
          (
            readUserId,
          ) =>
            readUserId !==
            item.senderId,
        );

      return (
        <View
          style={[
            styles.messageRow,
            isMine
              ? styles.messageRowMine
              : styles.messageRowOther,
          ]}
        >
          <View
            style={[
              styles.bubble,
              isMine
                ? styles.bubbleMine
                : styles.bubbleOther,
            ]}
          >

            <Text
              style={[
                styles.messageText,
                isMine &&
                  styles.messageTextMine,
              ]}
            >
              {item.text}
            </Text>

            <View
              style={
                styles.messageMeta
              }
            >
              <Text
                style={[
                  styles.messageTime,
                  isMine &&
                    styles.messageTimeMine,
                ]}
              >
                {formatMessageTime(
                  item,
                )}
              </Text>

              {isMine && (
                <Text
                  style={
                    styles.readState
                  }
                >
                  {isRead
                    ? "✓✓"
                    : "✓"}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    };

  if (
    isAuthLoading ||
    (user &&
      isLoading)
  ) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
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
              styles.centerTitle
            }
          >
            Cargando conversación
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.centerState
          }
        >
          <Text
            style={
              styles.centerTitle
            }
          >
            Necesitás iniciar sesión
          </Text>

          <Text
            style={
              styles.centerText
            }
          >
            Volvé a Mensajes e ingresá con tu cuenta de Eziel.
          </Text>

          <Pressable
            onPress={() =>
              router.back()
            }
            style={
              styles.backStateButton
            }
          >
            <Text
              style={
                styles.backStateButtonText
              }
            >
              Volver
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error &&
    !conversation
  ) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.centerState
          }
        >
          <View
            style={
              styles.errorIcon
            }
          >
            <SymbolView
              name={{
                ios: "exclamationmark.triangle.fill",
                android:
                  "warning",
                web: "warning",
              }}
              size={30}
              tintColor={
                ORANGE
              }
            />
          </View>

          <Text
            style={
              styles.centerTitle
            }
          >
            No pudimos abrir el chat
          </Text>

          <Text
            style={
              styles.centerText
            }
          >
            {error}
          </Text>

          <Pressable
            onPress={() =>
              router.back()
            }
            style={
              styles.backStateButton
            }
          >
            <Text
              style={
                styles.backStateButtonText
              }
            >
              Volver
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={[
        "top",
        "bottom",
      ]}
      style={
        styles.safeArea
      }
    >
      <KeyboardAvoidingView
        style={
          styles.keyboardView
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={
            styles.header
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={10}
            onPress={() =>
              router.back()
            }
            style={({
              pressed,
            }) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios: "chevron.left",
                android:
                  "arrow_back",
                web: "arrow_back",
              }}
              size={23}
              tintColor={
                TEXT
              }
            />
          </Pressable>

          <View
            style={
              styles.headerCopy
            }
          >
            <Text
              numberOfLines={1}
              style={
                styles.headerName
              }
            >
              {otherName ||
                "Conversación"}
            </Text>

            <Text
              numberOfLines={1}
              style={
                styles.headerSubtitle
              }
            >
              {typingUsers.length >
              0
                ? `${otherName} está escribiendo…`
                : conversation?.listingTitle ||
                  "Eziel"}
            </Text>
          </View>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        {conversation && (
          <View
            style={
              styles.listingBar
            }
          >
            <View
              style={
                styles.listingImageShell
              }
            >
              {conversation.listingImageUrl ? (
                <Image
                  source={{
                    uri:
                      conversation.listingImageUrl,
                  }}
                  style={
                    styles.listingImage
                  }
                  resizeMode="cover"
                />
              ) : (
                <SymbolView
                  name={{
                    ios: "shippingbox.fill",
                    android:
                      "inventory_2",
                    web: "inventory_2",
                  }}
                  size={20}
                  tintColor={
                    ORANGE
                  }
                />
              )}
            </View>

            <View
              style={
                styles.listingCopy
              }
            >
              <Text
                style={
                  styles.listingEyebrow
                }
              >
                CONVERSACIÓN POR
              </Text>

              <Text
                numberOfLines={1}
                style={
                  styles.listingTitle
                }
              >
                {conversation.listingTitle}
              </Text>
            </View>
          </View>
        )}

        {error && (
          <View
            style={
              styles.inlineError
            }
          >
            <Text
              style={
                styles.inlineErrorText
              }
            >
              {error}
            </Text>
          </View>
        )}

        <FlatList
          ref={
            listRef
          }
          data={
            messages
          }
          keyExtractor={(
            item,
          ) => item.id}
          renderItem={
            renderMessage
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            messages.length >
            0
              ? styles.messagesContent
              : styles.emptyMessagesContent
          }
          onContentSizeChange={() => {
            listRef.current?.scrollToEnd(
              {
                animated: true,
              },
            );
          }}
          ListEmptyComponent={
            <View
              style={
                styles.emptyConversation
              }
            >
              <View
                style={
                  styles.emptyConversationIcon
                }
              >
                <SymbolView
                  name={{
                    ios: "message.fill",
                    android:
                      "chat",
                    web: "chat",
                  }}
                  size={29}
                  tintColor={
                    ORANGE
                  }
                />
              </View>

              <Text
                style={
                  styles.emptyConversationTitle
                }
              >
                Empezá la conversación
              </Text>

              <Text
                style={
                  styles.emptyConversationText
                }
              >
                Consultá por disponibilidad, estado del producto o forma de entrega.
              </Text>
            </View>
          }
        />

        {typingUsers.length >
          0 && (
          <View
            style={
              styles.typingBar
            }
          >
            <View
              style={
                styles.typingDot
              }
            />

            <Text
              style={
                styles.typingText
              }
            >
              {otherName} está escribiendo…
            </Text>
          </View>
        )}

        <View
          style={
            styles.composer
          }
        >
          <View
            style={
              styles.inputShell
            }
          >
            <TextInput
              value={text}
              onChangeText={
                handleChangeText
              }
              placeholder="Escribí un mensaje…"
              placeholderTextColor={
                "#94A3B8"
              }
              multiline
              maxLength={5000}
              editable={
                !isSending
              }
              style={
                styles.input
              }
              accessibilityLabel="Mensaje"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            accessibilityState={{
              disabled:
                !text.trim() ||
                isSending,
              busy:
                isSending,
            }}
            disabled={
              !text.trim() ||
              isSending
            }
            onPress={() => {
              void handleSend();
            }}
            style={({
              pressed,
            }) => [
              styles.sendButton,
              pressed &&
                text.trim() &&
                !isSending &&
                styles.sendButtonPressed,
              (!text.trim() ||
                isSending) &&
                styles.sendButtonDisabled,
            ]}
          >
            {isSending ? (
              <ActivityIndicator
                size="small"
                color={
                  SURFACE
                }
              />
            ) : (
              <SymbolView
                name={{
                  ios: "arrow.up",
                  android:
                    "arrow_upward",
                  web: "arrow_upward",
                }}
                size={21}
                tintColor={
                  SURFACE
                }
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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

    keyboardView: {
      flex: 1,
    },

    header: {
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
      backgroundColor:
        SURFACE,
    },

    backButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        BACKGROUND,
    },

    headerCopy: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      paddingHorizontal: 10,
    },

    headerName: {
      maxWidth: "100%",
      color: TEXT,
      fontSize: 15,
      fontWeight: "900",
    },

    headerSubtitle: {
      maxWidth: "100%",
      marginTop: 2,
      color: MUTED,
      fontSize: 9,
      fontWeight: "600",
    },

    headerSpacer: {
      width: 44,
    },

    listingBar: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
      backgroundColor:
        SURFACE,
    },

    listingImageShell: {
      width: 44,
      height: 44,
      overflow: "hidden",
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 13,
      backgroundColor:
        ORANGE_SOFT,
    },

    listingImage: {
      width: "100%",
      height: "100%",
    },

    listingCopy: {
      flex: 1,
      minWidth: 0,
    },

    listingEyebrow: {
      color: ORANGE,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    listingTitle: {
      marginTop: 3,
      color: TEXT,
      fontSize: 12,
      fontWeight: "800",
    },

    inlineError: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      backgroundColor:
        ORANGE_SOFT,
    },

    inlineErrorText: {
      color: ORANGE_DARK,
      fontSize: 10,
      lineHeight: 15,
      textAlign: "center",
      fontWeight: "700",
    },

    messagesContent: {
      paddingHorizontal: 15,
      paddingTop: 16,
      paddingBottom: 20,
      gap: 8,
    },

    emptyMessagesContent: {
      flexGrow: 1,
    },

    messageRow: {
      width: "100%",
      flexDirection: "row",
    },

    messageRowMine: {
      justifyContent:
        "flex-end",
    },

    messageRowOther: {
      justifyContent:
        "flex-start",
    },

    bubble: {
      maxWidth: "82%",
      paddingHorizontal: 13,
      paddingTop: 10,
      paddingBottom: 7,
      borderRadius: 18,
    },

    bubbleMine: {
      borderBottomRightRadius: 6,
      backgroundColor:
        ORANGE,
    },

    bubbleOther: {
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        SURFACE,
    },


    messageText: {
      color: TEXT,
      fontSize: 13,
      lineHeight: 19,
    },

    messageTextMine: {
      color: SURFACE,
    },

    messageMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "flex-end",
      gap: 5,
      marginTop: 5,
    },

    messageTime: {
      color: MUTED,
      fontSize: 8,
      fontWeight: "600",
    },

    messageTimeMine: {
      color:
        "rgba(255,255,255,0.76)",
    },

    readState: {
      color:
        "rgba(255,255,255,0.9)",
      fontSize: 9,
      fontWeight: "900",
    },

    typingBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 18,
      paddingVertical: 7,
    },

    typingDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor:
        ORANGE,
    },

    typingText: {
      color: MUTED,
      fontSize: 10,
      fontStyle: "italic",
    },

    composer: {
      flexDirection: "row",
      alignItems:
        "flex-end",
      gap: 9,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor:
        BORDER,
      backgroundColor:
        SURFACE,
    },

    inputShell: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      justifyContent:
        "center",
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        BACKGROUND,
    },

    input: {
      minHeight: 46,
      maxHeight: 112,
      paddingVertical: 11,
      color: TEXT,
      fontSize: 13,
      lineHeight: 18,
      textAlignVertical:
        "center",
    },

    sendButton: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 16,
      backgroundColor:
        ORANGE,
    },

    sendButtonPressed: {
      backgroundColor:
        ORANGE_DARK,
    },

    sendButtonDisabled: {
      opacity: 0.42,
    },

    emptyConversation: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 34,
    },

    emptyConversationIcon: {
      width: 64,
      height: 64,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 21,
      backgroundColor:
        ORANGE_SOFT,
    },

    emptyConversationTitle: {
      marginTop: 17,
      color: TEXT,
      fontSize: 18,
      fontWeight: "900",
    },

    emptyConversationText: {
      maxWidth: 300,
      marginTop: 7,
      color: MUTED,
      fontSize: 11,
      lineHeight: 18,
      textAlign: "center",
    },

    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 32,
    },

    centerTitle: {
      marginTop: 17,
      color: TEXT,
      fontSize: 19,
      fontWeight: "900",
      textAlign: "center",
    },

    centerText: {
      maxWidth: 310,
      marginTop: 8,
      color: MUTED,
      fontSize: 12,
      lineHeight: 19,
      textAlign: "center",
    },

    errorIcon: {
      width: 66,
      height: 66,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 22,
      backgroundColor:
        ORANGE_SOFT,
    },

    backStateButton: {
      minHeight: 47,
      justifyContent:
        "center",
      marginTop: 21,
      paddingHorizontal: 24,
      borderRadius: 14,
      backgroundColor:
        ORANGE,
    },

    backStateButtonText: {
      color: SURFACE,
      fontSize: 12,
      fontWeight: "900",
    },

    pressed: {
      opacity: 0.68,
    },
  });
