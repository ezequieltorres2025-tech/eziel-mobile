import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LISTING_CATEGORIES, type ListingCategory } from "../constants";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const ORANGE_BORDER = "#FED7AA";

const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

interface PublishCategorySelectorProps {
  value: ListingCategory | null;
  onChange: (category: ListingCategory) => void;
}

export function PublishCategorySelector({
  value,
  onChange,
}: PublishCategorySelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <SymbolView
            name={{
              ios: "square.grid.2x2.fill",
              android: "category",
              web: "category",
            }}
            size={21}
            tintColor={ORANGE}
          />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Categoría</Text>

          <Text style={styles.description}>
            Elegí la categoría que mejor representa tu publicación.
          </Text>
        </View>
      </View>

      <View accessibilityRole="radiogroup" style={styles.options}>
        {LISTING_CATEGORIES.map((category) => {
          const selected = value === category;

          return (
            <Pressable
              key={category}
              accessibilityRole="radio"
              accessibilityLabel={category}
              accessibilityState={{
                selected,
              }}
              onPress={() => onChange(category)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View
                style={[styles.radio, selected && styles.radioSelected]}
                pointerEvents="none"
              >
                {selected && <View style={styles.radioDot} />}
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {category}
              </Text>

              {selected && (
                <SymbolView
                  name={{
                    ios: "checkmark",
                    android: "check",
                    web: "check",
                  }}
                  size={16}
                  tintColor={ORANGE_DARK}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {value ? (
        <View style={styles.selectedNotice}>
          <SymbolView
            name={{
              ios: "checkmark.circle.fill",
              android: "check_circle",
              web: "check_circle",
            }}
            size={18}
            tintColor={ORANGE}
          />

          <Text style={styles.selectedNoticeText}>
            Categoría seleccionada:{" "}
            <Text style={styles.selectedNoticeStrong}>{value}</Text>
          </Text>
        </View>
      ) : (
        <Text style={styles.helper}>
          Seleccioná una categoría para continuar.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: ORANGE_SOFT,
  },

  headerContent: {
    flex: 1,
  },

  title: {
    color: TEXT,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.35,
  },

  description: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  option: {
    width: "48.5%",
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  optionSelected: {
    backgroundColor: ORANGE_SOFT,
    borderColor: ORANGE_BORDER,
  },

  optionPressed: {
    opacity: 0.7,
  },

  radio: {
    width: 19,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },

  radioSelected: {
    borderColor: ORANGE,
  },

  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },

  optionText: {
    flex: 1,
    color: TEXT,
    fontSize: 11,
    fontWeight: "700",
  },

  optionTextSelected: {
    color: ORANGE_DARK,
    fontWeight: "800",
  },

  selectedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 13,
  },

  selectedNoticeText: {
    flex: 1,
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
  },

  selectedNoticeStrong: {
    color: TEXT,
    fontWeight: "800",
  },

  helper: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 13,
  },
});
