import {
  SymbolView,
} from "expo-symbols";
import {
  router,
} from "expo-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
import {
  useUserProfiles,
} from "@/features/auth/useUserProfiles";
import {
  getListingBuyerCandidates,
} from "@/features/chat/chatFirestoreService";
import type {
  ListingBuyerCandidate,
} from "@/features/chat/chatTypes";
import {
  subscribeToSellerListings,
} from "@/features/explore/exploreFirestoreService";
import type {
  ExploreListing,
} from "@/features/explore/exploreTypes";
import {
  cancelListingSale,
  requestListingSale,
  subscribeToSellerSales,
} from "@/features/listing-sale/listingSaleFirestoreService";
import type {
  ListingSale,
} from "@/features/listing-sale/listingSaleTypes";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const ORANGE_BORDER = "#FED7AA";

const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";
const SOFT = "#F1F5F9";

const SUCCESS = "#15803D";
const SUCCESS_SOFT = "#F0FDF4";

const WARNING = "#B45309";
const WARNING_SOFT = "#FFFBEB";
const WARNING_BORDER = "#FDE68A";

const RED = "#B91C1C";
const RED_SOFT = "#FEF2F2";
const RED_BORDER = "#FECACA";


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

function getListingStatus(
  listing: ExploreListing,
): {
  label: string;
  tone:
    | "success"
    | "warning"
    | "neutral";
} {
  if (
    listing.status === "sold" ||
    listing.availableUnits === 0 &&
      listing.reservedUnits === 0
  ) {
    return {
      label: "Agotada",
      tone: "neutral",
    };
  }

  if (
    listing.reservedUnits > 0
  ) {
    return {
      label:
        listing.availableUnits > 0
          ? "Con reservas"
          : "En confirmación",
      tone: "warning",
    };
  }

  return {
    label: "Activa",
    tone: "success",
  };
}

function clampQuantity(
  value: number,
  maximum: number,
): number {
  const safeMaximum =
    Math.max(
      Math.trunc(
        maximum || 1,
      ),
      1,
    );

  return Math.min(
    Math.max(
      Math.trunc(
        value || 1,
      ),
      1,
    ),
    safeMaximum,
  );
}

