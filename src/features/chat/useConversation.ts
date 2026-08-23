import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  ChatConversation,
  ChatMessage,
} from "./chatTypes";

import {
  getConversationById,
  markMessagesAsRead,
  sendChatMessage,
  setTypingStatus,
  subscribeToConversationMessages,
  subscribeToTypingStatus,
} from "./chatFirestoreService";

interface ConversationState {
  conversation:
    ChatConversation | null;
  messages: ChatMessage[];
  typingUsers: string[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (
    text: string,
  ) => Promise<void>;
  updateTyping: (
    isTyping: boolean,
  ) => Promise<void>;
}

export function useConversation(
  conversationId: string,
  userId: string | null,
  senderName: string,
): ConversationState {
  const normalizedConversationId =
    String(
      conversationId ?? "",
    ).trim();

  const [
    conversation,
    setConversation,
  ] = useState<
    ChatConversation | null
  >(null);

  const [
    messages,
    setMessages,
  ] = useState<
    ChatMessage[]
  >([]);

  const [
    typingUsers,
    setTypingUsers,
  ] = useState<
    string[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    Boolean(
      normalizedConversationId &&
        userId,
    ),
  );

  const [
    isSending,
    setIsSending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (
      !normalizedConversationId ||
      !userId
    ) {
      setConversation(null);
      setMessages([]);
      setTypingUsers([]);
      setIsLoading(false);
      setError(null);

      return;
    }

    let active = true;

    setIsLoading(true);
    setError(null);

    let unsubscribeMessages:
      | (() => void)
      | null = null;

    let unsubscribeTyping:
      | (() => void)
      | null = null;

    void (async () => {
      try {
        const nextConversation =
          await getConversationById(
            normalizedConversationId,
          );

        if (!active) {
          return;
        }

        if (
          !nextConversation
        ) {
          throw new Error(
            "La conversación ya no existe.",
          );
        }

        if (
          !nextConversation
            .participants
            .includes(
              userId,
            )
        ) {
          throw new Error(
            "No pertenecés a esta conversación.",
          );
        }

        setConversation(
          nextConversation,
        );

        unsubscribeMessages =
          subscribeToConversationMessages(
            normalizedConversationId,
            (
              nextMessages,
            ) => {
              if (!active) {
                return;
              }

              setMessages(
                nextMessages,
              );

              const hasUnread =
                nextMessages.some(
                  (message) =>
                    message.senderId !==
                      userId &&
                    !message.readBy.includes(
                      userId,
                    ),
                );

              if (hasUnread) {
                void markMessagesAsRead(
                  normalizedConversationId,
                  userId,
                ).catch(
                  (
                    readError,
                  ) => {
                    console.error(
                      "Error marcando mensajes como leídos:",
                      readError,
                    );
                  },
                );
              }
            },
            (
              messagesError,
            ) => {
              if (!active) {
                return;
              }

              setError(
                messagesError
                  .message
                  .trim()
                  ? messagesError.message
                  : "No pudimos cargar los mensajes.",
              );
            },
          );

        unsubscribeTyping =
          subscribeToTypingStatus(
            normalizedConversationId,
            (
              nextTypingUsers,
            ) => {
              if (!active) {
                return;
              }

              setTypingUsers(
                nextTypingUsers.filter(
                  (
                    typingUserId,
                  ) =>
                    typingUserId !==
                    userId,
                ),
              );
            },
            (
              typingError,
            ) => {
              console.error(
                "Error actualizando typing:",
                typingError,
              );
            },
          );
      } catch (
        loadError
      ) {
        if (!active) {
          return;
        }

        console.error(
          "Error cargando conversación:",
          loadError,
        );

        setError(
          loadError instanceof Error &&
            loadError.message.trim()
            ? loadError.message
            : "No pudimos cargar la conversación.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;

      unsubscribeMessages?.();
      unsubscribeTyping?.();

      void setTypingStatus(
        normalizedConversationId,
        userId,
        false,
      ).catch(() => {
        // La limpieza de typing no debe bloquear el desmontaje.
      });
    };
  }, [
    normalizedConversationId,
    userId,
  ]);

  const sendMessage =
    useCallback(
      async (
        text: string,
      ) => {
        if (
          !normalizedConversationId ||
          !userId ||
          isSending
        ) {
          return;
        }

        setIsSending(true);
        setError(null);

        try {
          await sendChatMessage({
            conversationId:
              normalizedConversationId,
            senderId:
              userId,
            senderName,
            text,
          });
        } catch (
          sendError
        ) {
          console.error(
            "Error enviando mensaje:",
            sendError,
          );

          const message =
            sendError instanceof Error &&
              sendError.message.trim()
              ? sendError.message
              : "No pudimos enviar el mensaje.";

          setError(
            message,
          );

          throw new Error(
            message,
          );
        } finally {
          setIsSending(false);
        }
      },
      [
        isSending,
        normalizedConversationId,
        senderName,
        userId,
      ],
    );

  const updateTyping =
    useCallback(
      async (
        isTyping: boolean,
      ) => {
        if (
          !normalizedConversationId ||
          !userId
        ) {
          return;
        }

        try {
          await setTypingStatus(
            normalizedConversationId,
            userId,
            isTyping,
          );
        } catch (
          typingError
        ) {
          console.error(
            "Error actualizando typing:",
            typingError,
          );
        }
      },
      [
        normalizedConversationId,
        userId,
      ],
    );

  return {
    conversation,
    messages,
    typingUsers,
    isLoading,
    isSending,
    error,
    sendMessage,
    updateTyping,
  };
}
