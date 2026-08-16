import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

const ACTIVE_COLOR = "#F97316";
const INACTIVE_COLOR = "#64748B";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarAccessibilityLabel: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: "house.fill",
                android: "home",
                web: "home",
              }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explorar"
        options={{
          title: "Explorar",
          tabBarAccessibilityLabel: "Explorar",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: "magnifyingglass",
                android: "search",
                web: "search",
              }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="publicar"
        options={{
          title: "Publicar",
          tabBarAccessibilityLabel: "Publicar",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: "plus.circle.fill",
                android: "add_circle",
                web: "add_circle",
              }}
              tintColor={color}
              size={size + 4}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="mensajes"
        options={{
          title: "Mensajes",
          tabBarAccessibilityLabel: "Mensajes",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: "bubble.left.and.bubble.right.fill",
                android: "chat_bubble",
                web: "chat_bubble",
              }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarAccessibilityLabel: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: "person.crop.circle.fill",
                android: "account_circle",
                web: "account_circle",
              }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
