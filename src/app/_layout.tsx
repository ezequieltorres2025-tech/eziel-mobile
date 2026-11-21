import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { NotificationsProvider } from "@/features/notifications/NotificationsProvider";
import { PushRegistrationProvider } from "@/features/push/PushRegistrationProvider";
import { PushNotificationNavigationHandler } from "@/features/push/PushNotificationNavigationHandler";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PushRegistrationProvider>
        <NotificationsProvider>
        <StatusBar style="dark" />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        <PushNotificationNavigationHandler />
        </NotificationsProvider>
        </PushRegistrationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
