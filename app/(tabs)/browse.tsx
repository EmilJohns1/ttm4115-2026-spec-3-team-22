import { Icon } from "@/components/ui/icon";
import LargeCard from "@/components/ui/large-card";
import type { Href } from "expo-router";
import { Search } from "lucide-react-native";
import React from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const products: Array<{
  id: string;
  title: string;
  subtitle: string;
  href: Href;
}> = [
  {
    id: "wireless-headphones",
    title: "Wireless Headphones",
    subtitle: "$79.99",
    href: "/products/1",
  },
  {
    id: "smart-watch",
    title: "Smart Watch",
    subtitle: "$199.99",
    href: "/products/2",
  },
  {
    id: "smart-watch",
    title: "Smart Watch",
    subtitle: "$199.99",
    href: "/products/3",
  },
  {
    id: "smart-watch",
    title: "Smart Watch",
    subtitle: "$199.99",
    href: "/products/4",
  },
  {
    id: "smart-watch",
    title: "Smart Watch",
    subtitle: "$199.99",
    href: "/products/5",
  },
];

const BrowseTab = () => {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background px-5">
      <Text className="text-3xl font-bold mb-5">Browse Products</Text>
      <View className="bg-gray-100 rounded-2xl pl-4 flex-row gap-2 justify-center items-center mb-2">
        <Icon as={Search} size={22} className="text-gray-500" />
        <TextInput
          placeholder="Search products"
          className="flex-1 text-foreground"
          placeholderTextColor={"gray"}
        />
      </View>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
        contentContainerStyle={{ paddingBottom: 16, paddingTop: 8, gap: 12 }}
        renderItem={({ item }) => (
          <View style={{ width: "48%" }}>
            <LargeCard
              title={item.title}
              subtitle={item.subtitle}
              href={item.href}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default BrowseTab;
