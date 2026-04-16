import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

/**
 * Root navigation container with tab flow and order details stack screen.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="products/[productId]"
          options={{
            headerShown: true,
            title: "Product Details",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="products/[productId]/checkout"
          options={{
            headerShown: true,
            title: "Checkout",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="orders/[orderId]"
          options={{
            headerShown: true,
            title: "Order Tracking",
            presentation: "card",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
