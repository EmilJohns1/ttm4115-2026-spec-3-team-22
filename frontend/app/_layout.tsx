import { AuthProvider, useAuth } from "@/context/auth-context";
import { PaymentProvider, usePaymentConfig } from "@/context/payment-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { type PropsWithChildren, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

const queryClient = new QueryClient();
const DEFAULT_STRIPE_PUBLISHABLE_KEY =
  "pk_test_51TNLNGGRh8hMW0uxob6o8eSRhSEpB3SqAKvfbv9w7TDPY7O7NSDUPGDmdMrdTE852j5bC4McWN48pVdTMvpfS7Xm00Bg1724dK";

/**
 * Stripe provider wrapper that uses the latest publishable key.
 */
function StripeProviderShell({ children }: PropsWithChildren) {
  const { publishableKey } = usePaymentConfig();

  return (
    <StripeProvider
      publishableKey={publishableKey ?? DEFAULT_STRIPE_PUBLISHABLE_KEY}
    >
      {children}
    </StripeProvider>
  );
}

/**
 * Root app layout with providers and navigation.
 */
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaymentProvider>
        <StripeProviderShell>
          <SafeAreaProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </SafeAreaProvider>
        </StripeProviderShell>
      </PaymentProvider>
    </QueryClientProvider>
  );
}

/**
 * Navigation stack with route guards for authenticated and unauthenticated users.
 */
function RootNavigator() {
  const { user, isHydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === "auth";

    if (!user && !inAuthGroup) {
      router.replace("/auth/login");
      return;
    }

    if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isHydrated, router, segments, user]);

  if (!isHydrated) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="products/[productId]/index"
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
      <Stack.Screen
        name="editProfile/index"
        options={{
          headerShown: true,
          title: "Edit Profile",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="editPersonalInfo/index"
        options={{
          headerShown: true,
          title: "Personal Information",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="editDeliveryAddress/index"
        options={{
          headerShown: true,
          title: "Delivery Address",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
