import * as Location from "expo-location";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const ORANGE_BORDER = "#FED7AA";

const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";

const RECENT_LOCATION_MAX_AGE_MS = 10 * 60 * 1000;

export interface PublishLocationValue {
  label: string;
  latitude: number | null;
  longitude: number | null;
  source: "manual" | "device" | null;
}

interface PublishLocationFieldProps {
  value: PublishLocationValue;
  onChange: (value: PublishLocationValue) => void;
}

function normalizePart(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function buildLocationLabel(address: Location.LocationGeocodedAddress): string {
  const district = normalizePart(address.district);

  const city = normalizePart(address.city);

  const subregion = normalizePart(address.subregion);

  const region = normalizePart(address.region);

  if (district && city && district.toLowerCase() !== city.toLowerCase()) {
    return `${district}, ${city}`;
  }

  if (city) {
    return city;
  }

  if (district) {
    return district;
  }

  if (subregion) {
    return subregion;
  }

  if (region) {
    return region;
  }

  return "";
}

async function getDeviceLocation(): Promise<Location.LocationObject> {
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: false,
    });
  } catch (currentLocationError) {
    const lastKnownLocation = await Location.getLastKnownPositionAsync({
      maxAge: RECENT_LOCATION_MAX_AGE_MS,
    });

    if (lastKnownLocation) {
      return lastKnownLocation;
    }

    throw currentLocationError;
  }
}

