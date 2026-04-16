import MediumCard from "@/components/ui/medium-card";
import QuickAction from "@/components/ui/quick-action";
import SmallCard from "@/components/ui/small-card";
import { Package, Search } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeTab = () => {
  return (
    <SafeAreaView edges={[]} className="flex-1">
      {/* Banner */}
      <View className="bg-primary rounded-2xl px-5 justify-center pt-safe-offset-6">
        <Text className="text-primary-foreground font-bold text-4xl mb-3">
          Hello, User
        </Text>
        <Text className="text-primary-foreground text-lg mb-8">
          Track your deliveries in real-time
        </Text>
      </View>

      {/* Content wrapper */}
      <ScrollView className="px-5 mt-5 mb-5" contentContainerClassName="gap-6">
        {/* Active Deliveries */}
        <View>
          <Text className="text-xl font-semibold mb-2">Active Deliveries</Text>
          <View className="gap-1">
            <MediumCard
              title="Wireless Headphones"
              status="On its way"
              footerLeft="Placed 30 min ago"
            />
            <MediumCard title="Smart Watch" status="Drone dispatched" />
          </View>
        </View>

        {/* Quick Actions */}
        <View>
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
        <View className="gap-1">
          <Text className="text-xl font-semibold mb-2">Recent Deliveries</Text>
          <SmallCard
            title="Bluetooth Speaker"
            subtitle="Today, 2:30 PM"
            icon={Package}
            iconAccent="green"
            pressable={true}
            href={"/profile"}
          />
          <SmallCard
            title="Bluetooth Speaker"
            subtitle="Today, 2:30 PM"
            icon={Package}
            iconAccent="green"
            pressable={true}
            href={"/profile"}
          />
          <SmallCard
            title="Bluetooth Speaker"
            subtitle="Today, 2:30 PM"
            icon={Package}
            iconAccent="green"
            pressable={true}
            href={"/profile"}
          />
          <SmallCard
            title="Bluetooth Speaker"
            subtitle="Today, 2:30 PM"
            icon={Package}
            iconAccent="green"
            pressable={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeTab;
