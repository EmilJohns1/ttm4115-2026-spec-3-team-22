import { useAuth } from "@/context/auth-context";
import {
  type RegisterFormValues,
  registerFormSchema,
  useRegisterMutation,
} from "@/services/auth-service";
import { logger } from "@/utils/logger";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Registration screen for new users.
 */
const Register = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, setError } = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useRegisterMutation();

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null);

    const parsed = registerFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0];

        if (
          fieldName === "name" ||
          fieldName === "email" ||
          fieldName === "password" ||
          fieldName === "confirmPassword"
        ) {
          setError(fieldName, { message: issue.message, type: "validate" });
        }
      }
      return;
    }

    try {
      const session = await registerMutation.mutateAsync(parsed.data);
      await signIn(session);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";

      logger.error("Registration failed", error);
      setSubmitError(message);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background px-5 pt-6">
      <View className="mt-10 gap-2">
        <Text className="text-4xl font-extrabold text-foreground">
          Create account
        </Text>
        <Text className="text-base text-muted-foreground">
          Sign up to place orders and track live deliveries.
        </Text>
      </View>

      <ScrollView className="mt-8" contentContainerClassName="gap-5 pb-10">
        <Controller
          control={control}
          name="name"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Name
              </Text>
              <TextInput
                placeholder="Your full name"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                className="rounded-xl border border-input bg-card px-4 py-3 text-foreground"
              />
              {fieldState.error?.message ? (
                <Text className="text-sm text-destructive">
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Email
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                className="rounded-xl border border-input bg-card px-4 py-3 text-foreground"
              />
              {fieldState.error?.message ? (
                <Text className="text-sm text-destructive">
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Password
              </Text>
              <TextInput
                secureTextEntry
                placeholder="Create a password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                className="rounded-xl border border-input bg-card px-4 py-3 text-foreground"
              />
              {fieldState.error?.message ? (
                <Text className="text-sm text-destructive">
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onBlur, onChange, value }, fieldState }) => (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Confirm password
              </Text>
              <TextInput
                secureTextEntry
                placeholder="Re-enter your password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                className="rounded-xl border border-input bg-card px-4 py-3 text-foreground"
              />
              {fieldState.error?.message ? (
                <Text className="text-sm text-destructive">
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        {submitError ? (
          <Text className="text-sm text-destructive">{submitError}</Text>
        ) : null}

        <Pressable
          onPress={handleSubmit((data) => {
            void onSubmit(data);
          })}
          disabled={registerMutation.isPending}
          className="rounded-xl bg-primary px-4 py-3 active:opacity-90 disabled:opacity-50"
        >
          <Text className="text-center text-base font-bold text-primary-foreground">
            {registerMutation.isPending
              ? "Creating account..."
              : "Create account"}
          </Text>
        </Pressable>
      </ScrollView>

      <View className="mb-8 mt-auto flex-row items-center justify-center gap-1">
        <Text className="text-muted-foreground">Already have an account?</Text>
        <Link href="/auth/login" className="font-semibold text-primary">
          Log in
        </Link>
      </View>
    </SafeAreaView>
  );
};

export default Register;
