import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/context/auth-context";
import { usePaymentConfig } from "@/context/payment-context";
import { useCreateOrderMutation } from "@/services/orders-service";
import { useCreatePaymentIntentMutation } from "@/services/payments-service";
import { useProductDetailsQuery } from "@/services/products-service";
import { useUserDetailsQuery } from "@/services/user-service";
import { logger } from "@/utils/logger";
import { useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CreditCard, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, type FieldPath, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const checkoutAddressSchema = z.object({
  streetAddress: z.string().trim().min(1, "Street address is required"),
  city: z.string().trim().min(1, "City is required"),
  zipCode: z.string().trim().min(1, "ZIP code is required"),
});

type CheckoutAddressFormValues = z.infer<typeof checkoutAddressSchema>;

const DELIVERY_FEE = 2.99;

type ActiveCheckoutSession = {
  orderId: string;
  paymentIntentClientSecret?: string;
  paymentIntentId?: string;
  customerId?: string | null;
  ephemeralKeySecret?: string | null;
  publishableKey?: string | null;
  paymentCompleted?: boolean;
};

type AddressFieldProps = {
  name: FieldPath<CheckoutAddressFormValues>;
  label: string;
  control: ReturnType<typeof useForm<CheckoutAddressFormValues>>["control"];
  errorMessage?: string;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
};

function AddressField({
  name,
  label,
  control,
  errorMessage,
  placeholder,
  keyboardType = "default",
}: AddressFieldProps) {
  return (
    <View>
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            className="mt-2 rounded-xl bg-muted px-3 py-3 text-base text-foreground"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType={keyboardType}
            placeholder={placeholder}
          />
        )}
      />
      {errorMessage ? (
        <Text className="mt-1 text-xs text-destructive">{errorMessage}</Text>
      ) : null}
    </View>
  );
}

/**
 * Checkout screen for a single product order.
 */
const CheckoutPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string | string[] }>();
  const productId =
    typeof params.productId === "string" ? params.productId : "";
  const { user } = useAuth();
  const { setPublishableKey } = usePaymentConfig();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [activeCheckout, setActiveCheckout] =
    useState<ActiveCheckoutSession | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CheckoutAddressFormValues>({
    defaultValues: {
      streetAddress: "",
      city: "",
      zipCode: "",
    },
  });

  const productQuery = useProductDetailsQuery(productId);
  const userDetailsQuery = useUserDetailsQuery();
  const createOrderMutation = useCreateOrderMutation();
  const createPaymentIntentMutation = useCreatePaymentIntentMutation();

  useEffect(() => {
    const userData = userDetailsQuery.data;
    if (!userData?.street_address) return;

    reset({
      streetAddress: userData.street_address,
      city: userData.city ?? "",
      zipCode: userData.zip_code ?? "",
    });
  }, [reset, userDetailsQuery.data]);

  const product = productQuery.data;
  const subtotal = product?.price ?? 0;
  const total = subtotal + DELIVERY_FEE;
  const formattedSubtotal = `${subtotal.toFixed(2)} ${product?.currency ?? "NOK"}`;
  const formattedDeliveryFee = `${DELIVERY_FEE.toFixed(2)} ${product?.currency ?? "NOK"}`;
  const formattedTotal = `${total.toFixed(2)} ${product?.currency ?? "NOK"}`;

  const productImageSource = product?.imageUrl?.trim()
    ? { uri: product.imageUrl }
    : require("../../../assets/images/react-logo.png");

  const preparePaymentSheet = async (session: ActiveCheckoutSession) => {
    if (session.paymentCompleted) {
      return session;
    }

    if (!session.paymentIntentClientSecret) {
      const paymentIntent = await createPaymentIntentMutation.mutateAsync({
        orderId: session.orderId,
      });

      if (!paymentIntent.clientSecret) {
        throw new Error("Could not start Stripe checkout.");
      }

      if (paymentIntent.publishableKey) {
        setPublishableKey(paymentIntent.publishableKey);
      }

      session = {
        ...session,
        paymentIntentClientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId,
        customerId: paymentIntent.customerId,
        ephemeralKeySecret: paymentIntent.ephemeralKeySecret ?? null,
        publishableKey: paymentIntent.publishableKey ?? null,
      };

      setActiveCheckout(session);
    }

    if (session.publishableKey) {
      setPublishableKey(session.publishableKey);
    }

    const paymentIntentClientSecret = session.paymentIntentClientSecret;

    if (!paymentIntentClientSecret) {
      throw new Error("Could not prepare payment sheet.");
    }

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: "DroneDelivery",
      paymentIntentClientSecret,
      customerId: session.customerId ?? undefined,
      customerEphemeralKeySecret: session.ephemeralKeySecret ?? undefined,
      allowsDelayedPaymentMethods: false,
    });

    if (initError) {
      throw new Error(initError.message || "Could not prepare payment sheet.");
    }

    const { error: presentError, didCancel } = await presentPaymentSheet();

    if (didCancel) {
      return null;
    }

    if (presentError) {
      throw new Error(
        presentError.message || "Payment failed. Please try again.",
      );
    }

    const completedSession = {
      ...session,
      paymentCompleted: true,
    };

    setActiveCheckout(completedSession);
    return completedSession;
  };

  const onSubmit = async (values: CheckoutAddressFormValues) => {
    setCheckoutError(null);

    const parsedAddress = checkoutAddressSchema.safeParse(values);

    if (!parsedAddress.success) {
      parsedAddress.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (
          field === "streetAddress" ||
          field === "city" ||
          field === "zipCode"
        ) {
          setError(field, {
            type: "zod",
            message: issue.message,
          });
        }
      });

      return;
    }

    if (!user?.id || !product) {
      logger.error("Checkout submission missing user or product", {
        hasUser: Boolean(user?.id),
        hasProduct: Boolean(product),
      });
      setCheckoutError("Could not start checkout. Please try again.");
      return;
    }

    setIsProcessingPayment(true);

    try {
      const session: ActiveCheckoutSession = activeCheckout ?? {
        orderId: "",
      };

      let checkoutSession = session;

      if (!checkoutSession.orderId) {
        const order = await createOrderMutation.mutateAsync({
          productId: product.id,
          deliveryAddress: parsedAddress.data,
        });

        checkoutSession = {
          orderId: order.id,
        };
        setActiveCheckout(checkoutSession);
      }

      const preparedSession = await preparePaymentSheet(checkoutSession);

      if (!preparedSession) {
        return;
      }

      setActiveCheckout(null);
      router.replace(`/orders/${preparedSession.orderId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      logger.error("Checkout payment flow failed", error);
      setCheckoutError(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (productQuery.isLoading || userDetailsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <ActivityIndicator size="large" />
        <Text className="text-muted-foreground">
          Loading checkout details...
        </Text>
      </View>
    );
  }

  if (productQuery.isError || !product) {
    const errorMessage =
      productQuery.error instanceof Error
        ? productQuery.error.message
        : "Could not load checkout details. Please try again.";

    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-destructive">{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-muted/60">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-36"
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center">
            <Image
              className="h-20 w-20 rounded-2xl"
              source={productImageSource}
              resizeMode="contain"
            />

            <View className="ml-4 flex-1">
              <Text className="text-xl font-semibold text-card-foreground">
                {product.name}
              </Text>
              <Text className="mt-1 text-base text-muted-foreground">
                Qty: 1
              </Text>
              <Text className="mt-2 text-lg font-medium text-primary">
                {formattedSubtotal}
              </Text>
            </View>
          </View>
        </View>

        {checkoutError ? (
          <View className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm font-medium text-destructive">
              {checkoutError}
            </Text>
          </View>
        ) : null}

        <View className="mt-7">
          <View className="mb-3 flex-row items-center">
            <Icon
              as={MapPin}
              className="mr-2 text-muted-foreground"
              size={20}
            />
            <Text className="text-2xl font-semibold text-foreground">
              Delivery Address
            </Text>
          </View>

          <View className="rounded-2xl border border-border bg-card p-4">
            <AddressField
              control={control}
              name="streetAddress"
              label="Street Address"
              errorMessage={errors.streetAddress?.message}
              placeholder="Nardobakken 3"
            />

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <AddressField
                  control={control}
                  name="city"
                  label="City"
                  errorMessage={errors.city?.message}
                  placeholder="Trondheim"
                />
              </View>

              <View className="flex-1">
                <AddressField
                  control={control}
                  name="zipCode"
                  label="ZIP Code"
                  keyboardType="number-pad"
                  errorMessage={errors.zipCode?.message}
                  placeholder="7032"
                />
              </View>
            </View>
          </View>
        </View>

        <View className="mt-7">
          <View className="mb-3 flex-row items-center">
            <Icon
              as={CreditCard}
              className="mr-2 text-muted-foreground"
              size={20}
            />
            <Text className="text-2xl font-semibold text-foreground">
              Payment Method
            </Text>
          </View>

          <View className="rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-lg bg-primary">
                  <Icon
                    as={CreditCard}
                    className="text-primary-foreground"
                    size={20}
                  />
                </View>

                <View className="ml-3">
                  <Text className="text-xl font-semibold text-card-foreground">
                    Stripe checkout
                  </Text>
                  <Text className="text-base text-muted-foreground">
                    Secure card payment in the payment sheet
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-7 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-lg text-muted-foreground">Subtotal</Text>
            <Text className="text-lg font-semibold text-foreground">
              {formattedSubtotal}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center justify-between py-1">
            <Text className="text-lg text-muted-foreground">Delivery Fee</Text>
            <Text className="text-lg font-semibold text-foreground">
              {formattedDeliveryFee}
            </Text>
          </View>

          <View className="mt-3 border-t border-border pt-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Total</Text>
              <Text className="text-xl font-bold text-primary">
                {formattedTotal}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 pt-3">
        <SafeAreaView edges={["bottom"]}>
          <Pressable
            disabled={isProcessingPayment}
            className="items-center rounded-xl bg-primary py-4"
            onPress={handleSubmit((formValues) => {
              void onSubmit(formValues);
            })}
          >
            <Text className="text-xl font-semibold text-white">
              {isProcessingPayment
                ? "Processing payment..."
                : activeCheckout
                  ? "Try again"
                  : `Pay ${formattedTotal}`}
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default CheckoutPage;
