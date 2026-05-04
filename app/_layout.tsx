import { AuthProvider, useAuth } from "@/context/auth-context";
import { PaymentProvider, usePaymentConfig } from "@/context/payment-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
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
  const [coldStartHandled, setColdStartHandled] = useState(false);
  const notificationTapListener =
    useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

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

  // Navigate to the order screen when user taps a notification while the app is running.
  useEffect(() => {
    notificationTapListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const orderId = response.notification.request.content.data?.orderId as
          | string
          | undefined;
        if (orderId) router.push(`/orders/${orderId}`);
      });
    return () => notificationTapListener.current?.remove();
  }, [router]);

  // Navigate to the order screen when user taps a notification that cold-started the app.
  useEffect(() => {
    if (!isHydrated || !user || coldStartHandled) return;
    setColdStartHandled(true);
    const response = Notifications.getLastNotificationResponse();
    const orderId = response?.notification.request.content.data?.orderId as
      | string
      | undefined;
    if (orderId) router.push(`/orders/${orderId}`);
  }, [isHydrated, user, coldStartHandled, router]);

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
