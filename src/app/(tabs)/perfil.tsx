import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/AuthProvider";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";

const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const SOFT_BACKGROUND = "#F1F5F9";
const SUCCESS = "#15803D";
const SUCCESS_SOFT = "#F0FDF4";

function getUserInitial(
  displayName: string | null,
  email: string | null,
): string {
  const source =
    displayName?.trim() ||
    email?.trim() ||
    "E";

  return source
    .charAt(0)
    .toUpperCase();
}

export default function ProfileScreen() {
  const {
    user,
    userProfile,
    isAuthenticated,
    isLoading,
    loginWithGoogle,
    logout,
  } = useAuth();

  const [isSigningIn, setIsSigningIn] =
    useState(false);

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  const [
    failedPhotoURL,
    setFailedPhotoURL,
  ] = useState<string | null>(null);

  const isBusy =
    isSigningIn ||
    isSigningOut;

  const displayName =
    userProfile
      ? userProfile.displayName?.trim() ||
        "Usuario Eziel"
      : user?.displayName?.trim() ||
        "Usuario Eziel";

  const photoURL =
    userProfile
      ? userProfile.photoURL?.trim() || ""
      : user?.photoURL?.trim() || "";

  const bio =
    userProfile?.bio?.trim() || "";

  const location =
    userProfile?.location?.trim() || "";

  const handleGoogleLogin =
    async () => {
      if (isBusy) {
        return;
      }

      try {
        setIsSigningIn(true);

        const result =
          await loginWithGoogle();

        if (
          result === "cancelled"
        ) {
          return;
        }
      } catch {
        Alert.alert(
          "No pudimos iniciar sesión",
          "No fue posible ingresar con Google. Intentá nuevamente.",
        );
      } finally {
        setIsSigningIn(false);
      }
    };

  const handleLogout =
    async () => {
      if (isBusy) {
        return;
      }

      try {
        setIsSigningOut(true);

        await logout();
      } catch {
        Alert.alert(
          "No pudimos cerrar la sesión",
          "Intentá nuevamente en unos segundos.",
        );
      } finally {
        setIsSigningOut(false);
      }
    };

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <View
            style={styles.loadingIcon}
          >
            <ActivityIndicator
              size="small"
              color={ORANGE}
            />
          </View>

          <Text
            style={styles.loadingTitle}
          >
            Cargando tu cuenta
          </Text>

          <Text
            style={
              styles.loadingDescription
            }
          >
            Estamos recuperando tu sesión.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.header}>
          <Text style={styles.brand}>
            EZIEL
          </Text>

          <Text style={styles.title}>
            Perfil
          </Text>

          <Text
            style={styles.description}
          >
            Tu identidad y tus accesos
            dentro del marketplace.
          </Text>
        </View>

        {isAuthenticated && user ? (
          <>
            <View
              style={styles.heroCard}
            >
              <View
                style={
                  styles.avatarContainer
                }
              >
                {photoURL &&
                failedPhotoURL !== photoURL ? (
                  <Image
                    source={{
                      uri: photoURL,
                    }}
                    style={styles.avatar}
                    accessibilityLabel="Foto de perfil"
                    onError={() =>
                      setFailedPhotoURL(
                        photoURL,
                      )
                    }
                  />
                ) : (
                  <Text
                    style={
                      styles.avatarInitial
                    }
                  >
                    {getUserInitial(
                      displayName,
                      user.email,
                    )}
                  </Text>
                )}
              </View>

              <View
                style={
                  styles.heroContent
                }
              >
                <View
                  style={
                    styles.nameRow
                  }
                >
                  <Text
                    numberOfLines={2}
                    style={
                      styles.profileName
                    }
                  >
                    {displayName}
                  </Text>

                  {userProfile?.verified ? (
                    <SymbolView
                      name={{
                        ios: "checkmark.seal.fill",
                        android:
                          "verified",
                        web: "verified",
                      }}
                      size={20}
                      tintColor={ORANGE}
                    />
                  ) : null}
                </View>

                {user.email ? (
                  <Text
                    numberOfLines={1}
                    style={
                      styles.profileEmail
                    }
                  >
                    {user.email}
                  </Text>
                ) : null}

                <View
                  style={
                    styles.statusRow
                  }
                >
                  <View
                    style={
                      styles.connectedBadge
                    }
                  >
                    <View
                      style={
                        styles.connectedDot
                      }
                    />

                    <Text
                      style={
                        styles.connectedText
                      }
                    >
                      Conectado
                    </Text>
                  </View>

                  <View
                    style={
                      styles.accountBadge
                    }
                  >
                    <Text
                      style={
                        styles.accountBadgeText
                      }
                    >
                      {userProfile?.verified
                        ? "Verificado"
                        : "Perfil básico"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {(bio || location) && (
              <View
                style={
                  styles.aboutCard
                }
              >
                {bio ? (
                  <>
                    <Text
                      style={
                        styles.aboutLabel
                      }
                    >
                      SOBRE MÍ
                    </Text>

                    <Text
                      style={
                        styles.aboutText
                      }
                    >
                      {bio}
                    </Text>
                  </>
                ) : null}

                {location ? (
                  <View
                    style={[
                      styles.locationRow,
                      bio &&
                        styles.locationRowSpaced,
                    ]}
                  >
                    <SymbolView
                      name={{
                        ios: "location.fill",
                        android:
                          "location_on",
                        web: "location_on",
                      }}
                      size={18}
                      tintColor={ORANGE}
                    />

                    <Text
                      style={
                        styles.locationText
                      }
                    >
                      {location}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            <View
              style={styles.section}
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Tu cuenta
              </Text>

              <View
                style={styles.menuCard}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Editar perfil"
                  onPress={() =>
                    router.push(
                      "../perfil/editar",
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.menuItem,
                    pressed &&
                      styles.menuItemPressed,
                  ]}
                >
                  <View
                    style={
                      styles.menuIcon
                    }
                  >
                    <SymbolView
                      name={{
                        ios: "person.crop.circle.fill",
                        android: "edit",
                        web: "edit",
                      }}
                      size={20}
                      tintColor={ORANGE}
                    />
                  </View>

                  <View
                    style={
                      styles.menuContent
                    }
                  >
                    <Text
                      style={
                        styles.menuTitle
                      }
                    >
                      Editar perfil
                    </Text>

                    <Text
                      style={
                        styles.menuDescription
                      }
                    >
                      Cambiá tu nombre,
                      foto, biografía y
                      ubicación.
                    </Text>
                  </View>

                  <SymbolView
                    name={{
                      ios: "chevron.right",
                      android:
                        "navigate_next",
                      web: "chevron_right",
                    }}
                    size={20}
                    tintColor={MUTED}
                  />
                </Pressable>

                <View
                  style={styles.divider}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir mi tienda"
                  onPress={() => router.push("/mi-tienda")}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                >
                  <View style={styles.menuIcon}>
                    <SymbolView name={{ ios: "storefront.fill", android: "store", web: "store" }} size={20} tintColor={ORANGE} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Mi tienda</Text>
                    <Text style={styles.menuDescription}>Creá tu tienda o consultá los datos de tu negocio.</Text>
                  </View>
                  <SymbolView name={{ ios: "chevron.right", android: "navigate_next", web: "chevron_right" }} size={20} tintColor={MUTED} />
                </Pressable>

                <View style={styles.divider} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir mis publicaciones"
                  onPress={() =>
                    router.push(
                      "/mis-publicaciones",
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.menuItem,
                    pressed &&
                      styles.menuItemPressed,
                  ]}
                >
                  <View
                    style={
                      styles.menuIcon
                    }
                  >
                    <SymbolView
                      name={{
                        ios: "shippingbox.fill",
                        android:
                          "inventory_2",
                        web: "inventory_2",
                      }}
                      size={20}
                      tintColor={ORANGE}
                    />
                  </View>

                  <View
                    style={
                      styles.menuContent
                    }
                  >
                    <Text
                      style={
                        styles.menuTitle
                      }
                    >
                      Mis publicaciones
                    </Text>

                    <Text
                      style={
                        styles.menuDescription
                      }
                    >
                      Administrá stock,
                      ventas y
                      confirmaciones.
                    </Text>
                  </View>

                  <SymbolView
                    name={{
                      ios: "chevron.right",
                      android:
                        "navigate_next",
                      web: "chevron_right",
                    }}
                    size={20}
                    tintColor={MUTED}
                  />
                </Pressable>

                <View
                  style={styles.divider}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir mis favoritos"
                  onPress={() =>
                    router.push(
                      "/favoritos",
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.menuItem,
                    pressed &&
                      styles.menuItemPressed,
                  ]}
                >
                  <View
                    style={
                      styles.menuIcon
                    }
                  >
                    <SymbolView
                      name={{
                        ios: "heart.fill",
                        android:
                          "favorite",
                        web: "favorite",
                      }}
                      size={20}
                      tintColor={ORANGE}
                    />
                  </View>

                  <View
                    style={
                      styles.menuContent
                    }
                  >
                    <Text
                      style={
                        styles.menuTitle
                      }
                    >
                      Mis favoritos
                    </Text>

                    <Text
                      style={
                        styles.menuDescription
                      }
                    >
                      Revisá las
                      publicaciones que
                      guardaste.
                    </Text>
                  </View>

                  <SymbolView
                    name={{
                      ios: "chevron.right",
                      android:
                        "navigate_next",
                      web: "chevron_right",
                    }}
                    size={20}
                    tintColor={MUTED}
                  />
                </Pressable>

                <View
                  style={styles.divider}
                />

                <View
                  style={
                    styles.menuItem
                  }
                >
                  <View
                    style={
                      styles.menuIcon
                    }
                  >
                    <SymbolView
                      name={{
                        ios: "lock.shield.fill",
                        android: "lock",
                        web: "lock",
                      }}
                      size={19}
                      tintColor={ORANGE}
                    />
                  </View>

                  <View
                    style={
                      styles.menuContent
                    }
                  >
                    <Text
                      style={
                        styles.menuTitle
                      }
                    >
                      Sesión protegida
                    </Text>

                    <Text
                      style={
                        styles.menuDescription
                      }
                    >
                      Firebase mantiene tu
                      sesión autenticada de
                      forma segura.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View
              style={
                styles.syncNotice
              }
            >
              <View
                style={
                  styles.syncNoticeIcon
                }
              >
                <SymbolView
                  name={{
                    ios: "arrow.triangle.2.circlepath",
                    android: "sync",
                    web: "sync",
                  }}
                  size={18}
                  tintColor={SUCCESS}
                />
              </View>

              <View
                style={
                  styles.syncNoticeContent
                }
              >
                <Text
                  style={
                    styles.syncNoticeTitle
                  }
                >
                  Perfil sincronizado
                </Text>

                <Text
                  style={
                    styles.syncNoticeText
                  }
                >
                  Tu identidad se mantiene
                  vinculada entre Eziel y
                  Firebase.
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              accessibilityState={{
                disabled: isBusy,
                busy: isSigningOut,
              }}
              disabled={isBusy}
              onPress={handleLogout}
              style={({
                pressed,
              }) => [
                styles.logoutButton,
                pressed &&
                  !isBusy &&
                  styles.logoutButtonPressed,
                isBusy &&
                  styles.disabledButton,
              ]}
            >
              {isSigningOut ? (
                <ActivityIndicator
                  size="small"
                  color={TEXT}
                />
              ) : (
                <>
                  <SymbolView
                    name={{
                      ios: "rectangle.portrait.and.arrow.right",
                      android:
                        "logout",
                      web: "logout",
                    }}
                    size={19}
                    tintColor={TEXT}
                  />

                  <Text
                    style={
                      styles.logoutButtonText
                    }
                  >
                    Cerrar sesión
                  </Text>
                </>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <View
              style={styles.loginCard}
            >
              <View
                style={
                  styles.loginIcon
                }
              >
                <SymbolView
                  name={{
                    ios: "person.crop.circle.fill",
                    android:
                      "account_circle",
                    web: "person",
                  }}
                  size={36}
                  tintColor={ORANGE}
                />
              </View>

              <Text
                style={
                  styles.loginTitle
                }
              >
                Tu cuenta de Eziel
              </Text>

              <Text
                style={
                  styles.loginDescription
                }
              >
                Ingresá para publicar,
                guardar favoritos,
                conversar y administrar tu
                identidad desde el mismo
                perfil.
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ingresar con Google"
                accessibilityState={{
                  disabled: isBusy,
                  busy: isSigningIn,
                }}
                disabled={isBusy}
                onPress={
                  handleGoogleLogin
                }
                style={({
                  pressed,
                }) => [
                  styles.googleButton,
                  pressed &&
                    !isBusy &&
                    styles.googleButtonPressed,
                  isBusy &&
                    styles.disabledButton,
                ]}
              >
                {isSigningIn ? (
                  <ActivityIndicator
                    size="small"
                    color={SURFACE}
                  />
                ) : (
                  <>
                    <View
                      style={
                        styles.googleMark
                      }
                    >
                      <Text
                        style={
                          styles.googleMarkText
                        }
                      >
                        G
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.googleButtonText
                      }
                    >
                      Ingresar con Google
                    </Text>

                    <SymbolView
                      name={{
                        ios: "arrow.right",
                        android:
                          "arrow_forward",
                        web: "arrow_forward",
                      }}
                      size={18}
                      tintColor={SURFACE}
                    />
                  </>
                )}
              </Pressable>
            </View>

            <View
              style={
                styles.securityNotice
              }
            >
              <SymbolView
                name={{
                  ios: "lock.shield.fill",
                  android: "shield",
                  web: "shield",
                }}
                size={18}
                tintColor={MUTED}
              />

              <Text
                style={
                  styles.securityText
                }
              >
                Eziel usa Firebase
                Authentication para validar
                tu sesión.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: BACKGROUND,
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 36,
    },

    header: {
      marginBottom: 24,
    },

    brand: {
      color: ORANGE,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 2.2,
      marginBottom: 9,
    },

    title: {
      color: TEXT,
      fontSize: 32,
      fontWeight: "900",
      letterSpacing: -1,
    },

    description: {
      color: MUTED,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 7,
      maxWidth: 340,
    },

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },

    loadingIcon: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: ORANGE_SOFT,
      marginBottom: 18,
    },

    loadingTitle: {
      color: TEXT,
      fontSize: 17,
      fontWeight: "800",
    },

    loadingDescription: {
      color: MUTED,
      fontSize: 13,
      marginTop: 6,
    },

    heroCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      padding: 18,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: SURFACE,
    },

    avatarContainer: {
      width: 74,
      height: 74,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderRadius: 24,
      borderWidth: 3,
      borderColor: ORANGE_SOFT,
      backgroundColor: ORANGE_SOFT,
    },

    avatar: {
      width: "100%",
      height: "100%",
    },

    avatarInitial: {
      color: ORANGE,
      fontSize: 28,
      fontWeight: "900",
    },

    heroContent: {
      flex: 1,
      minWidth: 0,
    },

    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    profileName: {
      flexShrink: 1,
      color: TEXT,
      fontSize: 21,
      fontWeight: "900",
      letterSpacing: -0.4,
    },

    profileEmail: {
      color: MUTED,
      fontSize: 12,
      marginTop: 4,
    },

    statusRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
      marginTop: 11,
    },

    connectedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: SUCCESS_SOFT,
    },

    connectedDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: SUCCESS,
    },

    connectedText: {
      color: SUCCESS,
      fontSize: 10,
      fontWeight: "800",
    },

    accountBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: ORANGE_SOFT,
    },

    accountBadgeText: {
      color: ORANGE_DARK,
      fontSize: 10,
      fontWeight: "800",
    },

    aboutCard: {
      marginTop: 14,
      padding: 17,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: SURFACE,
    },

    aboutLabel: {
      color: ORANGE,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.4,
    },

    aboutText: {
      color: TEXT,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
    },

    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    locationRowSpaced: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: BORDER,
    },

    locationText: {
      flex: 1,
      color: MUTED,
      fontSize: 12,
      fontWeight: "700",
    },

    section: {
      marginTop: 26,
    },

    sectionTitle: {
      color: TEXT,
      fontSize: 14,
      fontWeight: "900",
      marginBottom: 10,
    },

    menuCard: {
      overflow: "hidden",
      borderRadius: 22,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: SURFACE,
    },

    menuItem: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingHorizontal: 15,
      paddingVertical: 13,
    },

    menuItemPressed: {
      backgroundColor: ORANGE_SOFT,
    },

    menuIcon: {
      width: 43,
      height: 43,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: ORANGE_SOFT,
    },

    menuContent: {
      flex: 1,
    },

    menuTitle: {
      color: TEXT,
      fontSize: 13,
      fontWeight: "800",
    },

    menuDescription: {
      color: MUTED,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 3,
    },

    divider: {
      height: 1,
      backgroundColor: BORDER,
      marginLeft: 71,
    },

    syncNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 18,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#DCFCE7",
      backgroundColor: SUCCESS_SOFT,
    },

    syncNoticeIcon: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      backgroundColor: SURFACE,
    },

    syncNoticeContent: {
      flex: 1,
    },

    syncNoticeTitle: {
      color: SUCCESS,
      fontSize: 12,
      fontWeight: "900",
    },

    syncNoticeText: {
      color: "#166534",
      fontSize: 10,
      lineHeight: 15,
      marginTop: 2,
    },

    logoutButton: {
      minHeight: 55,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      marginTop: 18,
      paddingHorizontal: 16,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: SURFACE,
    },

    logoutButtonPressed: {
      backgroundColor: SOFT_BACKGROUND,
    },

    logoutButtonText: {
      color: TEXT,
      fontSize: 13,
      fontWeight: "800",
    },

    disabledButton: {
      opacity: 0.6,
    },

    loginCard: {
      alignItems: "center",
      paddingHorizontal: 22,
      paddingVertical: 30,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: SURFACE,
    },

    loginIcon: {
      width: 70,
      height: 70,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 23,
      backgroundColor: ORANGE_SOFT,
      marginBottom: 18,
    },

    loginTitle: {
      color: TEXT,
      fontSize: 21,
      fontWeight: "900",
      letterSpacing: -0.4,
    },

    loginDescription: {
      maxWidth: 320,
      color: MUTED,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 8,
    },

    googleButton: {
      width: "100%",
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 11,
      marginTop: 24,
      paddingHorizontal: 15,
      borderRadius: 17,
      backgroundColor: ORANGE,
    },

    googleButtonPressed: {
      backgroundColor: ORANGE_DARK,
    },

    googleMark: {
      width: 29,
      height: 29,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9,
      backgroundColor: SURFACE,
    },

    googleMarkText: {
      color: "#4285F4",
      fontSize: 16,
      fontWeight: "900",
    },

    googleButtonText: {
      flex: 1,
      color: SURFACE,
      fontSize: 14,
      fontWeight: "800",
      textAlign: "center",
    },

    securityNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
      padding: 14,
      marginTop: 18,
      borderRadius: 16,
      backgroundColor: SOFT_BACKGROUND,
    },

    securityText: {
      flex: 1,
      color: MUTED,
      fontSize: 11,
      lineHeight: 17,
    },
  });
