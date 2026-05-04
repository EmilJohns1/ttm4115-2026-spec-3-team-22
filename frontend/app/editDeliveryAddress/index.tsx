import {
  useUpdateUserMutation,
  useUserDetailsQuery,
} from "@/services/user-service";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { z } from "zod";

const editDeliveryAddressSchema = z.object({
  street_address: z.string().trim().min(1, "Street address is required"),
  city: z.string().trim().min(1, "City is required"),
  zip_code: z.string().trim().min(1, "ZIP code is required"),
});

type EditDeliveryAddressFormValues = z.infer<typeof editDeliveryAddressSchema>;

const EditDeliveryAddressPage = () => {
  const router = useRouter();
  const userQuery = useUserDetailsQuery();
  const updateUserMutation = useUpdateUserMutation();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditDeliveryAddressFormValues>({
    defaultValues: { street_address: "", city: "", zip_code: "" },
  });

  useEffect(() => {
    if (!userQuery.data) return;
    reset({
      street_address: userQuery.data.street_address ?? "",
      city: userQuery.data.city ?? "",
      zip_code: userQuery.data.zip_code ?? "",
    });
  }, [reset, userQuery.data]);

  const onSubmit = async (values: EditDeliveryAddressFormValues) => {
    const parsed = editDeliveryAddressSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "street_address" || field === "city" || field === "zip_code") {
          setError(field, { type: "zod", message: issue.message });
        }
      });
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        street_address: parsed.data.street_address,
        city: parsed.data.city,
        zip_code: parsed.data.zip_code,
      });
      router.back();
    } catch {
      setError("root", {
        type: "server",
        message: "Failed to save changes. Please try again.",
      });
    }
  };

  if (userQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 pb-safe">
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        className="flex-1 px-5"
        contentContainerClassName="pt-4"
      >
        {errors.root ? (
          <View className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm font-medium text-destructive">
              {errors.root.message}
            </Text>
          </View>
        ) : null}

        <View className="my-1 mt-5">
          <Text className="mb-3 uppercase tracking-wide font-medium text-muted-foreground text-sm">
            Delivery address
          </Text>
          <View className="border border-border rounded-2xl bg-card">
            <View className="border-b border-input px-5 py-3">
              <Text className="text-sm text-muted-foreground">Street address</Text>
              <Controller
                control={control}
                name="street_address"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    placeholder="Sunnlandsvegen 35"
                    className="px-0 mx-0 font-medium text-foreground mt-0.5"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="words"
                  />
                )}
              />
              {errors.street_address ? (
                <Text className="text-xs text-destructive mt-1">
                  {errors.street_address.message}
                </Text>
              ) : null}
            </View>
            <View className="flex-row">
              <View className="px-5 py-3 flex-1 border-r border-input">
                <Text className="text-sm text-muted-foreground">City</Text>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <TextInput
                      placeholder="Trondheim"
                      className="px-0 mx-0 font-medium text-foreground mt-0.5"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="words"
                    />
                  )}
                />
                {errors.city ? (
                  <Text className="text-xs text-destructive mt-1">
                    {errors.city.message}
                  </Text>
                ) : null}
              </View>
              <View className="px-5 py-3 w-36">
                <Text className="text-sm text-muted-foreground">ZIP code</Text>
                <Controller
                  control={control}
                  name="zip_code"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <TextInput
                      placeholder="7032"
                      className="px-0 mx-0 font-medium text-foreground mt-0.5"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="number-pad"
                    />
                  )}
                />
                {errors.zip_code ? (
                  <Text className="text-xs text-destructive mt-1">
                    {errors.zip_code.message}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View className="gap-3 px-5 pb-4">
        <Pressable
          disabled={updateUserMutation.isPending}
          className="bg-primary py-5 rounded-2xl"
          onPress={handleSubmit((values) => {
            void onSubmit(values);
          })}
        >
          <Text className="text-center text-primary-foreground font-semibold">
            {updateUserMutation.isPending ? "Saving..." : "Save changes"}
          </Text>
        </Pressable>
        <Pressable
          className="py-5 rounded-2xl border border-border bg-background"
          onPress={() => router.back()}
        >
          <Text className="text-center font-medium">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default EditDeliveryAddressPage;
