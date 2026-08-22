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

import type { PublishImage } from "@/features/publish/components/PublishImagePicker";

import {
  ACCEPTED_SERVICE_IMAGE_MIME_TYPES,
  MAX_SERVICE_IMAGES,
  MAX_SERVICE_IMAGE_SIZE_BYTES,
  MAX_SERVICE_IMAGE_SIZE_MB,
} from "../serviceConstants";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const ORANGE_BORDER = "#FED7AA";

const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";
const DANGER = "#DC2626";

const ACCEPTED_IMAGE_TYPES =
  new Set<string>(
    ACCEPTED_SERVICE_IMAGE_MIME_TYPES,
  );

interface ServiceImagePickerProps {
  images: PublishImage[];
  onImagesChange: (
    images: PublishImage[],
  ) => void;
  disabled?: boolean;
}

interface PreparedImageResult {
  image: PublishImage | null;
  error: string | null;
}

function getFileNameFromUri(
  uri: string,
): string | null {
  try {
    const cleanUri = decodeURIComponent(
      uri.split("?")[0].split("#")[0],
    );

    return (
      cleanUri.split("/").pop()?.trim() ||
      null
    );
  } catch {
    const cleanUri =
      uri.split("?")[0].split("#")[0];

    return (
      cleanUri.split("/").pop()?.trim() ||
      null
    );
  }
}

function normalizeMimeType(
  value: string | null | undefined,
): string | null {
  const normalized =
    value?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return null;
  }

  if (normalized === "image/jpg") {
    return "image/jpeg";
  }

  return normalized;
}

