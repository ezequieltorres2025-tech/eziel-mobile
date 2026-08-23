import {
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getStoryPreviewImage,
  getTemporaryStoryTimeLeft,
} from "./storeStoriesFirestoreService";

import {
  StoreStoryViewer,
} from "./StoreStoryViewer";

import {
  useStoreStories,
} from "./useStoreStories";

import type {
  StoreStory,
} from "./storeStoriesTypes";

interface StoreStoriesSectionProps {
  storeId: string;
  storeName: string;
  visible?: boolean;
}

export function StoreStoriesSection({
  storeId,
  storeName,
  visible = true,
}: StoreStoriesSectionProps) {
  const {
    highlights,
    temporary,
    error,
    isLoading,
    reload,
  } = useStoreStories(
    storeId,
    visible,
  );

  const [viewerVisible, setViewerVisible] =
    useState(false);

  const [
    initialStoryIndex,
    setInitialStoryIndex,
  ] = useState(0);

  const stories =
    useMemo(
      () => [
        ...temporary,
        ...highlights,
      ],
      [
        highlights,
        temporary,
      ],
    );

  if (!visible) {
    return null;
  }

  if (
    isLoading &&
    stories.length === 0
  ) {
    return (
      <View
        style={
          styles.loadingCard
        }
      >
        <ActivityIndicator
          color="#F97316"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Cargando historias…
        </Text>
      </View>
    );
  }

  if (
    error &&
    stories.length === 0
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar cargar historias"
        onPress={() => {
          void reload();
        }}
        style={
          styles.errorCard
        }
      >
        <View>
          <Text
            style={
              styles.errorTitle
            }
          >
            Historias no disponibles
          </Text>

          <Text
            style={
              styles.errorText
            }
          >
            Tocá para intentar de nuevo.
          </Text>
        </View>

        <Text
          style={
            styles.retryText
          }
        >
          Reintentar
        </Text>
      </Pressable>
    );
  }

  if (
    stories.length === 0
  ) {
    return null;
  }

  const subtitleParts =
    [
      temporary.length > 0
        ? `${temporary.length} ${
            temporary.length === 1
              ? "historia por 24 h"
              : "historias por 24 h"
          }`
        : "",
      highlights.length > 0
        ? `${highlights.length} ${
            highlights.length === 1
              ? "destacada"
              : "destacadas"
          }`
        : "",
    ].filter(Boolean);

  return (
    <>
      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Historias
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              {subtitleParts.join(
                " · ",
              )}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.storiesContent
          }
        >
          {stories.map(
            (story, index) => (
              <StoryPreview
                key={story.id}
                story={story}
                onPress={() => {
                  setInitialStoryIndex(
                    index,
                  );

                  setViewerVisible(
                    true,
                  );
                }}
              />
            ),
          )}
        </ScrollView>
      </View>

      <StoreStoryViewer
        visible={
          viewerVisible
        }
        stories={stories}
        initialStoryIndex={
          initialStoryIndex
        }
        storeName={storeName}
        onClose={() =>
          setViewerVisible(
            false,
          )
        }
      />
    </>
  );
}

function StoryPreview({
  story,
  onPress,
}: {
  story: StoreStory;
  onPress: () => void;
}) {
  const previewImage =
    getStoryPreviewImage(
      story,
    );

  const isTemporary =
    story.kind ===
    "temporary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isTemporary
          ? `Abrir historia temporal ${story.title}`
          : `Abrir historia destacada ${story.title}`
      }
      onPress={onPress}
      style={({ pressed }) => [
        styles.storyButton,
        pressed &&
          styles.storyButtonPressed,
      ]}
    >
      <View
        style={[
          styles.storyRing,
          isTemporary
            ? styles.temporaryRing
            : styles.highlightRing,
        ]}
      >
        <View
          style={
            styles.storyImageShell
          }
        >
          {previewImage ? (
            <Image
              source={{
                uri:
                  previewImage,
              }}
              resizeMode="cover"
              style={
                styles.storyImage
              }
            />
          ) : (
            <View
              style={
                styles.videoFallback
              }
            >
              <Text
                style={
                  styles.videoFallbackIcon
                }
              >
                ▶
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text
        numberOfLines={1}
        style={
          styles.storyTitle
        }
      >
        {story.title ||
          "Historia"}
      </Text>

      <Text
        numberOfLines={1}
        style={[
          styles.storyMeta,
          isTemporary &&
            styles.temporaryMeta,
        ]}
      >
        {isTemporary
          ? getTemporaryStoryTimeLeft(
              story,
            )
          : "Destacada"}
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    section: {
      marginTop: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#E2E8F0",
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      paddingTop: 18,
      paddingBottom: 16,
    },

    sectionHeader: {
      paddingHorizontal: 18,
      marginBottom: 16,
    },

    sectionTitle: {
      color: "#0F172A",
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: -0.4,
    },

    sectionSubtitle: {
      marginTop: 4,
      color: "#64748B",
      fontSize: 13,
      fontWeight: "600",
    },

    storiesContent: {
      paddingHorizontal: 18,
      paddingBottom: 2,
      gap: 14,
    },

    storyButton: {
      width: 88,
      alignItems: "center",
    },

    storyButtonPressed: {
      opacity: 0.72,
      transform: [
        {
          scale: 0.97,
        },
      ],
    },

    storyRing: {
      width: 78,
      height: 78,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 39,
      borderWidth: 3,
    },

    temporaryRing: {
      borderColor: "#F97316",
    },

    highlightRing: {
      borderColor: "#CBD5E1",
    },

    storyImageShell: {
      width: 66,
      height: 66,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 33,
      backgroundColor: "#FFF7ED",
    },

    storyImage: {
      width: "100%",
      height: "100%",
    },

    videoFallback: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0F172A",
    },

    videoFallbackIcon: {
      marginLeft: 3,
      color: "#FFFFFF",
      fontSize: 23,
      fontWeight: "900",
    },

    storyTitle: {
      width: "100%",
      marginTop: 8,
      color: "#0F172A",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "800",
    },

    storyMeta: {
      width: "100%",
      marginTop: 2,
      color: "#64748B",
      textAlign: "center",
      fontSize: 10,
      fontWeight: "700",
    },

    temporaryMeta: {
      color: "#EA580C",
    },

    loadingCard: {
      minHeight: 88,
      marginTop: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
    },

    loadingText: {
      color: "#64748B",
      fontSize: 13,
      fontWeight: "700",
    },

    errorCard: {
      minHeight: 86,
      marginTop: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 16,
      borderWidth: 1,
      borderColor: "#FED7AA",
      borderRadius: 24,
      backgroundColor: "#FFF7ED",
      paddingHorizontal: 18,
      paddingVertical: 14,
    },

    errorTitle: {
      color: "#9A3412",
      fontSize: 14,
      fontWeight: "800",
    },

    errorText: {
      marginTop: 2,
      color: "#C2410C",
      fontSize: 12,
      fontWeight: "600",
    },

    retryText: {
      color: "#EA580C",
      fontSize: 12,
      fontWeight: "900",
    },
  });