export default function SellerListingsScreen() {
  const buyerCandidatesRequestId = useRef(0);

  const {
    user,
    isLoading:
      isAuthLoading,
  } = useAuth();

  const sellerId =
    user?.uid ?? "";

  const [
    listings,
    setListings,
  ] = useState<
    ExploreListing[]
  >([]);

  const [
    sales,
    setSales,
  ] = useState<
    ListingSale[]
  >([]);

  const [
    listingsLoading,
    setListingsLoading,
  ] = useState(true);

  const [
    salesLoading,
    setSalesLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState<
    string | null
  >(null);

  const [
    saleListingId,
    setSaleListingId,
  ] = useState<
    string | null
  >(null);


  const [
    buyerCandidates,
    setBuyerCandidates,
  ] = useState<
    ListingBuyerCandidate[]
  >([]);

  const [
    selectedBuyerId,
    setSelectedBuyerId,
  ] = useState("");

  const [
    saleQuantity,
    setSaleQuantity,
  ] = useState(1);

  const [
    buyersLoading,
    setBuyersLoading,
  ] = useState(false);

  const [
    saleError,
    setSaleError,
  ] = useState<
    string | null
  >(null);

  const [
    savingSale,
    setSavingSale,
  ] = useState(false);

  const [
    cancellingSaleId,
    setCancellingSaleId,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!sellerId) {
      setListings([]);
      setListingsLoading(false);

      return;
    }

    setListingsLoading(true);
    setLoadError(null);

    return subscribeToSellerListings(
      sellerId,
      (nextListings) => {
        setListings(
          nextListings,
        );
        setListingsLoading(
          false,
        );
      },
      (error) => {
        console.error(
          "Error cargando publicaciones propias:",
          error,
        );

        setListingsLoading(
          false,
        );

        setLoadError(
          error.message.trim() ||
            "No pudimos cargar tus publicaciones.",
        );
      },
    );
  }, [
    sellerId,
  ]);

  useEffect(() => {
    if (!sellerId) {
      setSales([]);
      setSalesLoading(false);

      return;
    }

    setSalesLoading(true);

    return subscribeToSellerSales(
      sellerId,
      (nextSales) => {
        setSales(
          nextSales,
        );
        setSalesLoading(
          false,
        );
      },
      (error) => {
        console.error(
          "Error cargando operaciones del vendedor:",
          error,
        );

        setSalesLoading(
          false,
        );

        setLoadError(
          error.message.trim() ||
            "No pudimos actualizar tus operaciones.",
        );
      },
    );
  }, [
    sellerId,
  ]);

  const saleListing =
    useMemo(
      () =>
        saleListingId
          ? listings.find(
              (listing) =>
                listing.id ===
                saleListingId,
            ) ?? null
          : null,
      [
        listings,
        saleListingId,
      ],
    );

  const salesByListingId =
    useMemo(() => {
      const result =
        new Map<
          string,
          ListingSale[]
        >();

      sales.forEach(
        (sale) => {
          const current =
            result.get(
              sale.listingId,
            ) ?? [];

          current.push(
            sale,
          );

          result.set(
            sale.listingId,
            current,
          );
        },
      );

      return result;
    }, [
      sales,
    ]);

  const buyerIds =
    useMemo(
      () =>
        Array.from(
          new Set(
            [
              ...sales.map(
                (sale) =>
                  sale.buyerId,
              ),
              ...buyerCandidates.map(
                (candidate) =>
                  candidate.buyerId,
              ),
            ]
              .map(
                (buyerId) =>
                  buyerId.trim(),
              )
              .filter(Boolean),
          ),
        ),
      [
        buyerCandidates,
        sales,
      ],
    );

  const {
    profilesById,
  } = useUserProfiles(
    buyerIds,
  );

  const getBuyerName =
    (
      buyerId: string,
      fallback: string,
    ): string => {
      const currentName =
        profilesById[
          buyerId
        ]?.displayName?.trim();

      return (
        currentName ||
        fallback.trim() ||
        "Comprador"
      );
    };

  const dashboard =
    useMemo(() => {
      const activeListings =
        listings.filter(
          (listing) =>
            listing.availableUnits >
            0,
        ).length;

      const reservedUnits =
        listings.reduce(
          (
            total,
            listing,
          ) =>
            total +
            listing.reservedUnits,
          0,
        );

      const soldUnits =
        listings.reduce(
          (
            total,
            listing,
          ) =>
            total +
            listing.soldUnits,
          0,
        );

      return {
        activeListings,
        reservedUnits,
        soldUnits,
      };
    }, [
      listings,
    ]);

  const isInitialLoading =
    isAuthLoading ||
    listingsLoading ||
    salesLoading;

  const closeSaleModal =
    () => {
      if (savingSale) {
        return;
      }

      buyerCandidatesRequestId.current += 1;

      setSaleListingId(
        null,
      );
      setBuyerCandidates(
        [],
      );
      setSelectedBuyerId(
        "",
      );
      setSaleQuantity(1);
      setSaleError(null);
      setBuyersLoading(
        false,
      );
    };

  const openSaleModal =
    async (
      listing:
        ExploreListing,
    ) => {
      if (
        !sellerId ||
        listing.availableUnits <
          1
      ) {
        Alert.alert(
          "Sin stock disponible",
          "Esta publicación no tiene unidades libres para registrar otro trato.",
        );

        return;
      }

      const requestId = ++buyerCandidatesRequestId.current;

      setSaleListingId(
        listing.id,
      );
      setSelectedBuyerId(
        "",
      );
      setBuyerCandidates(
        [],
      );
      setSaleQuantity(1);
      setSaleError(null);
      setBuyersLoading(
        true,
      );

      try {
        const candidates =
          await getListingBuyerCandidates(
            listing.id,
            sellerId,
          );

        if (requestId !== buyerCandidatesRequestId.current) {
          return;
        }

        setBuyerCandidates(
          candidates,
        );
      } catch (error) {
        if (requestId !== buyerCandidatesRequestId.current) {
          return;
        }

        console.error(
          "Error cargando interesados:",
          error,
        );

        setSaleError(
          error instanceof Error &&
            error.message.trim()
            ? error.message
            : "No pudimos cargar las personas interesadas.",
        );
      } finally {
        if (requestId === buyerCandidatesRequestId.current) {
          setBuyersLoading(
            false,
          );
        }
      }
    };

  const updateQuantity =
    (
      nextQuantity: number,
    ) => {
      if (!saleListing) {
        return;
      }

      setSaleQuantity(
        clampQuantity(
          nextQuantity,
          saleListing.availableUnits,
        ),
      );

      setSaleError(null);
    };

  const handleRequestConfirmation =
    () => {
      if (
        !saleListing ||
        !sellerId ||
        savingSale
      ) {
        return;
      }

      const candidate =
        buyerCandidates.find(
          (item) =>
            item.buyerId ===
            selectedBuyerId,
        );

      if (!candidate) {
        setSaleError(
          "Elegí a la persona con la que llegaste al trato.",
        );

        return;
      }

      if (
        saleQuantity < 1 ||
        saleQuantity >
          saleListing.availableUnits
      ) {
        setSaleError(
          `Elegí una cantidad entre 1 y ${saleListing.availableUnits}.`,
        );

        return;
      }

      const buyerName =
        getBuyerName(
          candidate.buyerId,
          candidate.buyerName,
        );

      Alert.alert(
        "Solicitar confirmación",
        `Se reservarán ${saleQuantity} ${
          saleQuantity === 1
            ? "unidad"
            : "unidades"
        } de “${saleListing.title}” para ${buyerName}. El comprador deberá confirmar que hubo un trato. Eziel no valida el pago ni la entrega.`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text:
              "Enviar solicitud",
            onPress: () => {
              void (async () => {
                try {
                  setSavingSale(
                    true,
                  );
                  setSaleError(
                    null,
                  );

                  await requestListingSale({
                    listingId:
                      saleListing.id,
                    sellerId,
                    buyerId:
                      candidate.buyerId,
                    buyerName,
                    quantity:
                      saleQuantity,
                  });

                  closeSaleModal();

                  Alert.alert(
                    "Solicitud enviada",
                    `${buyerName} recibirá la solicitud para confirmar el trato.`,
                  );
                } catch (error) {
                  console.error(
                    "Error registrando trato:",
                    error,
                  );

                  setSaleError(
                    error instanceof Error &&
                      error.message.trim()
                      ? error.message
                      : "No pudimos registrar el trato.",
                  );
                } finally {
                  setSavingSale(
                    false,
                  );
                }
              })();
            },
          },
        ],
      );
    };

  const handleCancelPending =
    (
      listing:
        ExploreListing,
      sale:
        ListingSale,
    ) => {
      if (
        !sellerId ||
        cancellingSaleId
      ) {
        return;
      }

      const buyerName =
        getBuyerName(
          sale.buyerId,
          sale.buyerName,
        );

      Alert.alert(
        "Cancelar solicitud",
        `¿Querés cancelar la solicitud enviada a ${buyerName}? ${
          sale.quantity === 1
            ? "La unidad reservada volverá"
            : `Las ${sale.quantity} unidades reservadas volverán`
        } a quedar disponibles.`,
        [
          {
            text: "No",
            style: "cancel",
          },
          {
            text: "Cancelar solicitud",
            style:
              "destructive",
            onPress: () => {
              void (async () => {
                try {
                  setCancellingSaleId(
                    sale.id,
                  );

                  await cancelListingSale({
                    listingId:
                      listing.id,
                    buyerId:
                      sale.buyerId,
                    actorId:
                      sellerId,
                    saleId:
                      sale.id,
                  });
                } catch (error) {
                  console.error(
                    "Error cancelando solicitud:",
                    error,
                  );

                  Alert.alert(
                    "No pudimos cancelar",
                    error instanceof Error &&
                      error.message.trim()
                      ? error.message
                      : "Intentá nuevamente.",
                  );
                } finally {
                  setCancellingSaleId(
                    null,
                  );
                }
              })();
            },
          },
        ],
      );
    };

  if (
    !isAuthLoading &&
    !user
  ) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.centerState
          }
        >
          <View
            style={
              styles.stateIcon
            }
          >
            <SymbolView
              name={{
                ios:
                  "person.crop.circle.fill",
                android:
                  "account_circle",
                web:
                  "person",
              }}
              size={34}
              tintColor={
                ORANGE
              }
            />
          </View>

          <Text
            style={
              styles.stateTitle
            }
          >
            Iniciá sesión
          </Text>

          <Text
            style={
              styles.stateText
            }
          >
            Necesitás una cuenta para administrar tus publicaciones y ventas.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.back()
            }
            style={({ pressed }) => [
              styles.primaryButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Volver
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
      ]}
    >
      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.topBar
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={10}
            onPress={() =>
              router.back()
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios:
                  "chevron.left",
                android:
                  "arrow_back",
                web:
                  "arrow_back",
              }}
              size={22}
              tintColor={TEXT}
            />
          </Pressable>

          <Text
            style={
              styles.brand
            }
          >
            EZIEL
          </Text>

          <View
            style={
              styles.topBarSpacer
            }
          />
        </View>

        <View
          style={
            styles.header
          }
        >
          <Text
            style={
              styles.eyebrow
            }
          >
            CENTRO DE VENTAS
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Mis publicaciones
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Administrá tu stock, registrá tratos y seguí las confirmaciones desde un solo lugar.
          </Text>
        </View>

        {isInitialLoading ? (
          <View
            style={
              styles.loadingCard
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
              Preparando tu panel
            </Text>

            <Text
              style={
                styles.loadingText
              }
            >
              Estamos sincronizando tus publicaciones y operaciones.
            </Text>
          </View>
        ) : (
          <>
            <View
              style={
                styles.dashboard
              }
            >
              <DashboardMetric
                value={
                  dashboard.activeListings
                }
                label="Activas"
              />

              <DashboardMetric
                value={
                  dashboard.reservedUnits
                }
                label="Reservadas"
                warning={
                  dashboard.reservedUnits >
                  0
                }
              />

              <DashboardMetric
                value={
                  dashboard.soldUnits
                }
                label="Vendidas"
              />
            </View>

            {loadError ? (
              <View
                style={
                  styles.errorBanner
                }
              >
                <SymbolView
                  name={{
                    ios:
                      "exclamationmark.triangle.fill",
                    android:
                      "warning",
                    web:
                      "warning",
                  }}
                  size={19}
                  tintColor={RED}
                />

                <Text
                  style={
                    styles.errorBannerText
                  }
                >
                  {loadError}
                </Text>
              </View>
            ) : null}

            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Tus anuncios
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  {listings.length}{" "}
                  {listings.length ===
                  1
                    ? "publicación"
                    : "publicaciones"}
                </Text>
              </View>
            </View>

            {listings.length ===
            0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <View
                  style={
                    styles.stateIcon
                  }
                >
                  <SymbolView
                    name={{
                      ios:
                        "shippingbox.fill",
                      android:
                        "inventory_2",
                      web:
                        "inventory_2",
                    }}
                    size={30}
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
                  Todavía no publicaste
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Cuando publiques un producto, vas a poder administrar acá su stock y sus ventas.
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.list
                }
              >
                {listings.map(
                  (listing) => {
                    const listingSales =
                      salesByListingId.get(
                        listing.id,
                      ) ?? [];

                    const pendingSales =
                      listingSales.filter(
                        (sale) =>
                          sale.status ===
                          "pending_confirmation",
                      );

                    const confirmedSales =
                      listingSales.filter(
                        (sale) =>
                          sale.status ===
                          "confirmed",
                      );

                    return (
                      <ListingCard
                        key={
                          listing.id
                        }
                        listing={
                          listing
                        }
                        pendingSales={
                          pendingSales
                        }
                        confirmedCount={
                          confirmedSales.length
                        }
                        cancellingSaleId={
                          cancellingSaleId
                        }
                        getBuyerName={
                          getBuyerName
                        }
                        onOpen={() =>
                          router.push({
                            pathname:
                              "/explorar/[id]",
                            params: {
                              id: listing.id,
                            },
                          })
                        }
                        onRegister={() =>
                          void openSaleModal(
                            listing,
                          )
                        }
                        onCancelPending={(
                          sale,
                        ) =>
                          handleCancelPending(
                            listing,
                            sale,
                          )
                        }
                      />
                    );
                  },
                )}
              </View>
            )}
          </>
        )}

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>

      <Modal
        visible={
          Boolean(
            saleListingId,
          )
        }
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={
          closeSaleModal
        }
      >
        <View
          style={
            styles.modalRoot
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar registrar trato"
            onPress={
              closeSaleModal
            }
            style={
              styles.modalBackdrop
            }
          />

          <SafeAreaView
            edges={[
              "bottom",
            ]}
            style={
              styles.sheet
            }
          >
            <View
              style={
                styles.sheetHandle
              }
            />

            <View
              style={
                styles.sheetHeader
              }
            >
              <View
                style={
                  styles.sheetHeaderCopy
                }
              >
                <Text
                  style={
                    styles.sheetEyebrow
                  }
                >
                  OPERACIÓN
                </Text>

                <Text
                  style={
                    styles.sheetTitle
                  }
                >
                  Registrar trato
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                disabled={
                  savingSale
                }
                onPress={
                  closeSaleModal
                }
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed &&
                    !savingSale &&
                    styles.pressed,
                ]}
              >
                <SymbolView
                  name={{
                    ios:
                      "xmark",
                    android:
                      "close",
                    web:
                      "close",
                  }}
                  size={19}
                  tintColor={
                    TEXT
                  }
                />
              </Pressable>
            </View>

            {saleListing ? (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={
                  styles.sheetContent
                }
              >
                <View
                  style={
                    styles.saleListingCard
                  }
                >
                  <View
                    style={
                      styles.saleListingImage
                    }
                  >
                    {saleListing.imageUrl ? (
                      <Image
                        source={{
                          uri:
                            saleListing.imageUrl,
                        }}
                        resizeMode="cover"
                        style={
                          styles.saleImage
                        }
                      />
                    ) : (
                      <SymbolView
                        name={{
                          ios:
                            "photo.fill",
                          android:
                            "image",
                          web:
                            "image",
                        }}
                        size={26}
                        tintColor={
                          ORANGE
                        }
                      />
                    )}
                  </View>

                  <View
                    style={
                      styles.saleListingCopy
                    }
                  >
                    <Text
                      numberOfLines={
                        2
                      }
                      style={
                        styles.saleListingTitle
                      }
                    >
                      {
                        saleListing.title
                      }
                    </Text>

                    <Text
                      style={
                        styles.saleListingPrice
                      }
                    >
                      {formatCurrency(
                        saleListing.price,
                      )}{" "}
                      por unidad
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.modalMetrics
                  }
                >
                  <SmallMetric
                    label="Disponibles"
                    value={
                      saleListing.availableUnits
                    }
                    emphasis
                  />

                  <SmallMetric
                    label="Vendidas"
                    value={
                      saleListing.soldUnits
                    }
                  />

                  <SmallMetric
                    label="Reservadas"
                    value={
                      saleListing.reservedUnits
                    }
                    warning={
                      saleListing.reservedUnits >
                      0
                    }
                  />
                </View>

                    <View
                      style={
                        styles.infoBox
                      }
                    >
                      <SymbolView
                        name={{
                          ios:
                            "checkmark.shield.fill",
                          android:
                            "verified_user",
                          web:
                            "verified_user",
                        }}
                        size={19}
                        tintColor={
                          ORANGE
                        }
                      />

                      <Text
                        style={
                          styles.infoText
                        }
                      >
                        Solo aparecen personas que iniciaron una conversación por esta publicación.
                      </Text>
                    </View>

                    <View
                      style={
                        styles.fieldHeader
                      }
                    >
                      <Text
                        style={
                          styles.fieldLabel
                        }
                      >
                        Elegí al comprador
                      </Text>

                      {!buyersLoading &&
                      buyerCandidates.length >
                        0 ? (
                        <Text
                          style={
                            styles.fieldCount
                          }
                        >
                          {
                            buyerCandidates.length
                          }{" "}
                          interesados
                        </Text>
                      ) : null}
                    </View>

                    {buyersLoading ? (
                      <View
                        style={
                          styles.buyersLoading
                        }
                      >
                        <ActivityIndicator
                          size="small"
                          color={
                            ORANGE
                          }
                        />

                        <Text
                          style={
                            styles.buyersLoadingText
                          }
                        >
                          Buscando conversaciones…
                        </Text>
                      </View>
                    ) : buyerCandidates.length ===
                      0 ? (
                      <View
                        style={
                          styles.noBuyersCard
                        }
                      >
                        <Text
                          style={
                            styles.noBuyersTitle
                          }
                        >
                          No hay interesados desde el chat
                        </Text>

                        <Text
                          style={
                            styles.noBuyersText
                          }
                        >
                          Primero la persona debe iniciar una conversación por esta publicación para poder registrar el trato en Eziel.
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={
                          styles.buyersList
                        }
                      >
                        {buyerCandidates.map(
                          (
                            candidate,
                          ) => {
                            const buyerSales =
                              (
                                salesByListingId.get(
                                  saleListing.id,
                                ) ??
                                []
                              ).filter(
                                (
                                  sale,
                                ) =>
                                  sale.buyerId ===
                                  candidate.buyerId,
                              );

                            const hasPending =
                              buyerSales.some(
                                (
                                  sale,
                                ) =>
                                  sale.status ===
                                  "pending_confirmation",
                              );

                            const confirmedCount =
                              buyerSales.filter(
                                (
                                  sale,
                                ) =>
                                  sale.status ===
                                  "confirmed",
                              ).length;

                            const selected =
                              selectedBuyerId ===
                              candidate.buyerId;

                            const buyerName =
                              getBuyerName(
                                candidate.buyerId,
                                candidate.buyerName,
                              );

                            return (
                              <Pressable
                                key={
                                  candidate.buyerId
                                }
                                accessibilityRole="button"
                                accessibilityState={{
                                  selected,
                                  disabled:
                                    hasPending,
                                }}
                                disabled={
                                  hasPending ||
                                  savingSale
                                }
                                onPress={() => {
                                  setSelectedBuyerId(
                                    candidate.buyerId,
                                  );
                                  setSaleError(
                                    null,
                                  );
                                }}
                                style={({
                                  pressed,
                                }) => [
                                  styles.buyerCard,
                                  selected &&
                                    styles.buyerCardSelected,
                                  hasPending &&
                                    styles.buyerCardDisabled,
                                  pressed &&
                                    !hasPending &&
                                    styles.pressed,
                                ]}
                              >
                                <View
                                  style={
                                    styles.buyerAvatar
                                  }
                                >
                                  <Text
                                    style={
                                      styles.buyerAvatarText
                                    }
                                  >
                                    {buyerName
                                      .charAt(
                                        0,
                                      )
                                      .toUpperCase()}
                                  </Text>
                                </View>

                                <View
                                  style={
                                    styles.buyerCopy
                                  }
                                >
                                  <Text
                                    numberOfLines={
                                      1
                                    }
                                    style={
                                      styles.buyerName
                                    }
                                  >
                                    {
                                      buyerName
                                    }
                                  </Text>

                                  <Text
                                    numberOfLines={
                                      1
                                    }
                                    style={
                                      styles.buyerMeta
                                    }
                                  >
                                    {hasPending
                                      ? "Ya tiene una confirmación pendiente"
                                      : confirmedCount >
                                          0
                                        ? `${confirmedCount} ${
                                            confirmedCount ===
                                            1
                                              ? "trato anterior"
                                              : "tratos anteriores"
                                          }`
                                        : candidate.lastMessage ||
                                          "Conversación iniciada"}
                                  </Text>
                                </View>

                                <View
                                  style={[
                                    styles.radio,
                                    selected &&
                                      styles.radioSelected,
                                  ]}
                                >
                                  {selected ? (
                                    <View
                                      style={
                                        styles.radioDot
                                      }
                                    />
                                  ) : null}
                                </View>
                              </Pressable>
                            );
                          },
                        )}
                      </View>
                    )}

                <View
                  style={
                    styles.quantityCard
                  }
                >
                  <View
                    style={
                      styles.quantityCopy
                    }
                  >
                    <Text
                      style={
                        styles.fieldLabel
                      }
                    >
                      Cantidad del trato
                    </Text>

                    <Text
                      style={
                        styles.quantityHint
                      }
                    >
                      Máximo disponible:{" "}
                      {
                        saleListing.availableUnits
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.stepper
                    }
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Restar una unidad"
                      disabled={
                        savingSale ||
                        saleQuantity <=
                          1
                      }
                      onPress={() =>
                        updateQuantity(
                          saleQuantity -
                            1,
                        )
                      }
                      style={({ pressed }) => [
                        styles.stepButton,
                        pressed &&
                          styles.stepButtonPressed,
                        saleQuantity <=
                          1 &&
                          styles.disabled,
                      ]}
                    >
                      <SymbolView
                        name={{
                          ios:
                            "minus",
                          android:
                            "remove",
                          web:
                            "remove",
                        }}
                        size={18}
                        tintColor={
                          TEXT
                        }
                      />
                    </Pressable>

                    <Text
                      style={
                        styles.quantityValue
                      }
                    >
                      {
                        saleQuantity
                      }
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Sumar una unidad"
                      disabled={
                        savingSale ||
                        saleQuantity >=
                          saleListing.availableUnits
                      }
                      onPress={() =>
                        updateQuantity(
                          saleQuantity +
                            1,
                        )
                      }
                      style={({ pressed }) => [
                        styles.stepButton,
                        pressed &&
                          styles.stepButtonPressed,
                        saleQuantity >=
                          saleListing.availableUnits &&
                          styles.disabled,
                      ]}
                    >
                      <SymbolView
                        name={{
                          ios:
                            "plus",
                          android:
                            "add",
                          web:
                            "add",
                        }}
                        size={18}
                        tintColor={
                          TEXT
                        }
                      />
                    </Pressable>
                  </View>
                </View>

                {saleError ? (
                  <View
                    style={
                      styles.saleError
                    }
                  >
                    <SymbolView
                      name={{
                        ios:
                          "exclamationmark.circle.fill",
                        android:
                          "error",
                        web:
                          "error",
                      }}
                      size={19}
                      tintColor={
                        RED
                      }
                    />

                    <Text
                      style={
                        styles.saleErrorText
                      }
                    >
                      {saleError}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled:
                      savingSale ||
                      saleListing.availableUnits <
                        1 ||
                      !selectedBuyerId,
                    busy:
                      savingSale,
                  }}
                  disabled={
                    savingSale ||
                    saleListing.availableUnits <
                      1 ||
                    !selectedBuyerId
                  }
                  onPress={
                    handleRequestConfirmation
                  }
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed &&
                      !savingSale &&
                      styles.submitButtonPressed,
                    (
                      savingSale ||
                      saleListing.availableUnits <
                        1 ||
                      !selectedBuyerId
                    ) &&
                      styles.submitButtonDisabled,
                  ]}
                >
                  {savingSale ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        SURFACE
                      }
                    />
                  ) : (
                    <SymbolView
                      name={{
                        ios:
                          "paperplane.fill",
                        android:
                          "send",
                        web:
                          "send",
                      }}
                      size={19}
                      tintColor={
                        SURFACE
                      }
                    />
                  )}

                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    {savingSale
                      ? "Registrando…"
                      : "Solicitar confirmación"}
                  </Text>
                </Pressable>

                <Text
                  style={
                    styles.disclaimer
                  }
                >
                  Eziel registra que las partes reconocen un trato. No certifica pagos, entregas ni el estado del producto.
                </Text>
              </ScrollView>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface DashboardMetricProps {
  value: number;
  label: string;
  warning?: boolean;
}

