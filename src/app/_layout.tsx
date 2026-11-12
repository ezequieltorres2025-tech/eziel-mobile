import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { NotificationsProvider } from "@/features/notifications/NotificationsProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
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
        </NotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
