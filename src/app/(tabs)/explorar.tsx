import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useExploreData } from "@/features/explore/useExploreData";

import type {
  ExploreListing,
  ExploreService,
  ExploreStore,
} from "@/features/explore/exploreTypes";

const ORANGE = "#F97316";
const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";
const ORANGE_SOFT = "#FFF7ED";
const ERROR_BACKGROUND = "#FEF2F2";
const ERROR_TEXT = "#B91C1C";

type ExploreFilter =
  | "Todos"
  | "Productos"
  | "Servicios"
  | "Tiendas";

const filters: ExploreFilter[] = [
  "Todos",
  "Productos",
  "Servicios",
  "Tiendas",
];

function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function includesSearch(
  query: string,
  values: readonly unknown[],
): boolean {
  if (!query) {
    return true;
  }

  return values.some((value) =>
    normalizeSearchText(value).includes(query),
  );
}

function formatCurrency(value: number): string {
  const safeValue =
    Number.isFinite(value) && value >= 0
      ? Math.round(value)
      : 0;

  return `$ ${safeValue.toLocaleString("es-AR")}`;
}

function getServicePriceLabel(
  service: ExploreService,
): string {
  if (service.priceType === "quote") {
    return "A consultar";
  }

  const price = formatCurrency(service.price);

  if (service.priceType === "from") {
    return `Desde ${price}`;
  }

  if (service.priceType === "hourly") {
    return `${price} / hora`;
  }

  return price;
}

