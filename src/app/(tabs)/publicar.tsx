import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../features/auth/AuthProvider";
import {
  PublishBasicInfoForm,
  type PublishFocusedField,
} from "../../features/publish/components/PublishBasicInfoForm";
import { PublishCategorySelector } from "../../features/publish/components/PublishCategorySelector";
import {
  PublishImagePicker,
  type PublishImage,
} from "../../features/publish/components/PublishImagePicker";
import {
  PublishLocationField,
  type PublishLocationValue,
} from "../../features/publish/components/PublishLocationField";
import { PublishTypeCard } from "../../features/publish/components/PublishTypeCard";
import type { ListingCategory } from "../../features/publish/constants";
import { PublishServiceFlow } from "../../features/publish-service/components/PublishServiceFlow";
import { publishProduct } from "../../features/publish/publishProductService";

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
const DISABLED = "#E2E8F0";

type PublishType = "product" | "service";
type PublishStep = 1 | 2 | 3;

const PRODUCT_ICON = {
  ios: "bag.fill",
  android: "shopping_bag",
  web: "shopping_bag",
} as const;

const SERVICE_ICON = {
  ios: "wrench.and.screwdriver.fill",
  android: "handyman",
  web: "handyman",
} as const;

const EMPTY_LOCATION: PublishLocationValue = {
  label: "",
  latitude: null,
  longitude: null,
  source: null,
};

function getStepLabel(step: PublishStep) {
  switch (step) {
    case 1:
      return "Tipo de publicación";

    case 2:
      return "Información";

    case 3:
      return "Detalles";
  }
}

function getProgressWidth(step: PublishStep): `${number}%` {
  switch (step) {
    case 1:
      return "33.333%";

    case 2:
      return "66.666%";

    case 3:
      return "100%";
  }
}

