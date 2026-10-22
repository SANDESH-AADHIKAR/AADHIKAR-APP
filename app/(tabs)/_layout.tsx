import { mutedColor } from "@/constants/theme";
import { Tabs } from "expo-router/js-tabs";
import { useTheme } from "expo-router";
import { House, Landmark, Mic } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: mutedColor(theme.dark),
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab_home", "Home"),
          tabBarIcon: ({ color, size, focused }) => (
            <House size={size} color={color} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          title: t("tab_schemes", "Schemes"),
          tabBarIcon: ({ color, size, focused }) => (
            <Landmark
              size={size}
              color={color}
              strokeWidth={focused ? 2.4 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tab_chat", "Chat"),
          tabBarIcon: ({ color, size, focused }) => (
            <Mic size={size} color={color} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
