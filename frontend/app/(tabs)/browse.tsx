import { Icon } from "@/components/ui/icon";
import LargeCard from "@/components/ui/large-card";
import { useProductsQuery } from "@/services/products-service";
import type { Href } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Browse tab that lists products from the backend catalogue.
 */
const BrowseTab = () => {
  const [searchText, setSearchText] = useState("");
  const productsQuery = useProductsQuery();

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const allProducts = productsQuery.data ?? [];

    if (!query) {
      return allProducts;
    }

    return allProducts.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [productsQuery.data, searchText]);

  const errorMessage =
    productsQuery.error instanceof Error
      ? productsQuery.error.message
      : "Couldn't load products. Please try again.";

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-5 pb-4">
        <Text className="text-3xl font-bold mb-5">Browse Products</Text>
        <View className="bg-gray-100 rounded-2xl pl-4 flex-row gap-2 justify-center items-center">
          <Icon as={Search} size={22} className="text-gray-500" />
          <TextInput
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
            placeholder="Search products"
            className="flex-1 text-foreground"
            placeholderTextColor={"gray"}
          />
        </View>
      </View>
      <View className="flex-1 bg-gray-100 px-5 py-4">
        {productsQuery.isLoading ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator size="large" />
            <Text className="text-muted-foreground">Loading products...</Text>
          </View>
        ) : null}

        {productsQuery.isError ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-destructive">{errorMessage}</Text>
          </View>
        ) : null}

        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperClassName="gap-3 justify-center"
          contentContainerClassName="gap-3"
          ListEmptyComponent={
            <Text className="text-center text-muted-foreground mt-10">
              No products found.
            </Text>
          }
          style={
            productsQuery.isLoading || productsQuery.isError
              ? { display: "none" }
              : undefined
          }
          renderItem={({ item }) => (
            <View className="flex-1">
              <LargeCard
                title={item.name}
                subtitle={`${item.price.toFixed(2)} ${item.currency ?? "NOK"}`}
                imageUrl={item.imageUrl}
                href={`/products/${item.id}` as Href}
              />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default BrowseTab;
