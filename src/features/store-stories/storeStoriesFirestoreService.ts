import {
  collection,
  getDocs,
  query,
  where,
} from "@react-native-firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  StoreStoriesResult,
  StoreStory,
  StoreStoryItem,
  StoreStoryMediaType,
} from "./storeStoriesTypes";

type FirestoreData =
  Record<string, unknown>;

function normalizeString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : String(value ?? "").trim();
}

function normalizeOrder(
  value: unknown,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

export function detectStoryMediaType(
  url: string,
): StoreStoryMediaType {
  const cleanUrl =
    url
      .split("?")[0]
      ?.split("#")[0]
      ?.toLowerCase() ?? "";

  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(
    cleanUrl,
  )
    ? "video"
    : "image";
}

function normalizeMediaType(
  value: unknown,
  mediaUrl: string,
): StoreStoryMediaType {
  if (value === "video") {
    return "video";
  }

  if (value === "image") {
    return "image";
  }

  return detectStoryMediaType(mediaUrl);
}

export function getUnknownDateMs(
  value: unknown,
): number | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    const timestamp =
      value as {
        toMillis?: () => number;
        toDate?: () => Date;
        seconds?: number;
        _seconds?: number;
      };

    if (
      typeof timestamp.toMillis ===
      "function"
    ) {
      const milliseconds =
        timestamp.toMillis();

      return Number.isFinite(milliseconds)
        ? milliseconds
        : null;
    }

    if (
      typeof timestamp.toDate ===
      "function"
    ) {
      const milliseconds =
        timestamp.toDate().getTime();

      return Number.isFinite(milliseconds)
        ? milliseconds
        : null;
    }

    const seconds =
      typeof timestamp.seconds === "number"
        ? timestamp.seconds
        : timestamp._seconds;

    if (
      typeof seconds === "number" &&
      Number.isFinite(seconds)
    ) {
      return seconds * 1000;
    }
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const parsed =
      new Date(value).getTime();

    return Number.isNaN(parsed)
      ? null
      : parsed;
  }

  return null;
}

function mapStoreStory(
  id: string,
  data: FirestoreData,
): StoreStory {
  const imageUrl =
    normalizeString(
      data.imageUrl ?? data.mediaUrl,
    );

  const mediaUrl =
    normalizeString(
      data.mediaUrl ?? imageUrl,
    );

  const mediaType =
    normalizeMediaType(
      data.mediaType,
      mediaUrl,
    );

  const coverImage =
    normalizeString(
      data.coverImage ?? imageUrl,
    );

  const rawKind =
    normalizeString(
      data.kind ?? "highlight",
    );

  return {
    id,
    storeId:
      normalizeString(data.storeId),
    ownerId:
      normalizeString(data.ownerId),
    title:
      normalizeString(data.title),
    imageUrl,
    mediaUrl,
    mediaType,
    coverImage,
    active: data.active !== false,
    kind:
      rawKind === "temporary"
        ? "temporary"
        : "highlight",
    expiresAt: data.expiresAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    items: [],
  };
}

function mapStoreStoryItem(
  id: string,
  data: FirestoreData,
): StoreStoryItem {
  const imageUrl =
    normalizeString(
      data.imageUrl ?? data.mediaUrl,
    );

  const mediaUrl =
    normalizeString(
      data.mediaUrl ?? imageUrl,
    );

  return {
    id,
    storyId:
      normalizeString(data.storyId),
    imageUrl,
    mediaUrl,
    mediaType:
      normalizeMediaType(
        data.mediaType,
        mediaUrl,
      ),
    order:
      normalizeOrder(data.order),
    createdAt: data.createdAt,
  };
}

export function getStoryPrimaryMedia(
  story: StoreStory,
): StoreStoryItem {
  const firstItem =
    story.items[0];

  if (firstItem) {
    return {
      ...firstItem,
      mediaUrl:
        firstItem.mediaUrl ||
        firstItem.imageUrl,
      imageUrl:
        firstItem.imageUrl ||
        firstItem.mediaUrl,
      mediaType:
        firstItem.mediaType ||
        detectStoryMediaType(
          firstItem.mediaUrl ||
            firstItem.imageUrl,
        ),
    };
  }

  const mediaUrl =
    story.mediaUrl ||
    story.imageUrl ||
    story.coverImage;

  return {
    id: `${story.id}-primary`,
    storyId: story.id,
    imageUrl: mediaUrl,
    mediaUrl,
    mediaType:
      story.mediaType ||
      detectStoryMediaType(mediaUrl),
    order: 0,
  };
}

export function isStoryMediaVideo(
  media: Pick<
    StoreStoryItem,
    "mediaUrl" | "imageUrl" | "mediaType"
  >,
): boolean {
  return (
    media.mediaType ||
    detectStoryMediaType(
      media.mediaUrl ||
        media.imageUrl,
    )
  ) === "video";
}

