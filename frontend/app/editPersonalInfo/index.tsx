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

const editPersonalInfoSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email"),
});

type EditPersonalInfoFormValues = z.infer<typeof editPersonalInfoSchema>;

const EditPersonalInfoPage = () => {
  const router = useRouter();
  const userQuery = useUserDetailsQuery();
  const updateUserMutation = useUpdateUserMutation();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditPersonalInfoFormValues>({
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (!userQuery.data) return;
    reset({
      name: userQuery.data.name ?? "",
      email: userQuery.data.email ?? "",
    });
  }, [reset, userQuery.data]);

  const onSubmit = async (values: EditPersonalInfoFormValues) => {
    const parsed = editPersonalInfoSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "name" || field === "email") {
          setError(field, { type: "zod", message: issue.message });
        }
      });
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        name: parsed.data.name,
        email: parsed.data.email,
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
            Personal information
          </Text>
          <View className="border border-border rounded-2xl bg-card">
            <View className="border-b border-input px-5 py-3">
              <Text className="text-sm text-muted-foreground">Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    placeholder="Full name"
                    className="px-0 mx-0 font-medium text-foreground mt-0.5"
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
              <Text className="text-sm text-muted-foreground">Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    placeholder="email@example.com"
                    className="px-0 mx-0 font-medium text-foreground mt-0.5"
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

export default EditPersonalInfoPage;
