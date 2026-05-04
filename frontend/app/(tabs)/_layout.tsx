import { Icon } from "@/components/ui/icon";
import { Tabs } from "expo-router";
import { Home, Package, Search, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <Icon as={Home} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          headerShown: false,
          tabBarIcon: ({ size, color }) => {
            return <Icon as={Search} size={size} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <Icon as={Package} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <Icon as={User} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
