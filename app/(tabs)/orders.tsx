import MediumCard from "@/components/ui/medium-card";
import { getOrderStatusMeta } from "@/constants/order-status";
import { useOrdersQuery } from "@/services/orders-service";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OrderSection = "active" | "completed" | "cancelled";

const ORDER_SECTIONS: ReadonlyArray<{ key: OrderSection; label: string }> = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

/**
 * Formats ISO timestamps for order cards.
 */
function formatOrderTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

/**
 * Formats totals from backend amount objects.
 */
function formatOrderTotal(total: number, currency: string) {
  return `${total.toFixed(2)} ${currency}`;
}

/**
 * Orders tab screen with pager-style section navigation.
 */
const OrdersTab = () => {
  const [selectedSection, setSelectedSection] =
    useState<OrderSection>("active");
  const ordersQuery = useOrdersQuery(selectedSection);

  const visibleOrders = ordersQuery.data ?? [];
  const errorMessage =
    ordersQuery.error instanceof Error
      ? ordersQuery.error.message
      : "Could not load orders. Please try again.";

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-5 pb-4">
        <Text className="mb-3 text-3xl font-bold text-foreground">
          My orders
        </Text>
        <Text className="text-muted-foreground">
          Track and view your order history
        </Text>

        <View className="mt-5 flex-row rounded-full bg-muted p-1">
          {ORDER_SECTIONS.map((section) => {
            const isSelected = selectedSection === section.key;

            return (
              <Pressable
                key={section.key}
                onPress={() => setSelectedSection(section.key)}
                className={`flex-1 rounded-full px-2 py-2.5 ${
                  isSelected ? "bg-background" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {section.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="px-5 bg-gray-100 py-4"
        showsVerticalScrollIndicator={false}
      >
        {ordersQuery.isLoading ? (
          <View className="items-center justify-center py-12 gap-3">
            <ActivityIndicator size="large" />
            <Text className="text-muted-foreground">Loading orders...</Text>
          </View>
        ) : null}

        {ordersQuery.isError ? (
          <View className="rounded-2xl border border-dashed border-border bg-card px-6 py-10">
            <Text className="text-center text-sm text-destructive">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {visibleOrders.length > 0 ? (
          <FlatList
            contentContainerClassName="gap-1.5"
            scrollEnabled={false}
            data={visibleOrders}
            renderItem={({ item }) => {
              const statusMeta = getOrderStatusMeta(item.status);

              return (
                <MediumCard
                  key={item.id}
                  title={item.productName}
                  status={statusMeta.label}
                  footerLeft={formatOrderTimestamp(item.createdAt)}
                  footerRight={formatOrderTotal(
                    item.amount.total,
                    item.amount.currency,
                  )}
                  productId={item.productId}
                  href={`/orders/${item.id}`}
                  showChevron={false}
                />
              );
            }}
          />
        ) : !ordersQuery.isLoading && !ordersQuery.isError ? (
          <View className="rounded-2xl border border-dashed border-border bg-card px-6 py-10">
            <Text className="text-center text-base font-semibold text-card-foreground">
              No {selectedSection} orders
            </Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              New orders in this category will show up here.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersTab;
