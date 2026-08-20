import { SymbolView } from "expo-symbols";
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

function getUserInitial(
  displayName: string | null,
  email: string | null,
): string {
  const source = displayName?.trim() || email?.trim() || "E";

  return source.charAt(0).toUpperCase();
}

export default function ProfileScreen() {
  const { user, isAuthenticated, isLoading, loginWithGoogle, logout } =
    useAuth();

  const [isSigningIn, setIsSigningIn] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);

  const isBusy = isSigningIn || isSigningOut;

  const handleGoogleLogin = async () => {
    if (isBusy) {
      return;
    }

    try {
      setIsSigningIn(true);

      const result = await loginWithGoogle();

      if (result === "cancelled") {
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

  const handleLogout = async () => {
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="small" color={ORANGE} />
          </View>

          <Text style={styles.loadingTitle}>Cargando tu cuenta</Text>

          <Text style={styles.loadingDescription}>
            Estamos recuperando tu sesión.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>EZIEL</Text>

          <Text style={styles.title}>Perfil</Text>

          <Text style={styles.description}>
            Tu cuenta, publicaciones, favoritos y configuración.
          </Text>
        </View>

        {isAuthenticated && user ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                {user.photoURL ? (
                  <Image
                    source={{
                      uri: user.photoURL,
                    }}
                    style={styles.avatar}
                    accessibilityLabel="Foto de perfil"
                  />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {getUserInitial(user.displayName, user.email)}
                  </Text>
                )}
              </View>

              <View style={styles.profileContent}>
                <View style={styles.profileTitleRow}>
                  <Text numberOfLines={1} style={styles.profileName}>
                    {user.displayName?.trim() || "Usuario Eziel"}
                  </Text>

                  <View style={styles.connectedBadge}>
                    <View style={styles.connectedDot} />

                    <Text style={styles.connectedText}>Conectado</Text>
                  </View>
                </View>

                {user.email && (
                  <Text numberOfLines={1} style={styles.profileEmail}>
                    {user.email}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tu cuenta</Text>

              <View style={styles.menuCard}>
                <View style={styles.menuItem}>
                  <View style={styles.menuIcon}>
                    <SymbolView
                      name={{
                        ios: "person.fill",
                        android: "account_circle",
                        web: "person",
                      }}
                      size={20}
                      tintColor={ORANGE}
                    />
                  </View>

                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Perfil de Eziel</Text>

                    <Text style={styles.menuDescription}>
                      Tu identidad está conectada con Google.
                    </Text>
                  </View>

                  <SymbolView
                    name={{
                      ios: "checkmark.circle.fill",
                      android: "check_circle",
                      web: "check_circle",
                    }}
                    size={20}
                    tintColor={ORANGE}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.menuItem}>
                  <View style={styles.menuIcon}>
                    <SymbolView
                      name={{
                        ios: "lock.fill",
                        android: "lock",
                        web: "lock",
                      }}
                      size={18}
                      tintColor={ORANGE}
                    />
                  </View>

                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Sesión protegida</Text>

                    <Text style={styles.menuDescription}>
                      Firebase mantiene tu sesión de forma segura.
                    </Text>
                  </View>
                </View>
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
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && !isBusy && styles.logoutButtonPressed,
                isBusy && styles.disabledButton,
              ]}
            >
              {isSigningOut ? (
                <ActivityIndicator size="small" color={TEXT} />
              ) : (
                <>
                  <SymbolView
                    name={{
                      ios: "rectangle.portrait.and.arrow.right",
                      android: "logout",
                      web: "logout",
                    }}
                    size={19}
                    tintColor={TEXT}
                  />

                  <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
                </>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.loginCard}>
              <View style={styles.loginIcon}>
                <SymbolView
                  name={{
                    ios: "person.crop.circle.fill",
                    android: "account_circle",
                    web: "person",
                  }}
                  size={34}
                  tintColor={ORANGE}
                />
              </View>

              <Text style={styles.loginTitle}>Tu cuenta de Eziel</Text>

              <Text style={styles.loginDescription}>
                Ingresá para publicar, administrar tus favoritos, mensajes y
                futuras tiendas desde el mismo perfil.
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ingresar con Google"
                accessibilityState={{
                  disabled: isBusy,
                  busy: isSigningIn,
                }}
                disabled={isBusy}
                onPress={handleGoogleLogin}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && !isBusy && styles.googleButtonPressed,
                  isBusy && styles.disabledButton,
                ]}
              >
                {isSigningIn ? (
                  <ActivityIndicator size="small" color={SURFACE} />
                ) : (
                  <>
                    <View style={styles.googleMark}>
                      <Text style={styles.googleMarkText}>G</Text>
                    </View>

                    <Text style={styles.googleButtonText}>
                      Ingresar con Google
                    </Text>

                    <SymbolView
                      name={{
                        ios: "arrow.right",
                        android: "arrow_forward",
                        web: "arrow_forward",
                      }}
                      size={18}
                      tintColor={SURFACE}
                    />
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.benefitsCard}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <SymbolView
                    name={{
                      ios: "square.and.pencil",
                      android: "edit",
                      web: "edit",
                    }}
                    size={18}
                    tintColor={ORANGE}
                  />
                </View>

                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Publicá</Text>

                  <Text style={styles.benefitDescription}>
                    Creá publicaciones desde tu teléfono.
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <SymbolView
                    name={{
                      ios: "message.fill",
                      android: "chat",
                      web: "chat",
                    }}
                    size={18}
                    tintColor={ORANGE}
                  />
                </View>

                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Conversá</Text>

                  <Text style={styles.benefitDescription}>
                    Tus mensajes quedarán asociados a tu cuenta.
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <SymbolView
                    name={{
                      ios: "storefront.fill",
                      android: "storefront",
                      web: "storefront",
                    }}
                    size={18}
                    tintColor={ORANGE}
                  />
                </View>

                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Administrá</Text>

                  <Text style={styles.benefitDescription}>
                    Tu cuenta será la base de tus publicaciones y tiendas.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.securityNotice}>
              <SymbolView
                name={{
                  ios: "lock.shield.fill",
                  android: "shield",
                  web: "shield",
                }}
                size={18}
                tintColor={MUTED}
              />

              <Text style={styles.securityText}>
                Eziel usa Firebase Authentication para validar tu sesión.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },

  header: {
    marginBottom: 28,
  },

  brand: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 12,
  },

  title: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  description: {
    color: MUTED,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    maxWidth: 340,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  loadingIcon: {
    width: 54,
    height: 54,
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

  loginCard: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },

  loginIcon: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
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

  disabledButton: {
    opacity: 0.65,
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

  benefitsCard: {
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },

  benefitItem: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 14,
  },

  benefitIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: ORANGE_SOFT,
  },

  benefitContent: {
    flex: 1,
  },

  benefitTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  benefitDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
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

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },

  avatarContainer: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: ORANGE_SOFT,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  avatarInitial: {
    color: ORANGE,
    fontSize: 25,
    fontWeight: "900",
  },

  profileContent: {
    flex: 1,
  },

  profileTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  profileName: {
    flexShrink: 1,
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
  },

  profileEmail: {
    color: MUTED,
    fontSize: 11,
    marginTop: 5,
  },

  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: ORANGE_SOFT,
  },

  connectedDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: ORANGE,
  },

  connectedText: {
    color: ORANGE_DARK,
    fontSize: 7,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  section: {
    marginTop: 26,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },

  menuCard: {
    paddingHorizontal: 16,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },

  menuItem: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 14,
  },

  menuIcon: {
    width: 42,
    height: 42,
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
    marginTop: 2,
  },

  logoutButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 22,
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
});
