import {
  useEffect,
  useState,
} from "react";

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
    conversations,
    setConversations,
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
      setConversations([]);
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
          setConversations(
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

  return {
    conversations,
    isLoading,
    error,
  };
}
