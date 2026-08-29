import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useUserProfiles,
} from "@/features/auth/useUserProfiles";

import type {
  ChatConversation,
} from "./chatTypes";

import {
  subscribeToUserConversations,
} from "./chatFirestoreService";

interface UserConversationsState {
  conversations:
    ChatConversation[];
  isLoading: boolean;
  error: string | null;
}

export function useUserConversations(
  userId: string | null,
): UserConversationsState {
  const [
    conversationSnapshots,
    setConversationSnapshots,
  ] = useState<
    ChatConversation[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    Boolean(userId),
  );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!userId) {
      setConversationSnapshots(
        [],
      );

      setIsLoading(false);
      setError(null);

      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe =
      subscribeToUserConversations(
        userId,
        (
          nextConversations,
        ) => {
          setConversationSnapshots(
            nextConversations,
          );

          setIsLoading(false);
          setError(null);
        },
        (
          subscriptionError,
        ) => {
          setIsLoading(false);

          setError(
            subscriptionError
              .message
              .trim()
              ? subscriptionError.message
              : "No pudimos cargar tus conversaciones.",
          );
        },
      );

    return unsubscribe;
  }, [
    userId,
  ]);

  const participantIds =
    useMemo(
      () =>
        Array.from(
          new Set(
            conversationSnapshots
              .flatMap(
                (
                  conversation,
                ) => [
                  conversation.buyerId,
                  conversation.sellerId,
                ],
              )
              .map((id) =>
                id.trim(),
              )
              .filter(Boolean),
          ),
        ),
      [
        conversationSnapshots,
      ],
    );

  const {
    profilesById,
  } = useUserProfiles(
    participantIds,
  );

  const conversations =
    useMemo(
      () =>
        conversationSnapshots.map(
          (
            conversation,
          ) => {
            const buyerProfile =
              profilesById[
                conversation.buyerId
              ];

            const sellerProfile =
              profilesById[
                conversation.sellerId
              ];

            return {
              ...conversation,

              buyerName:
                buyerProfile
                  ?.displayName
                  ?.trim() ||
                conversation.buyerName,

              sellerName:
                sellerProfile
                  ?.displayName
                  ?.trim() ||
                conversation.sellerName,
            };
          },
        ),
      [
        conversationSnapshots,
        profilesById,
      ],
    );

  return {
    conversations,
    isLoading,
    error,
  };
}
