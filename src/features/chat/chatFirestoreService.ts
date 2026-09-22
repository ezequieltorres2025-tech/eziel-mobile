import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase";

import type {
  ChatConversation,
  ChatMessage,
  ChatTimestamp,
  CreateConversationParams,
  ListingBuyerCandidate,
  SendChatMessageParams,
} from "./chatTypes";

type FirestoreData =
  Record<string, unknown>;

type Unsubscribe =
  () => void;

function normalizeRequiredId(
  value: string,
  fieldName: string,
): string {
  const normalized =
    String(value ?? "").trim();

  if (!normalized) {
    throw new Error(
      `Falta ${fieldName}.`,
    );
  }

  if (normalized.includes("/")) {
    throw new Error(
      `${fieldName} no es válido.`,
    );
  }

  return normalized;
}

function normalizeText(
  value: unknown,
  fallback = "",
): string {
  const normalized =
    String(value ?? "").trim();

  return normalized || fallback;
}

function normalizeStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((entry) =>
          String(entry ?? "").trim(),
        )
        .filter(Boolean),
    ),
  );
}

function normalizeTimestamp(
  value: unknown,
): ChatTimestamp | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  return value as ChatTimestamp;
}

export function getChatTimestampMillis(
  value:
    | ChatTimestamp
    | null
    | undefined,
): number {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis ===
    "function"
  ) {
    try {
      const millis =
        value.toMillis();

      return Number.isFinite(millis)
        ? millis
        : 0;
    } catch {
      return 0;
    }
  }

  if (
    typeof value.seconds ===
      "number" &&
    Number.isFinite(
      value.seconds,
    )
  ) {
    return value.seconds * 1000;
  }

  return 0;
}

function assertCurrentUser(
  userId: string,
): void {
  const normalizedUserId =
    normalizeRequiredId(
      userId,
      "el usuario",
    );

  if (
    auth.currentUser?.uid !==
    normalizedUserId
  ) {
    throw new Error(
      "La sesión actual no coincide con el usuario.",
    );
  }
}

function mapConversation(
  id: string,
  data: FirestoreData,
  unreadCount = 0,
): ChatConversation {
  return {
    id,
    listingId:
      normalizeText(
        data.listingId,
      ),
    listingTitle:
      normalizeText(
        data.listingTitle,
        "Publicación",
      ),
    listingImageUrl:
      normalizeText(
        data.listingImageUrl,
      ),
    buyerId:
      normalizeText(
        data.buyerId,
      ),
    buyerName:
      normalizeText(
        data.buyerName,
        "Comprador",
      ),
    sellerId:
      normalizeText(
        data.sellerId,
      ),
    sellerName:
      normalizeText(
        data.sellerName,
        "Vendedor",
      ),
    participants:
      normalizeStringArray(
        data.participants,
      ),
    lastMessage:
      normalizeText(
        data.lastMessage,
      ),
    lastMessageAt:
      normalizeTimestamp(
        data.lastMessageAt,
      ),
    createdAt:
      normalizeTimestamp(
        data.createdAt,
      ),
    updatedAt:
      normalizeTimestamp(
        data.updatedAt,
      ),
    unreadCount:
      Math.max(
        0,
        Math.floor(
          Number(
            unreadCount ?? 0,
          ),
        ),
      ),
  };
}

function mapMessage(
  id: string,
  conversationId: string,
  data: FirestoreData,
): ChatMessage {
  return {
    id,
    conversationId:
      normalizeText(
        data.conversationId,
        conversationId,
      ),
    senderId:
      normalizeText(
        data.senderId,
      ),
    senderName:
      normalizeText(
        data.senderName,
        "Usuario",
      ),
    text:
      normalizeText(
        data.text,
      ),
    createdAt:
      normalizeTimestamp(
        data.createdAt,
      ),
    readBy:
      normalizeStringArray(
        data.readBy,
      ),
  };
}

function sortConversationsByNewest(
  conversations:
    ChatConversation[],
): ChatConversation[] {
  return [
    ...conversations,
  ].sort(
    (
      conversationA,
      conversationB,
    ) =>
      getChatTimestampMillis(
        conversationB.lastMessageAt,
      ) -
      getChatTimestampMillis(
        conversationA.lastMessageAt,
      ),
  );
}

function mapBuyerCandidate(
  conversation: ChatConversation,
): ListingBuyerCandidate {
  return {
    buyerId:
      conversation.buyerId,

    buyerName:
      conversation.buyerName ||
      "Comprador",

    conversationId:
      conversation.id,

    listingId:
      conversation.listingId,

    listingTitle:
      conversation.listingTitle ||
      "Publicación",

    listingImageUrl:
      conversation.listingImageUrl,

    lastMessage:
      conversation.lastMessage,

    lastMessageAt:
      conversation.lastMessageAt,

    createdAt:
      conversation.createdAt,

    updatedAt:
      conversation.updatedAt,
  };
}

