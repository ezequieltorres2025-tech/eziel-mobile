import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#F97316";
const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

type ExploreFilter = "Todos" | "Productos" | "Servicios" | "Tiendas";

const filters: ExploreFilter[] = ["Todos", "Productos", "Servicios", "Tiendas"];

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>("Todos");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>EZIEL</Text>

          <Text style={styles.title}>Explorar</Text>

          <Text style={styles.subtitle}>
            Encontrá productos, servicios y comercios cerca tuyo.
          </Text>
        </View>

        <View style={styles.searchBar}>
          <SymbolView
            name={{
              ios: "magnifyingglass",
              android: "search",
              web: "search",
            }}
            size={21}
            tintColor={MUTED}
          />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="¿Qué estás buscando?"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />

          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
              hitSlop={10}
              onPress={() => setQuery("")}
            >
              <SymbolView
                name={{
                  ios: "xmark.circle.fill",
                  android: "cancel",
                  web: "cancel",
                }}
                size={20}
                tintColor="#94A3B8"
              />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => {
            const active = activeFilter === filter;

            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                onPress={() => setActiveFilter(filter)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Descubrí Eziel</Text>

            <Text style={styles.sectionSubtitle}>
              Elegí una categoría o empezá buscando arriba.
            </Text>
          </View>

          <View style={styles.filterButton}>
            <SymbolView
              name={{
                ios: "line.3.horizontal.decrease",
                android: "filter_list",
                web: "filter_list",
              }}
              size={20}
              tintColor={TEXT}
            />
          </View>
        </View>

        <View style={styles.categoryGrid}>
          <CategoryCard
            title="Productos"
            description="Tecnología, hogar, vehículos y más."
            icon={{
              ios: "bag.fill",
              android: "shopping_bag",
              web: "shopping_bag",
            }}
            onPress={() => setActiveFilter("Productos")}
          />

          <CategoryCard
            title="Servicios"
            description="Encontrá profesionales y soluciones."
            icon={{
              ios: "wrench.and.screwdriver.fill",
              android: "handyman",
              web: "handyman",
            }}
            onPress={() => setActiveFilter("Servicios")}
          />

          <CategoryCard
            title="Tiendas"
            description="Descubrí negocios y comercios locales."
            icon={{
              ios: "storefront.fill",
              android: "storefront",
              web: "storefront",
            }}
            onPress={() => setActiveFilter("Tiendas")}
          />
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {query
              ? `Resultados para “${query}”`
              : activeFilter === "Todos"
                ? "Publicaciones"
                : activeFilter}
          </Text>

          <Text style={styles.resultsSubtitle}>
            Los resultados aparecerán en esta sección.
          </Text>
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <SymbolView
              name={{
                ios: "magnifyingglass",
                android: "search",
                web: "search",
              }}
              size={28}
              tintColor={ORANGE}
            />
          </View>

          <Text style={styles.emptyTitle}>Empezá a explorar</Text>

          <Text style={styles.emptyDescription}>
            Buscá algo específico o elegí una categoría para encontrar lo que
            necesitás.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface CategoryCardProps {
  title: string;
  description: string;
  icon: {
    ios: "bag.fill" | "wrench.and.screwdriver.fill" | "storefront.fill";
    android: "shopping_bag" | "handyman" | "storefront";
    web: "shopping_bag" | "handyman" | "storefront";
  };
  onPress: () => void;
}

function CategoryCard({
  title,
  description,
  icon,
  onPress,
}: CategoryCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}
    >
      <View style={styles.categoryIcon}>
        <SymbolView name={icon} size={24} tintColor={ORANGE} />
      </View>

      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>{title}</Text>

        <Text style={styles.categoryDescription}>{description}</Text>
      </View>

      <SymbolView
        name={{
          ios: "chevron.right",
          android: "chevron_right",
          web: "chevron_right",
        }}
        size={21}
        tintColor="#94A3B8"
      />
    </Pressable>
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
    marginBottom: 20,
  },

  brand: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.4,
    marginBottom: 5,
  },

  title: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.9,
  },

  subtitle: {
    maxWidth: 340,
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },

  searchBar: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
  },

  searchInput: {
    flex: 1,
    minHeight: 54,
    color: TEXT,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },

  filters: {
    gap: 9,
    paddingVertical: 16,
  },

  filterChip: {
    height: 38,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  filterChipActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },

  filterText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
  },

  filterTextActive: {
    color: SURFACE,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 14,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },

  filterButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  categoryGrid: {
    gap: 10,
    marginBottom: 30,
  },

  categoryCard: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  categoryIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
  },

  categoryContent: {
    flex: 1,
  },

  categoryTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
  },

  categoryDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  resultsHeader: {
    marginBottom: 14,
  },

  resultsTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  resultsSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#FFF7ED",
    marginBottom: 16,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
  },

  emptyDescription: {
    maxWidth: 290,
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },

  pressed: {
    opacity: 0.7,
  },
});
