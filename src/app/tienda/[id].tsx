import { SymbolView } from "expo-symbols";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

import { useStoreDetail } from "@/features/store-detail/useStoreDetail";

import type {
  StoreCatalogItem,
  StoreDetailPlan,
  StoreDetailStore,
} from "@/features/store-detail/storeDetailTypes";

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

function formatCurrency(
  value: number,
): string {
  const safeValue =
    Number.isFinite(value) &&
    value >= 0
      ? Math.round(value)
      : 0;

  return `$ ${safeValue.toLocaleString(
    "es-AR",
  )}`;
}

function getPlanLabel(
  plan: StoreDetailPlan,
): string {
  if (plan === "premium_plus") {
    return "Premium Plus";
  }

  if (plan === "premium") {
    return "Premium";
  }

  return "Gratis";
}

function normalizePhoneNumber(
  value: string,
): string {
  return value.replace(/\D/g, "");
}

function normalizeWebsiteUrl(
  value: string,
): string {
  const trimmed =
    String(value ?? "").trim();

  if (!trimmed) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getInstagramUrl(
  value: string,
): string {
  const trimmed =
    String(value ?? "").trim();

  if (!trimmed) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  const username =
    trimmed.replace(
      /^@/,
      "",
    );

  return `https://instagram.com/${username}`;
}

function getFacebookUrl(
  value: string,
): string {
  const trimmed =
    String(value ?? "").trim();

  if (!trimmed) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  return `https://facebook.com/${trimmed}`;
}

function getMapsUrl(
  store: StoreDetailStore,
): string {
  const coordinatesAvailable =
    store.latitude !== null &&
    store.longitude !== null;

  const query =
    coordinatesAvailable
      ? `${store.latitude},${store.longitude}`
      : [
          store.address,
          store.city,
          store.province,
        ]
          .filter(Boolean)
          .join(", ");

  if (!query) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query,
  )}`;
}

function isSectionVisible(
  store: StoreDetailStore,
  key: string,
): boolean {
  return (
    store.visibleSections[key] !==
    false
  );
}

async function openExternalUrl(
  url: string,
  errorMessage: string,
) {
  try {
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

export default function StoreDetailScreen() {
  const params =
    useLocalSearchParams<{
      id?: string;
    }>();

  const storeId =
    typeof params.id === "string"
      ? params.id
      : "";

  const {
    store,
    catalog,
    error,
    isLoading,
    reload,
  } = useStoreDetail(storeId);

  const catalogProducts =
    useMemo(
      () =>
        catalog.filter(
          (item) =>
            item.type === "product",
        ),
      [catalog],
    );

  const catalogServices =
    useMemo(
      () =>
        catalog.filter(
          (item) =>
            item.type === "service",
        ),
      [catalog],
    );

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
            Cargando tienda
          </Text>

          <Text
            style={
              styles.stateDescription
            }
          >
            Estamos preparando su perfil y catálogo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!store || error) {
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
                ios: "storefront.fill",
                android: "store",
                web: "store",
              }}
              size={31}
              tintColor={ORANGE}
            />
          </View>

          <Text style={styles.stateTitle}>
            Tienda no disponible
          </Text>

          <Text
            style={
              styles.stateDescription
            }
          >
            {error ||
              "La tienda fue eliminada o ya no está disponible."}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void reload();
            }}
            style={({ pressed }) => [
              styles.retryButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Reintentar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const showProducts =
    isSectionVisible(
      store,
      "products",
    );

  const showLocation =
    isSectionVisible(
      store,
      "location",
    );

  const showContact =
    isSectionVisible(
      store,
      "contact",
    );

  const showSocial =
    isSectionVisible(
      store,
      "social",
    );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <DetailHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <StoreHero store={store} />

        {store.promoEnabled &&
          Boolean(
            store.promoText.trim(),
          ) && (
            <View
              style={
                styles.promoCard
              }
            >
              <SymbolView
                name={{
                  ios: "sparkles",
                  android: "auto_awesome",
                  web: "auto_awesome",
                }}
                size={19}
                tintColor={ORANGE}
              />

              <Text
                style={
                  styles.promoText
                }
              >
                {store.promoText}
              </Text>
            </View>
          )}

        <StoreMetrics
          store={store}
          catalogCount={
            catalog.length
          }
        />

        <SectionCard title="Sobre la tienda">
          <Text
            style={
              styles.description
            }
          >
            {store.description ||
              "Esta tienda todavía no agregó una descripción."}
          </Text>
        </SectionCard>

        {showLocation && (
          <LocationCard
            store={store}
          />
        )}

        {(showContact ||
          showSocial) && (
          <ContactCard
            store={store}
            showContact={
              showContact
            }
            showSocial={
              showSocial
            }
          />
        )}

        {showProducts &&
          catalogProducts.length >
            0 && (
            <CatalogSection
              title="Productos"
              subtitle={`${catalogProducts.length} ${
                catalogProducts.length ===
                1
                  ? "producto disponible"
                  : "productos disponibles"
              }`}
              items={
                catalogProducts
              }
            />
          )}

        {showProducts &&
          catalogServices.length >
            0 && (
            <CatalogSection
              title="Servicios de la tienda"
              subtitle={`${catalogServices.length} ${
                catalogServices.length ===
                1
                  ? "servicio disponible"
                  : "servicios disponibles"
              }`}
              items={
                catalogServices
              }
            />
          )}

        {showProducts &&
          catalog.length === 0 && (
            <SectionCard title="Catálogo">
              <View
                style={
                  styles.emptyCatalog
                }
              >
                <SymbolView
                  name={{
                    ios: "shippingbox.fill",
                    android: "inventory_2",
                    web: "inventory_2",
                  }}
                  size={28}
                  tintColor={
                    MUTED_LIGHT
                  }
                />

                <Text
                  style={
                    styles.emptyCatalogTitle
                  }
                >
                  Sin publicaciones activas
                </Text>

                <Text
                  style={
                    styles.emptyCatalogText
                  }
                >
                  Esta tienda todavía no tiene productos o servicios disponibles en su catálogo.
                </Text>
              </View>
            </SectionCard>
          )}

        <View
          style={
            styles.trustNotice
          }
        >
          <SymbolView
            name={{
              ios: "shield.checkered",
              android: "verified_user",
              web: "verified_user",
            }}
            size={19}
            tintColor={ORANGE}
          />

          <Text
            style={
              styles.trustNoticeText
            }
          >
            Consultá condiciones, disponibilidad y entrega directamente con la tienda antes de concretar una operación.
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
        onPress={() =>
          router.back()
        }
        style={({ pressed }) => [
          styles.headerButton,
          pressed &&
            styles.pressed,
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

      <View
        style={
          styles.headerCopy
        }
      >
        <Text
          style={
            styles.headerBrand
          }
        >
          EZIEL
        </Text>

        <Text
          style={
            styles.headerTitle
          }
        >
          Tienda
        </Text>
      </View>

      <View
        style={
          styles.headerSpacer
        }
      />
    </View>
  );
}

function StoreHero({
  store,
}: {
  store: StoreDetailStore;
}) {
  const [bannerFailed, setBannerFailed] =
    useState(false);

  const [logoFailed, setLogoFailed] =
    useState(false);

  const location = [
    store.city,
    store.province,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={styles.hero}>
      <View
        style={
          styles.heroMedia
        }
      >
        {store.bannerUrl &&
        !bannerFailed ? (
          <Image
            source={{
              uri: store.bannerUrl,
            }}
            resizeMode="cover"
            accessibilityLabel={`Banner de ${store.name}`}
            onError={() =>
              setBannerFailed(true)
            }
            style={
              styles.heroImage
            }
          />
        ) : (
          <View
            style={
              styles.heroFallback
            }
          >
            <SymbolView
              name={{
                ios: "storefront.fill",
                android: "store",
                web: "store",
              }}
              size={56}
              tintColor="#FDBA74"
            />
          </View>
        )}

        <View
          style={
            styles.heroOverlay
          }
        />

        <View
          style={
            styles.heroContent
          }
        >
          <View
            style={
              styles.logoRow
            }
          >
            {store.logoUrl &&
            !logoFailed ? (
              <Image
                source={{
                  uri: store.logoUrl,
                }}
                resizeMode="cover"
                accessibilityLabel={`Logo de ${store.name}`}
                onError={() =>
                  setLogoFailed(true)
                }
                style={
                  styles.storeLogo
                }
              />
            ) : (
              <View
                style={[
                  styles.storeLogo,
                  styles.logoFallback,
                ]}
              >
                <Text
                  style={
                    styles.logoInitials
                  }
                >
                  {getStoreInitials(
                    store.name,
                  )}
                </Text>
              </View>
            )}

            <View
              style={
                styles.heroBadges
              }
            >
              {store.verified && (
                <View
                  style={
                    styles.verifiedBadge
                  }
                >
                  <Text
                    style={
                      styles.verifiedBadgeText
                    }
                  >
                    Verificada
                  </Text>
                </View>
              )}

              {store.featured && (
                <View
                  style={
                    styles.featuredBadge
                  }
                >
                  <Text
                    style={
                      styles.featuredBadgeText
                    }
                  >
                    Destacada
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text
            style={
              styles.heroCategory
            }
          >
            {store.category}
          </Text>

          <Text
            style={
              styles.heroTitle
            }
          >
            {store.name}
          </Text>

          {location && (
            <View
              style={
                styles.heroLocation
              }
            >
              <SymbolView
                name={{
                  ios: "mappin.and.ellipse",
                  android: "location_on",
                  web: "location_on",
                }}
                size={17}
                tintColor={
                  SURFACE
                }
              />

              <Text
                style={
                  styles.heroLocationText
                }
              >
                {location}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function StoreMetrics({
  store,
  catalogCount,
}: {
  store: StoreDetailStore;
  catalogCount: number;
}) {
  return (
    <View
      style={
        styles.metricsGrid
      }
    >
      <MetricCard
        label="Estado"
        value={
          store.verified
            ? "Verificada"
            : "Activa"
        }
      />

      <MetricCard
        label="Plan"
        value={getPlanLabel(
          store.plan,
        )}
      />

      <MetricCard
        label="Catálogo"
        value={String(
          catalogCount,
        )}
      />

      <MetricCard
        label="Vistas"
        value={String(
          Math.trunc(
            store.views,
          ),
        )}
      />
    </View>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.metricCard
      }
    >
      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>

      <Text
        numberOfLines={2}
        style={
          styles.metricValue
        }
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
  children: ReactNode;
}) {
  return (
    <View
      style={
        styles.sectionCard
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      {children}
    </View>
  );
}

function LocationCard({
  store,
}: {
  store: StoreDetailStore;
}) {
  const locationText = [
    store.address,
    store.city,
    store.province,
  ]
    .filter(Boolean)
    .join(", ");

  const mapsUrl =
    getMapsUrl(store);

  if (
    !locationText &&
    !mapsUrl
  ) {
    return null;
  }

  return (
    <SectionCard title="Ubicación">
      <View
        style={
          styles.locationRow
        }
      >
        <View
          style={
            styles.locationIcon
          }
        >
          <SymbolView
            name={{
              ios: "mappin.and.ellipse",
              android: "location_on",
              web: "location_on",
            }}
            size={21}
            tintColor={ORANGE}
          />
        </View>

        <View
          style={
            styles.locationCopy
          }
        >
          <Text
            style={
              styles.locationValue
            }
          >
            {locationText ||
              "Ubicación registrada"}
          </Text>

          <Text
            style={
              styles.locationHelper
            }
          >
            Datos informados por la tienda
          </Text>
        </View>
      </View>

      {mapsUrl && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir ubicación en el mapa"
          onPress={() => {
            void openExternalUrl(
              mapsUrl,
              "No pudimos abrir el mapa en este dispositivo.",
            );
          }}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <SymbolView
            name={{
              ios: "location.fill",
              android: "near_me",
              web: "near_me",
            }}
            size={18}
            tintColor={TEXT}
          />

          <Text
            style={
              styles.secondaryButtonText
            }
          >
            Cómo llegar
          </Text>
        </Pressable>
      )}
    </SectionCard>
  );
}

function ContactCard({
  store,
  showContact,
  showSocial,
}: {
  store: StoreDetailStore;
  showContact: boolean;
  showSocial: boolean;
}) {
  const whatsappNumber =
    normalizePhoneNumber(
      store.whatsapp,
    );

  const phoneNumber =
    normalizePhoneNumber(
      store.phone,
    );

  const whatsappMessage =
    encodeURIComponent(
      `Hola, vi la tienda "${store.name}" en Eziel. Quería hacer una consulta.`,
    );

  const whatsappUrl =
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
      : "";

  const phoneUrl =
    phoneNumber
      ? `tel:${phoneNumber}`
      : "";

  const websiteUrl =
    normalizeWebsiteUrl(
      store.website,
    );

  const instagramUrl =
    getInstagramUrl(
      store.instagram,
    );

  const facebookUrl =
    getFacebookUrl(
      store.facebook,
    );

  const hasContact =
    showContact &&
    Boolean(
      whatsappUrl ||
        phoneUrl,
    );

  const hasSocial =
    showSocial &&
    Boolean(
      websiteUrl ||
        instagramUrl ||
        facebookUrl,
    );

  if (
    !hasContact &&
    !hasSocial
  ) {
    return null;
  }

  return (
    <View
      style={
        styles.contactCard
      }
    >
      <View
        style={
          styles.contactIcon
        }
      >
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

      <Text
        style={
          styles.contactEyebrow
        }
      >
        Contacto
      </Text>

      <Text
        style={
          styles.contactTitle
        }
      >
        Hablá con la tienda
      </Text>

      <Text
        style={
          styles.contactDescription
        }
      >
        Consultá disponibilidad, entrega y condiciones directamente con el comercio.
      </Text>

      <View
        style={
          styles.contactActions
        }
      >
        {showContact &&
          whatsappUrl && (
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
                styles.whatsappButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <SymbolView
                name={{
                  ios: "message.fill",
                  android: "chat",
                  web: "chat",
                }}
                size={19}
                tintColor={
                  SURFACE
                }
              />

              <Text
                style={
                  styles.whatsappButtonText
                }
              >
                Consultar por WhatsApp
              </Text>
            </Pressable>
          )}

        {showContact &&
          phoneUrl && (
            <ExternalButton
              label="Llamar"
              iconIos="phone.fill"
              iconAndroid="call"
              onPress={() => {
                void openExternalUrl(
                  phoneUrl,
                  "No pudimos iniciar la llamada en este dispositivo.",
                );
              }}
            />
          )}

        {showSocial &&
          websiteUrl && (
            <ExternalButton
              label="Sitio web"
              iconIos="globe"
              iconAndroid="language"
              onPress={() => {
                void openExternalUrl(
                  websiteUrl,
                  "No pudimos abrir el sitio web.",
                );
              }}
            />
          )}

        {showSocial &&
          instagramUrl && (
            <ExternalButton
              label="Instagram"
              iconIos="camera.fill"
              iconAndroid="photo_camera"
              onPress={() => {
                void openExternalUrl(
                  instagramUrl,
                  "No pudimos abrir Instagram.",
                );
              }}
            />
          )}

        {showSocial &&
          facebookUrl && (
            <ExternalButton
              label="Facebook"
              iconIos="person.2.fill"
              iconAndroid="groups"
              onPress={() => {
                void openExternalUrl(
                  facebookUrl,
                  "No pudimos abrir Facebook.",
                );
              }}
            />
          )}
      </View>
    </View>
  );
}

function ExternalButton({
  label,
  iconIos,
  iconAndroid,
  onPress,
}: {
  label: string;
  iconIos:
    | "phone.fill"
    | "globe"
    | "camera.fill"
    | "person.2.fill";
  iconAndroid:
    | "call"
    | "language"
    | "photo_camera"
    | "groups";
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        pressed &&
          styles.pressed,
      ]}
    >
      <SymbolView
        name={{
          ios: iconIos,
          android:
            iconAndroid,
          web: iconAndroid,
        }}
        size={18}
        tintColor={TEXT}
      />

      <Text
        style={
          styles.secondaryButtonText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CatalogSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: StoreCatalogItem[];
}) {
  return (
    <View
      style={
        styles.catalogSection
      }
    >
      <View
        style={
          styles.catalogHeader
        }
      >
        <View>
          <Text
            style={
              styles.sectionTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.catalogSubtitle
            }
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.catalogList
        }
      >
        {items.map(
          (item) => (
            <CatalogItemCard
              key={item.id}
              item={item}
            />
          ),
        )}
      </View>
    </View>
  );
}

function CatalogItemCard({
  item,
}: {
  item: StoreCatalogItem;
}) {
  const [imageFailed, setImageFailed] =
    useState(false);

  return (
    <View
      style={
        styles.catalogCard
      }
    >
      <View
        style={
          styles.catalogImageShell
        }
      >
        {item.imageUrl &&
        !imageFailed ? (
          <Image
            source={{
              uri: item.imageUrl,
            }}
            resizeMode="cover"
            accessibilityLabel={`Imagen de ${item.name}`}
            onError={() =>
              setImageFailed(true)
            }
            style={
              styles.catalogImage
            }
          />
        ) : (
          <View
            style={
              styles.catalogFallback
            }
          >
            <SymbolView
              name={{
                ios:
                  item.type ===
                  "service"
                    ? "wrench.and.screwdriver.fill"
                    : "shippingbox.fill",
                android:
                  item.type ===
                  "service"
                    ? "handyman"
                    : "inventory_2",
                web:
                  item.type ===
                  "service"
                    ? "handyman"
                    : "inventory_2",
              }}
              size={28}
              tintColor={ORANGE}
            />
          </View>
        )}

        {item.featured && (
          <View
            style={
              styles.catalogFeatured
            }
          >
            <Text
              style={
                styles.catalogFeaturedText
              }
            >
              Destacado
            </Text>
          </View>
        )}
      </View>

      <View
        style={
          styles.catalogContent
        }
      >
        <Text
          numberOfLines={1}
          style={
            styles.catalogCategory
          }
        >
          {item.category}
        </Text>

        <Text
          numberOfLines={2}
          style={
            styles.catalogName
          }
        >
          {item.name}
        </Text>

        <Text
          style={
            styles.catalogPrice
          }
        >
          {formatCurrency(
            item.price,
          )}
        </Text>

        {item.type ===
          "product" && (
          <Text
            style={
              styles.catalogMeta
            }
          >
            {item.stock > 0
              ? `${item.stock} ${
                  item.stock === 1
                    ? "unidad"
                    : "unidades"
                }`
              : "Consultar stock"}
          </Text>
        )}

        {item.type ===
          "service" && (
          <Text
            style={
              styles.catalogMeta
            }
          >
            Servicio de la tienda
          </Text>
        )}
      </View>
    </View>
  );
}

function getStoreInitials(
  name: string,
): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "EZ";
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
      backgroundColor:
        SURFACE,
      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
    },

    headerButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 14,
      backgroundColor:
        BACKGROUND,
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

    hero: {
      width: "100%",
    },

    heroMedia: {
      overflow: "hidden",
      position: "relative",
      width: "100%",
      aspectRatio: 1.14,
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
      justifyContent:
        "center",
      backgroundColor:
        "#0F172A",
    },

    heroOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor:
        "rgba(2,6,23,0.56)",
    },

    heroContent: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 21,
    },

    logoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
      marginBottom: 14,
    },

    storeLogo: {
      width: 70,
      height: 70,
      borderRadius: 20,
      borderWidth: 3,
      borderColor:
        "rgba(255,255,255,0.92)",
      backgroundColor:
        SURFACE,
    },

    logoFallback: {
      alignItems: "center",
      justifyContent:
        "center",
    },

    logoInitials: {
      color: ORANGE_DARK,
      fontSize: 21,
      fontWeight: "900",
    },

    heroBadges: {
      flex: 1,
      flexDirection: "row",
      justifyContent:
        "flex-end",
      flexWrap: "wrap",
      gap: 7,
    },

    verifiedBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor:
        "rgba(21,128,61,0.34)",
      borderWidth: 1,
      borderColor:
        "rgba(134,239,172,0.45)",
    },

    verifiedBadgeText: {
      color: "#DCFCE7",
      fontSize: 9,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    featuredBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor:
        "rgba(249,115,22,0.34)",
      borderWidth: 1,
      borderColor:
        "rgba(253,186,116,0.50)",
    },

    featuredBadgeText: {
      color: "#FFEDD5",
      fontSize: 9,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    heroCategory: {
      color: "#FDBA74",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 1.2,
      textTransform:
        "uppercase",
    },

    heroTitle: {
      color: SURFACE,
      fontSize: 33,
      lineHeight: 37,
      fontWeight: "900",
      letterSpacing: -1,
      marginTop: 6,
    },

    heroLocation: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 13,
    },

    heroLocationText: {
      flex: 1,
      color: SURFACE,
      fontSize: 12,
      fontWeight: "700",
    },

    promoCard: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 10,
      padding: 16,
      borderRadius: 18,
      backgroundColor:
        ORANGE_SOFT,
      borderWidth: 1,
      borderColor:
        "#FED7AA",
    },

    promoText: {
      flex: 1,
      color: "#9A3412",
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "800",
    },

    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    metricCard: {
      width: "48.7%",
      minHeight: 92,
      padding: 14,
      borderRadius: 18,
      backgroundColor:
        SURFACE,
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
      fontSize: 17,
      lineHeight: 21,
      fontWeight: "900",
      marginTop: 8,
    },

    sectionCard: {
      padding: 20,
      borderRadius: 22,
      backgroundColor:
        SURFACE,
      borderWidth: 1,
      borderColor: BORDER,
    },

    sectionTitle: {
      color: TEXT,
      fontSize: 19,
      fontWeight: "900",
      letterSpacing: -0.35,
      marginBottom: 14,
    },

    description: {
      color: "#334155",
      fontSize: 14,
      lineHeight: 22,
    },

    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
    },

    locationIcon: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 15,
      backgroundColor:
        ORANGE_SOFT,
    },

    locationCopy: {
      flex: 1,
    },

    locationValue: {
      color: TEXT,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "800",
    },

    locationHelper: {
      color: MUTED,
      fontSize: 11,
      marginTop: 4,
    },

    contactCard: {
      padding: 20,
      borderRadius: 22,
      backgroundColor:
        SURFACE,
      borderWidth: 1,
      borderColor: BORDER,
    },

    contactIcon: {
      width: 46,
      height: 46,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 15,
      backgroundColor:
        ORANGE_SOFT,
    },

    contactEyebrow: {
      color: ORANGE_DARK,
      fontSize: 10,
      fontWeight: "900",
      textTransform:
        "uppercase",
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

    whatsappButton: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 9,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor:
        "#16A34A",
    },

    whatsappButtonText: {
      color: SURFACE,
      fontSize: 13,
      fontWeight: "900",
    },

    secondaryButton: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 9,
      paddingHorizontal: 16,
      borderRadius: 15,
      backgroundColor:
        SURFACE,
      borderWidth: 1,
      borderColor: BORDER,
      marginTop: 14,
    },

    secondaryButtonText: {
      color: TEXT,
      fontSize: 13,
      fontWeight: "900",
    },

    catalogSection: {
      padding: 20,
      borderRadius: 22,
      backgroundColor:
        SURFACE,
      borderWidth: 1,
      borderColor: BORDER,
    },

    catalogHeader: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
    },

    catalogSubtitle: {
      color: MUTED,
      fontSize: 11,
      marginTop: -8,
      marginBottom: 15,
    },

    catalogList: {
      gap: 10,
    },

    catalogCard: {
      overflow: "hidden",
      flexDirection: "row",
      minHeight: 122,
      borderRadius: 18,
      backgroundColor:
        BACKGROUND,
      borderWidth: 1,
      borderColor: BORDER,
    },

    catalogImageShell: {
      position: "relative",
      width: 122,
      height: 122,
      alignSelf: "flex-start",
      backgroundColor:
        ORANGE_SOFT,
    },

    catalogImage: {
      width: 122,
      height: 122,
    },

    catalogFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    catalogFeatured: {
      position: "absolute",
      left: 7,
      top: 7,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.94)",
    },

    catalogFeaturedText: {
      color: ORANGE_DARK,
      fontSize: 8,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    catalogContent: {
      flex: 1,
      minWidth: 0,
      justifyContent:
        "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    catalogCategory: {
      color: ORANGE_DARK,
      fontSize: 9,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    catalogName: {
      color: TEXT,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900",
      marginTop: 5,
    },

    catalogPrice: {
      color: TEXT,
      fontSize: 15,
      fontWeight: "900",
      marginTop: 8,
    },

    catalogMeta: {
      color: MUTED,
      fontSize: 10,
      marginTop: 4,
    },

    emptyCatalog: {
      alignItems: "center",
      paddingVertical: 14,
    },

    emptyCatalogTitle: {
      color: TEXT,
      fontSize: 14,
      fontWeight: "900",
      marginTop: 10,
    },

    emptyCatalogText: {
      maxWidth: 290,
      color: MUTED,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 5,
    },

    trustNotice: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 10,
      padding: 16,
      borderRadius: 18,
      backgroundColor:
        ORANGE_SOFT,
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
      justifyContent:
        "center",
      paddingHorizontal: 34,
    },

    stateIcon: {
      width: 64,
      height: 64,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 20,
      backgroundColor:
        ORANGE_SOFT,
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
      justifyContent:
        "center",
      paddingHorizontal: 20,
      borderRadius: 14,
      backgroundColor:
        ORANGE,
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