export async function getListingBuyerCandidates(
  listingId: string,
  sellerId: string,
): Promise<ListingBuyerCandidate[]> {
  const normalizedListingId =
    normalizeRequiredId(
      listingId,
      "la publicación",
    );

  const normalizedSellerId =
    normalizeRequiredId(
      sellerId,
      "el vendedor",
    );

  assertCurrentUser(
    normalizedSellerId,
  );

  const conversationsQuery =
    query(
      collection(
        db,
        "conversations",
      ),
      where(
        "participants",
        "array-contains",
        normalizedSellerId,
      ),
    );

  const snapshot =
    await getDocs(
      conversationsQuery,
    );

  const conversations =
    snapshot.docs
      .map((conversationDoc) =>
        mapConversation(
          conversationDoc.id,
          conversationDoc.data() as
            FirestoreData,
        ),
      )
      .filter(
        (conversation) =>
          conversation.listingId ===
            normalizedListingId &&
          conversation.sellerId ===
            normalizedSellerId &&
          Boolean(
            conversation.buyerId,
          ) &&
          conversation.buyerId !==
            normalizedSellerId &&
          conversation.participants.includes(
            normalizedSellerId,
          ) &&
          conversation.participants.includes(
            conversation.buyerId,
          ),
      );

  const sortedConversations =
    sortConversationsByNewest(
      conversations,
    );

  const candidatesByBuyerId =
    new Map<
      string,
      ListingBuyerCandidate
    >();

  sortedConversations.forEach(
    (conversation) => {
      if (
        candidatesByBuyerId.has(
          conversation.buyerId,
        )
      ) {
        return;
      }

      candidatesByBuyerId.set(
        conversation.buyerId,
        mapBuyerCandidate(
          conversation,
        ),
      );
    },
  );

  return Array.from(
    candidatesByBuyerId.values(),
  );
}
export async function createOrGetConversation(
  params: CreateConversationParams,
): Promise<string> {
  const listingId =
    normalizeRequiredId(
      params.listingId,
      "la publicación",
    );

  const buyerId =
    normalizeRequiredId(
      params.buyerId,
      "el comprador",
    );

  const sellerId =
    normalizeRequiredId(
      params.sellerId,
      "el vendedor",
    );

  assertCurrentUser(
    buyerId,
  );

  if (buyerId === sellerId) {
    throw new Error(
      "No podés iniciar una conversación con vos mismo.",
    );
  }

  const listingTitle =
    normalizeText(
      params.listingTitle,
      "Publicación",
    );

  const listingImageUrl =
    normalizeText(
      params.listingImageUrl,
    );

  const buyerName =
    normalizeText(
      params.buyerName,
      "Comprador",
    ).slice(
      0,
      100,
    );

  const sellerName =
    normalizeText(
      params.sellerName,
      "Vendedor",
    ).slice(
      0,
      100,
    );

  const conversationsRef =
    collection(
      db,
      "conversations",
    );

  const conversationsQuery =
    query(
      conversationsRef,
      where(
        "participants",
        "array-contains",
        buyerId,
      ),
    );

  const querySnapshot =
    await getDocs(
      conversationsQuery,
    );

  const existingConversation =
    querySnapshot.docs.find(
      (conversationDoc) => {
        const data =
          conversationDoc.data() as
            FirestoreData;

        return (
          normalizeText(
            data.listingId,
          ) === listingId &&
          normalizeText(
            data.buyerId,
          ) === buyerId &&
          normalizeText(
            data.sellerId,
          ) === sellerId
        );
      },
    );

  if (
    existingConversation
  ) {
    return existingConversation.id;
  }

  const now =
    serverTimestamp();

  const conversationRef =
    await addDoc(
      conversationsRef,
      {
        listingId,
        listingTitle,
        listingImageUrl,
        buyerId,
        buyerName,
        sellerId,
        sellerName,
        participants: [
          buyerId,
          sellerId,
        ],
        lastMessage: "",
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      },
    );

  return conversationRef.id;
}

export async function getConversationById(
  conversationId: string,
): Promise<ChatConversation | null> {
  const normalizedConversationId =
    String(
      conversationId ?? "",
    ).trim();

  if (
    !normalizedConversationId
  ) {
    return null;
  }

  const snapshot =
    await getDoc(
      doc(
        db,
        "conversations",
        normalizedConversationId,
      ),
    );

  if (!snapshot.exists()) {
    return null;
  }

  return mapConversation(
    snapshot.id,
    snapshot.data() as FirestoreData,
  );
}

