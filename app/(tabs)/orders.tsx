import MediumCard from "@/components/ui/medium-card";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OrderSection = "active" | "completed" | "cancelled";

type Order = {
  id: string;
  title: string;
  destination: string;
  placedAt: string;
  total: string;
};

const ORDER_SECTIONS: ReadonlyArray<{ key: OrderSection; label: string }> = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const MOCK_ORDERS: Record<OrderSection, ReadonlyArray<Order>> = {
  active: [
    {
      id: "ORD-1842",
      title: "Starter Grocery Pack",
      destination: "Magnus Lagabotes gate 8",
      placedAt: "Placed 8 min ago",
      total: "$29.90",
    },
    {
      id: "ORD-1843",
      title: "Protein Snack Bundle",
      destination: "Kongens gate 31",
      placedAt: "Placed 16 min ago",
      total: "$19.50",
    },
  ],
  completed: [
    {
      id: "ORD-1829",
      title: "Coffee Essentials Kit",
      destination: "Olav Tryggvasons gate 12",
      placedAt: "Delivered 2h ago",
      total: "$42.00",
    },
    {
      id: "ORD-1827",
      title: "Fresh Fruit Box",
      destination: "Munkegata 19",
      placedAt: "Delivered yesterday",
      total: "$24.40",
    },
  ],
  cancelled: [
    {
      id: "ORD-1805",
      title: "Late Night Refill",
      destination: "Nordre gate 5",
      placedAt: "Cancelled yesterday",
      total: "$15.80",
    },
  ],
};

const STATUS_STYLES: Record<
  OrderSection,
  { label: string; dotClassName: string; textClassName: string }
> = {
  active: {
    label: "In flight",
    dotClassName: "bg-chart-1",
    textClassName: "text-chart-1",
  },
  completed: {
    label: "Delivered",
    dotClassName: "bg-green-600",
    textClassName: "text-green-600",
  },
  cancelled: {
    label: "Cancelled",
    dotClassName: "bg-destructive",
    textClassName: "text-destructive",
  },
};

/**
 * Orders tab screen with pager-style section navigation.
 */
const OrdersTab = () => {
  const [selectedSection, setSelectedSection] =
    React.useState<OrderSection>("active");
  const visibleOrders = MOCK_ORDERS[selectedSection];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background px-5">
      <Text className="mb-3 text-3xl font-bold text-foreground">My orders</Text>
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

      <ScrollView
        className="mt-5"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        {visibleOrders.length > 0 ? (
          visibleOrders.map((order) => (
            <MediumCard
              key={order.id}
              title={order.title}
              status={STATUS_STYLES[selectedSection].label}
              subtitle={`${order.id} • ${order.destination}`}
              footerLeft={order.placedAt}
              footerRight={order.total}
              statusDotClassName={STATUS_STYLES[selectedSection].dotClassName}
              statusTextClassName={STATUS_STYLES[selectedSection].textClassName}
              href={`/orders/${order.id}`}
              showChevron={false}
              className="mb-3"
            />
          ))
        ) : (
          <View className="rounded-2xl border border-dashed border-border bg-card px-6 py-10">
            <Text className="text-center text-base font-semibold text-card-foreground">
              No {selectedSection} orders
            </Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              New orders in this category will show up here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersTab;
