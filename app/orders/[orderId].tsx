import StatusTracker, {
  type TrackerStep,
  type TrackerStepState,
} from "@/components/ui/status-tracker";
import { createOrderMapHtml } from "@/constants/order-map-html";
import {
  getOrderStatusMeta,
  normalizeOrderStatus,
} from "@/constants/order-status";
import {
  useOrderDetailsQuery,
  useOrderTrackingQuery,
} from "@/services/orders-service";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  CheckCheck,
  CreditCard,
  Drone,
  PackageCheck,
} from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const STEP_ORDER = ["pending", "confirmed", "dispatched", "completed"];

const TRACKER_STEP_DEFS: ReadonlyArray<Omit<TrackerStep, "state">> = [
  { id: "pending", label: "Payment Processed", icon: CreditCard },
  { id: "confirmed", label: "Order Confirmed", icon: CheckCheck },
  { id: "dispatched", label: "Drone Dispatched", icon: Drone },
  { id: "completed", label: "Delivered", icon: PackageCheck },
];

function trackerStepState(
  i: number,
  currentIndex: number,
  isCancelled: boolean,
): TrackerStepState {
  if (i < currentIndex || (isCancelled && i === currentIndex))
    return "completed";
  if (i === currentIndex)
    return i === TRACKER_STEP_DEFS.length - 1 ? "completed" : "in-progress";
  return "incomplete";
}

function createTrackerSteps(status: string): ReadonlyArray<TrackerStep> {
  const normalized = normalizeOrderStatus(status);
  const isCancelled = normalized === "cancelled";
  // in_transit maps to dispatched (same visual step); cancelled stops at confirmed
  const currentIndex = STEP_ORDER.indexOf(normalized);
  return TRACKER_STEP_DEFS.map((step, i) => ({
    ...step,
    state: trackerStepState(i, currentIndex, isCancelled),
  }));
}

/**
 * Order details screen shown as a root stack page.
 */
const OrderDetailsPage = () => {
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = typeof params.orderId === "string" ? params.orderId : "";
  const orderSubtitle = orderId ? `#${orderId}` : "#unknown";
  const orderQuery = useOrderDetailsQuery(orderId);
  const shouldPollTracking =
    orderQuery.data?.status !== "completed" &&
    orderQuery.data?.status !== "cancelled";
  const trackingQuery = useOrderTrackingQuery(orderId, shouldPollTracking);

  const trackerSteps = useMemo(() => {
    return createTrackerSteps(trackingQuery.data?.status ?? "confirmed");
  }, [trackingQuery.data?.status]);
  const statusMeta = getOrderStatusMeta(
    trackingQuery.data?.status ?? orderQuery.data?.status ?? "confirmed",
  );
  console.log("Tracking data", trackingQuery.data);

  const droneLocation =
    trackingQuery.data?.drone ?? trackingQuery.data?.destination;
  const destinationLocation = trackingQuery.data?.destination;
  const orderMapHtml =
    droneLocation && destinationLocation
      ? createOrderMapHtml(
          {
            latitude: droneLocation.latitude,
            longitude: droneLocation.longitude,
          },
          {
            latitude: destinationLocation.latitude,
            longitude: destinationLocation.longitude,
          },
        )
      : null;

  if (orderQuery.isLoading || trackingQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <ActivityIndicator size="large" />
        <Text className="text-muted-foreground">
          Loading tracking details...
        </Text>
      </View>
    );
  }

  if (
    orderQuery.isError ||
    trackingQuery.isError ||
    !orderQuery.data ||
    !trackingQuery.data
  ) {
    const errorMessage =
      orderQuery.error instanceof Error
        ? orderQuery.error.message
        : trackingQuery.error instanceof Error
          ? trackingQuery.error.message
          : "Could not load tracking details. Please try again.";

    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-destructive">{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerTitleAlign: "left",
          headerTitle: () => (
            <View className="py-1">
              <Text className="text-2xl font-bold text-foreground">
                Track Order
              </Text>
              <Text className="my-1 text-sm text-muted-foreground">
                {orderSubtitle}
              </Text>
            </View>
          ),
        }}
      />

      <View className="bg-primary py-4 px-5">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="h-3 w-3 bg-primary-foreground rounded-full"></View>
          <Text
            className="font-bold text-primary-foreground
           text-2xl"
          >
            {statusMeta.label}
          </Text>
        </View>
        <Text className="text-primary-foreground font-medium text-lg">
          {orderQuery.data.productName}
        </Text>
        <Text className="text-primary-foreground font-medium text-lg">
          Status: {statusMeta.label}
        </Text>
      </View>

      <View className="px-5 pt-5">
        <Text className="mb-3 text-lg font-semibold text-foreground">
          Live Map
        </Text>
        <View className="h-96 overflow-hidden rounded-2xl border border-border bg-card">
          {orderMapHtml ? (
            <WebView
              originWhitelist={["*"]}
              source={{ html: orderMapHtml }}
              javaScriptEnabled
              domStorageEnabled
              style={{ flex: 1, backgroundColor: "transparent" }}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-muted-foreground">
                Waiting for drone position...
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="px-5 py-5">
        <StatusTracker steps={trackerSteps} />
      </View>
    </View>
  );
};

export default OrderDetailsPage;
