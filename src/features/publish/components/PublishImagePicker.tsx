import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    ACCEPTED_LISTING_IMAGE_MIME_TYPES,
    MAX_LISTING_IMAGES,
    MAX_LISTING_IMAGE_SIZE_BYTES,
    MAX_LISTING_IMAGE_SIZE_MB,
} from "../constants";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const ORANGE_BORDER = "#FED7AA";

const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";

const ACCEPTED_IMAGE_TYPES = new Set<string>(ACCEPTED_LISTING_IMAGE_MIME_TYPES);

export interface PublishImage {
  id: string;
  uri: string;
  width: number;
  height: number;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
}

interface PublishImagePickerProps {
  images: PublishImage[];
  onImagesChange: (images: PublishImage[]) => void;
}

interface PreparedImageResult {
  image: PublishImage | null;
  error: string | null;
}

function getFileNameFromUri(uri: string): string | null {
  try {
    const cleanUri = decodeURIComponent(uri.split("?")[0].split("#")[0]);

    const fileName = cleanUri.split("/").pop()?.trim() ?? "";

    return fileName || null;
  } catch {
    const cleanUri = uri.split("?")[0].split("#")[0];

    const fileName = cleanUri.split("/").pop()?.trim() ?? "";

    return fileName || null;
  }
}

function inferMimeTypeFromName(value: string | null): string | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase().split("?")[0].split("#")[0];

  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  return null;
}

function normalizeMimeType(mimeType: string | null | undefined): string | null {
  const normalized = mimeType?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return null;
  }

  if (normalized === "image/jpg") {
    return "image/jpeg";
  }

  return normalized;
}

function prepareImageAsset(
  asset: ImagePicker.ImagePickerAsset,
  fallbackId: string,
): PreparedImageResult {
  const fileName = asset.fileName?.trim() || getFileNameFromUri(asset.uri);

  const reportedMimeType = normalizeMimeType(asset.mimeType);

  const mimeType =
    reportedMimeType ??
    inferMimeTypeFromName(fileName) ??
    inferMimeTypeFromName(asset.uri);

  const fileSize =
    typeof asset.fileSize === "number" && Number.isFinite(asset.fileSize)
      ? asset.fileSize
      : null;

  const displayName = fileName || "La imagen seleccionada";

  if (!mimeType || !ACCEPTED_IMAGE_TYPES.has(mimeType)) {
    return {
      image: null,
      error: `${displayName} no tiene un formato compatible. Usá JPG, PNG o WebP.`,
    };
  }

  if (fileSize === null || fileSize <= 0) {
    return {
      image: null,
      error: `No pudimos verificar el tamaño de ${displayName}. Elegí otra imagen e intentá nuevamente.`,
    };
  }

  if (fileSize > MAX_LISTING_IMAGE_SIZE_BYTES) {
    return {
      image: null,
      error: `${displayName} supera el límite de ${MAX_LISTING_IMAGE_SIZE_MB} MB.`,
    };
  }

  return {
    error: null,
    image: {
      id: asset.assetId?.trim() || fallbackId,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName,
      fileSize,
      mimeType,
    },
  };
}

