import { Icon } from "@/components/ui/icon";
import { logger } from "@/utils/logger";
import { CreditCard, MapPin } from "lucide-react-native";
import { Controller, type FieldPath, useForm } from "react-hook-form";
import {
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

const SUBTOTAL = 79.99;
const DELIVERY_FEE = 2.99;
const TOTAL = SUBTOTAL + DELIVERY_FEE;

type AddressFieldProps = {
  name: FieldPath<CheckoutAddressFormValues>;
  label: string;
  control: ReturnType<typeof useForm<CheckoutAddressFormValues>>["control"];
  errorMessage?: string;
  keyboardType?: "default" | "number-pad";
};

function AddressField({
  name,
  label,
  control,
  errorMessage,
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
            placeholderTextColor="rgb(148 163 184)"
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
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CheckoutAddressFormValues>({
    defaultValues: {
      streetAddress: "123 Main Street",
      city: "San Francisco",
      zipCode: "94102",
    },
  });

  const onSubmit = (values: CheckoutAddressFormValues) => {
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

    logger.log("Checkout payload", parsedAddress.data);
  };

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
              source={require("../../../assets/images/react-logo.png")}
              resizeMode="contain"
            />

            <View className="ml-4 flex-1">
              <Text className="text-xl font-semibold text-card-foreground">
                Wireless Headphones
              </Text>
              <Text className="mt-1 text-base text-muted-foreground">
                Qty: 1
              </Text>
              <Text className="mt-2 text-lg font-medium text-primary">
                $79.99
              </Text>
            </View>
          </View>
        </View>

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
            />

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <AddressField
                  control={control}
                  name="city"
                  label="City"
                  errorMessage={errors.city?.message}
                />
              </View>

              <View className="flex-1">
                <AddressField
                  control={control}
                  name="zipCode"
                  label="ZIP Code"
                  keyboardType="number-pad"
                  errorMessage={errors.zipCode?.message}
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
                    •••• 4242
                  </Text>
                  <Text className="text-base text-muted-foreground">
                    Expires 12/26
                  </Text>
                </View>
              </View>

              <Text className="text-medium font-medium text-foreground">
                Change
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-7 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-lg text-muted-foreground">Subtotal</Text>
            <Text className="text-lg font-semibold text-foreground">
              ${SUBTOTAL.toFixed(2)}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center justify-between py-1">
            <Text className="text-lg text-muted-foreground">Delivery Fee</Text>
            <Text className="text-lg font-semibold text-foreground">
              ${DELIVERY_FEE.toFixed(2)}
            </Text>
          </View>

          <View className="mt-3 border-t border-border pt-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Total</Text>
              <Text className="text-xl font-bold text-primary">
                ${TOTAL.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 pt-3">
        <SafeAreaView edges={["bottom"]}>
          <Pressable
            className="items-center rounded-xl bg-slate-950 py-4"
            onPress={handleSubmit(onSubmit)}
          >
            <Text className="text-xl font-semibold text-white">
              Pay ${TOTAL.toFixed(2)}
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default CheckoutPage;
