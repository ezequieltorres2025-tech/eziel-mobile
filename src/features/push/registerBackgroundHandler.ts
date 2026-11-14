import { Platform } from "react-native";
import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";

if (Platform.OS === "android") {
  try {
    setBackgroundMessageHandler(getMessaging(), async () => {
      // Reception only. Firestore owns notification state; no UI or business writes.
    });
  } catch {
    // The previous development binary has no Messaging module. Registration UI
    // reports the missing integration; a new Android build is required.
  }
}
