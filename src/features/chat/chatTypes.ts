export interface ChatTimestamp {
  toMillis?: () => number;
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: ChatTimestamp | null;
  readBy: string[];
}

export interface ChatConversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: ChatTimestamp | null;
  createdAt: ChatTimestamp | null;
  updatedAt: ChatTimestamp | null;
  unreadCount: number;
}

export interface ListingBuyerCandidate {
  buyerId: string;
  buyerName: string;
  conversationId: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string;
  lastMessage: string;
  lastMessageAt: ChatTimestamp | null;
  createdAt: ChatTimestamp | null;
  updatedAt: ChatTimestamp | null;
}

export interface CreateConversationParams {
  listingId: string;
  listingTitle: string;
  listingImageUrl: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
}

export interface SendChatMessageParams {
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
}