export function PublishImagePicker({
  images,
  onImagesChange,
}: PublishImagePickerProps) {
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);

  const remainingSlots = Math.max(MAX_LISTING_IMAGES - images.length, 0);

  const hasImages = images.length > 0;
  const isFull = remainingSlots === 0;

  const appendAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    if (remainingSlots <= 0) {
      return;
    }

    const selectedAssets = assets.slice(0, remainingSlots);

    const preparedImages: PublishImage[] = [];

    for (let index = 0; index < selectedAssets.length; index += 1) {
      const asset = selectedAssets[index];

      const result = prepareImageAsset(
        asset,
        `${asset.uri}-${Date.now()}-${index}`,
      );

      if (result.error) {
        Alert.alert("Imagen no compatible", result.error);

        return;
      }

      if (result.image) {
        preparedImages.push(result.image);
      }
    }

    const existingKeys = new Set(
      images.flatMap((image) => [image.id, image.uri]),
    );

    const uniqueImages = preparedImages.filter((image) => {
      if (existingKeys.has(image.id) || existingKeys.has(image.uri)) {
        return false;
      }

      existingKeys.add(image.id);
      existingKeys.add(image.uri);

      return true;
    });

    if (uniqueImages.length === 0) {
      return;
    }

    onImagesChange([...images, ...uniqueImages]);
  };

  const handleOpenLibrary = async () => {
    if (isOpeningPicker || isFull) {
      return;
    }

    try {
      setIsOpeningPicker(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        orderedSelection: true,
        selectionLimit: remainingSlots,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      appendAssets(result.assets);
    } catch (error) {
      console.error("Unable to open image library:", error);

      Alert.alert(
        "No pudimos abrir tus fotos",
        "Intentá nuevamente en unos segundos.",
      );
    } finally {
      setIsOpeningPicker(false);
    }
  };

  const handleOpenCamera = async () => {
    if (isOpeningPicker || isFull) {
      return;
    }

    try {
      setIsOpeningPicker(true);

      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permiso de cámara necesario",
          "Para sacar una foto desde Eziel necesitás permitir el acceso a la cámara.",
        );

        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      appendAssets(result.assets);
    } catch (error) {
      console.error("Unable to open camera:", error);

      Alert.alert(
        "No pudimos abrir la cámara",
        "Intentá nuevamente en unos segundos.",
      );
    } finally {
      setIsOpeningPicker(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    onImagesChange(images.filter((image) => image.id !== imageId));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Imágenes</Text>

          <Text style={styles.description}>
            Mostrá claramente lo que estás publicando. La primera imagen será la
            portada.
          </Text>
        </View>

        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {images.length}/{MAX_LISTING_IMAGES}
          </Text>
        </View>
      </View>

      <View style={styles.rules}>
        <SymbolView
          name={{
            ios: "info.circle.fill",
            android: "info",
            web: "info",
          }}
          size={17}
          tintColor={ORANGE}
        />

        <Text style={styles.rulesText}>
          JPG, PNG o WebP · hasta {MAX_LISTING_IMAGE_SIZE_MB} MB cada una ·
          máximo {MAX_LISTING_IMAGES}.
        </Text>
      </View>

      {!hasImages ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <SymbolView
              name={{
                ios: "photo.on.rectangle.angled",
                android: "add_photo_alternate",
                web: "add_photo_alternate",
              }}
              size={30}
              tintColor={ORANGE}
            />
          </View>

          <Text style={styles.emptyTitle}>Agregá al menos una imagen</Text>

          <Text style={styles.emptyDescription}>
            Las fotos claras ayudan a generar más confianza y hacen que tu
            publicación se destaque.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imagesContent}
          style={styles.imagesScroll}
        >
          {images.map((image, index) => (
            <View key={image.id} style={styles.imageCard}>
              <Image
                source={{
                  uri: image.uri,
                }}
                style={styles.image}
                resizeMode="cover"
                accessibilityLabel={`Imagen ${index + 1} de la publicación`}
              />

              {index === 0 && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Portada</Text>
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Eliminar imagen ${index + 1}`}
                hitSlop={8}
                onPress={() => handleRemoveImage(image.id)}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.removeButtonPressed,
                ]}
              >
                <SymbolView
                  name={{
                    ios: "xmark",
                    android: "close",
                    web: "close",
                  }}
                  size={15}
                  tintColor={SURFACE}
                />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir fotos de la galería"
          accessibilityState={{
            disabled: isOpeningPicker || isFull,
          }}
          disabled={isOpeningPicker || isFull}
          onPress={handleOpenLibrary}
          style={({ pressed }) => [
            styles.actionButton,
            styles.primaryAction,
            (isOpeningPicker || isFull) && styles.actionDisabled,
            pressed && !isOpeningPicker && !isFull && styles.actionPressed,
          ]}
        >
          <View style={styles.primaryActionIcon}>
            <SymbolView
              name={{
                ios: "photo.on.rectangle",
                android: "photo_library",
                web: "photo_library",
              }}
              size={19}
              tintColor={SURFACE}
            />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.primaryActionTitle}>Elegir fotos</Text>

            <Text style={styles.primaryActionDescription}>
              Desde tu galería
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sacar una foto con la cámara"
          accessibilityState={{
            disabled: isOpeningPicker || isFull,
          }}
          disabled={isOpeningPicker || isFull}
          onPress={handleOpenCamera}
          style={({ pressed }) => [
            styles.actionButton,
            styles.secondaryAction,
            (isOpeningPicker || isFull) && styles.actionDisabled,
            pressed && !isOpeningPicker && !isFull && styles.actionPressed,
          ]}
        >
          <View style={styles.secondaryActionIcon}>
            <SymbolView
              name={{
                ios: "camera.fill",
                android: "photo_camera",
                web: "photo_camera",
              }}
              size={19}
              tintColor={ORANGE}
            />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.secondaryActionTitle}>Cámara</Text>

            <Text style={styles.secondaryActionDescription}>
              Sacar una foto
            </Text>
          </View>
        </Pressable>
      </View>

      {isFull ? (
        <View style={styles.limitNotice}>
          <SymbolView
            name={{
              ios: "checkmark.circle.fill",
              android: "check_circle",
              web: "check_circle",
            }}
            size={18}
            tintColor={ORANGE}
          />

          <Text style={styles.limitNoticeText}>
            Alcanzaste el máximo de {MAX_LISTING_IMAGES} imágenes.
          </Text>
        </View>
      ) : (
        <Text style={styles.helper}>
          Podés agregar {remainingSlots}{" "}
          {remainingSlots === 1 ? "imagen más" : "imágenes más"}.
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
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
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
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  counter: {
    minWidth: 46,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: ORANGE_SOFT,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
  },

  counterText: {
    color: ORANGE_DARK,
    fontSize: 11,
    fontWeight: "800",
  },

  rules: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: ORANGE_SOFT,
  },

  rulesText: {
    flex: 1,
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "600",
  },

  emptyCard: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: ORANGE_SOFT,
    marginBottom: 13,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 280,
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
  },

  imagesScroll: {
    marginHorizontal: -20,
  },

  imagesContent: {
    gap: 10,
    paddingHorizontal: 20,
  },

  imageCard: {
    position: "relative",
    width: 132,
    height: 132,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: BORDER,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  coverBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: ORANGE,
  },

  coverBadgeText: {
    color: SURFACE,
    fontSize: 9,
    fontWeight: "800",
  },

  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
  },

  removeButtonPressed: {
    opacity: 0.7,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  actionButton: {
    flex: 1,
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
    borderRadius: 18,
  },

  primaryAction: {
    backgroundColor: ORANGE,
  },

  secondaryAction: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  primaryActionIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },

  secondaryActionIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: ORANGE_SOFT,
  },

  actionContent: {
    flex: 1,
  },

  primaryActionTitle: {
    color: SURFACE,
    fontSize: 12,
    fontWeight: "800",
  },

  primaryActionDescription: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 9,
    marginTop: 2,
  },

  secondaryActionTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "800",
  },

  secondaryActionDescription: {
    color: MUTED,
    fontSize: 9,
    marginTop: 2,
  },

  actionDisabled: {
    opacity: 0.45,
  },

  actionPressed: {
    opacity: 0.75,
  },

  helper: {
    color: MUTED_LIGHT,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 9,
    marginLeft: 2,
  },

  limitNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
  },

  limitNoticeText: {
    flex: 1,
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
  },
});