function DashboardMetric({
  value,
  label,
  warning = false,
}: DashboardMetricProps) {
  return (
    <View
      style={[
        styles.dashboardMetric,
        warning &&
          styles.dashboardMetricWarning,
      ]}
    >
      <Text
        style={[
          styles.dashboardValue,
          warning &&
            styles.dashboardValueWarning,
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.dashboardLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

interface SmallMetricProps {
  label: string;
  value: number;
  emphasis?: boolean;
  warning?: boolean;
}

function SmallMetric({
  label,
  value,
  emphasis = false,
  warning = false,
}: SmallMetricProps) {
  return (
    <View
      style={[
        styles.smallMetric,
        emphasis &&
          styles.smallMetricEmphasis,
        warning &&
          styles.smallMetricWarning,
      ]}
    >
      <Text
        style={[
          styles.smallMetricValue,
          emphasis &&
            styles.smallMetricValueEmphasis,
          warning &&
            styles.smallMetricValueWarning,
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.smallMetricLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}


interface ListingCardProps {
  listing: ExploreListing;
  pendingSales: ListingSale[];
  confirmedCount: number;
  cancellingSaleId:
    | string
    | null;
  getBuyerName: (
    buyerId: string,
    fallback: string,
  ) => string;
  onOpen: () => void;
  onRegister: () => void;
  onCancelPending: (
    sale: ListingSale,
  ) => void;
}

function ListingCard({
  listing,
  pendingSales,
  confirmedCount,
  cancellingSaleId,
  getBuyerName,
  onOpen,
  onRegister,
  onCancelPending,
}: ListingCardProps) {
  const status =
    getListingStatus(
      listing,
    );

  const imageUrl =
    listing.imageUrl ||
    listing.imageUrls[0] ||
    "";

  return (
    <View
      style={
        styles.listingCard
      }
    >
      <View
        style={
          styles.listingTop
        }
      >
        <View
          style={
            styles.listingImageShell
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
                styles.listingImage
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
                  ios:
                    "photo.fill",
                  android:
                    "image",
                  web:
                    "image",
                }}
                size={27}
                tintColor={
                  ORANGE
                }
              />
            </View>
          )}
        </View>

        <View
          style={
            styles.listingCopy
          }
        >
          <View
            style={
              styles.listingMetaRow
            }
          >
            <StatusBadge
              label={
                status.label
              }
              tone={
                status.tone
              }
            />

            {listing.storeName ? (
              <Text
                numberOfLines={
                  1
                }
                style={
                  styles.storeLabel
                }
              >
                {
                  listing.storeName
                }
              </Text>
            ) : null}
          </View>

          <Text
            numberOfLines={2}
            style={
              styles.listingTitle
            }
          >
            {
              listing.title
            }
          </Text>

          <Text
            style={
              styles.listingPrice
            }
          >
            {formatCurrency(
              listing.price,
            )}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.stockRow
        }
      >
        <SmallMetric
          label="Disponibles"
          value={
            listing.availableUnits
          }
          emphasis={
            listing.availableUnits >
            0
          }
        />

        <SmallMetric
          label="Vendidas"
          value={
            listing.soldUnits
          }
        />

        <SmallMetric
          label="Reservadas"
          value={
            listing.reservedUnits
          }
          warning={
            listing.reservedUnits >
            0
          }
        />
      </View>

      {pendingSales.length >
      0 ? (
        <View
          style={
            styles.pendingBlock
          }
        >
          <View
            style={
              styles.pendingHeader
            }
          >
            <View
              style={
                styles.pendingTitleRow
              }
            >
              <SymbolView
                name={{
                  ios:
                    "clock.fill",
                  android:
                    "schedule",
                  web:
                    "schedule",
                }}
                size={17}
                tintColor={
                  WARNING
                }
              />

              <Text
                style={
                  styles.pendingTitle
                }
              >
                Pendiente de confirmación
              </Text>
            </View>

            <Text
              style={
                styles.pendingCount
              }
            >
              {
                pendingSales.length
              }
            </Text>
          </View>

          {pendingSales.map(
            (sale) => {
              const buyerName =
                getBuyerName(
                  sale.buyerId,
                  sale.buyerName,
                );

              return (
                <View
                  key={
                    sale.id
                  }
                  style={
                    styles.pendingSale
                  }
                >
                  <View
                    style={
                      styles.pendingBuyerAvatar
                    }
                  >
                    <Text
                      style={
                        styles.pendingBuyerInitial
                      }
                    >
                      {buyerName
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.pendingSaleCopy
                    }
                  >
                    <Text
                      numberOfLines={
                        1
                      }
                      style={
                        styles.pendingBuyerName
                      }
                    >
                      {buyerName}
                    </Text>

                    <Text
                      style={
                        styles.pendingSaleMeta
                      }
                    >
                      {sale.quantity}{" "}
                      {sale.quantity ===
                      1
                        ? "unidad reservada"
                        : "unidades reservadas"}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Cancelar solicitud a ${buyerName}`}
                    disabled={
                      cancellingSaleId ===
                      sale.id
                    }
                    onPress={() =>
                      onCancelPending(
                        sale,
                      )
                    }
                    style={({ pressed }) => [
                      styles.cancelPendingButton,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    {cancellingSaleId ===
                    sale.id ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          RED
                        }
                      />
                    ) : (
                      <Text
                        style={
                          styles.cancelPendingText
                        }
                      >
                        Cancelar
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            },
          )}
        </View>
      ) : null}

      {confirmedCount >
      0 ? (
        <View
          style={
            styles.confirmedNotice
          }
        >
          <SymbolView
            name={{
              ios:
                "checkmark.circle.fill",
              android:
                "check_circle",
              web:
                "check_circle",
            }}
            size={17}
            tintColor={
              SUCCESS
            }
          />

          <Text
            style={
              styles.confirmedNoticeText
            }
          >
            {confirmedCount}{" "}
            {confirmedCount ===
            1
              ? "trato confirmado"
              : "tratos confirmados"}
          </Text>
        </View>
      ) : null}

      <View
        style={
          styles.actions
        }
      >
        <Pressable
          accessibilityRole="button"
          onPress={
            onOpen
          }
          style={({ pressed }) => [
            styles.secondaryAction,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text
            style={
              styles.secondaryActionText
            }
          >
            Ver publicación
          </Text>
        </Pressable>

        {listing.availableUnits >
        0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={
              onRegister
            }
            style={({ pressed }) => [
              styles.registerAction,
              pressed &&
                styles.registerActionPressed,
            ]}
          >
            <SymbolView
              name={{
                ios:
                  "checkmark.circle.fill",
                android:
                  "check_circle",
                web:
                  "check_circle",
              }}
              size={18}
              tintColor={
                SURFACE
              }
            />

            <Text
              style={
                styles.registerActionText
              }
            >
              {listing.soldUnits >
                  0 ||
                listing.reservedUnits >
                  0
                ? "Registrar otro"
                : "Registrar trato"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

interface StatusBadgeProps {
  label: string;
  tone:
    | "success"
    | "warning"
    | "neutral";
}

function StatusBadge({
  label,
  tone,
}: StatusBadgeProps) {
  return (
    <View
      style={[
        styles.statusBadge,
        tone ===
          "success" &&
          styles.statusSuccess,
        tone ===
          "warning" &&
          styles.statusWarning,
        tone ===
          "neutral" &&
          styles.statusNeutral,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          tone ===
            "success" &&
            styles.statusDotSuccess,
          tone ===
            "warning" &&
            styles.statusDotWarning,
          tone ===
            "neutral" &&
            styles.statusDotNeutral,
        ]}
      />

      <Text
        style={[
          styles.statusText,
          tone ===
            "success" &&
            styles.statusTextSuccess,
          tone ===
            "warning" &&
            styles.statusTextWarning,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
    },

    scrollView: {
      flex: 1,
    },

    content: {
      paddingHorizontal:
        18,
    },

    topBar: {
      height: 52,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        SURFACE,
      borderWidth: 1,
      borderColor:
        BORDER,
    },

    brand: {
      color: ORANGE,
      fontSize: 14,
      fontWeight:
        "900",
      letterSpacing: 2.4,
    },

    topBarSpacer: {
      width: 40,
    },

    header: {
      paddingTop: 16,
      paddingBottom: 20,
    },

    eyebrow: {
      color: ORANGE,
      fontSize: 11,
      fontWeight:
        "900",
      letterSpacing: 1.7,
    },

    title: {
      marginTop: 6,
      color: TEXT,
      fontSize: 31,
      lineHeight: 36,
      fontWeight:
        "900",
      letterSpacing: -0.7,
    },

    subtitle: {
      marginTop: 9,
      maxWidth: 360,
      color: MUTED,
      fontSize: 15,
      lineHeight: 22,
      fontWeight:
        "500",
    },

    dashboard: {
      flexDirection:
        "row",
      gap: 9,
      marginBottom: 22,
    },

    dashboardMetric: {
      flex: 1,
      minHeight: 84,
      padding: 13,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
      justifyContent:
        "center",
    },

    dashboardMetricWarning: {
      borderColor:
        WARNING_BORDER,
      backgroundColor:
        WARNING_SOFT,
    },

    dashboardValue: {
      color: TEXT,
      fontSize: 24,
      fontWeight:
        "900",
    },

    dashboardValueWarning: {
      color: WARNING,
    },

    dashboardLabel: {
      marginTop: 4,
      color: MUTED,
      fontSize: 11,
      fontWeight:
        "800",
    },

    errorBanner: {
      marginBottom: 18,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        RED_BORDER,
      backgroundColor:
        RED_SOFT,
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 10,
    },

    errorBannerText: {
      flex: 1,
      color: RED,
      fontSize: 13,
      lineHeight: 19,
      fontWeight:
        "600",
    },

    sectionHeader: {
      marginBottom: 12,
    },

    sectionTitle: {
      color: TEXT,
      fontSize: 20,
      fontWeight:
        "900",
      letterSpacing: -0.25,
    },

    sectionSubtitle: {
      marginTop: 3,
      color: MUTED,
      fontSize: 13,
      fontWeight:
        "600",
    },

    list: {
      gap: 14,
    },

    listingCard: {
      padding: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
      shadowColor:
        "#0F172A",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },

    listingTop: {
      flexDirection:
        "row",
      gap: 13,
    },

    listingImageShell: {
      width: 88,
      height: 88,
      borderRadius: 17,
      overflow:
        "hidden",
      backgroundColor:
        ORANGE_SOFT,
    },

    listingImage: {
      width: "100%",
      height: "100%",
    },

    imageFallback: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    listingCopy: {
      flex: 1,
      minWidth: 0,
      paddingTop: 1,
    },

    listingMetaRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    storeLabel: {
      flex: 1,
      color: MUTED,
      fontSize: 11,
      fontWeight:
        "700",
    },

    listingTitle: {
      marginTop: 8,
      color: TEXT,
      fontSize: 16,
      lineHeight: 21,
      fontWeight:
        "900",
    },

    listingPrice: {
      marginTop: 5,
      color: ORANGE_DARK,
      fontSize: 16,
      fontWeight:
        "900",
    },

    statusBadge: {
      alignSelf:
        "flex-start",
      paddingHorizontal:
        8,
      paddingVertical: 5,
      borderRadius: 999,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      backgroundColor:
        SOFT,
    },

    statusSuccess: {
      backgroundColor:
        SUCCESS_SOFT,
    },

    statusWarning: {
      backgroundColor:
        WARNING_SOFT,
    },

    statusNeutral: {
      backgroundColor:
        SOFT,
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    statusDotSuccess: {
      backgroundColor:
        SUCCESS,
    },

    statusDotWarning: {
      backgroundColor:
        WARNING,
    },

    statusDotNeutral: {
      backgroundColor:
        MUTED_LIGHT,
    },

    statusText: {
      color: MUTED,
      fontSize: 10,
      fontWeight:
        "900",
    },

    statusTextSuccess: {
      color: SUCCESS,
    },

    statusTextWarning: {
      color: WARNING,
    },

    stockRow: {
      marginTop: 14,
      flexDirection:
        "row",
      gap: 7,
    },

    smallMetric: {
      flex: 1,
      paddingVertical:
        9,
      paddingHorizontal:
        8,
      borderRadius: 13,
      backgroundColor:
        SOFT,
      alignItems:
        "center",
    },

    smallMetricEmphasis: {
      backgroundColor:
        ORANGE_SOFT,
    },

    smallMetricWarning: {
      backgroundColor:
        WARNING_SOFT,
    },

    smallMetricValue: {
      color: TEXT,
      fontSize: 15,
      fontWeight:
        "900",
    },

    smallMetricValueEmphasis: {
      color: ORANGE_DARK,
    },

    smallMetricValueWarning: {
      color: WARNING,
    },

    smallMetricLabel: {
      marginTop: 2,
      color: MUTED,
      fontSize: 9,
      fontWeight:
        "800",
    },

    pendingBlock: {
      marginTop: 13,
      padding: 11,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        WARNING_BORDER,
      backgroundColor:
        WARNING_SOFT,
    },

    pendingHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 8,
    },

    pendingTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    pendingTitle: {
      color: WARNING,
      fontSize: 11,
      fontWeight:
        "900",
    },

    pendingCount: {
      color: WARNING,
      fontSize: 11,
      fontWeight:
        "900",
    },

    pendingSale: {
      minHeight: 48,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      paddingVertical: 5,
    },

    pendingBuyerAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        SURFACE,
      borderWidth: 1,
      borderColor:
        WARNING_BORDER,
    },

    pendingBuyerInitial: {
      color: WARNING,
      fontSize: 13,
      fontWeight:
        "900",
    },

    pendingSaleCopy: {
      flex: 1,
      minWidth: 0,
    },

    pendingBuyerName: {
      color: TEXT,
      fontSize: 12,
      fontWeight:
        "900",
    },

    pendingSaleMeta: {
      marginTop: 2,
      color: MUTED,
      fontSize: 10,
      fontWeight:
        "600",
    },

    cancelPendingButton: {
      minWidth: 62,
      height: 32,
      borderRadius: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 8,
      backgroundColor:
        SURFACE,
    },

    cancelPendingText: {
      color: RED,
      fontSize: 10,
      fontWeight:
        "900",
    },

    confirmedNotice: {
      marginTop: 11,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    confirmedNoticeText: {
      color: SUCCESS,
      fontSize: 11,
      fontWeight:
        "800",
    },

    actions: {
      marginTop: 14,
      flexDirection:
        "row",
      gap: 9,
    },

    secondaryAction: {
      flex: 1,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        BORDER,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        SURFACE,
    },

    secondaryActionText: {
      color: TEXT,
      fontSize: 12,
      fontWeight:
        "900",
    },

    registerAction: {
      flex: 1,
      height: 44,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      flexDirection:
        "row",
      gap: 7,
      backgroundColor:
        ORANGE,
    },

    registerActionPressed: {
      backgroundColor:
        ORANGE_DARK,
      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    registerActionText: {
      color: SURFACE,
      fontSize: 12,
      fontWeight:
        "900",
    },

    loadingCard: {
      marginTop: 30,
      paddingVertical:
        42,
      paddingHorizontal:
        24,
      alignItems:
        "center",
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
    },

    loadingTitle: {
      marginTop: 15,
      color: TEXT,
      fontSize: 17,
      fontWeight:
        "900",
    },

    loadingText: {
      marginTop: 6,
      color: MUTED,
      fontSize: 13,
      lineHeight: 19,
      textAlign:
        "center",
    },

    emptyCard: {
      paddingVertical:
        38,
      paddingHorizontal:
        24,
      alignItems:
        "center",
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
    },

    emptyTitle: {
      marginTop: 12,
      color: TEXT,
      fontSize: 17,
      fontWeight:
        "900",
    },

    emptyText: {
      marginTop: 7,
      maxWidth: 290,
      color: MUTED,
      fontSize: 13,
      lineHeight: 20,
      textAlign:
        "center",
    },

    centerState: {
      flex: 1,
      paddingHorizontal:
        30,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    stateIcon: {
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        ORANGE_SOFT,
    },

    stateTitle: {
      marginTop: 16,
      color: TEXT,
      fontSize: 22,
      fontWeight:
        "900",
    },

    stateText: {
      marginTop: 8,
      maxWidth: 310,
      color: MUTED,
      fontSize: 14,
      lineHeight: 21,
      textAlign:
        "center",
    },

    primaryButton: {
      marginTop: 22,
      minWidth: 150,
      height: 48,
      paddingHorizontal:
        20,
      borderRadius: 15,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        ORANGE,
    },

    primaryButtonText: {
      color: SURFACE,
      fontSize: 14,
      fontWeight:
        "900",
    },

    bottomSpace: {
      height: 38,
    },

    pressed: {
      opacity: 0.72,
    },

    disabled: {
      opacity: 0.35,
    },

    modalRoot: {
      flex: 1,
      justifyContent:
        "flex-end",
    },

    modalBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor:
        "rgba(15, 23, 42, 0.42)",
    },

    sheet: {
      maxHeight: "91%",
      borderTopLeftRadius:
        28,
      borderTopRightRadius:
        28,
      backgroundColor:
        BACKGROUND,
      overflow:
        "hidden",
    },

    sheetHandle: {
      alignSelf:
        "center",
      width: 42,
      height: 5,
      marginTop: 9,
      borderRadius: 999,
      backgroundColor:
        "#CBD5E1",
    },

    sheetHeader: {
      paddingHorizontal:
        19,
      paddingTop: 13,
      paddingBottom: 13,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    sheetHeaderCopy: {
      flex: 1,
    },

    sheetEyebrow: {
      color: ORANGE,
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing: 1.4,
    },

    sheetTitle: {
      marginTop: 3,
      color: TEXT,
      fontSize: 23,
      fontWeight:
        "900",
      letterSpacing: -0.35,
    },

    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
    },

    sheetContent: {
      paddingHorizontal:
        18,
      paddingBottom: 24,
    },

    saleListingCard: {
      padding: 11,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 11,
    },

    saleListingImage: {
      width: 62,
      height: 62,
      borderRadius: 14,
      overflow:
        "hidden",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        ORANGE_SOFT,
    },

    saleImage: {
      width: "100%",
      height: "100%",
    },

    saleListingCopy: {
      flex: 1,
      minWidth: 0,
    },

    saleListingTitle: {
      color: TEXT,
      fontSize: 14,
      lineHeight: 18,
      fontWeight:
        "900",
    },

    saleListingPrice: {
      marginTop: 4,
      color: ORANGE_DARK,
      fontSize: 12,
      fontWeight:
        "800",
    },

    modalMetrics: {
      marginTop: 10,
      flexDirection:
        "row",
      gap: 7,
    },

    fieldLabel: {
      color: TEXT,
      fontSize: 13,
      fontWeight:
        "900",
    },

    fieldHeader: {
      marginTop: 18,
      marginBottom: 9,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    fieldCount: {
      color: ORANGE,
      fontSize: 10,
      fontWeight:
        "900",
    },


    infoBox: {
      marginTop: 13,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        ORANGE_BORDER,
      backgroundColor:
        ORANGE_SOFT,
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 8,
    },

    infoText: {
      flex: 1,
      color: MUTED,
      fontSize: 11,
      lineHeight: 16,
      fontWeight:
        "600",
    },

    buyersLoading: {
      minHeight: 70,
      alignItems:
        "center",
      justifyContent:
        "center",
      flexDirection:
        "row",
      gap: 9,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
    },

    buyersLoadingText: {
      color: MUTED,
      fontSize: 12,
      fontWeight:
        "700",
    },

    noBuyersCard: {
      padding: 15,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
    },

    noBuyersTitle: {
      color: TEXT,
      fontSize: 12,
      fontWeight:
        "900",
    },

    noBuyersText: {
      marginTop: 5,
      color: MUTED,
      fontSize: 11,
      lineHeight: 16,
      fontWeight:
        "600",
    },

    buyersList: {
      gap: 8,
    },

    buyerCard: {
      minHeight: 62,
      padding: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
    },

    buyerCardSelected: {
      borderColor:
        ORANGE,
      backgroundColor:
        ORANGE_SOFT,
    },

    buyerCardDisabled: {
      opacity: 0.52,
    },

    buyerAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        ORANGE_SOFT,
    },

    buyerAvatarText: {
      color: ORANGE_DARK,
      fontSize: 14,
      fontWeight:
        "900",
    },

    buyerCopy: {
      flex: 1,
      minWidth: 0,
    },

    buyerName: {
      color: TEXT,
      fontSize: 12,
      fontWeight:
        "900",
    },

    buyerMeta: {
      marginTop: 3,
      color: MUTED,
      fontSize: 10,
      fontWeight:
        "600",
    },

    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor:
        "#CBD5E1",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    radioSelected: {
      borderColor:
        ORANGE,
    },

    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        ORANGE,
    },


    quantityCard: {
      marginTop: 17,
      padding: 13,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        SURFACE,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    quantityCopy: {
      flex: 1,
    },

    quantityHint: {
      marginTop: 3,
      color: MUTED,
      fontSize: 10,
      fontWeight:
        "600",
    },

    stepper: {
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        BACKGROUND,
      flexDirection:
        "row",
      alignItems:
        "center",
      padding: 3,
    },

    stepButton: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    stepButtonPressed: {
      backgroundColor:
        ORANGE_SOFT,
    },

    quantityValue: {
      width: 39,
      color: TEXT,
      fontSize: 15,
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    saleError: {
      marginTop: 13,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        RED_BORDER,
      backgroundColor:
        RED_SOFT,
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 8,
    },

    saleErrorText: {
      flex: 1,
      color: RED,
      fontSize: 11,
      lineHeight: 16,
      fontWeight:
        "700",
    },

    submitButton: {
      marginTop: 16,
      minHeight: 50,
      borderRadius: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
      backgroundColor:
        ORANGE,
    },

    submitButtonPressed: {
      backgroundColor:
        ORANGE_DARK,
      transform: [
        {
          scale: 0.988,
        },
      ],
    },

    submitButtonDisabled: {
      opacity: 0.46,
    },

    submitButtonText: {
      color: SURFACE,
      fontSize: 13,
      fontWeight:
        "900",
    },

    disclaimer: {
      marginTop: 11,
      paddingHorizontal: 5,
      color: MUTED_LIGHT,
      fontSize: 9,
      lineHeight: 14,
      textAlign:
        "center",
      fontWeight:
        "600",
    },
  });
