import MediumCard from "@/components/ui/medium-card";
import QuickAction from "@/components/ui/quick-action";
import SmallCard from "@/components/ui/small-card";
import { getOrderStatusMeta } from "@/constants/order-status";
import { useAuth } from "@/context/auth-context";
import { useOrdersQuery } from "@/services/orders-service";
import { Package, Search } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeTab = () => {
  const { user } = useAuth();
  if (!user) return;
  const activeOrdersQuery = useOrdersQuery("active");
  const activeOrders = activeOrdersQuery.data?.slice(0, 2) ?? [];

  const recentOrdersQuery = useOrdersQuery("completed");
  const recentOrders = recentOrdersQuery.data?.slice(0, 4) ?? [];

  const errorMessage =
    activeOrdersQuery.error instanceof Error
      ? activeOrdersQuery.error.message
      : "Could not load orders. Please try again.";

  return (
    <SafeAreaView edges={[]} className="flex-1">
      {/* Banner */}
      <View className="bg-primary rounded-b-2xl px-5 justify-center pt-safe-offset-6">
        <Text className="text-primary-foreground font-bold text-4xl mb-3">
          Hello, {user?.name.split(" ")[0]}
        </Text>
        <Text className="text-primary-foreground text-lg mb-8">
          Track your deliveries in real-time
        </Text>
      </View>

      {/* Content wrapper */}
      <ScrollView className="px-5 py-5" contentContainerClassName="gap-2">
        {/* Active Deliveries */}
        <View className="">
          <Text className="text-xl font-semibold mb-2">Active Deliveries</Text>

          {activeOrdersQuery.isLoading ? (
            <View className="items-center justify-center py-12 gap-3">
              <ActivityIndicator size="large" />
              <Text className="text-muted-foreground">Loading orders...</Text>
            </View>
          ) : null}

          {activeOrdersQuery.isError ? (
            <View className="rounded-2xl border border-dashed border-border bg-card px-6 py-10">
              <Text className="text-center text-sm text-destructive">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {activeOrders.length > 0 ? (
            <FlatList
              contentContainerClassName="gap-1.5"
              scrollEnabled={false}
              data={activeOrders}
              renderItem={({ item }) => {
                const statusMeta = getOrderStatusMeta(item.status);
                return (
                  <MediumCard
                    key={item.id}
                    productId={item.productId}
                    title={item.productName}
                    status={statusMeta.label}
                    href={`/orders/${item.id}`}
                    showChevron={false}
                  />
                );
              }}
            />
          ) : !activeOrdersQuery.isLoading && !activeOrdersQuery.isError ? (
            <View className="rounded-2xl border border-dashed border-border bg-card px-6 py-10">
              <Text className="text-center text-base font-semibold text-card-foreground">
                No Active orders
              </Text>
              <Text className="mt-2 text-center text-sm text-muted-foreground">
                New orders in this category will show up here.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Quick Actions */}
        <View className="mt-2">
          <Text className="text-xl font-semibold mb-2">Quick Actions</Text>
          <View className="flex-row gap-2">
            <QuickAction
              title="Browse Products"
              icon={Search}
              href="/browse"
              className="bg-blue-500"
            />
            <QuickAction
              title="Order History"
              icon={Package}
              href="/orders"
              className="bg-purple-500"
            />
          </View>
        </View>

        {/* Recent Deliveries */}
        <View className="mt-2">
          <Text className="text-xl font-semibold mb-2">Recent Deliveries</Text>
          {recentOrders.length > 0 ? (
            <FlatList
              scrollEnabled={false}
              data={recentOrders}
              renderItem={({ item }) => (
                <SmallCard
                  key={item.id}
                  title={item.productName}
                  subtitle={item.updatedAt}
                  icon={Package}
                  iconAccent="green"
                  pressable
                  href={`/orders/${item.id}`}
                />
              )}
            />
          ) : !recentOrdersQuery.isLoading && !recentOrdersQuery.isError ? (
            <View className="rounded-2xl border border-dashed border-border bg-card px-6 py-10">
              <Text className="text-center text-base font-semibold text-card-foreground">
                No Recent orders
              </Text>
              <Text className="mt-2 text-center text-sm text-muted-foreground">
                Recently completed orders in this category will show up here.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeTab;
