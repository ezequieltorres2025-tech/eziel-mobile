import { router } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

interface QuickActionProps {
  title: string;
  description: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
}

function QuickAction({ title, description, icon, onPress }: QuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <View style={styles.quickActionIcon}>
        <SymbolView name={icon} size={24} tintColor={ORANGE} />
      </View>

      <Text style={styles.quickActionTitle}>{title}</Text>

      <Text style={styles.quickActionDescription}>{description}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>EZIEL</Text>

            <Text style={styles.welcome}>Descubrí lo que está cerca</Text>
          </View>

          <View style={styles.headerIcon}>
            <SymbolView
              name={{
                ios: "bell.fill",
                android: "notifications",
                web: "notifications",
              }}
              size={22}
              tintColor={TEXT}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/explorar")}
          style={({ pressed }) => [styles.search, pressed && styles.pressed]}
        >
          <SymbolView
            name={{
              ios: "magnifyingglass",
              android: "search",
              web: "search",
            }}
            size={21}
            tintColor={MUTED}
          />

          <Text style={styles.searchText}>¿Qué estás buscando?</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>MARKETPLACE LOCAL</Text>
          </View>

          <Text style={styles.heroTitle}>
            Comprá, vendé y descubrí cerca tuyo.
          </Text>

          <Text style={styles.heroDescription}>
            Productos, servicios y comercios locales en un solo lugar.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/explorar")}
            style={({ pressed }) => [
              styles.heroButton,
              pressed && styles.heroButtonPressed,
            ]}
          >
            <Text style={styles.heroButtonText}>Explorar ahora</Text>

            <SymbolView
              name={{
                ios: "arrow.right",
                android: "arrow_forward",
                web: "arrow_forward",
              }}
              size={18}
              tintColor={SURFACE}
            />
          </Pressable>

          <View style={styles.heroDecorationLarge} />
          <View style={styles.heroDecorationSmall} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explorá Eziel</Text>

          <Text style={styles.sectionSubtitle}>
            Todo lo que necesitás, más rápido.
          </Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Productos"
            description="Encontrá lo que buscás"
            icon={{
              ios: "bag.fill",
              android: "shopping_bag",
              web: "shopping_bag",
            }}
            onPress={() => router.push("/explorar")}
          />

          <QuickAction
            title="Servicios"
            description="Profesionales y comercios"
            icon={{
              ios: "wrench.and.screwdriver.fill",
              android: "handyman",
              web: "handyman",
            }}
            onPress={() => router.push("/explorar")}
          />

          <QuickAction
            title="Tiendas"
            description="Negocios de tu zona"
            icon={{
              ios: "storefront.fill",
              android: "storefront",
              web: "storefront",
            }}
            onPress={() => router.push("/explorar")}
          />

          <QuickAction
            title="Publicar"
            description="Vendé de forma simple"
            icon={{
              ios: "plus.circle.fill",
              android: "add_circle",
              web: "add_circle",
            }}
            onPress={() => router.push("/publicar")}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tu marketplace</Text>

          <Text style={styles.sectionSubtitle}>
            Una experiencia pensada para comprar y vender localmente.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <SymbolView
              name={{
                ios: "location.fill",
                android: "location_on",
                web: "location_on",
              }}
              size={24}
              tintColor={ORANGE}
            />
          </View>

          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Encontrá oportunidades cerca
            </Text>

            <Text style={styles.featureDescription}>
              Explorá publicaciones, tiendas y servicios desde un solo lugar.
            </Text>
          </View>

          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={22}
            tintColor={MUTED}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/publicar")}
          style={({ pressed }) => [styles.sellCard, pressed && styles.pressed]}
        >
          <View style={styles.sellContent}>
            <Text style={styles.sellEyebrow}>¿TENÉS ALGO PARA OFRECER?</Text>

            <Text style={styles.sellTitle}>Publicalo en Eziel</Text>

            <Text style={styles.sellDescription}>
              Empezá a mostrar tus productos o servicios a personas de tu zona.
            </Text>
          </View>

          <View style={styles.sellButton}>
            <SymbolView
              name={{
                ios: "plus",
                android: "add",
                web: "add",
              }}
              size={22}
              tintColor={SURFACE}
            />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  brand: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.4,
    marginBottom: 5,
  },

  welcome: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  search: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 18,
  },

  searchText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: "500",
  },

  hero: {
    minHeight: 260,
    overflow: "hidden",
    padding: 22,
    borderRadius: 28,
    backgroundColor: ORANGE,
    marginBottom: 30,
  },

  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 18,
  },

  heroBadgeText: {
    color: SURFACE,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  heroTitle: {
    maxWidth: 290,
    color: SURFACE,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "900",
    letterSpacing: -1,
  },

  heroDescription: {
    maxWidth: 280,
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },

  heroButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
    backgroundColor: ORANGE_DARK,
    marginTop: 20,
  },

  heroButtonPressed: {
    opacity: 0.82,
  },

  heroButtonText: {
    color: SURFACE,
    fontSize: 14,
    fontWeight: "800",
  },

  heroDecorationLarge: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.09)",
    right: -65,
    bottom: -70,
  },

  heroDecorationSmall: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.08)",
    right: 18,
    top: 16,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 30,
  },

  quickAction: {
    width: "48.5%",
    minHeight: 150,
    padding: 16,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    marginBottom: 16,
  },

  quickActionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "800",
  },

  quickActionDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },

  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
  },

  featureDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  sellCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#111827",
  },

  sellContent: {
    flex: 1,
    paddingRight: 16,
  },

  sellEyebrow: {
    color: ORANGE,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  sellTitle: {
    color: SURFACE,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 5,
  },

  sellDescription: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  sellButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
  },

  pressed: {
    opacity: 0.7,
  },
});