export function subscribeToUserConversations(
  userId: string,
  onChange: (
    conversations:
      ChatConversation[],
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): Unsubscribe {
  const normalizedUserId =
    normalizeRequiredId(
      userId,
      "el usuario",
    );

  assertCurrentUser(
    normalizedUserId,
  );

  const conversationsQuery =
    query(
      collection(
        db,
        "conversations",
      ),
      where(
        "participants",
        "array-contains",
        normalizedUserId,
      ),
    );

  const messageUnsubscribes =
    new Map<
      string,
      Unsubscribe
    >();

  let currentConversations =
    new Map<
      string,
      ChatConversation
    >();

  const unreadCounts =
    new Map<
      string,
      number
    >();

  const emit = () => {
    onChange(
      sortConversationsByNewest(
        Array.from(
          currentConversations.values(),
        ).map(
          (conversation) => ({
            ...conversation,
            unreadCount:
              unreadCounts.get(
                conversation.id,
              ) ?? 0,
          }),
        ),
      ),
    );
  };

  const unsubscribeConversations =
    onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const nextConversations =
          new Map<
            string,
            ChatConversation
          >();

        snapshot.docs.forEach(
          (
            conversationDocument,
          ) => {
            const conversation =
              mapConversation(
                conversationDocument.id,
                conversationDocument.data() as
                  FirestoreData,
              );

            nextConversations.set(
              conversation.id,
              conversation,
            );
          },
        );

        messageUnsubscribes.forEach(
          (
            unsubscribe,
            conversationId,
          ) => {
            if (
              !nextConversations.has(
                conversationId,
              )
            ) {
              unsubscribe();

              messageUnsubscribes.delete(
                conversationId,
              );

              unreadCounts.delete(
                conversationId,
              );
            }
          },
        );

        currentConversations =
          nextConversations;

        currentConversations.forEach(
          (conversation) => {
            if (
              messageUnsubscribes.has(
                conversation.id,
              )
            ) {
              return;
            }

            const messagesRef =
              collection(
                db,
                "conversations",
                conversation.id,
                "messages",
              );

            const unsubscribeMessages =
              onSnapshot(
                messagesRef,
                (
                  messagesSnapshot,
                ) => {
                  const unreadCount =
                    messagesSnapshot.docs.filter(
                      (
                        messageDocument,
                      ) => {
                        const data =
                          messageDocument.data() as
                            FirestoreData;

                        const senderId =
                          normalizeText(
                            data.senderId,
                          );

                        const readBy =
                          normalizeStringArray(
                            data.readBy,
                          );

                        return (
                          senderId !==
                            normalizedUserId &&
                          !readBy.includes(
                            normalizedUserId,
                          )
                        );
                      },
                    ).length;

                  unreadCounts.set(
                    conversation.id,
                    unreadCount,
                  );

                  emit();
                },
                (error) => {
                  console.error(
                    "Error escuchando mensajes para contador:",
                    error,
                  );

                  onError?.(
                    error instanceof Error
                      ? error
                      : new Error(
                          "No pudimos actualizar los mensajes.",
                        ),
                  );
                },
              );

            messageUnsubscribes.set(
              conversation.id,
              unsubscribeMessages,
            );
          },
        );

        emit();
      },
      (error) => {
        console.error(
          "Error escuchando conversaciones:",
          error,
        );

        onError?.(
          error instanceof Error
            ? error
            : new Error(
                "No pudimos cargar tus conversaciones.",
              ),
        );
      },
    );

  return () => {
    unsubscribeConversations();

    messageUnsubscribes.forEach(
      (unsubscribe) => {
        unsubscribe();
      },
    );

    messageUnsubscribes.clear();
  };
}

export function subscribeToConversationMessages(
  conversationId: string,
  onChange: (
    messages: ChatMessage[],
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): Unsubscribe {
  const normalizedConversationId =
    normalizeRequiredId(
      conversationId,
      "la conversación",
    );

  const messagesQuery =
    query(
      collection(
        db,
        "conversations",
        normalizedConversationId,
        "messages",
      ),
      orderBy(
        "createdAt",
        "asc",
      ),
    );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map(
          (messageDocument) =>
            mapMessage(
              messageDocument.id,
              normalizedConversationId,
              messageDocument.data() as
                FirestoreData,
            ),
        ),
      );
    },
    (error) => {
      console.error(
        "Error escuchando conversación:",
        error,
      );

      onError?.(
        error instanceof Error
          ? error
          : new Error(
              "No pudimos cargar los mensajes.",
            ),
      );
    },
  );
}

