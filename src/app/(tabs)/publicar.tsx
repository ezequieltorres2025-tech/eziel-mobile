import { SymbolView } from "expo-symbols";
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

import {
  PublishBasicInfoForm,
  type PublishFocusedField,
} from "../../features/publish/components/PublishBasicInfoForm";
import { PublishTypeCard } from "../../features/publish/components/PublishTypeCard";

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

export default function PublishScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);

  const [publishType, setPublishType] = useState<PublishType | null>(null);

  const [step, setStep] = useState<1 | 2>(1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [focusedField, setFocusedField] = useState<PublishFocusedField>(null);

  const titleIsValid = title.trim().length >= 3;
  const descriptionIsValid = description.trim().length >= 10;

  const canSelectType = publishType !== null;

  const canContinue = titleIsValid && descriptionIsValid;

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

  const handleTypeContinue = () => {
    if (!canSelectType) return;

    clearKeyboardState();
    setStep(2);
    scrollToTop();
  };

  const handleBack = () => {
    clearKeyboardState();
    setStep(1);
    scrollToTop();
  };

  const handleChangeType = () => {
    clearKeyboardState();
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
                  accessibilityRole="button"
                  accessibilityLabel="Continuar al siguiente paso"
                  accessibilityState={{
                    disabled: true,
                  }}
                  style={[
                    styles.continueButton,
                    !canContinue && styles.primaryButtonDisabled,
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
