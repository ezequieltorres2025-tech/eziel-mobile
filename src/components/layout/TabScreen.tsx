import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TabScreenProps {
  title: string;
  description: string;
}

export function TabScreen({ title, description }: TabScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.brand}>EZIEL</Text>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  brand: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 12,
  },

  title: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  description: {
    color: "#64748B",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    maxWidth: 340,
  },
});
