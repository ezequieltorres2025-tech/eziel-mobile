import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useRef, useState } from "react";
import {
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

type FocusedField = "title" | "description" | "price" | null;

const PRODUCT_ICON: SymbolViewProps["name"] = {
  ios: "bag.fill",
  android: "shopping_bag",
  web: "shopping_bag",
};

const SERVICE_ICON: SymbolViewProps["name"] = {
  ios: "wrench.and.screwdriver.fill",
  android: "handyman",
  web: "handyman",
};

interface PublishTypeCardProps {
  title: string;
  description: string;
  icon: SymbolViewProps["name"];
  selected: boolean;
  onPress: () => void;
}

function PublishTypeCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: PublishTypeCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeCard,
        selected && styles.typeCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.typeIcon, selected && styles.typeIconSelected]}>
        <SymbolView
          name={icon}
          size={28}
          tintColor={selected ? SURFACE : ORANGE}
        />
      </View>

      <View style={styles.typeContent}>
        <Text style={styles.typeTitle}>{title}</Text>

        <Text style={styles.typeDescription}>{description}</Text>
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

export default function PublishScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);

  const [publishType, setPublishType] = useState<PublishType | null>(null);

  const [step, setStep] = useState<1 | 2>(1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [focusedField, setFocusedField] = useState<FocusedField>(null);

  const titleIsValid = title.trim().length >= 3;
  const descriptionIsValid = description.trim().length >= 10;

  const canContinue = publishType !== null;

  const canFinish = titleIsValid && descriptionIsValid;

  const scrollToTop = (animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        x: 0,
        y: 0,
        animated,
      });
    });
  };

  const handleContinue = () => {
    if (!canContinue) return;

    Keyboard.dismiss();
    setFocusedField(null);
    setStep(2);
    scrollToTop();
  };

  const handleBack = () => {
    Keyboard.dismiss();
    setFocusedField(null);
    setStep(1);
    scrollToTop();
  };

  const handleChangeType = () => {
    Keyboard.dismiss();
    setFocusedField(null);
    setStep(1);
    scrollToTop();
  };

  const handlePriceChange = (value: string) => {
    const normalizedValue = value.replace(/[^\d]/g, "");
    setPrice(normalizedValue);
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
            style={styles.progress}
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 1,
              max: 2,
              now: step,
              text: `Paso ${step} de 2`,
            }}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Paso {step} de 2</Text>

              <Text style={styles.progressValue}>
                {step === 1 ? "Tipo de publicación" : "Información"}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  step === 2 && styles.progressFillComplete,
                ]}
              />
            </View>
          </View>

          {step === 1 ? (
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
                  disabled: !canContinue,
                }}
                disabled={!canContinue}
                onPress={handleContinue}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !canContinue && styles.primaryButtonDisabled,
                  pressed && canContinue && styles.primaryButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    !canContinue && styles.primaryButtonTextDisabled,
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
                  tintColor={canContinue ? SURFACE : MUTED_LIGHT}
                />
              </Pressable>
            </>
          ) : (
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

              <View style={styles.formSection}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Título</Text>

                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === "title" && styles.inputContainerFocused,
                    ]}
                  >
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder={
                        publishType === "product"
                          ? "Ej. iPhone 15 Pro 256 GB"
                          : "Ej. Instalaciones eléctricas"
                      }
                      placeholderTextColor={MUTED_LIGHT}
                      maxLength={80}
                      returnKeyType="next"
                      autoCapitalize="sentences"
                      autoCorrect
                      selectionColor={ORANGE}
                      accessibilityLabel="Título de la publicación"
                      onFocus={() => setFocusedField("title")}
                      onBlur={() => setFocusedField(null)}
                      onSubmitEditing={() => descriptionRef.current?.focus()}
                      style={styles.input}
                    />

                    <Text style={styles.characterCount}>{title.length}/80</Text>
                  </View>

                  {title.length > 0 && !titleIsValid && (
                    <Text style={styles.validationHint}>
                      Escribí al menos 3 caracteres.
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Descripción</Text>

                  <View
                    style={[
                      styles.inputContainer,
                      styles.descriptionContainer,
                      focusedField === "description" &&
                        styles.inputContainerFocused,
                    ]}
                  >
                    <TextInput
                      ref={descriptionRef}
                      value={description}
                      onChangeText={setDescription}
                      placeholder={
                        publishType === "product"
                          ? "Contá el estado, características y todo lo importante."
                          : "Explicá qué servicio ofrecés y qué incluye."
                      }
                      placeholderTextColor={MUTED_LIGHT}
                      multiline
                      textAlignVertical="top"
                      maxLength={1000}
                      autoCapitalize="sentences"
                      autoCorrect
                      selectionColor={ORANGE}
                      accessibilityLabel="Descripción de la publicación"
                      onFocus={() => setFocusedField("description")}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.input, styles.descriptionInput]}
                    />

                    <Text style={styles.characterCount}>
                      {description.length}/1000
                    </Text>
                  </View>

                  {description.length > 0 && !descriptionIsValid && (
                    <Text style={styles.validationHint}>
                      La descripción necesita al menos 10 caracteres.
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <View style={styles.fieldLabelRow}>
                    <Text style={styles.fieldLabel}>Precio</Text>

                    <Text style={styles.optional}>Opcional</Text>
                  </View>

                  <View
                    style={[
                      styles.priceInput,
                      focusedField === "price" && styles.inputContainerFocused,
                    ]}
                  >
                    <Text style={styles.currency}>$</Text>

                    <TextInput
                      ref={priceRef}
                      value={price}
                      onChangeText={handlePriceChange}
                      placeholder="0"
                      placeholderTextColor={MUTED_LIGHT}
                      keyboardType="numeric"
                      inputMode="numeric"
                      returnKeyType="done"
                      selectionColor={ORANGE}
                      accessibilityLabel="Precio"
                      onFocus={() => setFocusedField("price")}
                      onBlur={() => setFocusedField(null)}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      style={styles.priceTextInput}
                    />
                  </View>

                  <Text style={styles.fieldHelper}>
                    Ingresá el valor sin puntos ni símbolos.
                  </Text>
                </View>
              </View>

              <View style={styles.nextInfo}>
                <View style={styles.nextInfoIcon}>
                  <SymbolView
                    name={{
                      ios: "photo.on.rectangle.angled",
                      android: "photo_library",
                      web: "photo_library",
                    }}
                    size={22}
                    tintColor={ORANGE}
                  />
                </View>

                <Text style={styles.nextInfoText}>
                  El siguiente bloque incorporará imágenes, categoría, ubicación
                  y los demás datos necesarios para publicar.
                </Text>
              </View>

              <View style={styles.formStatus}>
                <View
                  style={[
                    styles.formStatusIcon,
                    canFinish && styles.formStatusIconReady,
                  ]}
                >
                  <SymbolView
                    name={
                      canFinish
                        ? {
                            ios: "checkmark",
                            android: "check",
                            web: "check",
                          }
                        : {
                            ios: "info.circle.fill",
                            android: "info",
                            web: "info",
                          }
                    }
                    size={19}
                    tintColor={canFinish ? SURFACE : MUTED}
                  />
                </View>

                <View style={styles.formStatusContent}>
                  <Text style={styles.formStatusTitle}>
                    {canFinish
                      ? "Información básica completa"
                      : "Completá los datos principales"}
                  </Text>

                  <Text style={styles.formStatusDescription}>
                    {canFinish
                      ? "El título y la descripción ya están listos para continuar."
                      : "Necesitás un título y una descripción válidos antes de avanzar."}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleBack}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
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

                <View
                  style={[
                    styles.continueButton,
                    !canFinish && styles.primaryButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: true,
                  }}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      !canFinish && styles.primaryButtonTextDisabled,
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
                    tintColor={canFinish ? SURFACE : MUTED_LIGHT}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    width: "50%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: ORANGE,
  },

  progressFillComplete: {
    width: "100%",
  },

  sectionHeader: {
    marginBottom: 16,
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

  typeCard: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
  },

  typeCardSelected: {
    borderColor: ORANGE,
    backgroundColor: ORANGE_SOFT,
  },

  typeIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: ORANGE_SOFT,
  },

  typeIconSelected: {
    backgroundColor: ORANGE,
  },

  typeContent: {
    flex: 1,
  },

  typeTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "800",
  },

  typeDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  radio: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },

  radioSelected: {
    borderColor: ORANGE,
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ORANGE,
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

  formSection: {
    gap: 20,
  },

  field: {
    width: "100%",
  },

  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fieldLabel: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },

  optional: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },

  inputContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  inputContainerFocused: {
    borderColor: ORANGE,
  },

  input: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingRight: 52,
    color: TEXT,
    fontSize: 15,
    fontWeight: "500",
  },

  descriptionContainer: {
    minHeight: 140,
  },

  descriptionInput: {
    minHeight: 140,
    paddingTop: 15,
    paddingBottom: 34,
    paddingRight: 16,
  },

  characterCount: {
    position: "absolute",
    right: 12,
    bottom: 10,
    color: MUTED_LIGHT,
    fontSize: 10,
    fontWeight: "500",
  },

  validationHint: {
    color: ORANGE_DARK,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    marginLeft: 2,
  },

  fieldHelper: {
    color: MUTED_LIGHT,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
    marginLeft: 2,
  },

  priceInput: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  currency: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    marginRight: 8,
  },

  priceTextInput: {
    flex: 1,
    minHeight: 54,
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 0,
  },

  nextInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    marginTop: 24,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  nextInfoIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: ORANGE_SOFT,
  },

  nextInfoText: {
    flex: 1,
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },

  formStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  formStatusIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },

  formStatusIconReady: {
    backgroundColor: ORANGE,
  },

  formStatusContent: {
    flex: 1,
  },

  formStatusTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  formStatusDescription: {
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

  pressed: {
    opacity: 0.7,
  },
});
