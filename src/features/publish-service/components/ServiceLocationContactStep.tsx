import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ARGENTINA_PROVINCES,
  SERVICE_CITY_SUGGESTIONS,
  getServiceZoneSuggestions,
  isCommaItemSelected,
  normalizeServiceOptionText,
  toggleCommaItem,
} from "../serviceFormOptions";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const ORANGE_BORDER = "#FED7AA";

const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";

interface ServiceLocationContactStepProps {
  city: string;
  province: string;
  zones: string;
  whatsapp: string;
  phone: string;
  disabled?: boolean;

  onCityChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onZonesChange: (value: string) => void;
  onWhatsappChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

interface ChipProps {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected,
        disabled,
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function phoneCharactersOnly(
  value: string,
): string {
  return value.replace(/[^\d+\s()-]/g, "");
}

export function ServiceLocationContactStep({
  city,
  province,
  zones,
  whatsapp,
  phone,
  disabled = false,
  onCityChange,
  onProvinceChange,
  onZonesChange,
  onWhatsappChange,
  onPhoneChange,
}: ServiceLocationContactStepProps) {
  const zoneSuggestions =
    getServiceZoneSuggestions(
      city,
      province,
    );

  const handleQuickCity = (
    nextCity: string,
    nextProvince: string,
  ) => {
    onCityChange(nextCity);
    onProvinceChange(nextProvince);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          COBERTURA Y CONTACTO
        </Text>

        <Text style={styles.title}>
          Decí dónde trabajás
        </Text>

        <Text style={styles.description}>
          La ciudad principal es obligatoria. Las zonas permiten
          mostrar si atendés a domicilio, online o en áreas
          específicas.
        </Text>
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            Ciudad principal
          </Text>

          <Text style={styles.required}>
            Obligatorio
          </Text>
        </View>

        <TextInput
          value={city}
          onChangeText={onCityChange}
          editable={!disabled}
          placeholder="Ej: Neuquén Capital"
          placeholderTextColor={MUTED_LIGHT}
          maxLength={80}
          autoCapitalize="words"
          selectionColor={ORANGE}
          accessibilityLabel="Ciudad principal"
          style={styles.input}
        />

        <Text style={styles.helper}>
          También podés elegir una ciudad frecuente.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalChips}
        >
          {SERVICE_CITY_SUGGESTIONS.map(
            (item) => (
              <Chip
                key={`${item.city}-${item.province}`}
                label={item.city}
                selected={
                  normalizeServiceOptionText(city) ===
                    normalizeServiceOptionText(
                      item.city,
                    ) &&
                  normalizeServiceOptionText(
                    province,
                  ) ===
                    normalizeServiceOptionText(
                      item.province,
                    )
                }
                disabled={disabled}
                onPress={() =>
                  handleQuickCity(
                    item.city,
                    item.province,
                  )
                }
              />
            ),
          )}
        </ScrollView>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Provincia
        </Text>

        <TextInput
          value={province}
          onChangeText={onProvinceChange}
          editable={!disabled}
          placeholder="Ej: Neuquén"
          placeholderTextColor={MUTED_LIGHT}
          maxLength={80}
          autoCapitalize="words"
          selectionColor={ORANGE}
          accessibilityLabel="Provincia"
          style={styles.input}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalChips}
        >
          {ARGENTINA_PROVINCES.map(
            (item) => (
              <Chip
                key={item}
                label={item}
                selected={
                  normalizeServiceOptionText(
                    province,
                  ) ===
                  normalizeServiceOptionText(
                    item,
                  )
                }
                disabled={disabled}
                onPress={() =>
                  onProvinceChange(item)
                }
              />
            ),
          )}
        </ScrollView>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Zonas donde trabajás
        </Text>

        <TextInput
          value={zones}
          onChangeText={onZonesChange}
          editable={!disabled}
          placeholder="Ej: Centro, zona norte, online"
          placeholderTextColor={MUTED_LIGHT}
          maxLength={300}
          autoCapitalize="sentences"
          selectionColor={ORANGE}
          accessibilityLabel="Zonas de cobertura"
          style={styles.input}
        />

        <Text style={styles.helper}>
          Separalas con coma o elegí opciones rápidas.
        </Text>

        <View style={styles.wrapChips}>
          {zoneSuggestions.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={isCommaItemSelected(
                zones,
                item,
              )}
              disabled={disabled}
              onPress={() =>
                onZonesChange(
                  toggleCommaItem(
                    zones,
                    item,
                  ),
                )
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>
          Contacto
        </Text>

        <Text style={styles.contactDescription}>
          Debés agregar al menos WhatsApp o teléfono.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>
            WhatsApp
          </Text>

          <TextInput
            value={whatsapp}
            onChangeText={(value) =>
              onWhatsappChange(
                phoneCharactersOnly(value),
              )
            }
            editable={!disabled}
            placeholder="549299..."
            placeholderTextColor={MUTED_LIGHT}
            keyboardType="phone-pad"
            inputMode="tel"
            maxLength={30}
            selectionColor={ORANGE}
            accessibilityLabel="WhatsApp"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Teléfono
          </Text>

          <TextInput
            value={phone}
            onChangeText={(value) =>
              onPhoneChange(
                phoneCharactersOnly(value),
              )
            }
            editable={!disabled}
            placeholder="299..."
            placeholderTextColor={MUTED_LIGHT}
            keyboardType="phone-pad"
            inputMode="tel"
            maxLength={30}
            selectionColor={ORANGE}
            accessibilityLabel="Teléfono"
            style={styles.input}
          />
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

  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 17,
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
    color: TEXT,
    fontSize: 15,
    fontWeight: "500",
  },

  helper: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
  },

  horizontalChips: {
    gap: 8,
    paddingVertical: 2,
  },

  wrapChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    minHeight: 38,
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    paddingHorizontal: 13,
  },

  chipSelected: {
    borderColor: ORANGE_BORDER,
    backgroundColor: ORANGE_SOFT,
  },

  chipText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  chipTextSelected: {
    color: ORANGE_DARK,
  },

  contactCard: {
    gap: 18,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    borderRadius: 22,
    backgroundColor: ORANGE_SOFT,
    padding: 16,
  },

  contactTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
  },

  contactDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: -12,
  },

  disabled: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.72,
  },
});