export function getStoryPreviewImage(
  story: StoreStory,
): string {
  if (
    story.coverImage &&
    detectStoryMediaType(
      story.coverImage,
    ) === "image"
  ) {
    return story.coverImage;
  }

  const primary =
    getStoryPrimaryMedia(story);

  const primaryUrl =
    primary.imageUrl ||
    primary.mediaUrl;

  if (
    primaryUrl &&
    !isStoryMediaVideo(primary)
  ) {
    return primaryUrl;
  }

  return "";
}

export function isTemporaryStoryActive(
  story: StoreStory,
): boolean {
  if (!story.active) {
    return false;
  }

  if (
    story.kind !== "temporary"
  ) {
    return story.active;
  }

  const expiresAtMs =
    getUnknownDateMs(
      story.expiresAt,
    );

  if (!expiresAtMs) {
    return false;
  }

  return expiresAtMs > Date.now();
}

export function getTemporaryStoryTimeLeft(
  story: StoreStory,
): string {
  const expiresAtMs =
    getUnknownDateMs(
      story.expiresAt,
    );

  if (!expiresAtMs) {
    return "Sin vencimiento";
  }

  const diffMs =
    expiresAtMs - Date.now();

  if (diffMs <= 0) {
    return "Expirada";
  }

  const totalMinutes =
    Math.ceil(diffMs / 60000);

  const hours =
    Math.floor(
      totalMinutes / 60,
    );

  const minutes =
    totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min restantes`;
  }

  if (minutes === 0) {
    return `${hours} h restantes`;
  }

  return `${hours} h ${minutes} min restantes`;
}

async function getStoreStoryItems(
  storyId: string,
): Promise<StoreStoryItem[]> {
  if (!storyId) {
    return [];
  }

  const itemsQuery =
    query(
      collection(
        db,
        "storeStoryItems",
      ),
      where(
        "storyId",
        "==",
        storyId,
      ),
    );

  const snapshot =
    await getDocs(itemsQuery);

  return snapshot.docs
    .map((document) =>
      mapStoreStoryItem(
        document.id,
        document.data() as FirestoreData,
      ),
    )
    .filter(
      (item) =>
        Boolean(
          item.mediaUrl ||
            item.imageUrl,
        ),
    )
    .sort(
      (a, b) =>
        a.order - b.order,
    );
}

async function hydrateStory(
  story: StoreStory,
): Promise<StoreStory> {
  const items =
    await getStoreStoryItems(
      story.id,
    );

  if (items.length > 0) {
    return {
      ...story,
      items,
    };
  }

  if (
    !story.mediaUrl &&
    !story.imageUrl
  ) {
    return {
      ...story,
      items: [],
    };
  }

  return {
    ...story,
    items: [
      {
        id:
          `${story.id}-fallback`,
        storyId: story.id,
        imageUrl:
          story.imageUrl ||
          story.mediaUrl,
        mediaUrl:
          story.mediaUrl ||
          story.imageUrl,
        mediaType:
          story.mediaType ||
          detectStoryMediaType(
            story.mediaUrl ||
              story.imageUrl,
          ),
        order: 0,
      },
    ],
  };
}

function sortCreatedDesc(
  a: StoreStory,
  b: StoreStory,
): number {
  const dateA =
    getUnknownDateMs(
      a.createdAt,
    ) ?? 0;

  const dateB =
    getUnknownDateMs(
      b.createdAt,
    ) ?? 0;

  return dateB - dateA;
}

export async function getStoreStoriesForDetail(
  storeId: string,
): Promise<StoreStoriesResult> {
  const normalizedStoreId =
    normalizeString(storeId);

  if (!normalizedStoreId) {
    return {
      highlights: [],
      temporary: [],
    };
  }

  const storiesQuery =
    query(
      collection(
        db,
        "storeStories",
      ),
      where(
        "storeId",
        "==",
        normalizedStoreId,
      ),
    );

  const snapshot =
    await getDocs(storiesQuery);

  const mappedStories =
    snapshot.docs
      .map((document) =>
        mapStoreStory(
          document.id,
          document.data() as FirestoreData,
        ),
      )
      .filter((story) => {
        if (!story.active) {
          return false;
        }

        if (
          story.kind ===
          "temporary"
        ) {
          return isTemporaryStoryActive(
            story,
          );
        }

        return true;
      });

  const hydrated =
    await Promise.all(
      mappedStories.map(
        hydrateStory,
      ),
    );

  const playable =
    hydrated.filter(
      (story) =>
        story.items.some(
          (item) =>
            Boolean(
              item.mediaUrl ||
                item.imageUrl,
            ),
        ),
    );

  const temporary =
    playable
      .filter(
        (story) =>
          story.kind ===
            "temporary" &&
          isTemporaryStoryActive(
            story,
          ),
      )
      .sort(sortCreatedDesc);

  const highlights =
    playable
      .filter(
        (story) =>
          story.kind ===
          "highlight",
      )
      .sort((a, b) =>
        a.title
          .toLowerCase()
          .localeCompare(
            b.title.toLowerCase(),
            "es",
          ),
      );

  return {
    highlights,
    temporary,
  };
}
