import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  useStoreFollow,
} from "./useStoreFollow";

import type {
  StoreFollowNotificationKey,
} from "./storeFollowTypes";

interface StoreFollowCardProps {
  storeId: string;
  storeOwnerId: string;
  storeName: string;
}

interface PreferenceDefinition {
  key: StoreFollowNotificationKey;
  title: string;
  description: string;
}

const PREFERENCES: PreferenceDefinition[] =
  [
    {
      key: "newProducts",
      title: "Nuevos productos",
      description:
        "Avisame cuando la tienda publique algo nuevo.",
    },
    {
      key: "offers",
      title: "Ofertas",
      description:
        "Recibí avisos cuando active promociones.",
    },
    {
      key: "clips",
      title: "Clips",
      description:
        "Enterate cuando publique un nuevo clip.",
    },
  ];

function formatFollowers(
  value: number,
): string {
  const normalized =
    Math.max(
      0,
      Math.trunc(value),
    );

  return `${normalized.toLocaleString(
    "es-AR",
  )} ${
    normalized === 1
      ? "seguidor"
      : "seguidores"
  }`;
}

export function StoreFollowCard({
  storeId,
  storeOwnerId,
  storeName,
}: StoreFollowCardProps) {
  const {
    userId,
    isOwner,
    isFollowing,
    followersCount,
    notifications,
    isLoading,
    isSaving,
    savingPreference,
    error,
    toggleFollow,
    toggleNotification,
  } = useStoreFollow({
    storeId,
    storeOwnerId,
  });

  const handleFollowPress =
    () => {
      if (isOwner) {
        return;
      }

      if (!userId) {
        Alert.alert(
          "Iniciá sesión",
          `Para seguir a ${storeName} tenés que iniciar sesión en Eziel.`,
        );
        return;
      }

      void toggleFollow();
    };

  return (
    <View
      style={
        styles.card
      }
    >
      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.headerCopy
          }
        >
          <Text
            style={
              styles.eyebrow
            }
          >
            COMUNIDAD
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Seguí esta tienda
          </Text>

          <Text
            style={
              styles.followers
            }
          >
            {isLoading
              ? "Cargando seguidores…"
              : formatFollowers(
                  followersCount,
                )}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isOwner
              ? "Esta es tu tienda"
              : isFollowing
                ? "Dejar de seguir tienda"
                : "Seguir tienda"
          }
          disabled={
            isLoading ||
            isSaving ||
            isOwner
          }
          onPress={
            handleFollowPress
          }
          style={({
            pressed,
          }) => [
            styles.followButton,
            isFollowing &&
              styles.followButtonActive,
            isOwner &&
              styles.followButtonOwner,
            (isLoading ||
              isSaving) &&
              styles.followButtonDisabled,
            pressed &&
              !isOwner &&
              styles.followButtonPressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator
              size="small"
              color={
                isFollowing
                  ? "#0F172A"
                  : "#FFFFFF"
              }
            />
          ) : (
            <>
              <Text
                style={[
                  styles.followIcon,
                  isFollowing &&
                    styles.followIconActive,
                  isOwner &&
                    styles.followIconOwner,
                ]}
              >
                {isOwner
                  ? "✓"
                  : isFollowing
                    ? "✓"
                    : "+"}
              </Text>

              <Text
                style={[
                  styles.followButtonText,
                  isFollowing &&
                    styles.followButtonTextActive,
                  isOwner &&
                    styles.followButtonTextOwner,
                ]}
              >
                {isOwner
                  ? "Tu tienda"
                  : isFollowing
                    ? "Siguiendo"
                    : "Seguir"}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {isFollowing && (
        <View
          style={
            styles.notifications
          }
        >
          <View
            style={
              styles.notificationsHeader
            }
          >
            <View>
              <Text
                style={
                  styles.notificationsTitle
                }
              >
                Avisos de la tienda
              </Text>

              <Text
                style={
                  styles.notificationsSubtitle
                }
              >
                Elegí qué novedades querés recibir.
              </Text>
            </View>

            <View
              style={
                styles.bellBadge
              }
            >
              <Text
                style={
                  styles.bellBadgeText
                }
              >
                🔔
              </Text>
            </View>
          </View>

          <View
            style={
              styles.preferenceList
            }
          >
            {PREFERENCES.map(
              (
                preference,
                index,
              ) => {
                const isLast =
                  index ===
                  PREFERENCES.length -
                    1;

                const isPreferenceSaving =
                  savingPreference ===
                  preference.key;

                return (
                  <View
                    key={
                      preference.key
                    }
                    style={[
                      styles.preferenceRow,
                      !isLast &&
                        styles.preferenceRowBorder,
                    ]}
                  >
                    <View
                      style={
                        styles.preferenceCopy
                      }
                    >
                      <Text
                        style={
                          styles.preferenceTitle
                        }
                      >
                        {preference.title}
                      </Text>

                      <Text
                        style={
                          styles.preferenceDescription
                        }
                      >
                        {
                          preference.description
                        }
                      </Text>
                    </View>

                    {isPreferenceSaving ? (
                      <View
                        style={
                          styles.switchLoading
                        }
                      >
                        <ActivityIndicator
                          size="small"
                          color="#F97316"
                        />
                      </View>
                    ) : (
                      <Switch
                        accessibilityLabel={
                          preference.title
                        }
                        disabled={
                          savingPreference !==
                          null
                        }
                        value={
                          notifications[
                            preference.key
                          ]
                        }
                        onValueChange={(
                          enabled,
                        ) => {
                          void toggleNotification(
                            preference.key,
                            enabled,
                          );
                        }}
                        trackColor={{
                          false:
                            "#CBD5E1",
                          true:
                            "#FDBA74",
                        }}
                        thumbColor={
                          notifications[
                            preference.key
                          ]
                            ? "#F97316"
                            : "#FFFFFF"
                        }
                      />
                    )}
                  </View>
                );
              },
            )}
          </View>
        </View>
      )}

      {error && (
        <View
          style={
            styles.errorBox
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
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    card: {
      marginTop: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
      borderRadius: 24,
      backgroundColor:
        "#FFFFFF",
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingHorizontal: 18,
      paddingVertical: 18,
    },

    headerCopy: {
      flex: 1,
    },

    eyebrow: {
      color: "#F97316",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    title: {
      marginTop: 4,
      color: "#0F172A",
      fontSize: 19,
      fontWeight: "900",
      letterSpacing: -0.35,
    },

    followers: {
      marginTop: 4,
      color: "#64748B",
      fontSize: 12,
      fontWeight: "700",
    },

    followButton: {
      minWidth: 112,
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: 14,
      backgroundColor:
        "#F97316",
      paddingHorizontal: 14,
    },

    followButtonActive: {
      borderWidth: 1,
      borderColor:
        "#CBD5E1",
      backgroundColor:
        "#F8FAFC",
    },

    followButtonOwner: {
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
      backgroundColor:
        "#F8FAFC",
    },

    followButtonDisabled: {
      opacity: 0.7,
    },

    followButtonPressed: {
      transform: [
        {
          scale: 0.97,
        },
      ],
    },

    followIcon: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "900",
      lineHeight: 20,
    },

    followIconActive: {
      color: "#16A34A",
    },

    followIconOwner: {
      color: "#64748B",
    },

    followButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
    },

    followButtonTextActive: {
      color: "#0F172A",
    },

    followButtonTextOwner: {
      color: "#64748B",
    },

    notifications: {
      borderTopWidth: 1,
      borderTopColor:
        "#F1F5F9",
      backgroundColor:
        "#FBFCFE",
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 8,
    },

    notificationsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
      paddingBottom: 12,
    },

    notificationsTitle: {
      color: "#0F172A",
      fontSize: 15,
      fontWeight: "900",
    },

    notificationsSubtitle: {
      marginTop: 3,
      color: "#64748B",
      fontSize: 11,
      fontWeight: "600",
    },

    bellBadge: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
      backgroundColor:
        "#FFF7ED",
    },

    bellBadgeText: {
      fontSize: 17,
    },

    preferenceList: {
      borderTopWidth: 1,
      borderTopColor:
        "#F1F5F9",
    },

    preferenceRow: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingVertical: 12,
    },

    preferenceRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor:
        "#F1F5F9",
    },

    preferenceCopy: {
      flex: 1,
      paddingRight: 4,
    },

    preferenceTitle: {
      color: "#0F172A",
      fontSize: 13,
      fontWeight: "800",
    },

    preferenceDescription: {
      marginTop: 3,
      color: "#64748B",
      fontSize: 11,
      fontWeight: "500",
      lineHeight: 16,
    },

    switchLoading: {
      width: 50,
      alignItems: "center",
      justifyContent: "center",
    },

    errorBox: {
      marginHorizontal: 18,
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor:
        "#FFF7ED",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    errorText: {
      color: "#C2410C",
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16,
    },
  });
