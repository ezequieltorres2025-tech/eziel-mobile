import { SymbolView } from "expo-symbols";
import { RefObject } from "react";
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";

const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";

export type PublishFocusedField = "title" | "description" | "price" | null;

interface PublishBasicInfoFormProps {
  publishType: "product" | "service";
  title: string;
  description: string;
  price: string;
  focusedField: PublishFocusedField;
  descriptionRef: RefObject<TextInput | null>;
  priceRef: RefObject<TextInput | null>;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onFocusChange: (field: PublishFocusedField) => void;
}

export function PublishBasicInfoForm({
  publishType,
  title,
  description,
  price,
  focusedField,
  descriptionRef,
  priceRef,
  onTitleChange,
  onDescriptionChange,
  onPriceChange,
  onFocusChange,
}: PublishBasicInfoFormProps) {
  const titleIsValid = title.trim().length >= 3;
  const descriptionIsValid = description.trim().length >= 10;

  const canContinue = titleIsValid && descriptionIsValid;

  return (
    <>
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
              onChangeText={onTitleChange}
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
              onFocus={() => onFocusChange("title")}
              onBlur={() => onFocusChange(null)}
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
              focusedField === "description" && styles.inputContainerFocused,
            ]}
          >
            <TextInput
              ref={descriptionRef}
              value={description}
              onChangeText={onDescriptionChange}
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
              onFocus={() => onFocusChange("description")}
              onBlur={() => onFocusChange(null)}
              style={[styles.input, styles.descriptionInput]}
            />

            <Text style={styles.characterCount}>{description.length}/1000</Text>
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
              onChangeText={onPriceChange}
              placeholder="0"
              placeholderTextColor={MUTED_LIGHT}
              keyboardType="numeric"
              inputMode="numeric"
              returnKeyType="done"
              selectionColor={ORANGE}
              accessibilityLabel="Precio"
              onFocus={() => onFocusChange("price")}
              onBlur={() => onFocusChange(null)}
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
          El siguiente bloque incorporará imágenes, categoría, ubicación y los
          demás datos necesarios para publicar.
        </Text>
      </View>

      <View style={styles.formStatus}>
        <View
          style={[
            styles.formStatusIcon,
            canContinue && styles.formStatusIconReady,
          ]}
        >
          <SymbolView
            name={
              canContinue
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
            tintColor={canContinue ? SURFACE : MUTED}
          />
        </View>

        <View style={styles.formStatusContent}>
          <Text style={styles.formStatusTitle}>
            {canContinue
              ? "Información básica completa"
              : "Completá los datos principales"}
          </Text>

          <Text style={styles.formStatusDescription}>
            {canContinue
              ? "El título y la descripción ya están listos para continuar."
              : "Necesitás un título y una descripción válidos antes de avanzar."}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
});
