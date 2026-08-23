import { SymbolView } from "expo-symbols";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useListingDetail } from "@/features/listing-detail/useListingDetail";

import type {
  ExploreListing,
  ExploreStore,
} from "@/features/explore/exploreTypes";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";
const GREEN = "#15803D";
const GREEN_SOFT = "#F0FDF4";
const AMBER = "#C2410C";
const AMBER_SOFT = "#FFF7ED";

function formatCurrency(value: number): string {
  const safeValue =
    Number.isFinite(value) && value >= 0
      ? Math.round(value)
      : 0;

  return `$ ${safeValue.toLocaleString("es-AR")}`;
}

function getTimestampMillis(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (value && typeof value === "object") {
    const candidate = value as {
      toDate?: () => Date;
    };

    if (typeof candidate.toDate === "function") {
      return candidate.toDate().getTime();
    }
  }

  return 0;
}

function getPublishedLabel(value: unknown): string {
  const timestamp = getTimestampMillis(value);

  if (!timestamp) {
    return "Fecha no disponible";
  }

  const elapsed = Date.now() - timestamp;

  if (elapsed < 60_000) {
    return "Publicado recién";
  }

  const minutes = Math.floor(
    elapsed / 60_000,
  );

  if (minutes < 60) {
    return `Publicado hace ${minutes} ${
      minutes === 1 ? "minuto" : "minutos"
    }`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Publicado hace ${hours} ${
      hours === 1 ? "hora" : "horas"
    }`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `Publicado hace ${days} ${
      days === 1 ? "día" : "días"
    }`;
  }

  const date = new Date(timestamp);

  return `Publicado el ${date.toLocaleDateString(
    "es-AR",
  )}`;
}

function getStatusInfo(listing: ExploreListing) {
  if (listing.status === "sold") {
    return {
      label: "Vendido",
      color: MUTED,
      backgroundColor: "#F1F5F9",
    };
  }

  if (
    listing.status === "pending_confirmation"
  ) {
    return {
      label: "En confirmación",
      color: AMBER,
      backgroundColor: AMBER_SOFT,
    };
  }

  return {
    label: "Disponible",
    color: GREEN,
    backgroundColor: GREEN_SOFT,
  };
}

export default function ListingDetailScreen() {
  const params =
    useLocalSearchParams<{ id?: string }>();

  const listingId =
    typeof params.id === "string"
      ? params.id
      : "";

  const {
    listing,
    store,
    error,
    isLoading,
    reload,
  } = useListingDetail(listingId);

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <DetailHeader />

        <View style={styles.centerState}>
          <ActivityIndicator
            size="large"
            color={ORANGE}
          />

          <Text style={styles.stateTitle}>
            Cargando publicación
          </Text>

          <Text style={styles.stateDescription}>
            Estamos preparando todos los detalles.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!listing || error) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <DetailHeader />

        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <SymbolView
              name={{
                ios: "exclamationmark.triangle.fill",
                android: "warning",
                web: "warning",
              }}
              size={30}
              tintColor={ORANGE}
            />
          </View>

          <Text style={styles.stateTitle}>
            No pudimos abrir esta publicación
          </Text>

          <Text style={styles.stateDescription}>
            {error ||
              "La publicación fue eliminada o ya no existe."}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <DetailHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ListingGallery listing={listing} />

        <ListingMainInfo listing={listing} />

        <ListingStock listing={listing} />

        <SectionCard title="Descripción">
          <Text style={styles.description}>
            {listing.description ||
              "El vendedor no agregó una descripción."}
          </Text>
        </SectionCard>

        <SectionCard title="Detalles">
          <DetailRow
            label="Categoría"
            value={listing.category}
          />

          <DetailRow
            label="Ubicación"
            value={
              listing.location || "Neuquén"
            }
          />

          <DetailRow
            label="Publicado"
            value={getPublishedLabel(
              listing.createdAt,
            )}
          />

          <DetailRow
            label="Stock total"
            value={`${listing.stockTotal} ${
              listing.stockTotal === 1
                ? "unidad"
                : "unidades"
            }`}
          />

          <DetailRow
            label="Disponibles"
            value={String(
              listing.availableUnits,
            )}
            isLast
          />
        </SectionCard>

        <SellerCard
          listing={listing}
          store={store}
        />

        <View style={styles.productionNotice}>
          <SymbolView
            name={{
              ios: "shield.checkered",
              android: "verified_user",
              web: "verified_user",
            }}
            size={19}
            tintColor={ORANGE}
          />

          <Text style={styles.productionNoticeText}>
            Revisá siempre el producto y acordá la
            entrega directamente con el vendedor.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailHeader() {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.headerButton,
          pressed && styles.pressed,
        ]}
      >
        <SymbolView
          name={{
            ios: "chevron.left",
            android: "arrow_back",
            web: "arrow_back",
          }}
          size={23}
          tintColor={TEXT}
        />
      </Pressable>

      <View style={styles.headerCopy}>
        <Text style={styles.headerBrand}>
          EZIEL
        </Text>

        <Text style={styles.headerTitle}>
          Publicación
        </Text>
      </View>

      <View style={styles.headerSpacer} />
    </View>
  );
}

function ListingGallery({
  listing,
}: {
  listing: ExploreListing;
}) {
  const imageUrls = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...(Array.isArray(
              listing.imageUrls,
            )
              ? listing.imageUrls
              : []),
            listing.imageUrl,
          ]
            .map((url) =>
              String(url ?? "").trim(),
            )
            .filter(Boolean),
        ),
      ),
    [
      listing.imageUrl,
      listing.imageUrls,
    ],
  );

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const [imageFailed, setImageFailed] =
    useState(false);

  const safeIndex =
    imageUrls.length === 0
      ? 0
      : Math.min(
          selectedIndex,
          imageUrls.length - 1,
        );

  const selectedImage =
    imageUrls[safeIndex] || "";

  return (
    <View style={styles.galleryCard}>
      <View style={styles.mainImageShell}>
        {selectedImage && !imageFailed ? (
          <Image
            source={{ uri: selectedImage }}
            resizeMode="cover"
            accessibilityLabel={`Imagen de ${listing.title}`}
            onError={() =>
              setImageFailed(true)
            }
            style={styles.mainImage}
          />
        ) : (
          <View style={styles.imageFallback}>
            <SymbolView
              name={{
                ios: "photo.fill",
                android: "image",
                web: "image",
              }}
              size={44}
              tintColor={ORANGE}
            />

            <Text
              style={styles.imageFallbackText}
            >
              {listing.category}
            </Text>
          </View>
        )}

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {listing.category}
          </Text>
        </View>
      </View>

      {imageUrls.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.thumbnailList
          }
        >
          {imageUrls.map((url, index) => {
            const active =
              index === safeIndex;

            return (
              <Pressable
                key={`${url}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`Ver imagen ${
                  index + 1
                }`}
                onPress={() => {
                  setSelectedIndex(index);
                  setImageFailed(false);
                }}
                style={[
                  styles.thumbnailButton,
                  active &&
                    styles.thumbnailButtonActive,
                ]}
              >
                <Image
                  source={{ uri: url }}
                  resizeMode="cover"
                  style={styles.thumbnailImage}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function ListingMainInfo({
  listing,
}: {
  listing: ExploreListing;
}) {
  const status = getStatusInfo(listing);

  return (
    <View style={styles.mainInfoCard}>
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor:
              status.backgroundColor,
          },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                status.color,
            },
          ]}
        />

        <Text
          style={[
            styles.statusBadgeText,
            {
              color: status.color,
            },
          ]}
        >
          {status.label}
        </Text>
      </View>

      <Text style={styles.listingTitle}>
        {listing.title}
      </Text>

      <Text style={styles.price}>
        {formatCurrency(listing.price)}
      </Text>

      <View style={styles.metaRow}>
        <SymbolView
          name={{
            ios: "mappin.and.ellipse",
            android: "location_on",
            web: "location_on",
          }}
          size={17}
          tintColor={MUTED}
        />

        <Text style={styles.metaText}>
          {listing.location || "Neuquén"}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <SymbolView
          name={{
            ios: "eye.fill",
            android: "visibility",
            web: "visibility",
          }}
          size={17}
          tintColor={MUTED}
        />

        <Text style={styles.metaText}>
          {listing.views}{" "}
          {listing.views === 1
            ? "vista"
            : "vistas"}
        </Text>
      </View>
    </View>
  );
}