function getStorePlanLabel(
  store: ExploreStore,
): string | null {
  if (store.plan === "premium_plus") {
    return "Premium Plus";
  }

  if (store.plan === "premium") {
    return "Premium";
  }

  return null;
}

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<ExploreFilter>("Todos");

  const {
    data,
    error,
    isLoading,
    reload,
  } = useExploreData();

  const normalizedQuery = useMemo(
    () => normalizeSearchText(query),
    [query],
  );

  const filteredData = useMemo(() => {
    if (!data) {
      return {
        listings: [] as ExploreListing[],
        services: [] as ExploreService[],
        stores: [] as ExploreStore[],
      };
    }

    const listings = data.listings.filter((listing) =>
      includesSearch(normalizedQuery, [
        listing.title,
        listing.description,
        listing.category,
        listing.location,
        listing.userName,
        listing.storeName,
      ]),
    );

    const services = data.services.filter((service) =>
      includesSearch(normalizedQuery, [
        service.title,
        service.description,
        service.category,
        service.specialty,
        service.userName,
        service.city,
        service.province,
        ...service.keywords,
        ...service.zones,
      ]),
    );

    const stores = data.stores.filter((store) =>
      includesSearch(normalizedQuery, [
        store.name,
        store.description,
        store.category,
        store.address,
        store.city,
        store.province,
      ]),
    );

    return {
      listings,
      services,
      stores,
    };
  }, [data, normalizedQuery]);

  const visibleResultCount = useMemo(() => {
    if (activeFilter === "Productos") {
      return filteredData.listings.length;
    }

    if (activeFilter === "Servicios") {
      return filteredData.services.length;
    }

    if (activeFilter === "Tiendas") {
      return filteredData.stores.length;
    }

    return (
      filteredData.listings.length +
      filteredData.services.length +
      filteredData.stores.length
    );
  }, [activeFilter, filteredData]);

  const showProducts =
    activeFilter === "Todos" ||
    activeFilter === "Productos";

  const showServices =
    activeFilter === "Todos" ||
    activeFilter === "Servicios";

  const showStores =
    activeFilter === "Todos" ||
    activeFilter === "Tiendas";

  const hasSearchQuery =
    query.trim().length > 0;

  const showDiscovery =
    !hasSearchQuery &&
    activeFilter === "Todos";

  const showResultSectionHeaders =
    activeFilter === "Todos" ||
    hasSearchQuery;

  const showInitialLoading =
    isLoading && data === null;

  const showEmptyState =
    !showInitialLoading &&
    !error &&
    visibleResultCount === 0;

  const resultsTitle = query.trim()
    ? `Resultados para “${query.trim()}”`
    : activeFilter === "Todos"
      ? "Publicaciones"
      : activeFilter;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && data !== null}
            onRefresh={() => {
              void reload();
            }}
            tintColor={ORANGE}
            colors={[ORANGE]}
          />
        }
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
            placeholderTextColor={MUTED_LIGHT}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Buscar en Eziel"
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
                tintColor={MUTED_LIGHT}
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
            const active =
              activeFilter === filter;

            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{
                  selected: active,
                }}
                onPress={() =>
                  setActiveFilter(filter)
                }
                style={({ pressed }) => [
                  styles.filterChip,
                  active &&
                    styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {showDiscovery && (
          <>
            <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>
              Descubrí Eziel
            </Text>

            <Text style={styles.sectionSubtitle}>
              Elegí una categoría o empezá buscando arriba.
            </Text>
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
            onPress={() =>
              setActiveFilter("Productos")
            }
          />

          <CategoryCard
            title="Servicios"
            description="Encontrá profesionales y soluciones."
            icon={{
              ios: "wrench.and.screwdriver.fill",
              android: "handyman",
              web: "handyman",
            }}
            onPress={() =>
              setActiveFilter("Servicios")
            }
          />

          <CategoryCard
            title="Tiendas"
            description="Descubrí negocios y comercios locales."
            icon={{
              ios: "storefront.fill",
              android: "storefront",
              web: "storefront",
            }}
            onPress={() =>
              setActiveFilter("Tiendas")
            }
          />
            </View>
          </>
        )}

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {resultsTitle}
          </Text>

          <Text style={styles.resultsSubtitle}>
            {showInitialLoading
              ? "Cargando contenido..."
              : `${visibleResultCount} ${
                  visibleResultCount === 1
                    ? "resultado"
                    : "resultados"
                }`}
          </Text>
        </View>

        {showInitialLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator
              size="large"
              color={ORANGE}
            />

            <Text style={styles.loadingTitle}>
              Cargando Eziel
            </Text>

            <Text style={styles.loadingDescription}>
              Estamos buscando productos, servicios y tiendas.
            </Text>
          </View>
        )}

        {!showInitialLoading && error && (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>
              No pudimos cargar Explorar
            </Text>

            <Text style={styles.errorDescription}>
              {error}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void reload();
              }}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryButtonText}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        )}

        {!showInitialLoading &&
          !error &&
          visibleResultCount > 0 && (
            <View style={styles.results}>
              {showProducts &&
                filteredData.listings.length >
                  0 && (
                  <ResultSection
                    title="Productos"
                    showHeader={showResultSectionHeaders}
                    count={
                      filteredData.listings
                        .length
                    }
                  >
                    {filteredData.listings.map(
                      (listing) => (
                        <ProductResultCard
                          key={listing.id}
                          listing={listing}
                        />
                      ),
                    )}
                  </ResultSection>
                )}

              {showServices &&
                filteredData.services.length >
                  0 && (
                  <ResultSection
                    title="Servicios"
                    showHeader={showResultSectionHeaders}
                    count={
                      filteredData.services
                        .length
                    }
                  >
                    {filteredData.services.map(
                      (service) => (
                        <ServiceResultCard
                          key={service.id}
                          service={service}
                        />
                      ),
                    )}
                  </ResultSection>
                )}

              {showStores &&
                filteredData.stores.length >
                  0 && (
                  <ResultSection
                    title="Tiendas"
                    showHeader={showResultSectionHeaders}
                    count={
                      filteredData.stores.length
                    }
                  >
                    {filteredData.stores.map(
                      (store) => (
                        <StoreResultCard
                          key={store.id}
                          store={store}
                        />
                      ),
                    )}
                  </ResultSection>
                )}
            </View>
          )}

        {showEmptyState && (
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

            <Text style={styles.emptyTitle}>
              No encontramos resultados
            </Text>

            <Text style={styles.emptyDescription}>
              Probá con otra búsqueda o elegí una categoría diferente.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface CategoryCardProps {
  title: string;
  description: string;
  icon: {
    ios:
      | "bag.fill"
      | "wrench.and.screwdriver.fill"
      | "storefront.fill";
    android:
      | "shopping_bag"
      | "handyman"
      | "storefront";
    web:
      | "shopping_bag"
      | "handyman"
      | "storefront";
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
      style={({ pressed }) => [
        styles.categoryCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.categoryIcon}>
        <SymbolView
          name={icon}
          size={24}
          tintColor={ORANGE}
        />
      </View>

      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>
          {title}
        </Text>

        <Text
          style={styles.categoryDescription}
        >
          {description}
        </Text>
      </View>

      <SymbolView
        name={{
          ios: "chevron.right",
          android: "chevron_right",
          web: "chevron_right",
        }}
        size={21}
        tintColor={MUTED_LIGHT}
      />
    </Pressable>
  );
}

interface ResultSectionProps {
  title: string;
  count: number;
  showHeader?: boolean;
  children: React.ReactNode;
}

function ResultSection({
  title,
  count,
  showHeader = true,
  children,
}: ResultSectionProps) {
  return (
    <View style={styles.resultSection}>
      {showHeader && (
        <View style={styles.resultSectionHeader}>
          <Text style={styles.resultSectionTitle}>
            {title}
          </Text>

          <Text style={styles.resultSectionCount}>
            {count}
          </Text>
        </View>
      )}

      <View style={styles.resultList}>
        {children}
      </View>
    </View>
  );
}

function ProductResultCard({
  listing,
}: {
  listing: ExploreListing;
}) {
  return (
    <View style={styles.resultCard}>
      <ResultImage
        imageUrl={listing.imageUrl}
        kind="product"
        accessibilityLabel={`Imagen de ${listing.title}`}
      />

      <View style={styles.resultCardContent}>
        <View style={styles.resultTopRow}>
          <Text
            numberOfLines={1}
            style={styles.resultCategory}
          >
            {listing.category}
          </Text>

          <Text style={styles.productPrice}>
            {formatCurrency(listing.price)}
          </Text>
        </View>

        <Text
          numberOfLines={2}
          style={styles.resultTitle}
        >
          {listing.title}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.resultMeta}
        >
          {listing.location ||
            listing.storeName ||
            listing.userName}
        </Text>

        {listing.availableUnits > 1 && (
          <Text style={styles.stockText}>
            {listing.availableUnits} disponibles
          </Text>
        )}
      </View>
    </View>
  );
}

function ServiceResultCard({
  service,
}: {
  service: ExploreService;
}) {
  return (
    <View style={styles.resultCard}>
      <ResultImage
        imageUrl={service.imageUrl}
        kind="service"
        accessibilityLabel={`Imagen de ${service.title}`}
      />

      <View style={styles.resultCardContent}>
        <View style={styles.resultTopRow}>
          <Text
            numberOfLines={1}
            style={styles.resultCategory}
          >
            {service.specialty ||
              service.category}
          </Text>

          {service.verified && (
            <View style={styles.verifiedBadge}>
              <Text
                style={styles.verifiedBadgeText}
              >
                Verificado
              </Text>
            </View>
          )}
        </View>

        <Text
          numberOfLines={2}
          style={styles.resultTitle}
        >
          {service.title}
        </Text>

        <Text style={styles.servicePrice}>
          {getServicePriceLabel(service)}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.resultMeta}
        >
          {[service.city, service.province]
            .filter(Boolean)
            .join(", ")}
        </Text>
      </View>
    </View>
  );
}

function StoreResultCard({
  store,
}: {
  store: ExploreStore;
}) {
  const planLabel = getStorePlanLabel(store);

  return (
    <View style={styles.resultCard}>
      <ResultImage
        imageUrl={store.logoUrl}
        kind="store"
        accessibilityLabel={`Logo de ${store.name}`}
      />

      <View style={styles.resultCardContent}>
        <View style={styles.resultTopRow}>
          <Text
            numberOfLines={1}
            style={styles.resultCategory}
          >
            {store.category}
          </Text>

          {planLabel && (
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>
                {planLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.storeNameRow}>
          <Text
            numberOfLines={2}
            style={[
              styles.resultTitle,
              styles.storeName,
            ]}
          >
            {store.name}
          </Text>

          {store.verified && (
            <Text
              accessibilityLabel="Tienda verificada"
              style={styles.verifiedMark}
            >
              ✓
            </Text>
          )}
        </View>

        <Text
          numberOfLines={2}
          style={styles.storeDescription}
        >
          {store.description ||
            "Comercio local en Eziel."}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.resultMeta}
        >
          {[store.city, store.province]
            .filter(Boolean)
            .join(", ")}
        </Text>
      </View>
    </View>
  );
}

type ResultImageKind =
  | "product"
  | "service"
  | "store";

function ResultImage({
  imageUrl,
  kind,
  accessibilityLabel,
}: {
  imageUrl: string;
  kind: ResultImageKind;
  accessibilityLabel: string;
}) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        resizeMode={
          kind === "store"
            ? "contain"
            : "cover"
        }
        accessible
        accessibilityLabel={
          accessibilityLabel
        }
        style={[
          styles.resultImage,
          kind === "store" &&
            styles.storeLogoImage,
        ]}
      />
    );
  }

  const icon =
    kind === "product"
      ? {
          ios: "bag.fill" as const,
          android:
            "shopping_bag" as const,
          web: "shopping_bag" as const,
        }
      : kind === "service"
        ? {
            ios: "wrench.and.screwdriver.fill" as const,
            android: "handyman" as const,
            web: "handyman" as const,
          }
        : {
            ios: "storefront.fill" as const,
            android: "storefront" as const,
            web: "storefront" as const,
          };

  return (
    <View style={styles.resultImageFallback}>
      <SymbolView
        name={icon}
        size={28}
        tintColor={ORANGE}
      />
    </View>
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

  sectionHeaderCopy: {
    flex: 1,
    paddingRight: 12,
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
    backgroundColor: ORANGE_SOFT,
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

  loadingState: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 44,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  loadingTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 16,
  },

  loadingDescription: {
    maxWidth: 290,
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },

  errorState: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: ERROR_BACKGROUND,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  errorTitle: {
    color: ERROR_TEXT,
    fontSize: 16,
    fontWeight: "800",
  },

  errorDescription: {
    color: ERROR_TEXT,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },

  retryButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: ERROR_TEXT,
    marginTop: 16,
  },

  retryButtonText: {
    color: SURFACE,
    fontSize: 13,
    fontWeight: "800",
  },

  results: {
    gap: 28,
  },

  resultSection: {
    gap: 12,
  },

  resultSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  resultSectionTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
  },

  resultSectionCount: {
    minWidth: 28,
    textAlign: "center",
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: ORANGE_SOFT,
  },

  resultList: {
    gap: 10,
  },

  resultCard: {
    minHeight: 124,
    flexDirection: "row",
    gap: 14,
    padding: 12,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  resultImage: {
    width: 100,
    height: 100,
    borderRadius: 15,
    backgroundColor: ORANGE_SOFT,
  },

  storeLogoImage: {
    resizeMode: "contain",
  },

  resultImageFallback: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: ORANGE_SOFT,
  },

  resultCardContent: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
  },

  resultTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  resultCategory: {
    flex: 1,
    color: ORANGE,
    fontSize: 11,
    fontWeight: "800",
  },

  resultTitle: {
    color: TEXT,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    marginTop: 6,
  },

  resultMeta: {
    color: MUTED,
    fontSize: 12,
    marginTop: 7,
  },

  productPrice: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "900",
  },

  servicePrice: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },

  stockText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
  },

  verifiedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: ORANGE_SOFT,
  },

  verifiedBadgeText: {
    color: ORANGE,
    fontSize: 9,
    fontWeight: "900",
  },

  planBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: ORANGE_SOFT,
  },

  planBadgeText: {
    color: ORANGE,
    fontSize: 9,
    fontWeight: "900",
  },

  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  storeName: {
    flexShrink: 1,
  },

  verifiedMark: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 5,
  },

  storeDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
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
    backgroundColor: ORANGE_SOFT,
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
