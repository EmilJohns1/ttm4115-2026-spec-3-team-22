import { Icon } from "@/components/ui/icon";
import { Link } from "expo-router";
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  Shield,
  ShieldCheck,
  Zap,
} from "lucide-react-native";
import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRODUCT_MOCK = {
  name: "AeroPods Pro",
  price: "$79.99",
  description:
    "Premium wireless earbuds with active noise cancellation, crystal-clear call quality, and up to 30 hours of battery with the charging case. Designed for all-day comfort and built for fast, reliable daily use.",
  image: require("../../../assets/images/react-logo.png"),
};

const KEY_FEATURES = [
  {
    id: "anc",
    title: "Active Noise Cancellation",
    subtitle: "Block distractions and focus on your audio",
    icon: Shield,
  },
  {
    id: "battery",
    title: "30-Hour Battery Life",
    subtitle: "Long-lasting playback with quick-charge support",
    icon: Zap,
  },
  {
    id: "delivery",
    title: "Ready For Drone Delivery",
    subtitle: "Packed safely and dispatched within minutes",
    icon: PackageCheck,
  },
];

/**
 * Product details screen with persistent checkout footer.
 */
const ProductDetailsPage = () => {
  return (
    <View className="flex-1 bg-background pt-4">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-40"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-2 overflow-hidden rounded-3xl border border-border bg-card">
          <View className="h-72 items-center justify-center bg-muted/50">
            <Image
              className="h-48 w-48"
              resizeMode="contain"
              source={PRODUCT_MOCK.image}
            />
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-3xl font-bold text-foreground">
            {PRODUCT_MOCK.name}
          </Text>
          <Text className="mt-2 text-2xl font-semibold text-primary">
            {PRODUCT_MOCK.price}
          </Text>
          <Text className="mt-4 text-base leading-6 text-muted-foreground">
            {PRODUCT_MOCK.description}
          </Text>
        </View>

        <View className="mt-8 mb-4">
          <Text className="mb-3 text-xl font-semibold text-foreground">
            Key Features
          </Text>

          <FlatList
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            numColumns={2}
            contentContainerClassName="gap-2"
            columnWrapperClassName="gap-6"
            data={KEY_FEATURES}
            renderItem={({ item }) => (
              <View className="flex-row items-center gap-2">
                <View className="h-3 w-3 rounded-full bg-primary"></View>

                <Text>{item.title}</Text>
              </View>
            )}
          />
        </View>

        <View className="mt-2">
          <View className="mb-3 flex-row items-center rounded-3xl border border-blue-300 bg-blue-50 px-4 py-5">
            <View className="mr-4 rounded-full bg-primary p-3.5">
              <Icon as={Clock3} className="text-primary-foreground" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-semibold text-foreground">
                Drone Delivery
              </Text>
              <Text className="mt-1 text-lg text-muted-foreground">
                Delivered in 15-30 minutes
              </Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-3xl border border-green-300 bg-green-50 px-4 py-5">
            <View className="mr-4 rounded-full bg-green-600 p-3.5">
              <Icon
                as={ShieldCheck}
                className="text-primary-foreground"
                size={20}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-semibold text-foreground">
                Secure Payment
              </Text>
              <Text className="mt-1 text-lg text-muted-foreground">
                Powered by Stripe
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-5 pt-3"
      >
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Icon as={CheckCircle2} className="text-chart-2" size={16} />
            <Text className="ml-1 text-sm text-muted-foreground">In stock</Text>
          </View>
        </View>

        <Link href={`/products/${PRODUCT_MOCK.name}/checkout`} asChild>
          <Pressable className="mb-1 items-center rounded-2xl bg-primary py-4">
            <Text className="text-lg font-semibold text-primary-foreground">
              {`Order now ${PRODUCT_MOCK.price}`}
            </Text>
          </Pressable>
        </Link>
      </SafeAreaView>
    </View>
  );
};

export default ProductDetailsPage;