export async function sendChatMessage(
  params: SendChatMessageParams,
): Promise<void> {
  const conversationId =
    normalizeRequiredId(
      params.conversationId,
      "la conversación",
    );

  const senderId =
    normalizeRequiredId(
      params.senderId,
      "el remitente",
    );

  assertCurrentUser(
    senderId,
  );

  const senderName =
    normalizeText(
      params.senderName,
      "Usuario",
    ).slice(
      0,
      100,
    );

  const cleanText =
    String(
      params.text ?? "",
    ).trim();

  if (!cleanText) {
    throw new Error(
      "El mensaje no puede estar vacío.",
    );
  }

  if (
    cleanText.length > 5000
  ) {
    throw new Error(
      "El mensaje no puede superar los 5000 caracteres.",
    );
  }

  const conversationRef =
    doc(
      db,
      "conversations",
      conversationId,
    );

  const conversationSnapshot =
    await getDoc(
      conversationRef,
    );

  if (
    !conversationSnapshot.exists()
  ) {
    throw new Error(
      "La conversación ya no existe.",
    );
  }

  const conversation =
    mapConversation(
      conversationSnapshot.id,
      conversationSnapshot.data() as
        FirestoreData,
    );

  if (
    !conversation.participants.includes(
      senderId,
    )
  ) {
    throw new Error(
      "No pertenecés a esta conversación.",
    );
  }

  const hasRecipient =
    conversation.participants.some(
      (participantId) =>
        participantId !==
        senderId,
    );

  if (!hasRecipient) {
    throw new Error(
      "No se pudo identificar al destinatario.",
    );
  }

  const now =
    serverTimestamp();

  await addDoc(
    collection(
      db,
      "conversations",
      conversationId,
      "messages",
    ),
    {
      conversationId,
      senderId,
      senderName,
      text: cleanText,
      createdAt: now,
      readBy: [
        senderId,
      ],
    },
  );

  await updateDoc(
    conversationRef,
    {
      lastMessage:
        cleanText.substring(
          0,
          100,
        ),
      lastMessageAt: now,
      updatedAt: now,
    },
  );
}

export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  const normalizedConversationId =
    normalizeRequiredId(
      conversationId,
      "la conversación",
    );

  const normalizedUserId =
    normalizeRequiredId(
      userId,
      "el usuario",
    );

  assertCurrentUser(
    normalizedUserId,
  );

  const snapshot =
    await getDocs(
      collection(
        db,
        "conversations",
        normalizedConversationId,
        "messages",
      ),
    );

  const updates =
    snapshot.docs.map(
      async (
        messageDocument,
      ) => {
        const data =
          messageDocument.data() as
            FirestoreData;

        const senderId =
          normalizeText(
            data.senderId,
          );

        const readBy =
          normalizeStringArray(
            data.readBy,
          );

        if (
          senderId !==
            normalizedUserId &&
          !readBy.includes(
            normalizedUserId,
          )
        ) {
          await updateDoc(
            messageDocument.ref,
            {
              readBy:
                arrayUnion(
                  normalizedUserId,
                ),
            },
          );
        }
      },
    );

  await Promise.all(
    updates,
  );
}

export async function setTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean,
): Promise<void> {
  const normalizedConversationId =
    normalizeRequiredId(
      conversationId,
      "la conversación",
    );

  const normalizedUserId =
    normalizeRequiredId(
      userId,
      "el usuario",
    );

  assertCurrentUser(
    normalizedUserId,
  );

  const typingRef =
    doc(
      db,
      "conversations",
      normalizedConversationId,
      "typing",
      normalizedUserId,
    );

  if (isTyping) {
    await setDoc(
      typingRef,
      {
        userId:
          normalizedUserId,
        isTyping: true,
        updatedAt:
          serverTimestamp(),
      },
    );

    return;
  }

  const snapshot =
    await getDoc(
      typingRef,
    );

  if (
    snapshot.exists()
  ) {
    await deleteDoc(
      typingRef,
    );
  }
}

export function subscribeToTypingStatus(
  conversationId: string,
  onChange: (
    typingUsers: string[],
  ) => void,
  onError?: (
    error: Error,
  ) => void,
): Unsubscribe {
  const normalizedConversationId =
    normalizeRequiredId(
      conversationId,
      "la conversación",
    );

  return onSnapshot(
    collection(
      db,
      "conversations",
      normalizedConversationId,
      "typing",
    ),
    (snapshot) => {
      const typingUsers =
        snapshot.docs
          .map(
            (
              typingDocument,
            ) => {
              const data =
                typingDocument.data() as
                  FirestoreData;

              if (
                data.isTyping !==
                true
              ) {
                return "";
              }

              return normalizeText(
                data.userId,
              );
            },
          )
          .filter(Boolean);

      onChange(
        Array.from(
          new Set(
            typingUsers,
          ),
        ),
      );
    },
    (error) => {
      console.error(
        "Error escuchando typing:",
        error,
      );

      onError?.(
        error instanceof Error
          ? error
          : new Error(
              "No pudimos actualizar el estado de escritura.",
            ),
      );
    },
  );
}