function inferMimeTypeFromName(
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase()
      .split("?")[0]
      .split("#")[0];

  if (
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg")
  ) {
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

function prepareAsset(
  asset: ImagePicker.ImagePickerAsset,
  fallbackId: string,
): PreparedImageResult {
  const fileName =
    asset.fileName?.trim() ||
    getFileNameFromUri(asset.uri);

  const mimeType =
    normalizeMimeType(asset.mimeType) ??
    inferMimeTypeFromName(fileName) ??
    inferMimeTypeFromName(asset.uri);

  const fileSize =
    typeof asset.fileSize === "number" &&
    Number.isFinite(asset.fileSize)
      ? asset.fileSize
      : null;

  const displayName =
    fileName || "La imagen seleccionada";

  if (
    !mimeType ||
    !ACCEPTED_IMAGE_TYPES.has(mimeType)
  ) {
    return {
      image: null,
      error:
        `${displayName} no tiene un formato compatible. Usá JPG, PNG o WebP.`,
    };
  }

  if (
    fileSize === null ||
    fileSize <= 0
  ) {
    return {
      image: null,
      error:
        `No pudimos verificar el tamaño de ${displayName}. Elegí otra imagen.`,
    };
  }

  if (
    fileSize >
    MAX_SERVICE_IMAGE_SIZE_BYTES
  ) {
    return {
      image: null,
      error:
        `${displayName} supera el límite de ${MAX_SERVICE_IMAGE_SIZE_MB} MB.`,
    };
  }

  return {
    error: null,

    image: {
      id:
        asset.assetId?.trim() ||
        fallbackId,

      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName,
      fileSize,
      mimeType,
    },
  };
}

export function ServiceImagePicker({
  images,
  onImagesChange,
  disabled = false,
}: ServiceImagePickerProps) {
  const [
    isOpeningPicker,
    setIsOpeningPicker,
  ] = useState(false);

  const remainingSlots =
    Math.max(
      MAX_SERVICE_IMAGES -
        images.length,
      0,
    );

  const isFull =
    remainingSlots === 0;

  const appendAssets = (
    assets:
      ImagePicker.ImagePickerAsset[],
  ) => {
    if (remainingSlots <= 0) {
      return;
    }

    const selectedAssets =
      assets.slice(0, remainingSlots);

    const preparedImages:
      PublishImage[] = [];

    for (
      let index = 0;
      index < selectedAssets.length;
      index += 1
    ) {
      const asset =
        selectedAssets[index];

      const result =
        prepareAsset(
          asset,
          `${asset.uri}-${Date.now()}-${index}`,
        );

      if (result.error) {
        Alert.alert(
          "Imagen no compatible",
          result.error,
        );

        return;
      }

      if (result.image) {
        preparedImages.push(
          result.image,
        );
      }
    }

    const existingKeys =
      new Set(
        images.flatMap(
          (image) => [
            image.id,
            image.uri,
          ],
        ),
      );

    const uniqueImages =
      preparedImages.filter(
        (image) => {
          if (
            existingKeys.has(
              image.id,
            ) ||
            existingKeys.has(
              image.uri,
            )
          ) {
            return false;
          }

          existingKeys.add(
            image.id,
          );

          existingKeys.add(
            image.uri,
          );

          return true;
        },
      );

    if (
      uniqueImages.length === 0
    ) {
      return;
    }

    onImagesChange([
      ...images,
      ...uniqueImages,
    ]);
  };

  const handleOpenLibrary =
    async () => {
      if (
        disabled ||
        isOpeningPicker ||
        isFull
      ) {
        return;
      }

      try {
        setIsOpeningPicker(true);

        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permiso de fotos necesario",
            "Permití el acceso a tus fotos para agregar imágenes del servicio.",
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            selectionLimit:
              remainingSlots,
            quality: 1,
          });

        if (
          result.canceled ||
          result.assets.length === 0
        ) {
          return;
        }

        appendAssets(
          result.assets,
        );
      } catch {
        Alert.alert(
          "No pudimos abrir tus fotos",
          "Intentá nuevamente.",
        );
      } finally {
        setIsOpeningPicker(false);
      }
    };

  const handleOpenCamera =
    async () => {
      if (
        disabled ||
        isOpeningPicker ||
        isFull
      ) {
        return;
      }

      try {
        setIsOpeningPicker(true);

        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permiso de cámara necesario",
            "Permití el acceso a la cámara para sacar una foto del servicio.",
          );

          return;
        }

        const result =
          await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 1,
          });

        if (
          result.canceled ||
          result.assets.length === 0
        ) {
          return;
        }

        appendAssets(
          result.assets,
        );
      } catch {
        Alert.alert(
          "No pudimos abrir la cámara",
          "Intentá nuevamente.",
        );
      } finally {
        setIsOpeningPicker(false);
      }
    };

  const handleRemove = (
    imageId: string,
  ) => {
    if (disabled) {
      return;
    }

    onImagesChange(
      images.filter(
        (image) =>
          image.id !== imageId,
      ),
    );
  };

  const handleMakeCover = (
    imageId: string,
  ) => {
    if (disabled) {
      return;
    }

    const selected =
      images.find(
        (image) =>
          image.id === imageId,
      );

    if (!selected) {
      return;
    }

    onImagesChange([
      selected,
      ...images.filter(
        (image) =>
          image.id !== imageId,
      ),
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            IMÁGENES
          </Text>

          <Text style={styles.title}>
            Mostrá tu trabajo
          </Text>
        </View>

        <Text style={styles.count}>
          {images.length}/{MAX_SERVICE_IMAGES}
        </Text>
      </View>

      <Text style={styles.description}>
        Podés cargar hasta {MAX_SERVICE_IMAGES} imágenes JPEG,
        PNG o WebP de máximo {MAX_SERVICE_IMAGE_SIZE_MB} MB cada
        una. La primera será la portada.
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir imágenes de la galería"
          accessibilityState={{
            disabled:
              disabled ||
              isOpeningPicker ||
              isFull,
          }}
          disabled={
            disabled ||
            isOpeningPicker ||
            isFull
          }
          onPress={
            handleOpenLibrary
          }
          style={({ pressed }) => [
            styles.actionButton,
            pressed &&
              !disabled &&
              !isFull &&
              styles.pressed,
            (disabled ||
              isFull) &&
              styles.disabled,
          ]}
        >
          <SymbolView
            name={{
              ios: "photo.on.rectangle",
              android: "photo_library",
              web: "photo_library",
            }}
            size={20}
            tintColor={ORANGE}
          />

          <Text
            style={
              styles.actionText
            }
          >
            Galería
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sacar una foto"
          accessibilityState={{
            disabled:
              disabled ||
              isOpeningPicker ||
              isFull,
          }}
          disabled={
            disabled ||
            isOpeningPicker ||
            isFull
          }
          onPress={
            handleOpenCamera
          }
          style={({ pressed }) => [
            styles.actionButton,
            pressed &&
              !disabled &&
              !isFull &&
              styles.pressed,
            (disabled ||
              isFull) &&
              styles.disabled,
          ]}
        >
          <SymbolView
            name={{
              ios: "camera.fill",
              android: "photo_camera",
              web: "photo_camera",
            }}
            size={20}
            tintColor={ORANGE}
          />

          <Text
            style={
              styles.actionText
            }
          >
            Cámara
          </Text>
        </Pressable>
      </View>

      {images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageList}
        >
          {images.map(
            (image, index) => (
              <View
                key={image.id}
                style={styles.imageCard}
              >
                <Image
                  source={{
                    uri: image.uri,
                  }}
                  resizeMode="cover"
                  style={styles.image}
                />

                {index === 0 && (
                  <View
                    style={styles.coverBadge}
                  >
                    <Text
                      style={styles.coverBadgeText}
                    >
                      Portada
                    </Text>
                  </View>
                )}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar imagen ${index + 1}`}
                  disabled={disabled}
                  onPress={() =>
                    handleRemove(
                      image.id,
                    )
                  }
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={
                      styles.removeText
                    }
                  >
                    ×
                  </Text>
                </Pressable>

                {index !== 0 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Usar como portada"
                    disabled={disabled}
                    onPress={() =>
                      handleMakeCover(
                        image.id,
                      )
                    }
                    style={({ pressed }) => [
                      styles.makeCoverButton,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.makeCoverText
                      }
                    >
                      Hacer portada
                    </Text>
                  </Pressable>
                )}
              </View>
            ),
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyCard}>
          <SymbolView
            name={{
              ios: "photo",
              android: "image",
              web: "image",
            }}
            size={28}
            tintColor={MUTED_LIGHT}
          />

          <Text style={styles.emptyTitle}>
            Todavía no agregaste imágenes
          </Text>

          <Text
            style={styles.emptyDescription}
          >
            Son opcionales para Servicios, pero ayudan a mostrar
            trabajos realizados y generar confianza.
          </Text>
        </View>
      )}

      {isFull && (
        <Text style={styles.limitText}>
          Alcanzaste el máximo de {MAX_SERVICE_IMAGES} imágenes.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
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
    marginTop: 4,
  },

  count: {
    color: ORANGE_DARK,
    fontSize: 12,
    fontWeight: "900",
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    borderRadius: 999,
    backgroundColor: ORANGE_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  description: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  actionButton: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    borderRadius: 16,
    backgroundColor: ORANGE_SOFT,
  },

  actionText: {
    color: ORANGE_DARK,
    fontSize: 13,
    fontWeight: "800",
  },

  imageList: {
    gap: 10,
    paddingVertical: 2,
    paddingRight: 4,
  },

  imageCard: {
    width: 164,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    backgroundColor: SURFACE,
  },

  image: {
    width: "100%",
    height: 130,
    backgroundColor: "#F1F5F9",
  },

  coverBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    borderRadius: 999,
    backgroundColor: ORANGE,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  coverBadgeText: {
    color: SURFACE,
    fontSize: 10,
    fontWeight: "900",
  },

  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
  },

  removeText: {
    color: SURFACE,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },

  makeCoverButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  makeCoverText: {
    color: ORANGE_DARK,
    fontSize: 11,
    fontWeight: "800",
  },

  emptyCard: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
    borderRadius: 20,
    backgroundColor: SURFACE,
    padding: 22,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 290,
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  limitText: {
    color: ORANGE_DARK,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.72,
  },
});
