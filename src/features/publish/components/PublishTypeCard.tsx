import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ORANGE = "#F97316";
const ORANGE_SOFT = "#FFF7ED";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

export interface PublishTypeCardProps {
  title: string;
  description: string;
  icon: SymbolViewProps["name"];
  selected: boolean;
  onPress: () => void;
}

export function PublishTypeCard({
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
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.iconContainer, selected && styles.iconContainerSelected]}
      >
        <SymbolView
          name={icon}
          size={28}
          tintColor={selected ? SURFACE : ORANGE}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>

        <Text style={styles.description}>{description}</Text>
      </View>

      <View
        style={[styles.radio, selected && styles.radioSelected]}
        pointerEvents="none"
      >
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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

  cardSelected: {
    borderColor: ORANGE,
    backgroundColor: ORANGE_SOFT,
  },

  iconContainer: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: ORANGE_SOFT,
  },

  iconContainerSelected: {
    backgroundColor: ORANGE,
  },

  content: {
    flex: 1,
  },

  title: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "800",
  },

  description: {
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

  pressed: {
    opacity: 0.7,
  },
});
