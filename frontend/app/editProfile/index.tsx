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

const editProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email"),
  street_address: z.string().trim(),
  city: z.string().trim(),
  zip_code: z.string().trim(),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

const EditProfilePage = () => {
  const router = useRouter();
  const userQuery = useUserDetailsQuery();
  const updateUserMutation = useUpdateUserMutation();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    defaultValues: {
      name: "",
      email: "",
      street_address: "",
      city: "",
      zip_code: "",
    },
  });

  useEffect(() => {
    if (!userQuery.data) return;
    reset({
      name: userQuery.data.name ?? "",
      email: userQuery.data.email ?? "",
      street_address: userQuery.data.street_address ?? "",
      city: userQuery.data.city ?? "",
      zip_code: userQuery.data.zip_code ?? "",
    });
  }, [reset, userQuery.data]);

  const onSubmit = async (values: EditProfileFormValues) => {
    const parsed = editProfileSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (
          field === "name" ||
          field === "email" ||
          field === "street_address" ||
          field === "city" ||
          field === "zip_code"
        ) {
          setError(field, { type: "zod", message: issue.message });
        }
      });
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        name: parsed.data.name,
        email: parsed.data.email,
        street_address: parsed.data.street_address || null,
        city: parsed.data.city || null,
        zip_code: parsed.data.zip_code || null,
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
          <Text className="mb-3 uppercase tracking-wide font-medium">
            Personal information
          </Text>
          <View className="border border-border rounded-2xl bg-background">
            <View className="border-b border-input px-5 py-3">
              <Text>Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    placeholder="Full name"
                    className="px-0 mx-0 font-medium"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                )}
              />
              {errors.name ? (
                <Text className="text-xs text-destructive mt-1">
                  {errors.name.message}
                </Text>
              ) : null}
            </View>
            <View className="px-5 py-3">
              <Text>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    placeholder="email@example.com"
                    className="px-0 mx-0 font-medium"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
              />
              {errors.email ? (
                <Text className="text-xs text-destructive mt-1">
                  {errors.email.message}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View className="py-3">
          <Text className="mb-3 uppercase tracking-wide font-medium">
            Delivery address
          </Text>
          <View className="border border-border rounded-2xl bg-background">
            <View className="border-b border-input px-5 py-3">
              <Text>Street address</Text>
              <Controller
                control={control}
                name="street_address"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    placeholder="Sunnlandsvegen 35"
                    className="px-0 mx-0 font-medium"
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
              <View className="px-5 border-b border-input py-3 flex-1">
                <Text>City</Text>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <TextInput
                      placeholder="Trondheim"
                      className="px-0 mx-0 font-medium"
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
              <View className="px-5 border-b border-input py-3 pr-10">
                <Text>Postal code</Text>
                <Controller
                  control={control}
                  name="zip_code"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <TextInput
                      placeholder="7032"
                      className="px-0 mx-0 font-medium"
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
          className="bg-blue-500 py-5 rounded-2xl"
          onPress={handleSubmit((values) => {
            void onSubmit(values);
          })}
        >
          <Text className="text-center text-white font-semibold">
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

export default EditProfilePage;