export function PublishLocationField({
  value,
  onChange,
}: PublishLocationFieldProps) {
  const [isLocating, setIsLocating] = useState(false);

  const hasLocation = value.label.trim().length > 0;

  const handleManualChange = (nextValue: string) => {
    onChange({
      label: nextValue,
      latitude: null,
      longitude: null,
      source: nextValue.trim() ? "manual" : null,
    });
  };

  const handleUseCurrentLocation = async () => {
    if (isLocating) {
      return;
    }

    try {
      setIsLocating(true);

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        Alert.alert(
          "Activá la ubicación",
          "Necesitás activar la ubicación del dispositivo para detectar tu zona.",
        );

        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permiso de ubicación necesario",
          "Podés permitir el acceso a la ubicación o escribir tu zona manualmente.",
        );

        return;
      }

      const deviceLocation = await getDeviceLocation();

      const latitude = deviceLocation.coords.latitude;

      const longitude = deviceLocation.coords.longitude;

      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const address = addresses[0];

      if (!address) {
        Alert.alert(
          "No pudimos identificar tu zona",
          "Detectamos tu ubicación, pero no pudimos obtener el nombre del lugar. Escribilo manualmente.",
        );

        return;
      }

      const label = buildLocationLabel(address);

      if (!label) {
        Alert.alert(
          "No pudimos identificar tu zona",
          "Detectamos tu ubicación, pero no pudimos obtener un nombre válido. Escribilo manualmente.",
        );

        return;
      }

      onChange({
        label,
        latitude,
        longitude,
        source: "device",
      });
    } catch {
      Alert.alert(
        "No pudimos obtener tu ubicación",
        "Intentá nuevamente o escribí tu zona manualmente.",
      );
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <SymbolView
            name={{
              ios: "location.fill",
              android: "location_on",
              web: "location_on",
            }}
            size={21}
            tintColor={ORANGE}
          />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Ubicación</Text>

          <Text style={styles.description}>
            Indicá la zona donde se encuentra tu publicación.
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Usar mi ubicación actual"
        accessibilityState={{
          disabled: isLocating,
          busy: isLocating,
        }}
        disabled={isLocating}
        onPress={handleUseCurrentLocation}
        style={({ pressed }) => [
          styles.locationButton,
          pressed && !isLocating && styles.locationButtonPressed,
          isLocating && styles.locationButtonDisabled,
        ]}
      >
        <View style={styles.locationButtonIcon}>
          {isLocating ? (
            <ActivityIndicator size="small" color={SURFACE} />
          ) : (
            <SymbolView
              name={{
                ios: "location.fill",
                android: "my_location",
                web: "my_location",
              }}
              size={19}
              tintColor={SURFACE}
            />
          )}
        </View>

        <View style={styles.locationButtonContent}>
          <Text style={styles.locationButtonTitle}>
            {isLocating ? "Detectando ubicación..." : "Usar mi ubicación"}
          </Text>

          <Text style={styles.locationButtonDescription}>
            Detectaremos tu ciudad o zona
          </Text>
        </View>

        {!isLocating && (
          <SymbolView
            name={{
              ios: "arrow.right",
              android: "arrow_forward",
              web: "arrow_forward",
            }}
            size={18}
            tintColor={SURFACE}
          />
        )}
      </Pressable>

      <View style={styles.separator}>
        <View style={styles.separatorLine} />

        <Text style={styles.separatorText}>o escribila manualmente</Text>

        <View style={styles.separatorLine} />
      </View>

      <View
        style={[
          styles.inputContainer,
          hasLocation && styles.inputContainerFilled,
        ]}
      >
        <View style={styles.inputIcon}>
          <SymbolView
            name={{
              ios: "mappin",
              android: "place",
              web: "place",
            }}
            size={19}
            tintColor={hasLocation ? ORANGE : MUTED}
          />
        </View>

        <TextInput
          value={value.label}
          onChangeText={handleManualChange}
          placeholder="Ej. Centro, Neuquén"
          placeholderTextColor={MUTED_LIGHT}
          maxLength={100}
          autoCapitalize="words"
          autoCorrect={false}
          selectionColor={ORANGE}
          returnKeyType="done"
          accessibilityLabel="Ubicación de la publicación"
          style={styles.input}
        />

        {hasLocation && (
          <SymbolView
            name={{
              ios: "checkmark.circle.fill",
              android: "check_circle",
              web: "check_circle",
            }}
            size={19}
            tintColor={ORANGE}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.characterCount}>{value.label.length}/100</Text>

        {value.source === "device" && (
          <View style={styles.detectedBadge}>
            <SymbolView
              name={{
                ios: "location.fill",
                android: "my_location",
                web: "my_location",
              }}
              size={12}
              tintColor={ORANGE_DARK}
            />

            <Text style={styles.detectedBadgeText}>Detectada por GPS</Text>
          </View>
        )}
      </View>

      <View style={styles.privacyNotice}>
        <SymbolView
          name={{
            ios: "lock.fill",
            android: "lock",
            web: "lock",
          }}
          size={16}
          tintColor={MUTED}
        />

        <Text style={styles.privacyText}>
          Mostraremos una zona general. Podés corregirla antes de publicar.
        </Text>
      </View>
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

  locationButton: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: ORANGE,
  },

  locationButtonPressed: {
    backgroundColor: ORANGE_DARK,
  },

  locationButtonDisabled: {
    opacity: 0.7,
  },

  locationButtonIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  locationButtonContent: {
    flex: 1,
  },

  locationButtonTitle: {
    color: SURFACE,
    fontSize: 13,
    fontWeight: "800",
  },

  locationButtonDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 9,
    marginTop: 2,
  },

  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 16,
  },

  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },

  separatorText: {
    color: MUTED_LIGHT,
    fontSize: 9,
    fontWeight: "600",
  },

  inputContainer: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  inputContainerFilled: {
    borderColor: ORANGE_BORDER,
  },

  inputIcon: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    minHeight: 56,
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
  },

  footer: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 7,
  },

  characterCount: {
    color: MUTED_LIGHT,
    fontSize: 9,
  },

  detectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: ORANGE_SOFT,
  },

  detectedBadgeText: {
    color: ORANGE_DARK,
    fontSize: 8,
    fontWeight: "800",
  },

  privacyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    padding: 12,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },

  privacyText: {
    flex: 1,
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
  },
});
