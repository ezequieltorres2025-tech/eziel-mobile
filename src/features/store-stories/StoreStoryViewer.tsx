import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useEventListener,
} from "expo";

import {
  StatusBar,
} from "expo-status-bar";

import {
  VideoView,
  useVideoPlayer,
} from "expo-video";

import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  getTemporaryStoryTimeLeft,
  isStoryMediaVideo,
} from "./storeStoriesFirestoreService";

import type {
  StoreStory,
  StoreStoryItem,
} from "./storeStoriesTypes";

const IMAGE_DURATION_MS =
  6_000;

interface StoreStoryViewerProps {
  visible: boolean;
  stories: StoreStory[];
  initialStoryIndex: number;
  storeName: string;
  onClose: () => void;
}

function getPlayableItems(
  story: StoreStory | undefined,
): StoreStoryItem[] {
  if (!story) {
    return [];
  }

  return story.items.filter(
    (item) =>
      Boolean(
        item.mediaUrl ||
          item.imageUrl,
      ),
  );
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    Math.max(value, min),
    max,
  );
}

export function StoreStoryViewer({
  visible,
  stories,
  initialStoryIndex,
  storeName,
  onClose,
}: StoreStoryViewerProps) {
  const insets =
    useSafeAreaInsets();

  const [storyIndex, setStoryIndex] =
    useState(0);

  const [itemIndex, setItemIndex] =
    useState(0);

  const [progress, setProgress] =
    useState(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const maxIndex =
      Math.max(
        stories.length - 1,
        0,
      );

    setStoryIndex(
      clamp(
        initialStoryIndex,
        0,
        maxIndex,
      ),
    );

    setItemIndex(0);
    setProgress(0);
  }, [
    initialStoryIndex,
    stories.length,
    visible,
  ]);

  const currentStory =
    stories[storyIndex];

  const currentItems =
    useMemo(
      () =>
        getPlayableItems(
          currentStory,
        ),
      [currentStory],
    );

  const currentItem =
    currentItems[itemIndex];

  useEffect(() => {
    setProgress(0);
  }, [
    currentItem?.id,
    currentStory?.id,
  ]);

  const goNext =
    useCallback(() => {
      if (!currentStory) {
        onClose();
        return;
      }

      if (
        itemIndex <
        currentItems.length - 1
      ) {
        setItemIndex(
          (current) =>
            current + 1,
        );
        return;
      }

      if (
        storyIndex <
        stories.length - 1
      ) {
        setStoryIndex(
          (current) =>
            current + 1,
        );
        setItemIndex(0);
        return;
      }

      onClose();
    }, [
      currentItems.length,
      currentStory,
      itemIndex,
      onClose,
      stories.length,
      storyIndex,
    ]);

  const goPrevious =
    useCallback(() => {
      if (itemIndex > 0) {
        setItemIndex(
          (current) =>
            current - 1,
        );
        return;
      }

      if (storyIndex > 0) {
        const previousStoryIndex =
          storyIndex - 1;

        const previousItems =
          getPlayableItems(
            stories[
              previousStoryIndex
            ],
          );

        setStoryIndex(
          previousStoryIndex,
        );

        setItemIndex(
          Math.max(
            previousItems.length -
              1,
            0,
          ),
        );

        return;
      }

      setItemIndex(0);
      setProgress(0);
    }, [
      itemIndex,
      stories,
      storyIndex,
    ]);

  const handleProgress =
    useCallback(
      (value: number) => {
        setProgress(
          clamp(
            value,
            0,
            1,
          ),
        );
      },
      [],
    );

  if (
    !currentStory ||
    !currentItem
  ) {
    return null;
  }

  const storyMeta =
    currentStory.kind ===
    "temporary"
      ? getTemporaryStoryTimeLeft(
          currentStory,
        )
      : "Destacada";

  return (
    <Modal
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <StatusBar
        style="light"
      />

      <View
        style={
          styles.viewerRoot
        }
      >
        <View
          style={[
            styles.viewerTop,
            {
              paddingTop:
                insets.top + 8,
            },
          ]}
        >
          <View
            style={
              styles.progressRow
            }
          >
            {currentItems.map(
              (item, index) => {
                let width = 0;

                if (
                  index < itemIndex
                ) {
                  width = 1;
                } else if (
                  index ===
                  itemIndex
                ) {
                  width = progress;
                }

                return (
                  <View
                    key={item.id}
                    style={
                      styles.progressTrack
                    }
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            `${width * 100}%`,
                        },
                      ]}
                    />
                  </View>
                );
              },
            )}
          </View>

          <View
            style={
              styles.viewerHeader
            }
          >
            <View
              style={
                styles.viewerHeaderText
              }
            >
              <Text
                numberOfLines={1}
                style={
                  styles.viewerStoreName
                }
              >
                {storeName}
              </Text>

              <Text
                numberOfLines={1}
                style={
                  styles.viewerStoryMeta
                }
              >
                {currentStory.title ||
                  "Historia"}
                {" · "}
                {storyMeta}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar historia"
              hitSlop={12}
              onPress={onClose}
              style={
                styles.closeButton
              }
            >
              <Text
                style={
                  styles.closeButtonText
                }
              >
                ×
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={
            styles.mediaContainer
          }
        >
          <StoryMedia
            key={
              `${currentStory.id}:${currentItem.id}`
            }
            item={currentItem}
            onComplete={goNext}
            onProgress={
              handleProgress
            }
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Historia anterior"
          onPress={goPrevious}
          style={[
            styles.navigationZone,
            styles.navigationZoneLeft,
            {
              top:
                insets.top + 96,
              bottom:
                insets.bottom,
            },
          ]}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Siguiente historia"
          onPress={goNext}
          style={[
            styles.navigationZone,
            styles.navigationZoneRight,
            {
              top:
                insets.top + 96,
              bottom:
                insets.bottom,
            },
          ]}
        />
      </View>
    </Modal>
  );
}

