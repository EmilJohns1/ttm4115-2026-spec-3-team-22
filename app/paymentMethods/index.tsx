import { usePaymentConfig } from "@/context/payment-context";
import {
  useCreateSetupIntentMutation,
  usePaymentMethodsQuery,
  type SavedCard,
} from "@/services/payments-service";
import { useStripe } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";
import { CheckCircle, CreditCard, Plus } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/icon";

function CardRow({ card }: { card: SavedCard }) {
  const expiry = `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`;
  const brand = card.brand.charAt(0).toUpperCase() + card.brand.slice(1);

  return (
    <View className="flex-row items-center gap-3 px-5 py-4 border-b border-border last:border-b-0">
      <View className="bg-purple-50 rounded-full p-2">
        <Icon as={CreditCard} size={20} className="text-purple-600" />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-foreground">
          {brand} •••• {card.last4}
        </Text>
        <Text className="text-sm text-muted-foreground">Expires {expiry}</Text>
      </View>
      {card.isDefault && (
        <View className="flex-row items-center gap-1">
          <Icon as={CheckCircle} size={16} className="text-green-600" />
          <Text className="text-xs font-medium text-green-600">Default</Text>
        </View>
      )}
    </View>
  );
}

const PaymentMethodsPage = () => {
  const { setPublishableKey } = usePaymentConfig();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const methodsQuery = usePaymentMethodsQuery();
  const createSetupIntentMutation = useCreateSetupIntentMutation();
  const [addCardError, setAddCardError] = useState<string | null>(null);

  const handleAddCard = async () => {
    setAddCardError(null);
    try {
      const setupIntent = await createSetupIntentMutation.mutateAsync();

      if (setupIntent.publishableKey) {
        setPublishableKey(setupIntent.publishableKey);
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "DroneDelivery",
        setupIntentClientSecret: setupIntent.clientSecret,
        customerId: setupIntent.customerId,
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        throw new Error(initError.message || "Could not open card form.");
      }

      const { error: presentError, didCancel } = await presentPaymentSheet();

      if (didCancel) return;

      if (presentError) {
        throw new Error(presentError.message || "Could not save card.");
      }

      await methodsQuery.refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setAddCardError(message);
    }
  };

  const cards = methodsQuery.data?.methods ?? [];

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Payment Methods" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-10"
      >
        {addCardError && (
          <View className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm font-medium text-destructive">
              {addCardError}
            </Text>
          </View>
        )}

        <Text className="mb-3 text-sm uppercase tracking-wide font-medium text-muted-foreground">
          Saved cards
        </Text>

        <View className="rounded-2xl border border-border bg-card overflow-hidden">
          {methodsQuery.isLoading ? (
            <View className="items-center py-10">
              <ActivityIndicator />
            </View>
          ) : methodsQuery.isError ? (
            <View className="px-5 py-6">
              <Text className="text-destructive text-sm">
                Could not load payment methods.
              </Text>
            </View>
          ) : cards.length === 0 ? (
            <View className="px-5 py-6">
              <Text className="text-muted-foreground text-sm">
                No saved cards yet.
              </Text>
            </View>
          ) : (
            cards.map((card) => <CardRow key={card.id} card={card} />)
          )}
        </View>

        <Pressable
          onPress={() => {
            void handleAddCard();
          }}
          disabled={createSetupIntentMutation.isPending}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4"
        >
          {createSetupIntentMutation.isPending ? (
            <ActivityIndicator size="small" />
          ) : (
            <>
              <Icon as={Plus} size={18} className="text-foreground" />
              <Text className="font-medium text-foreground">Add new card</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentMethodsPage;
