import {
  Stack,
  router,
} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/AuthProvider";
import {
  deleteOwnedProfileImage,
  prepareProfileImageAsset,
  uploadProfileImage,
  type PreparedProfileImage,
  type UploadedProfileImage,
} from "@/features/auth/profileImageStorageService";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";

const BACKGROUND = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const ERROR = "#B91C1C";
const ERROR_SOFT = "#FEF2F2";
const SUCCESS = "#15803D";
const SUCCESS_SOFT = "#F0FDF4";


function getInitial(
  displayName: string,
  email: string | null,
): string {
  const source =
    displayName.trim() ||
    email?.trim() ||
    "E";

  return source
    .charAt(0)
    .toUpperCase();
}

export default function EditProfileScreen() {
  const {
    user,
    userProfile,
    isLoading,
    saveUserProfile,
  } = useAuth();

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    photoURL,
    setPhotoURL,
  ] = useState("");

  const [
    selectedPhoto,
    setSelectedPhoto,
  ] = useState<PreparedProfileImage | null>(
    null,
  );

  const [
    removePhoto,
    setRemovePhoto,
  ] = useState(false);

  const [
    isOpeningPhotoPicker,
    setIsOpeningPhotoPicker,
  ] = useState(false);

  const [bio, setBio] =
    useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace(
        "/(tabs)/perfil",
      );
      return;
    }

    setDisplayName(
      userProfile?.displayName ??
        user.displayName ??
        "",
    );

    setPhotoURL(
      userProfile
        ? userProfile.photoURL ?? ""
        : user.photoURL ?? "",
    );

    setSelectedPhoto(null);
    setRemovePhoto(false);

    setBio(
      userProfile?.bio ?? "",
    );

    setLocation(
      userProfile?.location ?? "",
    );
  }, [
    isLoading,
    user,
    userProfile,
  ]);

  const previewPhotoUri =
    selectedPhoto?.uri ??
    (removePhoto
      ? ""
      : photoURL.trim());

  useEffect(() => {
    setImageFailed(false);
  }, [previewPhotoUri]);

  const handleChoosePhoto =
    async () => {
      if (
        saving ||
        isOpeningPhotoPicker
      ) {
        return;
      }

      try {
        setIsOpeningPhotoPicker(true);
        setError("");
        setSuccess("");

        const result =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: false,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
          });

        if (
          result.canceled ||
          !result.assets?.length
        ) {
          return;
        }

        const preparedPhoto =
          prepareProfileImageAsset(
            result.assets[0],
          );

        setSelectedPhoto(
          preparedPhoto,
        );

        setRemovePhoto(false);
        setImageFailed(false);
      } catch (pickerError) {
        console.error(
          "Error seleccionando foto de perfil:",
          pickerError,
        );

        setSuccess("");

        setError(
          pickerError instanceof Error
            ? pickerError.message
            : "No pudimos seleccionar la foto. Intentá nuevamente.",
        );
      } finally {
        setIsOpeningPhotoPicker(false);
      }
    };

  const handleRemovePhoto = () => {
    if (
      saving ||
      isOpeningPhotoPicker
    ) {
      return;
    }

    setSelectedPhoto(null);
    setPhotoURL("");
    setRemovePhoto(true);
    setImageFailed(false);
    setError("");
    setSuccess("");
  };

  const handleSave =
    async () => {
      if (
        saving ||
        !user
      ) {
        return;
      }

      const normalizedName =
        displayName.trim();

      if (!normalizedName) {
        setSuccess("");
        setError(
          "El nombre visible es obligatorio.",
        );
        return;
      }

      const previousPhotoPath =
        userProfile?.photoPath ?? null;

      let uploadedPhoto:
        | UploadedProfileImage
        | null = null;

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        let nextPhotoURL =
          removePhoto
            ? null
            : photoURL.trim() || null;

        let nextPhotoPath =
          removePhoto
            ? null
            : userProfile?.photoPath ??
              null;

        if (selectedPhoto) {
          uploadedPhoto =
            await uploadProfileImage(
              user.uid,
              selectedPhoto,
            );

          nextPhotoURL =
            uploadedPhoto.url;

          nextPhotoPath =
            uploadedPhoto.fullPath;
        }

        const updatedProfile =
          await saveUserProfile({
            displayName:
              normalizedName,
            photoURL:
              nextPhotoURL,
            photoPath:
              nextPhotoPath,
            bio: bio.trim(),
            location:
              location.trim(),
          });

        setPhotoURL(
          updatedProfile.photoURL ??
            "",
        );

        setSelectedPhoto(null);
        setRemovePhoto(false);
        setImageFailed(false);

        if (
          previousPhotoPath &&
          previousPhotoPath !==
            nextPhotoPath
        ) {
          try {
            await deleteOwnedProfileImage(
              user.uid,
              previousPhotoPath,
            );
          } catch (cleanupError) {
            console.error(
              "No se pudo limpiar la foto de perfil anterior:",
              cleanupError,
            );
          }
        }

        setSuccess(
          "Perfil actualizado correctamente.",
        );
      } catch (saveError) {
        if (uploadedPhoto) {
          try {
            await deleteOwnedProfileImage(
              user.uid,
              uploadedPhoto.fullPath,
            );
          } catch (rollbackError) {
            console.error(
              "No se pudo revertir la foto subida después de fallar el perfil:",
              rollbackError,
            );
          }
        }

        console.error(
          "Error actualizando perfil:",
          saveError,
        );

        setSuccess("");

        setError(
          saveError instanceof Error
            ? saveError.message
            : "No pudimos guardar los cambios. Intentá nuevamente.",
        );
      } finally {
        setSaving(false);
      }
    };

  if (
    isLoading ||
    !user
  ) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <SafeAreaView
          style={styles.safeArea}
        >
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="small"
              color={ORANGE}
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Cargando perfil...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const previewVisible =
    Boolean(previewPhotoUri) &&
    !imageFailed;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView
        style={styles.safeArea}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.scrollContent
            }
          >
            <View
              style={styles.topBar}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Volver"
                onPress={() =>
                  router.back()
                }
                style={({
                  pressed,
                }) => [
                  styles.backButton,
                  pressed &&
                    styles.backButtonPressed,
                ]}
              >
                <SymbolView
                  name={{
                    ios: "chevron.left",
                    android:
                      "arrow_back",
                    web: "arrow_back",
                  }}
                  size={20}
                  tintColor={TEXT}
                />
              </Pressable>

              <View
                style={
                  styles.topBarCopy
                }
              >
                <Text
                  style={
                    styles.eyebrow
                  }
                >
                  MI CUENTA
                </Text>

                <Text
                  style={
                    styles.title
                  }
                >
                  Editar perfil
                </Text>
              </View>
            </View>

            <View
              style={
                styles.previewCard
              }
            >
              <View
                style={
                  styles.previewAvatar
                }
              >
                {previewVisible ? (
                  <Image
                    source={{
                      uri: previewPhotoUri,
                    }}
                    style={
                      styles.previewImage
                    }
                    onError={() =>
                      setImageFailed(true)
                    }
                    accessibilityLabel="Vista previa de la foto"
                  />
                ) : (
                  <Text
                    style={
                      styles.previewInitial
                    }
                  >
                    {getInitial(
                      displayName,
                      user.email,
                    )}
                  </Text>
                )}
              </View>

              <View
                style={
                  styles.previewContent
                }
              >
                <Text
                  style={
                    styles.previewName
                  }
                  numberOfLines={2}
                >
                  {displayName.trim() ||
                    "Tu nombre"}
                </Text>

                {user.email ? (
                  <Text
                    style={
                      styles.previewEmail
                    }
                    numberOfLines={1}
                  >
                    {user.email}
                  </Text>
                ) : null}

                <Text
                  style={
                    styles.previewHint
                  }
                >
                  Así se verá tu identidad
                  principal en Eziel.
                </Text>
              </View>
            </View>

            {success ? (
              <View
                style={
                  styles.successNotice
                }
              >
                <SymbolView
                  name={{
                    ios: "checkmark.circle.fill",
                    android:
                      "check_circle",
                    web: "check_circle",
                  }}
                  size={18}
                  tintColor={SUCCESS}
                />

                <Text
                  style={
                    styles.successText
                  }
                >
                  {success}
                </Text>
              </View>
            ) : null}

            {error ? (
              <View
                style={
                  styles.errorNotice
                }
              >
                <SymbolView
                  name={{
                    ios: "exclamationmark.circle.fill",
                    android: "error",
                    web: "error",
                  }}
                  size={18}
                  tintColor={ERROR}
                />

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <View
              style={styles.formCard}
            >
              <Text
                style={
                  styles.formTitle
                }
              >
                Información pública
              </Text>

              <Text
                style={
                  styles.formDescription
                }
              >
                Estos datos ayudan a que
                otros usuarios te
                reconozcan dentro del
                marketplace.
              </Text>

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.fieldLabel
                  }
                >
                  Nombre visible *
                </Text>

                <View
                  style={
                    styles.inputShell
                  }
                >
                  <SymbolView
                    name={{
                      ios: "person.fill",
                      android:
                        "person",
                      web: "person",
                    }}
                    size={18}
                    tintColor={ORANGE}
                  />

                  <TextInput
                    value={
                      displayName
                    }
                    onChangeText={
                      setDisplayName
                    }
                    placeholder="Ej: Ezequiel Torres"
                    placeholderTextColor="#94A3B8"
                    editable={!saving}
                    autoCapitalize="words"
                    returnKeyType="next"
                    style={styles.input}
                  />
                </View>
              </View>

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.fieldLabel
                  }
                >
                  Foto de perfil
                </Text>

                <View
                  style={
                    styles.photoActions
                  }
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Elegir foto de perfil"
                    accessibilityState={{
                      disabled:
                        saving ||
                        isOpeningPhotoPicker,
                      busy:
                        isOpeningPhotoPicker,
                    }}
                    disabled={
                      saving ||
                      isOpeningPhotoPicker
                    }
                    onPress={
                      handleChoosePhoto
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.photoPickerButton,
                      pressed &&
                        !saving &&
                        !isOpeningPhotoPicker &&
                        styles.photoPickerButtonPressed,
                      (saving ||
                        isOpeningPhotoPicker) &&
                        styles.photoPickerButtonDisabled,
                    ]}
                  >
                    {isOpeningPhotoPicker ? (
                      <ActivityIndicator
                        size="small"
                        color={ORANGE}
                      />
                    ) : (
                      <SymbolView
                        name={{
                          ios: "photo.fill",
                          android: "image",
                          web: "image",
                        }}
                        size={20}
                        tintColor={ORANGE}
                      />
                    )}

                    <View
                      style={
                        styles.photoPickerCopy
                      }
                    >
                      <Text
                        style={
                          styles.photoPickerTitle
                        }
                      >
                        {selectedPhoto
                          ? "Cambiar selección"
                          : previewPhotoUri
                            ? "Cambiar foto"
                            : "Elegir foto"}
                      </Text>

                      <Text
                        style={
                          styles.photoPickerSubtitle
                        }
                      >
                        JPG, PNG o WebP · máximo
                        5 MB
                      </Text>
                    </View>
                  </Pressable>

                  {previewPhotoUri ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Quitar foto de perfil"
                      disabled={
                        saving ||
                        isOpeningPhotoPicker
                      }
                      onPress={
                        handleRemovePhoto
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.removePhotoButton,
                        pressed &&
                          !saving &&
                          styles.removePhotoButtonPressed,
                      ]}
                    >
                      <Text
                        style={
                          styles.removePhotoText
                        }
                      >
                        Quitar foto
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <Text
                  style={
                    styles.fieldHint
                  }
                >
                  {selectedPhoto
                    ? "La nueva foto se subirá cuando guardes los cambios."
                    : removePhoto
                      ? "La foto actual se quitará cuando guardes los cambios."
                      : "Elegí una foto clara para que otros usuarios puedan reconocerte."}
                </Text>
              </View>

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.fieldLabel
                  }
                >
                  Biografía
                </Text>

                <View
                  style={[
                    styles.inputShell,
                    styles.textareaShell,
                  ]}
                >
                  <SymbolView
                    name={{
                      ios: "text.alignleft",
                      android: "notes",
                      web: "notes",
                    }}
                    size={18}
                    tintColor={ORANGE}
                  />

                  <TextInput
                    value={bio}
                    onChangeText={
                      setBio
                    }
                    placeholder="Contá quién sos o qué tipo de productos ofrecés."
                    placeholderTextColor="#94A3B8"
                    editable={!saving}
                    multiline
                    textAlignVertical="top"
                    style={[
                      styles.input,
                      styles.textarea,
                    ]}
                  />
                </View>
              </View>

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.fieldLabel
                  }
                >
                  Ciudad / ubicación
                </Text>

                <View
                  style={
                    styles.inputShell
                  }
                >
                  <SymbolView
                    name={{
                      ios: "location.fill",
                      android:
                        "location_on",
                      web: "location_on",
                    }}
                    size={18}
                    tintColor={ORANGE}
                  />

                  <TextInput
                    value={location}
                    onChangeText={
                      setLocation
                    }
                    placeholder="Ej: Neuquén, Neuquén"
                    placeholderTextColor="#94A3B8"
                    editable={!saving}
                    autoCapitalize="words"
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            <View
              style={
                styles.securityCard
              }
            >
              <SymbolView
                name={{
                  ios: "lock.shield.fill",
                  android: "security",
                  web: "security",
                }}
                size={19}
                tintColor={MUTED}
              />

              <Text
                style={
                  styles.securityText
                }
              >
                El nombre y la foto se
                sincronizan con Firebase
                Authentication para evitar
                que una sesión futura
                sobrescriba tus cambios.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Guardar cambios"
              accessibilityState={{
                disabled: saving,
                busy: saving,
              }}
              disabled={saving}
              onPress={handleSave}
              style={({
                pressed,
              }) => [
                styles.saveButton,
                pressed &&
                  !saving &&
                  styles.saveButtonPressed,
                saving &&
                  styles.saveButtonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={SURFACE}
                />
              ) : (
                <SymbolView
                  name={{
                    ios: "checkmark",
                    android: "check",
                    web: "check",
                  }}
                  size={19}
                  tintColor={SURFACE}
                />
              )}

              <Text
                style={
                  styles.saveButtonText
                }
              >
                {saving
                  ? "Guardando cambios..."
                  : "Guardar cambios"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
      backgroundColor: BACKGROUND,
    },

    scrollContent: {
      paddingHorizontal: 22,
      paddingTop: 18,
      paddingBottom: 42,
    },

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },

    loadingText: {
      color: MUTED,
      fontSize: 13,
      fontWeight: "700",
    },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      marginBottom: 22,
    },

    backButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 15,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: SURFACE,
    },

    backButtonPressed: {
      backgroundColor: ORANGE_SOFT,
    },

    topBarCopy: {
      flex: 1,
    },

    eyebrow: {
      color: ORANGE,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    title: {
      color: TEXT,
      fontSize: 27,
      fontWeight: "900",
      letterSpacing: -0.7,
      marginTop: 2,
    },

    previewCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
      padding: 18,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: "#FED7AA",
      backgroundColor: ORANGE_SOFT,
    },

    previewAvatar: {
      width: 70,
      height: 70,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderRadius: 23,
      borderWidth: 3,
      borderColor: SURFACE,
      backgroundColor: SURFACE,
    },

    previewImage: {
      width: "100%",
      height: "100%",
    },

    previewInitial: {
      color: ORANGE,
      fontSize: 27,
      fontWeight: "900",
    },

    previewContent: {
      flex: 1,
    },

    previewName: {
      color: TEXT,
      fontSize: 18,
      fontWeight: "900",
    },

    previewEmail: {
      color: MUTED,
      fontSize: 11,
      marginTop: 3,
    },

    previewHint: {
      color: "#9A3412",
      fontSize: 10,
      lineHeight: 15,
      marginTop: 8,
    },

    successNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: 14,
      padding: 13,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#BBF7D0",
      backgroundColor: SUCCESS_SOFT,
    },

    successText: {
      flex: 1,
      color: SUCCESS,
      fontSize: 11,
      lineHeight: 17,
      fontWeight: "700",
    },

    errorNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: 14,
      padding: 13,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#FECACA",
      backgroundColor: ERROR_SOFT,
    },

    errorText: {
      flex: 1,
      color: ERROR,
      fontSize: 11,
      lineHeight: 17,
      fontWeight: "700",
    },

    formCard: {
      marginTop: 16,
      padding: 18,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: SURFACE,
    },

    formTitle: {
      color: TEXT,
      fontSize: 16,
      fontWeight: "900",
    },

    formDescription: {
      color: MUTED,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 5,
      marginBottom: 4,
    },

    fieldGroup: {
      marginTop: 18,
    },

    fieldLabel: {
      color: TEXT,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 7,
    },

    inputShell: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: "#FFFFFF",
    },

    photoActions: {
      gap: 10,
    },

    photoPickerButton: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 15,
      paddingVertical: 11,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#FED7AA",
      backgroundColor: ORANGE_SOFT,
    },

    photoPickerButtonPressed: {
      backgroundColor: "#FFEDD5",
    },

    photoPickerButtonDisabled: {
      opacity: 0.6,
    },

    photoPickerCopy: {
      flex: 1,
    },

    photoPickerTitle: {
      color: TEXT,
      fontSize: 13,
      fontWeight: "800",
    },

    photoPickerSubtitle: {
      color: MUTED,
      fontSize: 10,
      lineHeight: 15,
      marginTop: 2,
    },

    removePhotoButton: {
      minHeight: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#FECACA",
      backgroundColor: ERROR_SOFT,
    },

    removePhotoButtonPressed: {
      backgroundColor: "#FEE2E2",
    },

    removePhotoText: {
      color: ERROR,
      fontSize: 11,
      fontWeight: "800",
    },

    textareaShell: {
      minHeight: 124,
      alignItems: "flex-start",
      paddingTop: 16,
    },

    input: {
      flex: 1,
      minHeight: 52,
      color: TEXT,
      fontSize: 13,
      fontWeight: "600",
      paddingVertical: 0,
    },

    textarea: {
      minHeight: 96,
      lineHeight: 19,
      paddingTop: 0,
      paddingBottom: 12,
    },

    fieldHint: {
      color: MUTED,
      fontSize: 10,
      lineHeight: 15,
      marginTop: 6,
      marginLeft: 3,
    },

    securityCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginTop: 16,
      padding: 14,
      borderRadius: 17,
      backgroundColor: "#F1F5F9",
    },

    securityText: {
      flex: 1,
      color: MUTED,
      fontSize: 10,
      lineHeight: 16,
    },

    saveButton: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      marginTop: 18,
      paddingHorizontal: 18,
      borderRadius: 18,
      backgroundColor: ORANGE,
    },

    saveButtonPressed: {
      backgroundColor: ORANGE_DARK,
    },

    saveButtonDisabled: {
      opacity: 0.65,
    },

    saveButtonText: {
      color: SURFACE,
      fontSize: 14,
      fontWeight: "900",
    },
  });
