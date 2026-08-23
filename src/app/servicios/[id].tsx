import { SymbolView } from "expo-symbols";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useServiceDetail } from "@/features/service-detail/useServiceDetail";

import type {
  ExploreService,
  ServiceResponseTime,
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
const DARK = "#020617";

function formatCurrency(value: number): string {
  const safeValue =
    Number.isFinite(value) && value >= 0
      ? Math.round(value)
      : 0;

  return `$ ${safeValue.toLocaleString("es-AR")}`;
}

function getPriceLabel(
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

function getResponseTimeLabel(
  value: ServiceResponseTime,
): string {
  if (value === "fast") {
    return "Respuesta rápida";
  }

  if (value === "normal") {
    return "Respuesta normal";
  }

  if (value === "slow") {
    return "Puede demorar";
  }

  return "No informado";
}

function getExperienceLabel(
  years: number,
): string {
  if (
    !Number.isFinite(years) ||
    years <= 0
  ) {
    return "No informada";
  }

  const normalized = Math.trunc(years);

  return `${normalized} ${
    normalized === 1 ? "año" : "años"
  }`;
}

function getRatingLabel(
  service: ExploreService,
): string {
  if (service.rating <= 0) {
    return "Nuevo";
  }

  return service.rating.toFixed(1);
}

function getReviewLabel(
  service: ExploreService,
): string {
  if (service.reviewCount <= 0) {
    return "Sin opiniones";
  }

  return `${service.reviewCount} ${
    service.reviewCount === 1
      ? "opinión"
      : "opiniones"
  }`;
}

async function openExternalUrl(
  url: string,
  errorMessage: string,
) {
  try {
    const supported =
      await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(
        "No se pudo abrir",
        errorMessage,
      );
      return;
    }

    await Linking.openURL(url);
  } catch (error) {
    console.error(
      "Error abriendo enlace externo:",
      error,
    );

    Alert.alert(
      "No se pudo abrir",
      errorMessage,
    );
  }
}

function normalizePhoneNumber(
  value: string,
): string {
  return value.replace(/\D/g, "");
}

export default function ServiceDetailScreen() {
  const params =
    useLocalSearchParams<{ id?: string }>();

  const serviceId =
    typeof params.id === "string"
      ? params.id
      : "";

  const {
    service,
    error,
    isLoading,
    reload,
  } = useServiceDetail(serviceId);

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
            Cargando servicio
          </Text>

          <Text style={styles.stateDescription}>
            Estamos preparando el perfil profesional.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service || error) {
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
                ios: "wrench.and.screwdriver.fill",
                android: "handyman",
                web: "handyman",
              }}
              size={31}
              tintColor={ORANGE}
            />
          </View>

          <Text style={styles.stateTitle}>
            Servicio no disponible
          </Text>

          <Text style={styles.stateDescription}>
            {error ||
              "El servicio fue eliminado o ya no está publicado."}
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
        <ServiceHero service={service} />

        <ServicePriceCard service={service} />

        <MetricsGrid service={service} />

        <SectionCard title="Sobre el servicio">
          <Text style={styles.description}>
            {service.description ||
              "El profesional no agregó una descripción."}
          </Text>
        </SectionCard>

        <ProfessionalCard service={service} />

        {service.zones.length > 0 && (
          <SectionCard title="Zonas donde trabaja">
            <View style={styles.pillWrap}>
              {service.zones.map(
                (zone, index) => (
                  <View
                    key={`${zone}-${index}`}
                    style={[
                      styles.infoPill,
                      index < 2 &&
                        styles.infoPillHighlighted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.infoPillText,
                        index < 2 &&
                          styles.infoPillTextHighlighted,
                      ]}
                    >
                      {zone}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </SectionCard>
        )}

        {service.keywords.length > 0 && (
          <SectionCard title="Palabras clave">
            <View style={styles.pillWrap}>
              {service.keywords.map(
                (keyword) => (
                  <View
                    key={keyword}
                    style={styles.keywordPill}
                  >
                    <Text
                      style={styles.keywordText}
                    >
                      {keyword}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </SectionCard>
        )}

        <ContactCard service={service} />

        <View style={styles.trustNotice}>
          <SymbolView
            name={{
              ios: "shield.checkered",
              android: "verified_user",
              web: "verified_user",
            }}
            size={19}
            tintColor={ORANGE}
          />

          <Text style={styles.trustNoticeText}>
            La consulta se realiza directamente con el profesional. Acordá precio, alcance y condiciones antes de contratar.
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
          Servicio
        </Text>
      </View>

      <View style={styles.headerSpacer} />
    </View>
  );
}

function ServiceHero({
  service,
}: {
  service: ExploreService;
}) {
  const imageUrls = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...service.imageUrls,
            service.imageUrl,
          ]
            .map((url) =>
              String(url ?? "").trim(),
            )
            .filter(Boolean),
        ),
      ),
    [service.imageUrl, service.imageUrls],
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

  const profileTitle =
    service.specialty || service.title;

  return (
    <View style={styles.heroBlock}>
      <View style={styles.heroImageShell}>
        {selectedImage && !imageFailed ? (
          <Image
            source={{ uri: selectedImage }}
            resizeMode="cover"
            accessibilityLabel={`Imagen de ${service.title}`}
            onError={() =>
              setImageFailed(true)
            }
            style={styles.heroImage}
          />
        ) : (
          <View style={styles.heroFallback}>
            <SymbolView
              name={{
                ios: "wrench.and.screwdriver.fill",
                android: "handyman",
                web: "handyman",
              }}
              size={48}
              tintColor="#FDBA74"
            />
          </View>
        )}

        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                Servicio profesional
              </Text>
            </View>

            {service.verified && (
              <View style={styles.verifiedHeroBadge}>
                <Text
                  style={styles.verifiedHeroBadgeText}
                >
                  Verificado
                </Text>
              </View>
            )}

            {service.featured && (
              <View style={styles.featuredBadge}>
                <Text
                  style={styles.featuredBadgeText}
                >
                  Destacado
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.heroCategory}>
            {service.category}
          </Text>

          <Text style={styles.heroTitle}>
            {profileTitle}
          </Text>

          {profileTitle !== service.title && (
            <Text style={styles.heroSubtitle}>
              {service.title}
            </Text>
          )}

          <View style={styles.heroLocation}>
            <SymbolView
              name={{
                ios: "mappin.and.ellipse",
                android: "location_on",
                web: "location_on",
              }}
              size={17}
              tintColor="#FFFFFF"
            />

            <Text
              style={styles.heroLocationText}
            >
              {[service.city, service.province]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </View>
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

function ServicePriceCard({
  service,
}: {
  service: ExploreService;
}) {
  return (
    <View style={styles.priceCard}>
      <View style={styles.priceCopy}>
        <Text style={styles.priceEyebrow}>
          Precio orientativo
        </Text>

        <Text style={styles.priceValue}>
          {getPriceLabel(service)}
        </Text>

        <Text style={styles.priceHelper}>
          El valor final puede variar según el trabajo, urgencia y zona.
        </Text>
      </View>

      <View style={styles.availableBadge}>
        <View style={styles.availableDot} />

        <Text style={styles.availableText}>
          Disponible
        </Text>
      </View>
    </View>
  );
}

function MetricsGrid({
  service,
}: {
  service: ExploreService;
}) {
  return (
    <View style={styles.metricsGrid}>
      <MetricCard
        label="Reputación"
        value={getRatingLabel(service)}
        helper={getReviewLabel(service)}
      />

      <MetricCard
        label="Experiencia"
        value={getExperienceLabel(
          service.experienceYears,
        )}
        helper="Experiencia informada"
      />

      <MetricCard
        label="Respuesta"
        value={getResponseTimeLabel(
          service.responseTime,
        )}
        helper="Tiempo orientativo"
      />

      <MetricCard
        label="Trabajos"
        value={String(service.completedJobs)}
        helper={
          service.completedJobs === 1
            ? "Trabajo registrado"
            : "Trabajos registrados"
        }
      />
    </View>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text
        numberOfLines={2}
        style={styles.metricValue}
      >
        {value}
      </Text>

      <Text
        numberOfLines={2}
        style={styles.metricHelper}
      >
        {helper}
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

function ProfessionalCard({
  service,
}: {
  service: ExploreService;
}) {
  const name =
    service.userName || "Profesional";

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.sectionCard}>
      <View style={styles.professionalHeader}>
        <Text style={styles.sectionTitle}>
          Profesional
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

      <View style={styles.professionalContent}>
        <View style={styles.professionalAvatar}>
          <Text
            style={styles.professionalInitials}
          >
            {initials || "EZ"}
          </Text>
        </View>

        <View style={styles.professionalCopy}>
          <Text style={styles.professionalName}>
            {name}
          </Text>

          <Text style={styles.professionalMeta}>
            {service.specialty ||
              service.category}
          </Text>

          <Text style={styles.professionalMeta}>
            {[service.city, service.province]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ContactCard({
  service,
}: {
  service: ExploreService;
}) {
  const whatsappNumber =
    normalizePhoneNumber(service.whatsapp);

  const phoneNumber =
    normalizePhoneNumber(service.phone);

  const whatsappMessage =
    encodeURIComponent(
      `Hola, vi tu servicio "${service.title}" en Eziel. Quería hacer una consulta.`,
    );

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : "";

  const phoneUrl = phoneNumber
    ? `tel:${phoneNumber}`
    : "";

  return (
    <View style={styles.contactCard}>
      <View style={styles.contactIcon}>
        <SymbolView
          name={{
            ios: "message.fill",
            android: "chat",
            web: "chat",
          }}
          size={22}
          tintColor={ORANGE}
        />
      </View>

      <Text style={styles.contactEyebrow}>
        Contacto directo
      </Text>

      <Text style={styles.contactTitle}>
        ¿Querés consultar por este servicio?
      </Text>

      <Text style={styles.contactDescription}>
        Coordiná directamente con el profesional los detalles, horarios y presupuesto final.
      </Text>

      <View style={styles.contactActions}>
        {whatsappUrl && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Consultar por WhatsApp"
            onPress={() => {
              void openExternalUrl(
                whatsappUrl,
                "No pudimos abrir WhatsApp en este dispositivo.",
              );
            }}
            style={({ pressed }) => [
              styles.primaryContactButton,
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios: "message.fill",
                android: "chat",
                web: "chat",
              }}
              size={19}
              tintColor={SURFACE}
            />

            <Text
              style={
                styles.primaryContactButtonText
              }
            >
              Consultar por WhatsApp
            </Text>
          </Pressable>
        )}

        {phoneUrl && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Llamar al profesional"
            onPress={() => {
              void openExternalUrl(
                phoneUrl,
                "No pudimos iniciar la llamada en este dispositivo.",
              );
            }}
            style={({ pressed }) => [
              styles.secondaryContactButton,
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios: "phone.fill",
                android: "call",
                web: "call",
              }}
              size={19}
              tintColor={TEXT}
            />

            <Text
              style={
                styles.secondaryContactButtonText
              }
            >
              Llamar
            </Text>
          </Pressable>
        )}

        {!whatsappUrl && !phoneUrl && (
          <View
            style={styles.noContactNotice}
          >
            <Text
              style={styles.noContactNoticeText}
            >
              Este profesional todavía no publicó un contacto directo.
            </Text>
          </View>
        )}
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

  heroBlock: {
    gap: 10,
  },

  heroImageShell: {
    overflow: "hidden",
    position: "relative",
    width: "100%",
    aspectRatio: 0.96,
    borderRadius: 24,
    backgroundColor: DARK,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
  },

  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(2,6,23,0.58)",
  },

  heroContent: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 21,
  },

  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 12,
  },

  heroBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  heroBadgeText: {
    color: SURFACE,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  verifiedHeroBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(21,128,61,0.28)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.42)",
  },

  verifiedHeroBadgeText: {
    color: "#DCFCE7",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  featuredBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(249,115,22,0.28)",
    borderWidth: 1,
    borderColor: "rgba(253,186,116,0.42)",
  },

  featuredBadgeText: {
    color: "#FFEDD5",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  heroCategory: {
    color: "#FDBA74",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  heroTitle: {
    color: SURFACE,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 6,
  },

  heroSubtitle: {
    color: "#FDBA74",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    marginTop: 6,
  },

  heroLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
  },

  heroLocationText: {
    flex: 1,
    color: SURFACE,
    fontSize: 12,
    fontWeight: "700",
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

  priceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 20,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  priceCopy: {
    flex: 1,
  },

  priceEyebrow: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  priceValue: {
    color: ORANGE_DARK,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 5,
  },

  priceHelper: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: GREEN_SOFT,
  },

  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: GREEN,
  },

  availableText: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "900",
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  metricCard: {
    width: "48.7%",
    minHeight: 112,
    padding: 14,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  metricLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "800",
  },

  metricValue: {
    color: TEXT,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
    marginTop: 8,
  },

  metricHelper: {
    color: MUTED_LIGHT,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 5,
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

  professionalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  professionalContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  professionalAvatar: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: ORANGE_SOFT,
  },

  professionalInitials: {
    color: ORANGE_DARK,
    fontSize: 18,
    fontWeight: "900",
  },

  professionalCopy: {
    flex: 1,
  },

  professionalName: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
  },

  professionalMeta: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  verifiedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: GREEN_SOFT,
  },

  verifiedBadgeText: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "900",
  },

  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  infoPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER,
  },

  infoPillHighlighted: {
    backgroundColor: ORANGE_SOFT,
    borderColor: "#FED7AA",
  },

  infoPillText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "800",
  },

  infoPillTextHighlighted: {
    color: ORANGE_DARK,
  },

  keywordPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER,
  },

  keywordText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "800",
  },

  contactCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  contactIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: ORANGE_SOFT,
  },

  contactEyebrow: {
    color: ORANGE_DARK,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginTop: 14,
  },

  contactTitle: {
    color: TEXT,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 5,
  },

  contactDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  contactActions: {
    gap: 10,
    marginTop: 18,
  },

  primaryContactButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#16A34A",
  },

  primaryContactButtonText: {
    color: SURFACE,
    fontSize: 13,
    fontWeight: "900",
  },

  secondaryContactButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  secondaryContactButtonText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "900",
  },

  noContactNotice: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: BACKGROUND,
  },

  noContactNoticeText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },

  trustNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: ORANGE_SOFT,
  },

  trustNoticeText: {
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
