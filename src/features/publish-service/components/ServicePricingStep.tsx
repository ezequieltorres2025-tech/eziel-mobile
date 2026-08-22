import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  SERVICE_PRICE_TYPE_OPTIONS,
  SERVICE_RESPONSE_TIME_OPTIONS,
} from "../serviceFormOptions";

import type {
  ServicePriceType,
  ServiceResponseTime,
} from "../serviceTypes";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const ORANGE_BORDER = "#FED7AA";

const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";

interface ServicePricingStepProps {
  priceType: ServicePriceType;
  price: string;
  experienceYears: string;
  responseTime: ServiceResponseTime;
  disabled?: boolean;

  onPriceTypeChange: (
    value: ServicePriceType,
  ) => void;

  onPriceChange: (value: string) => void;

  onExperienceYearsChange: (
    value: string,
  ) => void;

  onResponseTimeChange: (
    value: ServiceResponseTime,
  ) => void;
}

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

export function ServicePricingStep({
  priceType,
  price,
  experienceYears,
  responseTime,
  disabled = false,
  onPriceTypeChange,
  onPriceChange,
  onExperienceYearsChange,
  onResponseTimeChange,
}: ServicePricingStepProps) {
  const handlePriceTypeChange = (
    nextValue: ServicePriceType,
  ) => {
    onPriceTypeChange(nextValue);

    if (nextValue === "quote") {
      onPriceChange("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          PRECIO Y EXPERIENCIA
        </Text>

        <Text style={styles.title}>
          Definí cómo trabajás
        </Text>

        <Text style={styles.description}>
          Elegí la modalidad que mejor representa el valor de
          tu servicio.
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Modalidad de precio
        </Text>

        <View style={styles.optionList}>
          {SERVICE_PRICE_TYPE_OPTIONS.map(
            (option) => {
              const selected =
                option.value === priceType;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: selected,
                    disabled,
                  }}
                  disabled={disabled}
                  onPress={() =>
                    handlePriceTypeChange(
                      option.value,
                    )
                  }
                  style={({ pressed }) => [
                    styles.optionCard,
                    selected &&
                      styles.optionCardSelected,
                    disabled && styles.disabled,
                    pressed &&
                      !disabled &&
                      styles.pressed,
                  ]}
                >
                  <View style={styles.radioOuter}>
                    {selected && (
                      <View
                        style={styles.radioInner}
                      />
                    )}
                  </View>

                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionTitle,
                        selected &&
                          styles.optionTitleSelected,
                      ]}
                    >
                      {option.label}
                    </Text>

                    <Text
                      style={styles.optionDescription}
                    >
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              );
            },
          )}
        </View>
      </View>

      {priceType !== "quote" && (
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              {priceType === "hourly"
                ? "Precio por hora"
                : priceType === "from"
                  ? "Precio desde"
                  : "Precio"}
            </Text>

            <Text style={styles.required}>
              Obligatorio
            </Text>
          </View>

          <View style={styles.priceInput}>
            <Text style={styles.currency}>
              $
            </Text>

            <TextInput
              value={price}
              onChangeText={(value) =>
                onPriceChange(
                  digitsOnly(value),
                )
              }
              editable={!disabled}
              placeholder="0"
              placeholderTextColor={MUTED_LIGHT}
              keyboardType="numeric"
              inputMode="numeric"
              maxLength={12}
              selectionColor={ORANGE}
              accessibilityLabel="Precio del servicio"
              style={styles.priceTextInput}
            />
          </View>

          <Text style={styles.helper}>
            Ingresá el valor en pesos argentinos, sin puntos ni
            símbolos.
          </Text>
        </View>
      )}

      {priceType === "quote" && (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteTitle}>
            Precio a consultar
          </Text>

          <Text style={styles.quoteDescription}>
            En Firestore se guardará precio 0 y el cliente deberá
            pedir presupuesto.
          </Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>
          Años de experiencia
        </Text>

        <TextInput
          value={experienceYears}
          onChangeText={(value) =>
            onExperienceYearsChange(
              digitsOnly(value).slice(0, 2),
            )
          }
          editable={!disabled}
          placeholder="Ej: 5"
          placeholderTextColor={MUTED_LIGHT}
          keyboardType="numeric"
          inputMode="numeric"
          maxLength={2}
          selectionColor={ORANGE}
          accessibilityLabel="Años de experiencia"
          style={styles.input}
        />

        <Text style={styles.helper}>
          Opcional. El máximo permitido es 80 años.
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Tiempo de respuesta
        </Text>

        <View style={styles.responseGrid}>
          {SERVICE_RESPONSE_TIME_OPTIONS.map(
            (option) => {
              const selected =
                responseTime === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: selected,
                    disabled,
                  }}
                  disabled={disabled}
                  onPress={() =>
                    onResponseTimeChange(
                      option.value,
                    )
                  }
                  style={({ pressed }) => [
                    styles.responseChip,
                    selected &&
                      styles.responseChipSelected,
                    disabled && styles.disabled,
                    pressed &&
                      !disabled &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.responseText,
                      selected &&
                        styles.responseTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },

  header: {
    gap: 5,
  },

  eyebrow: {
    color: ORANGE_DARK,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  title: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "900",
  },

  description: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
  },

  field: {
    gap: 8,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  required: {
    color: ORANGE_DARK,
    fontSize: 10,
    fontWeight: "800",
  },

  optionList: {
    gap: 10,
  },

  optionCard: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    backgroundColor: SURFACE,
    padding: 14,
  },

  optionCardSelected: {
    borderColor: ORANGE_BORDER,
    backgroundColor: ORANGE_SOFT,
  },

  radioOuter: {
    width: 21,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: ORANGE,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: ORANGE,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "800",
  },

  optionTitleSelected: {
    color: ORANGE_DARK,
  },

  optionDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 17,
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
  },

  priceInput: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 17,
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
  },

  currency: {
    color: TEXT,
    fontSize: 19,
    fontWeight: "900",
    marginRight: 8,
  },

  priceTextInput: {
    flex: 1,
    minHeight: 54,
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: 0,
  },

  helper: {
    color: MUTED_LIGHT,
    fontSize: 10,
    lineHeight: 15,
  },

  quoteCard: {
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    borderRadius: 18,
    backgroundColor: ORANGE_SOFT,
    padding: 15,
  },

  quoteTitle: {
    color: ORANGE_DARK,
    fontSize: 13,
    fontWeight: "900",
  },

  quoteDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  responseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  responseChip: {
    minHeight: 40,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    backgroundColor: SURFACE,
    paddingHorizontal: 14,
  },

  responseChipSelected: {
    borderColor: ORANGE_BORDER,
    backgroundColor: ORANGE_SOFT,
  },

  responseText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  responseTextSelected: {
    color: ORANGE_DARK,
  },

  disabled: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.72,
  },
});
