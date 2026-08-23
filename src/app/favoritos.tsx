import {
  SymbolView,
} from "expo-symbols";
import {
  router,
} from "expo-router";
import {
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useAuth,
} from "@/features/auth/AuthProvider";
import type {
  ExploreListing,
} from "@/features/explore/exploreTypes";
import {
  useFavoriteListings,
  type FavoriteListingItem,
} from "@/features/favorites/useFavoriteListings";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";

const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

const RED = "#EF4444";
const RED_SOFT = "#FEF2F2";

function formatCurrency(
  value: number,
): string {
  const amount = Number(
    value ?? 0,
  );

  return `$ ${amount.toLocaleString(
    "es-AR",
    {
      maximumFractionDigits: 0,
    },
  )}`;
}

function getStatusLabel(
  listing: ExploreListing,
): string {
  if (
    listing.status ===
    "sold"
  ) {
    return "Vendida";
  }

  if (
    listing.status ===
    "pending_confirmation"
  ) {
    return "En confirmación";
  }

  return "Disponible";
}

export default function FavoritesScreen() {
  const {
    user,
    isLoading:
      isAuthLoading,
    loginWithGoogle,
  } = useAuth();

  const [
    isSigningIn,
    setIsSigningIn,
  ] = useState(false);

  const {
    items,
    isLoading,
    isRefreshing,
    removingId,
    error,
    refresh,
    removeFavorite,
  } = useFavoriteListings(
    user?.uid ?? null,
  );

  const handleLogin =
    async () => {
      if (isSigningIn) {
        return;
      }

      try {
        setIsSigningIn(true);

        await loginWithGoogle();
      } catch {
        Alert.alert(
          "No pudimos iniciar sesión",
          "No fue posible ingresar con Google. Intentá nuevamente.",
        );
      } finally {
        setIsSigningIn(false);
      }
    };

  const handleRemove =
    (
      item: FavoriteListingItem,
    ) => {
      void removeFavorite(
        item.listingId,
      );
    };

  const renderItem = ({
    item,
  }: {
    item: FavoriteListingItem;
  }) => {
    if (!item.listing) {
      return (
        <View
          style={
            styles.unavailableCard
          }
        >
          <View
            style={
              styles.unavailableIcon
            }
          >
            <SymbolView
              name={{
                ios: "exclamationmark.triangle.fill",
                android:
                  "warning",
                web: "warning",
              }}
              size={22}
              tintColor={
                ORANGE
              }
            />
          </View>

          <View
            style={
              styles.unavailableCopy
            }
          >
            <Text
              style={
                styles.unavailableTitle
              }
            >
              Publicación no disponible
            </Text>

            <Text
              style={
                styles.unavailableText
              }
            >
              Puede haber sido eliminada por el vendedor.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitar favorito no disponible"
            disabled={
              removingId ===
              item.listingId
            }
            onPress={() =>
              handleRemove(
                item,
              )
            }
            style={({
              pressed,
            }) => [
              styles.smallRemoveButton,
              pressed &&
                styles.pressed,
            ]}
          >
            {removingId ===
            item.listingId ? (
              <ActivityIndicator
                size="small"
                color={RED}
              />
            ) : (
              <SymbolView
                name={{
                  ios: "trash.fill",
                  android:
                    "delete",
                  web: "delete",
                }}
                size={18}
                tintColor={
                  RED
                }
              />
            )}
          </Pressable>
        </View>
      );
    }

    const listing =
      item.listing;

    const imageUrl =
      listing.imageUrl ||
      listing.imageUrls[0] ||
      "";

    return (
      <View
        style={
          styles.card
        }
      >
        <View
          style={
            styles.cardTop
          }
        >
          <View
            style={
              styles.imageShell
            }
          >
            {imageUrl ? (
              <Image
                source={{
                  uri: imageUrl,
                }}
                resizeMode="cover"
                accessibilityLabel={`Imagen de ${listing.title}`}
                style={
                  styles.image
                }
              />
            ) : (
              <View
                style={
                  styles.imageFallback
                }
              >
                <SymbolView
                  name={{
                    ios: "photo.fill",
                    android:
                      "image",
                    web: "image",
                  }}
                  size={30}
                  tintColor={
                    ORANGE
                  }
                />
              </View>
            )}
          </View>

          <View
            style={
              styles.cardCopy
            }
          >
            <View
              style={
                styles.statusBadge
              }
            >
              <View
                style={
                  styles.statusDot
                }
              />

              <Text
                style={
                  styles.statusText
                }
              >
                {getStatusLabel(
                  listing,
                )}
              </Text>
            </View>

            <Text
              numberOfLines={2}
              style={
                styles.cardTitle
              }
            >
              {listing.title}
            </Text>

            <Text
              style={
                styles.price
              }
            >
              {formatCurrency(
                listing.price,
              )}
            </Text>

            <View
              style={
                styles.locationRow
              }
            >
              <SymbolView
                name={{
                  ios: "mappin",
                  android:
                    "location_on",
                  web: "location_on",
                }}
                size={14}
                tintColor={
                  MUTED
                }
              />

              <Text
                numberOfLines={1}
                style={
                  styles.locationText
                }
              >
                {listing.location ||
                  "Neuquén"}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={
            styles.cardDivider
          }
        />

        <View
          style={
            styles.actions
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${listing.title}`}
            onPress={() =>
              router.push({
                pathname:
                  "/explorar/[id]",
                params: {
                  id: listing.id,
                },
              })
            }
            style={({
              pressed,
            }) => [
              styles.openButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios: "arrow.up.right",
                android:
                  "open_in_new",
                web: "open_in_new",
              }}
              size={17}
              tintColor={
                SURFACE
              }
            />

            <Text
              style={
                styles.openButtonText
              }
            >
              Ver publicación
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${listing.title} de favoritos`}
            disabled={
              Boolean(
                removingId,
              )
            }
            onPress={() =>
              handleRemove(
                item,
              )
            }
            style={({
              pressed,
            }) => [
              styles.removeButton,
              pressed &&
                !removingId &&
                styles.pressed,
              removingId &&
                styles.disabled,
            ]}
          >
            {removingId ===
            item.listingId ? (
              <ActivityIndicator
                size="small"
                color={RED}
              />
            ) : (
              <>
                <SymbolView
                  name={{
                    ios: "heart.slash.fill",
                    android:
                      "heart_broken",
                    web: "heart_broken",
                  }}
                  size={17}
                  tintColor={
                    RED
                  }
                />

                <Text
                  style={
                    styles.removeButtonText
                  }
                >
                  Quitar
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={[
        "top",
        "bottom",
      ]}
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
            tintColor={TEXT}
          />
        </Pressable>

        <View
          style={
            styles.headerCopy
          }
        >
          <Text
            style={
              styles.brand
            }
          >
            EZIEL
          </Text>

          <Text
            style={
              styles.headerTitle
            }
          >
            Favoritos
          </Text>
        </View>

        <View
          style={
            styles.headerSpacer
          }
        />
      </View>

      {isAuthLoading ? (
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
              styles.loadingTitle
            }
          >
            Cargando tu cuenta
          </Text>
        </View>
      ) : !user ? (
        <View
          style={
            styles.centerState
          }
        >
          <View
            style={
              styles.loginIcon
            }
          >
            <SymbolView
              name={{
                ios: "heart.fill",
                android:
                  "favorite",
                web: "favorite",
              }}
              size={34}
              tintColor={
                ORANGE
              }
            />
          </View>

          <Text
            style={
              styles.loginTitle
            }
          >
            Tus favoritos
          </Text>

          <Text
            style={
              styles.loginText
            }
          >
            Ingresá para ver las publicaciones que guardaste en Eziel.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ingresar con Google"
            disabled={
              isSigningIn
            }
            onPress={() => {
              void handleLogin();
            }}
            style={({
              pressed,
            }) => [
              styles.loginButton,
              pressed &&
                !isSigningIn &&
                styles.pressed,
              isSigningIn &&
                styles.disabled,
            ]}
          >
            {isSigningIn ? (
              <ActivityIndicator
                size="small"
                color={
                  SURFACE
                }
              />
            ) : (
              <Text
                style={
                  styles.loginButtonText
                }
              >
                Ingresar con Google
              </Text>
            )}
          </Pressable>
        </View>
      ) : isLoading &&
        items.length === 0 ? (
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
              styles.loadingTitle
            }
          >
            Cargando favoritos
          </Text>

          <Text
            style={
              styles.loadingText
            }
          >
            Estamos buscando tus publicaciones guardadas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(
            item,
          ) =>
            item.listingId
          }
          renderItem={
            renderItem
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshing={
            isRefreshing
          }
          onRefresh={() => {
            void refresh();
          }}
          contentContainerStyle={
            styles.listContent
          }
          ListHeaderComponent={
            <View>
              <View
                style={
                  styles.hero
                }
              >
                <View
                  style={
                    styles.heroTop
                  }
                >
                  <View
                    style={
                      styles.heroIcon
                    }
                  >
                    <SymbolView
                      name={{
                        ios: "heart.fill",
                        android:
                          "favorite",
                        web: "favorite",
                      }}
                      size={26}
                      tintColor={
                        RED
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.heroCount
                    }
                  >
                    <Text
                      style={
                        styles.heroCountNumber
                      }
                    >
                      {
                        items.length
                      }
                    </Text>

                    <Text
                      style={
                        styles.heroCountLabel
                      }
                    >
                      {items.length ===
                      1
                        ? "guardado"
                        : "guardados"}
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.heroTitle
                  }
                >
                  Mis favoritos
                </Text>

                <Text
                  style={
                    styles.heroDescription
                  }
                >
                  Todo lo que guardás desde Explorar aparece acá automáticamente.
                </Text>
              </View>

              {error && (
                <View
                  style={
                    styles.errorCard
                  }
                >
                  <SymbolView
                    name={{
                      ios: "exclamationmark.circle.fill",
                      android:
                        "error",
                      web: "error",
                    }}
                    size={18}
                    tintColor={
                      ORANGE_DARK
                    }
                  />

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
          }
          ListEmptyComponent={
            <View
              style={
                styles.emptyCard
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <SymbolView
                  name={{
                    ios: "heart",
                    android:
                      "favorite_border",
                    web: "favorite_border",
                  }}
                  size={34}
                  tintColor={
                    ORANGE
                  }
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Todavía no guardaste publicaciones
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Entrá a Explorar y tocá Guardar en cualquier publicación que te interese.
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Explorar publicaciones"
                onPress={() =>
                  router.push(
                    "/explorar",
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.exploreButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.exploreButtonText
                  }
                >
                  Explorar publicaciones
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
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

    header: {
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
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
      alignItems: "center",
    },

    brand: {
      color: ORANGE,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.8,
    },

    headerTitle: {
      marginTop: 2,
      color: TEXT,
      fontSize: 15,
      fontWeight: "800",
    },

    headerSpacer: {
      width: 44,
    },

    listContent: {
      flexGrow: 1,
      gap: 13,
      padding: 18,
      paddingBottom: 40,
    },

    hero: {
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        SURFACE,
      marginBottom: 14,
    },

    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    heroIcon: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 17,
      backgroundColor:
        RED_SOFT,
    },

    heroCount: {
      alignItems:
        "flex-end",
    },

    heroCountNumber: {
      color: TEXT,
      fontSize: 24,
      fontWeight: "900",
    },

    heroCountLabel: {
      color: MUTED,
      fontSize: 10,
      fontWeight: "700",
    },

    heroTitle: {
      marginTop: 18,
      color: TEXT,
      fontSize: 25,
      fontWeight: "900",
      letterSpacing: -0.6,
    },

    heroDescription: {
      marginTop: 7,
      color: MUTED,
      fontSize: 13,
      lineHeight: 20,
    },

    card: {
      overflow: "hidden",
      borderRadius: 22,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        SURFACE,
    },

    cardTop: {
      flexDirection: "row",
      gap: 14,
      padding: 14,
    },

    imageShell: {
      width: 112,
      height: 112,
      overflow: "hidden",
      borderRadius: 17,
      backgroundColor:
        ORANGE_SOFT,
    },

    image: {
      width: "100%",
      height: "100%",
    },

    imageFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    cardCopy: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 2,
    },

    statusBadge: {
      alignSelf:
        "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        "#F0FDF4",
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor:
        "#16A34A",
    },

    statusText: {
      color: "#15803D",
      fontSize: 9,
      fontWeight: "900",
    },

    cardTitle: {
      marginTop: 9,
      color: TEXT,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900",
    },

    price: {
      marginTop: 5,
      color: ORANGE_DARK,
      fontSize: 18,
      fontWeight: "900",
    },

    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 7,
    },

    locationText: {
      flex: 1,
      color: MUTED,
      fontSize: 10,
      fontWeight: "600",
    },

    cardDivider: {
      height: 1,
      backgroundColor:
        "#F1F5F9",
    },

    actions: {
      flexDirection: "row",
      gap: 9,
      padding: 12,
    },

    openButton: {
      flex: 1,
      minHeight: 43,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
      borderRadius: 13,
      backgroundColor:
        ORANGE,
    },

    openButtonText: {
      color: SURFACE,
      fontSize: 11,
      fontWeight: "900",
    },

    removeButton: {
      minWidth: 92,
      minHeight: 43,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
      paddingHorizontal: 12,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#FECACA",
      backgroundColor:
        RED_SOFT,
    },

    removeButtonText: {
      color: RED,
      fontSize: 11,
      fontWeight: "900",
    },

    unavailableCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        SURFACE,
    },

    unavailableIcon: {
      width: 43,
      height: 43,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 14,
      backgroundColor:
        ORANGE_SOFT,
    },

    unavailableCopy: {
      flex: 1,
    },

    unavailableTitle: {
      color: TEXT,
      fontSize: 13,
      fontWeight: "900",
    },

    unavailableText: {
      marginTop: 3,
      color: MUTED,
      fontSize: 10,
      lineHeight: 15,
    },

    smallRemoveButton: {
      width: 39,
      height: 39,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 12,
      backgroundColor:
        RED_SOFT,
    },

    emptyCard: {
      alignItems: "center",
      paddingHorizontal: 25,
      paddingVertical: 35,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        SURFACE,
    },

    emptyIcon: {
      width: 70,
      height: 70,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 23,
      backgroundColor:
        ORANGE_SOFT,
    },

    emptyTitle: {
      marginTop: 18,
      color: TEXT,
      fontSize: 18,
      fontWeight: "900",
      textAlign: "center",
    },

    emptyText: {
      marginTop: 8,
      maxWidth: 300,
      color: MUTED,
      fontSize: 12,
      lineHeight: 19,
      textAlign: "center",
    },

    exploreButton: {
      minHeight: 46,
      justifyContent:
        "center",
      marginTop: 20,
      paddingHorizontal: 20,
      borderRadius: 14,
      backgroundColor:
        ORANGE,
    },

    exploreButtonText: {
      color: SURFACE,
      fontSize: 12,
      fontWeight: "900",
    },

    errorCard: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 9,
      padding: 13,
      marginBottom: 14,
      borderRadius: 15,
      backgroundColor:
        ORANGE_SOFT,
    },

    errorText: {
      flex: 1,
      color: ORANGE_DARK,
      fontSize: 11,
      lineHeight: 17,
      fontWeight: "700",
    },

    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 34,
    },

    loadingTitle: {
      marginTop: 16,
      color: TEXT,
      fontSize: 17,
      fontWeight: "900",
      textAlign: "center",
    },

    loadingText: {
      marginTop: 7,
      color: MUTED,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
    },

    loginIcon: {
      width: 72,
      height: 72,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 24,
      backgroundColor:
        ORANGE_SOFT,
    },

    loginTitle: {
      marginTop: 20,
      color: TEXT,
      fontSize: 22,
      fontWeight: "900",
    },

    loginText: {
      maxWidth: 300,
      marginTop: 8,
      color: MUTED,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },

    loginButton: {
      minHeight: 50,
      justifyContent:
        "center",
      marginTop: 23,
      paddingHorizontal: 25,
      borderRadius: 15,
      backgroundColor:
        ORANGE,
    },

    loginButtonText: {
      color: SURFACE,
      fontSize: 13,
      fontWeight: "900",
    },

    pressed: {
      opacity: 0.7,
    },

    disabled: {
      opacity: 0.55,
    },
  });