interface StoryMediaProps {
  item: StoreStoryItem;
  onProgress: (
    progress: number,
  ) => void;
  onComplete: () => void;
}

function StoryMedia({
  item,
  onProgress,
  onComplete,
}: StoryMediaProps) {
  if (
    isStoryMediaVideo(item)
  ) {
    return (
      <VideoStoryMedia
        item={item}
        onProgress={
          onProgress
        }
        onComplete={
          onComplete
        }
      />
    );
  }

  return (
    <ImageStoryMedia
      item={item}
      onProgress={
        onProgress
      }
      onComplete={
        onComplete
      }
    />
  );
}

function ImageStoryMedia({
  item,
  onProgress,
  onComplete,
}: StoryMediaProps) {
  const [failed, setFailed] =
    useState(false);

  useEffect(() => {
    const startedAt =
      Date.now();

    onProgress(0);

    const interval =
      setInterval(() => {
        const elapsed =
          Date.now() -
          startedAt;

        const nextProgress =
          Math.min(
            elapsed /
              IMAGE_DURATION_MS,
            1,
          );

        onProgress(
          nextProgress,
        );

        if (
          nextProgress >= 1
        ) {
          clearInterval(
            interval,
          );

          onComplete();
        }
      }, 50);

    return () => {
      clearInterval(
        interval,
      );
    };
  }, [
    item.id,
    onComplete,
    onProgress,
  ]);

  const uri =
    item.mediaUrl ||
    item.imageUrl;

  if (failed) {
    return (
      <View
        style={
          styles.mediaError
        }
      >
        <Text
          style={
            styles.mediaErrorTitle
          }
        >
          No pudimos mostrar esta imagen
        </Text>

        <Text
          style={
            styles.mediaErrorText
          }
        >
          Tocá a la derecha para continuar.
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      resizeMode="contain"
      onError={() =>
        setFailed(true)
      }
      style={
        styles.storyMedia
      }
    />
  );
}

function VideoStoryMedia({
  item,
  onProgress,
  onComplete,
}: StoryMediaProps) {
  const [failed, setFailed] =
    useState(false);

  const player =
    useVideoPlayer(
      {
        uri:
          item.mediaUrl ||
          item.imageUrl,
        useCaching: true,
      },
      (videoPlayer) => {
        videoPlayer.loop = false;

        videoPlayer
          .timeUpdateEventInterval =
          0.1;

        videoPlayer.play();
      },
    );

  useEventListener(
    player,
    "timeUpdate",
    ({ currentTime }) => {
      const duration =
        player.duration;

      if (
        duration > 0 &&
        Number.isFinite(
          duration,
        )
      ) {
        onProgress(
          currentTime /
            duration,
        );
      }
    },
  );

  useEventListener(
    player,
    "playToEnd",
    () => {
      onProgress(1);
      onComplete();
    },
  );

  useEventListener(
    player,
    "statusChange",
    ({ status }) => {
      if (status === "error") {
        setFailed(true);
      }
    },
  );

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        // El hook libera el player
        // automáticamente al desmontar.
      }
    };
  }, [player]);

  if (failed) {
    return (
      <View
        style={
          styles.mediaError
        }
      >
        <Text
          style={
            styles.mediaErrorTitle
          }
        >
          No pudimos reproducir este video
        </Text>

        <Text
          style={
            styles.mediaErrorText
          }
        >
          Tocá a la derecha para continuar.
        </Text>
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="contain"
      surfaceType="textureView"
      style={
        styles.storyMedia
      }
    />
  );
}

const styles =
  StyleSheet.create({
    viewerRoot: {
      flex: 1,
      backgroundColor:
        "#05070A",
    },

    viewerTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      paddingHorizontal: 14,
      paddingBottom: 12,
      backgroundColor:
        "rgba(0,0,0,0.34)",
    },

    progressRow: {
      flexDirection: "row",
      gap: 4,
    },

    progressTrack: {
      flex: 1,
      height: 3,
      overflow: "hidden",
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.34)",
    },

    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor:
        "#FFFFFF",
    },

    viewerHeader: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    viewerHeaderText: {
      flex: 1,
    },

    viewerStoreName: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },

    viewerStoryMeta: {
      marginTop: 2,
      color:
        "rgba(255,255,255,0.76)",
      fontSize: 12,
      fontWeight: "600",
    },

    closeButton: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 21,
      backgroundColor:
        "rgba(0,0,0,0.42)",
    },

    closeButtonText: {
      marginTop: -2,
      color: "#FFFFFF",
      fontSize: 32,
      fontWeight: "300",
      lineHeight: 34,
    },

    mediaContainer: {
      flex: 1,
      alignItems: "stretch",
      justifyContent:
        "center",
      backgroundColor:
        "#05070A",
    },

    storyMedia: {
      width: "100%",
      height: "100%",
    },

    mediaError: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 32,
    },

    mediaErrorTitle: {
      color: "#FFFFFF",
      textAlign: "center",
      fontSize: 18,
      fontWeight: "800",
    },

    mediaErrorText: {
      marginTop: 8,
      color:
        "rgba(255,255,255,0.68)",
      textAlign: "center",
      fontSize: 14,
      lineHeight: 20,
    },

    navigationZone: {
      position: "absolute",
      zIndex: 10,
    },

    navigationZoneLeft: {
      left: 0,
      width: "32%",
    },

    navigationZoneRight: {
      right: 0,
      width: "68%",
    },
  });
