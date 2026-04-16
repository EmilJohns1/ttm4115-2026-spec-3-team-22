import StatusTracker, {
  type TrackerStep,
} from "@/components/ui/status-tracker";
import { createOrderMapHtml } from "@/constants/order-map-html";
import { Stack, useLocalSearchParams } from "expo-router";
import { CheckCheck, CircleOff, Package, Plane } from "lucide-react-native";
import { Text, View } from "react-native";
import { WebView } from "react-native-webview";

const TRACKER_STEPS: ReadonlyArray<TrackerStep> = [
  {
    id: "confirmed",
    label: "Order Confirmed",
    state: "completed",
    icon: CheckCheck,
  },
  {
    id: "dispatched",
    label: "Drone Dispatched",
    state: "completed",
    icon: Package,
  },
  {
    id: "transit",
    label: "On Its Way",
    state: "in-progress",
    icon: Plane,
  },
  {
    id: "delivered",
    label: "Delivered",
    state: "incomplete",
    icon: CircleOff,
  },
];

const PACKAGE_LOCATION = {
  latitude: 63.4306,
  longitude: 10.3951,
};

const DELIVERY_LOCATION = {
  latitude: 63.435,
  longitude: 10.4003,
};

const OSM_WEBVIEW_HTML = createOrderMapHtml(
  PACKAGE_LOCATION,
  DELIVERY_LOCATION,
);

/**
 * Order details screen shown as a root stack page.
 */
const OrderDetailsPage = () => {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const orderSubtitle = orderId ? `#${orderId}` : "#unknown";

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

      <View className="bg-primary py-8 px-5">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="h-3 w-3 bg-primary-foreground rounded-full"></View>
          <Text
            className="font-bold text-primary-foreground
           text-2xl"
          >
            On its way
          </Text>
        </View>
        <Text className="text-primary-foreground font-medium text-lg">
          Wireless Headphones
        </Text>
        <Text className="text-primary-foreground font-medium text-lg">
          Departed: 30 min ago
        </Text>
      </View>

      <View className="px-5 pt-5">
        <Text className="mb-3 text-lg font-semibold text-foreground">
          Live Map
        </Text>
        <View className="h-96 overflow-hidden rounded-2xl border border-border bg-card">
          <WebView
            originWhitelist={["*"]}
            source={{ html: OSM_WEBVIEW_HTML }}
            javaScriptEnabled
            domStorageEnabled
            style={{ flex: 1, backgroundColor: "transparent" }}
          />
        </View>
      </View>

      <View className="px-5 py-5">
        <StatusTracker steps={TRACKER_STEPS} />
      </View>
    </View>
  );
};

export default OrderDetailsPage;