export default function PublishScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    userProfile,
    loginWithGoogle,
  } = useAuth();

  const [publishType, setPublishType] = useState<PublishType | null>(null);

  const [step, setStep] = useState<PublishStep>(1);

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("");

  const [images, setImages] = useState<PublishImage[]>([]);

  const [category, setCategory] = useState<ListingCategory | null>(null);

  const [location, setLocation] =
    useState<PublishLocationValue>(EMPTY_LOCATION);

  const [focusedField, setFocusedField] = useState<PublishFocusedField>(null);

  const [isPublishing, setIsPublishing] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  const titleIsValid = title.trim().length >= 3;

  const descriptionIsValid = description.trim().length >= 10;

  const hasProductPrice = price.trim().length > 0;

  const canSelectType = publishType !== null;

  const canContinueBasicInfo = titleIsValid && descriptionIsValid;

  const hasRequiredImages = images.length > 0;

  const hasRequiredCategory = category !== null;

  const hasRequiredLocation = location.label.trim().length > 0;

  const detailsProgressCount =
    Number(hasRequiredImages) +
    Number(hasRequiredCategory) +
    Number(hasRequiredLocation);

  const allDetailsReady = detailsProgressCount === 3;

  const canPublishProduct =
    publishType === "product" &&
    allDetailsReady &&
    hasProductPrice &&
    !isPublishing;

  const uploadProgressPercent = Math.round(uploadProgress * 100);

  const uploadProgressWidth = `${uploadProgressPercent}%` as `${number}%`;

  const scrollToTop = (animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        x: 0,
        y: 0,
        animated,
      });
    });
  };

  const clearKeyboardState = () => {
    Keyboard.dismiss();
    setFocusedField(null);
  };

  const goToStep = (nextStep: PublishStep) => {
    clearKeyboardState();
    setStep(nextStep);
    scrollToTop();
  };

  const handleTypeContinue = () => {
    if (!canSelectType) {
      return;
    }

    goToStep(2);
  };

  const handleBasicInfoContinue = () => {
    if (!canContinueBasicInfo) {
      return;
    }

    goToStep(3);
  };

  const handleBack = () => {
    if (isPublishing) {
      return;
    }

    if (step === 3) {
      goToStep(2);
      return;
    }

    goToStep(1);
  };

  const handleChangeType = () => {
    if (isPublishing) {
      return;
    }

    goToStep(1);
  };

  const handlePriceChange = (value: string) => {
    const normalizedValue = value.replace(/[^\d]/g, "");

    setPrice(normalizedValue);
  };

  const resetForm = () => {
    clearKeyboardState();
    setPublishType(null);
    setStep(1);
    setTitle("");
    setDescription("");
    setPrice("");
    setImages([]);
    setCategory(null);
    setLocation({ ...EMPTY_LOCATION });
    setUploadProgress(0);
    scrollToTop(false);
  };

  const handlePublish = async () => {
    if (isPublishing || publishType !== "product" || !allDetailsReady) {
      return;
    }

    if (!hasProductPrice) {
      Alert.alert(
        "Precio requerido",
        "Ingresá un precio para publicar el producto.",
      );
      return;
    }

    if (isAuthLoading) {
      Alert.alert(
        "Verificando sesión",
        "Esperá un momento mientras verificamos tu cuenta.",
      );
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        "Iniciá sesión",
        "Debes iniciar sesión con Google para publicar en Eziel.",
      );
      return;
    }

    if (!category) {
      return;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      Alert.alert(
        "Precio inválido",
        "Ingresá un precio válido para continuar.",
      );
      return;
    }

    const selectedImages = [...images];
    const selectedCategory = category;
    const selectedLocation = location.label.trim();

    setIsPublishing(true);
    setUploadProgress(0);

    try {
      await publishProduct(
        {
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          category: selectedCategory,
          location: selectedLocation,
          images: selectedImages,
        },
        {
          userProfile,
          onUploadProgress: ({ overallProgress }) => {
            setUploadProgress(overallProgress);
          },
        },
      );

      setUploadProgress(1);

      resetForm();

      Alert.alert(
        "Publicación creada",
        "Tu producto ya está publicado en Eziel.",
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "No pudimos crear la publicación. Intentá nuevamente.";

      Alert.alert("No se pudo publicar", message);
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedIcon = publishType === "service" ? SERVICE_ICON : PRODUCT_ICON;

  const selectedTypeLabel = publishType === "service" ? "Servicio" : "Producto";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.brand}>EZIEL</Text>

            <Text style={styles.title}>Publicar</Text>

            <Text style={styles.subtitle}>
              Mostrá lo que ofrecés a personas de tu zona.
            </Text>
          </View>

          <View
            style={
              publishType === "service" && step === 2
                ? styles.hidden
                : styles.progress
            }
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 1,
              max: 3,
              now: step,
              text: `Paso ${step} de 3`,
            }}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Paso {step} de 3</Text>

              <Text style={styles.progressValue}>{getStepLabel(step)}</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: getProgressWidth(step),
                  },
                ]}
              />
            </View>
          </View>

          {publishType === "service" && step === 2 && (
            <PublishServiceFlow
              isAuthenticated={isAuthenticated}
              userProfile={userProfile}
              onExit={handleChangeType}
              onStepChange={() => {
                clearKeyboardState();
                scrollToTop();
              }}
              onPublished={() => {
                clearKeyboardState();
                scrollToTop();
              }}
              onRequestSignIn={async () => {
                if (isAuthLoading) {
                  Alert.alert(
                    "Verificando sesión",
                    "Esperá un momento mientras verificamos tu cuenta.",
                  );
                  return;
                }

                try {
                  const result = await loginWithGoogle();

                  if (result === "cancelled") {
                    return;
                  }
                } catch (error) {
                  const message =
                    error instanceof Error && error.message.trim()
                      ? error.message
                      : "No pudimos iniciar sesión con Google. Intentá nuevamente.";

                  Alert.alert(
                    "No se pudo iniciar sesión",
                    message,
                  );
                }
              }}
            />
          )}

          {step === 1 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>¿Qué querés publicar?</Text>

                <Text style={styles.sectionDescription}>
                  Elegí el tipo de publicación para adaptar la experiencia.
                </Text>
              </View>

              <View style={styles.typeList} accessibilityRole="radiogroup">
                <PublishTypeCard
                  title="Producto"
                  description="Algo físico que querés vender, nuevo o usado."
                  icon={PRODUCT_ICON}
                  selected={publishType === "product"}
                  onPress={() => setPublishType("product")}
                />

                <PublishTypeCard
                  title="Servicio"
                  description="Un trabajo, profesión o servicio que ofrecés."
                  icon={SERVICE_ICON}
                  selected={publishType === "service"}
                  onPress={() => setPublishType("service")}
                />
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <SymbolView
                    name={{
                      ios: "lightbulb.fill",
                      android: "lightbulb",
                      web: "lightbulb",
                    }}
                    size={23}
                    tintColor={ORANGE}
                  />
                </View>

                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>
                    Publicaciones claras venden mejor
                  </Text>

                  <Text style={styles.infoDescription}>
                    Usá un título simple, buenas imágenes y una descripción
                    completa para generar más confianza.
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: !canSelectType,
                }}
                disabled={!canSelectType}
                onPress={handleTypeContinue}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !canSelectType && styles.primaryButtonDisabled,
                  pressed && canSelectType && styles.primaryButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    !canSelectType && styles.primaryButtonTextDisabled,
                  ]}
                >
                  Continuar
                </Text>

                <SymbolView
                  name={{
                    ios: "arrow.right",
                    android: "arrow_forward",
                    web: "arrow_forward",
                  }}
                  size={19}
                  tintColor={canSelectType ? SURFACE : MUTED_LIGHT}
                />
              </Pressable>
            </>
          )}

          {step === 2 && publishType === "product" && (
            <>
              <View style={styles.selectedType}>
                <View style={styles.selectedTypeIcon}>
                  <SymbolView
                    name={selectedIcon}
                    size={21}
                    tintColor={ORANGE}
                  />
                </View>

                <View style={styles.selectedTypeContent}>
                  <Text style={styles.selectedTypeLabel}>Estás publicando</Text>

                  <Text style={styles.selectedTypeTitle}>
                    {selectedTypeLabel}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar tipo de publicación"
                  onPress={handleChangeType}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.changeTypeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.changeType}>Cambiar</Text>
                </Pressable>
              </View>

              <PublishBasicInfoForm
                publishType={publishType ?? "product"}
                title={title}
                description={description}
                price={price}
                focusedField={focusedField}
                descriptionRef={descriptionRef}
                priceRef={priceRef}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onPriceChange={handlePriceChange}
                onFocusChange={setFocusedField}
              />

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isPublishing,
                  }}
                  disabled={isPublishing}
                  onPress={handleBack}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    isPublishing && styles.secondaryButtonDisabled,
                    pressed && !isPublishing && styles.pressed,
                  ]}
                >
                  <SymbolView
                    name={{
                      ios: "arrow.left",
                      android: "arrow_back",
                      web: "arrow_back",
                    }}
                    size={19}
                    tintColor={TEXT}
                  />

                  <Text style={styles.secondaryButtonText}>Atrás</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Continuar al paso de detalles"
                  accessibilityState={{
                    disabled: !canContinueBasicInfo,
                  }}
                  disabled={!canContinueBasicInfo}
                  onPress={handleBasicInfoContinue}
                  style={({ pressed }) => [
                    styles.continueButton,
                    !canContinueBasicInfo && styles.primaryButtonDisabled,
                    pressed &&
                      canContinueBasicInfo &&
                      styles.primaryButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      !canContinueBasicInfo && styles.primaryButtonTextDisabled,
                    ]}
                  >
                    Continuar
                  </Text>

                  <SymbolView
                    name={{
                      ios: "arrow.right",
                      android: "arrow_forward",
                      web: "arrow_forward",
                    }}
                    size={19}
                    tintColor={canContinueBasicInfo ? SURFACE : MUTED_LIGHT}
                  />
                </Pressable>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.selectedType}>
                <View style={styles.selectedTypeIcon}>
                  <SymbolView
                    name={selectedIcon}
                    size={21}
                    tintColor={ORANGE}
                  />
                </View>

                <View style={styles.selectedTypeContent}>
                  <Text style={styles.selectedTypeLabel}>Estás publicando</Text>

                  <Text style={styles.selectedTypeTitle}>
                    {selectedTypeLabel}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar tipo de publicación"
                  onPress={handleChangeType}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.changeTypeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.changeType}>Cambiar</Text>
                </Pressable>
              </View>

              <View style={styles.detailsHeader}>
                <Text style={styles.sectionTitle}>Completá los detalles</Text>

                <Text style={styles.sectionDescription}>
                  Agregá imágenes, elegí una categoría y definí dónde se
                  encuentra tu publicación.
                </Text>
              </View>

              <PublishImagePicker images={images} onImagesChange={setImages} />

              <View style={styles.imageStatus}>
                <View
                  style={[
                    styles.imageStatusIcon,
                    hasRequiredImages && styles.imageStatusIconReady,
                  ]}
                >
                  <SymbolView
                    name={
                      hasRequiredImages
                        ? {
                            ios: "checkmark",
                            android: "check",
                            web: "check",
                          }
                        : {
                            ios: "photo.fill",
                            android: "photo_library",
                            web: "photo_library",
                          }
                    }
                    size={19}
                    tintColor={hasRequiredImages ? SURFACE : MUTED}
                  />
                </View>

                <View style={styles.imageStatusContent}>
                  <Text style={styles.imageStatusTitle}>
                    {hasRequiredImages ? "Imágenes listas" : "Falta una imagen"}
                  </Text>

                  <Text style={styles.imageStatusDescription}>
                    {hasRequiredImages
                      ? `${images.length} ${
                          images.length === 1
                            ? "imagen seleccionada"
                            : "imágenes seleccionadas"
                        }.`
                      : "Agregá al menos una imagen para completar esta parte de la publicación."}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <PublishCategorySelector
                value={category}
                onChange={setCategory}
              />

              <View style={styles.detailDivider} />

              <PublishLocationField value={location} onChange={setLocation} />

              <View style={styles.detailStatus}>
                <View
                  style={[
                    styles.detailStatusIcon,
                    allDetailsReady && styles.detailStatusIconReady,
                  ]}
                >
                  <SymbolView
                    name={
                      allDetailsReady
                        ? {
                            ios: "checkmark",
                            android: "check",
                            web: "check",
                          }
                        : {
                            ios: "list.bullet",
                            android: "list",
                            web: "list",
                          }
                    }
                    size={19}
                    tintColor={allDetailsReady ? SURFACE : MUTED}
                  />
                </View>

                <View style={styles.detailStatusContent}>
                  <Text style={styles.detailStatusTitle}>
                    {allDetailsReady
                      ? "Detalles completos"
                      : `${detailsProgressCount} de 3 datos completados`}
                  </Text>

                  <Text style={styles.detailStatusDescription}>
                    {allDetailsReady
                      ? "Las imágenes, la categoría y la ubicación están listas."
                      : "Completá imágenes, categoría y ubicación antes de publicar."}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isPublishing,
                  }}
                  disabled={isPublishing}
                  onPress={handleBack}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    isPublishing && styles.secondaryButtonDisabled,
                    pressed && !isPublishing && styles.pressed,
                  ]}
                >
                  <SymbolView
                    name={{
                      ios: "arrow.left",
                      android: "arrow_back",
                      web: "arrow_back",
                    }}
                    size={19}
                    tintColor={TEXT}
                  />

                  <Text style={styles.secondaryButtonText}>Atrás</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Publicar en Eziel"
                  accessibilityState={{
                    disabled:
                      publishType !== "product" ||
                      !allDetailsReady ||
                      !hasProductPrice ||
                      isPublishing,
                    busy: isPublishing,
                  }}
                  disabled={
                    publishType !== "product" ||
                    !allDetailsReady ||
                    !hasProductPrice ||
                    isPublishing
                  }
                  onPress={handlePublish}
                  style={({ pressed }) => [
                    styles.continueButton,
                    !canPublishProduct && styles.primaryButtonDisabled,
                    pressed && canPublishProduct && styles.primaryButtonPressed,
                  ]}
                >
                  {isPublishing ? (
                    <ActivityIndicator size="small" color={SURFACE} />
                  ) : (
                    <SymbolView
                      name={{
                        ios: "arrow.up.circle.fill",
                        android: "publish",
                        web: "publish",
                      }}
                      size={19}
                      tintColor={canPublishProduct ? SURFACE : MUTED_LIGHT}
                    />
                  )}

                  <Text
                    style={[
                      styles.primaryButtonText,
                      !canPublishProduct && styles.primaryButtonTextDisabled,
                    ]}
                  >
                    {isPublishing ? "Publicando..." : "Publicar"}
                  </Text>
                </Pressable>
              </View>

              {isPublishing && (
                <View
                  style={styles.publishingCard}
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: 100,
                    now: uploadProgressPercent,
                    text: `${uploadProgressPercent}%`,
                  }}
                >
                  <View style={styles.publishingHeader}>
                    <Text style={styles.publishingTitle}>
                      {uploadProgress < 1
                        ? "Subiendo imágenes"
                        : "Guardando publicación"}
                    </Text>

                    <Text style={styles.publishingPercent}>
                      {uploadProgressPercent}%
                    </Text>
                  </View>

                  <View style={styles.publishingProgressTrack}>
                    <View
                      style={[
                        styles.publishingProgressFill,
                        {
                          width: uploadProgressWidth,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.publishingDescription}>
                    No cierres Eziel hasta que termine la publicación.
                  </Text>
                </View>
              )}

              {!isPublishing && publishType === "service" && (
                <Text style={styles.pendingNotice}>
                  Los servicios usan un flujo profesional separado y no se
                  publican como productos.
                </Text>
              )}

              {!isPublishing &&
                publishType === "product" &&
                allDetailsReady &&
                !hasProductPrice && (
                  <Text style={styles.pendingNotice}>
                    Volvé a Información e ingresá un precio para publicar el
                    producto.
                  </Text>
                )}

              {!isPublishing &&
                publishType === "product" &&
                hasProductPrice &&
                allDetailsReady &&
                !isAuthenticated && (
                  <Text style={styles.pendingNotice}>
                    Al publicar te pediremos iniciar sesión si todavía no estás
                    conectado.
                  </Text>
                )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hidden: {
    display: "none",
  },

  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 22,
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
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },

  progress: {
    marginBottom: 30,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  progressLabel: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "800",
  },

  progressValue: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
  },

  progressTrack: {
    height: 5,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: DISABLED,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ORANGE,
  },

  sectionHeader: {
    marginBottom: 16,
  },

  detailsHeader: {
    marginBottom: 20,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  sectionDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  typeList: {
    gap: 12,
  },

  infoCard: {
    flexDirection: "row",
    gap: 13,
    padding: 16,
    marginTop: 22,
    borderRadius: 20,
    backgroundColor: ORANGE_SOFT,
  },

  infoIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: SURFACE,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "800",
  },

  infoDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  primaryButton: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 24,
    borderRadius: 18,
    backgroundColor: ORANGE,
  },

  primaryButtonDisabled: {
    backgroundColor: DISABLED,
  },

  primaryButtonPressed: {
    backgroundColor: ORANGE_DARK,
  },

  primaryButtonText: {
    color: SURFACE,
    fontSize: 15,
    fontWeight: "800",
  },

  primaryButtonTextDisabled: {
    color: MUTED_LIGHT,
  },

  selectedType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: ORANGE_SOFT,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    marginBottom: 24,
  },

  selectedTypeIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: SURFACE,
  },

  selectedTypeContent: {
    flex: 1,
  },

  selectedTypeLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "600",
  },

  selectedTypeTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },

  changeTypeButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },

  changeType: {
    color: ORANGE_DARK,
    fontSize: 12,
    fontWeight: "800",
  },

  imageStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  imageStatusIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },

  imageStatusIconReady: {
    backgroundColor: ORANGE,
  },

  imageStatusContent: {
    flex: 1,
  },

  imageStatusTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  imageStatusDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  detailDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 26,
  },

  detailStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  detailStatusIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },

  detailStatusIconReady: {
    backgroundColor: ORANGE,
  },

  detailStatusContent: {
    flex: 1,
  },

  detailStatusTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  detailStatusDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },

  secondaryButton: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  secondaryButtonText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "800",
  },

  continueButton: {
    flex: 1,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: ORANGE,
  },

  secondaryButtonDisabled: {
    opacity: 0.5,
  },

  publishingCard: {
    padding: 15,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
  },

  publishingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },

  publishingTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  publishingPercent: {
    color: ORANGE_DARK,
    fontSize: 12,
    fontWeight: "800",
  },

  publishingProgressTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: DISABLED,
  },

  publishingProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ORANGE,
  },

  publishingDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 9,
  },

  pendingNotice: {
    color: MUTED_LIGHT,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 18,
  },

  pressed: {
    opacity: 0.7,
  },
});