function ListingStock({
  listing,
}: {
  listing: ExploreListing;
}) {
  return (
    <View style={styles.stockGrid}>
      <StockItem
        label="Disponibles"
        value={listing.availableUnits}
        tone="available"
      />

      <StockItem
        label="En confirmación"
        value={listing.reservedUnits}
        tone={
          listing.reservedUnits > 0
            ? "pending"
            : "neutral"
        }
      />

      <StockItem
        label="Vendidas"
        value={listing.soldUnits}
        tone="neutral"
      />
    </View>
  );
}

type StockTone =
  | "available"
  | "pending"
  | "neutral";

function StockItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: StockTone;
}) {
  const valueColor =
    tone === "available"
      ? GREEN
      : tone === "pending"
        ? AMBER
        : TEXT;

  return (
    <View style={styles.stockItem}>
      <Text style={styles.stockLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.stockValue,
          { color: valueColor },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {children}
    </View>
  );
}

function DetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        isLast && styles.detailRowLast,
      ]}
    >
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function SellerCard({
  listing,
  store,
}: {
  listing: ExploreListing;
  store: ExploreStore | null;
}) {
  const sellerName =
    store?.name ||
    listing.storeName ||
    listing.userName ||
    "Usuario";

  const initials = sellerName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sellerTopRow}>
        <Text style={styles.sectionTitle}>
          {store ? "Tienda" : "Vendedor"}
        </Text>

        {store?.verified && (
          <View style={styles.verifiedBadge}>
            <Text
              style={styles.verifiedBadgeText}
            >
              Verificada
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sellerContent}>
        {store?.logoUrl ? (
          <Image
            source={{ uri: store.logoUrl }}
            resizeMode="cover"
            accessibilityLabel={`Logo de ${store.name}`}
            style={styles.sellerAvatar}
          />
        ) : (
          <View
            style={[
              styles.sellerAvatar,
              styles.sellerAvatarFallback,
            ]}
          >
            <Text
              style={
                styles.sellerInitials
              }
            >
              {initials || "EZ"}
            </Text>
          </View>
        )}

        <View style={styles.sellerCopy}>
          <Text style={styles.sellerName}>
            {sellerName}
          </Text>

          <Text style={styles.sellerMeta}>
            {store
              ? [
                  store.category,
                  store.city,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Vendedor de Eziel"}
          </Text>

          {listing.storeName && !store && (
            <Text style={styles.sellerMeta}>
              {listing.storeName}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER,
  },

  headerCopy: {
    flex: 1,
    alignItems: "center",
  },

  headerBrand: {
    color: ORANGE,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  headerTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },

  headerSpacer: {
    width: 44,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    gap: 14,
    padding: 18,
    paddingBottom: 42,
  },

  galleryCard: {
    gap: 10,
  },

  mainImageShell: {
    overflow: "hidden",
    position: "relative",
    width: "100%",
    aspectRatio: 1.08,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  mainImage: {
    width: "100%",
    height: "100%",
  },

  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: ORANGE_SOFT,
  },

  imageFallbackText: {
    color: ORANGE_DARK,
    fontSize: 13,
    fontWeight: "800",
  },

  categoryBadge: {
    position: "absolute",
    left: 14,
    bottom: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
  },

  categoryBadgeText: {
    color: TEXT,
    fontSize: 11,
    fontWeight: "800",
  },

  thumbnailList: {
    gap: 9,
    paddingHorizontal: 1,
  },

  thumbnailButton: {
    width: 66,
    height: 66,
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: SURFACE,
  },

  thumbnailButtonActive: {
    borderColor: ORANGE,
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  mainInfoCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  listingTitle: {
    color: TEXT,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 13,
  },

  price: {
    color: ORANGE_DARK,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 10,
    marginBottom: 16,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },

  metaText: {
    flex: 1,
    color: MUTED,
    fontSize: 13,
    fontWeight: "600",
  },

  stockGrid: {
    flexDirection: "row",
    gap: 8,
  },

  stockItem: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderRadius: 17,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  stockLabel: {
    minHeight: 30,
    color: MUTED,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },

  stockValue: {
    fontSize: 21,
    fontWeight: "900",
    marginTop: 4,
  },

  sectionCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  description: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 22,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  detailLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  detailValue: {
    flex: 1,
    color: TEXT,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    textAlign: "right",
  },

  sellerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  verifiedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: ORANGE_SOFT,
  },

  verifiedBadgeText: {
    color: ORANGE_DARK,
    fontSize: 10,
    fontWeight: "900",
  },

  sellerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  sellerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: ORANGE_SOFT,
  },

  sellerAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },

  sellerInitials: {
    color: ORANGE_DARK,
    fontSize: 18,
    fontWeight: "900",
  },

  sellerCopy: {
    flex: 1,
  },

  sellerName: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
  },

  sellerMeta: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  productionNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: ORANGE_SOFT,
  },

  productionNoticeText: {
    flex: 1,
    color: "#9A3412",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
  },

  stateIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: ORANGE_SOFT,
    marginBottom: 18,
  },

  stateTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18,
  },

  stateDescription: {
    maxWidth: 300,
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: ORANGE,
    marginTop: 22,
  },

  retryButtonText: {
    color: SURFACE,
    fontSize: 13,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.72,
  },
});
