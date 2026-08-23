export type StoreStoryKind =
  | "highlight"
  | "temporary";

export type StoreStoryMediaType =
  | "image"
  | "video";

export interface StoreStoryItem {
  id: string;
  storyId: string;
  imageUrl: string;
  mediaUrl: string;
  mediaType: StoreStoryMediaType;
  order: number;
  createdAt?: unknown;
}

export interface StoreStory {
  id: string;
  storeId: string;
  ownerId: string;
  title: string;
  imageUrl: string;
  mediaUrl: string;
  mediaType: StoreStoryMediaType;
  coverImage: string;
  active: boolean;
  kind: StoreStoryKind;
  expiresAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  items: StoreStoryItem[];
}

export interface StoreStoriesResult {
  highlights: StoreStory[];
  temporary: StoreStory[];
}
