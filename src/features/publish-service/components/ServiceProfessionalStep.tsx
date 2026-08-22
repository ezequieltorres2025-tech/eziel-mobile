import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  SERVICE_CATEGORIES,
  SERVICE_KEYWORDS_BY_CATEGORY,
  SERVICE_SPECIALTIES_BY_CATEGORY,
  isCommaItemSelected,
  normalizeServiceOptionText,
  toggleCommaItem,
  type ServiceCategory,
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

interface ServiceProfessionalStepProps {
  title: string;
  category: ServiceCategory;
  specialty: string;
  description: string;
  keywords: string;
  disabled?: boolean;

  onTitleChange: (value: string) => void;
  onCategoryChange: (value: ServiceCategory) => void;
  onSpecialtyChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
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

export function ServiceProfessionalStep({
  title,
  category,
  specialty,
  description,
  keywords,
  disabled = false,
  onTitleChange,
  onCategoryChange,
  onSpecialtyChange,
  onDescriptionChange,
  onKeywordsChange,
}: ServiceProfessionalStepProps) {
  const specialtySuggestions =
    SERVICE_SPECIALTIES_BY_CATEGORY[category];

  const keywordSuggestions =
    SERVICE_KEYWORDS_BY_CATEGORY[category];

  const handleCategoryChange = (
    nextCategory: ServiceCategory,
  ) => {
    if (nextCategory === category) {
      return;
    }

    onCategoryChange(nextCategory);
    onSpecialtyChange("");
    onKeywordsChange("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          INFORMACIÓN PROFESIONAL
        </Text>

        <Text style={styles.title}>
          Contá qué servicio ofrecés
        </Text>

        <Text style={styles.description}>
          Esta información será la base de tu perfil de servicio
          dentro de Eziel.
        </Text>
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            Título del servicio
          </Text>

          <Text style={styles.required}>
            Obligatorio
          </Text>
        </View>

        <TextInput
          value={title}
          onChangeText={onTitleChange}
          editable={!disabled}
          placeholder="Ej: Electricista domiciliario"
          placeholderTextColor={MUTED_LIGHT}
          maxLength={100}
          returnKeyType="next"
          autoCapitalize="sentences"
          selectionColor={ORANGE}
          accessibilityLabel="Título del servicio"
          style={styles.input}
        />

        <Text style={styles.counter}>
          {title.length}/100 · mínimo 5
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Categoría
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalChips}
        >
          {SERVICE_CATEGORIES.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={category === item}
              disabled={disabled}
              onPress={() =>
                handleCategoryChange(item)
              }
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            Especialidad
          </Text>

          <Text style={styles.required}>
            Obligatorio
          </Text>
        </View>

        <TextInput
          value={specialty}
          onChangeText={onSpecialtyChange}
          editable={!disabled}
          placeholder="Ej: Gasista matriculado"
          placeholderTextColor={MUTED_LIGHT}
          maxLength={80}
          returnKeyType="next"
          autoCapitalize="words"
          selectionColor={ORANGE}
          accessibilityLabel="Especialidad profesional"
          style={styles.input}
        />

        <Text style={styles.helper}>
          Elegí una sugerencia o escribí tu especialidad.
        </Text>

        <View style={styles.wrapChips}>
          {specialtySuggestions.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={
                normalizeServiceOptionText(specialty) ===
                normalizeServiceOptionText(item)
              }
              disabled={disabled}
              onPress={() =>
                onSpecialtyChange(item)
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            Descripción
          </Text>

          <Text style={styles.required}>
            Obligatorio
          </Text>
        </View>

        <TextInput
          value={description}
          onChangeText={onDescriptionChange}
          editable={!disabled}
          placeholder="Contá qué hacés, cómo trabajás, tu experiencia, horarios, cobertura y qué te diferencia."
          placeholderTextColor={MUTED_LIGHT}
          maxLength={1200}
          multiline
          textAlignVertical="top"
          autoCapitalize="sentences"
          selectionColor={ORANGE}
          accessibilityLabel="Descripción del servicio"
          style={[
            styles.input,
            styles.textArea,
          ]}
        />

        <Text style={styles.counter}>
          {description.length}/1200 · mínimo 15
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Palabras clave
        </Text>

        <TextInput
          value={keywords}
          onChangeText={onKeywordsChange}
          editable={!disabled}
          placeholder="Ej: urgencias, instalaciones, a domicilio"
          placeholderTextColor={MUTED_LIGHT}
          maxLength={300}
          autoCapitalize="none"
          selectionColor={ORANGE}
          accessibilityLabel="Palabras clave del servicio"
          style={styles.input}
        />

        <Text style={styles.helper}>
          Separalas con coma. Ayudan a mejorar el buscador.
        </Text>

        <View style={styles.wrapChips}>
          {keywordSuggestions.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={isCommaItemSelected(
                keywords,
                item,
              )}
              disabled={disabled}
              onPress={() =>
                onKeywordsChange(
                  toggleCommaItem(
                    keywords,
                    item,
                  ),
                )
              }
            />
          ))}
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

  textArea: {
    minHeight: 150,
    paddingTop: 15,
    paddingBottom: 15,
  },

  helper: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
  },

  counter: {
    color: MUTED_LIGHT,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "right",
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

  disabled: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.7,
  },
});
