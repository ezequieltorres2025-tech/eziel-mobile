export interface StoreFollowNotificationPreferences {
  newProducts: boolean;
  offers: boolean;
  clips: boolean;
}

export interface StoreFollow {
  id: string;
  storeId: string;
  storeOwnerId: string;
  storeName: string;
  userId: string;
  notifications: StoreFollowNotificationPreferences;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StoreFollowState {
  isFollowing: boolean;
  followersCount: number;
  notifications: StoreFollowNotificationPreferences;
}

export type StoreFollowNotificationKey =
  keyof StoreFollowNotificationPreferences;

export const DEFAULT_STORE_FOLLOW_NOTIFICATIONS: StoreFollowNotificationPreferences =
  {
    newProducts: true,
    offers: true,
    clips: true,
  };
