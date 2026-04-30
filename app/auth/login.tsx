import { useAuth } from "@/context/auth-context";
import {
  type LoginFormValues,
  loginFormSchema,
  useLoginMutation,
} from "@/services/auth-service";
import { logger } from "@/utils/logger";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Login screen for email/password authentication.
 */
const Login = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, setError } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useLoginMutation();

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);

    const parsed = loginFormSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0];

        if (fieldName === "email" || fieldName === "password") {
          setError(fieldName, { message: issue.message, type: "validate" });
        }
      }
      return;
    }

    try {
      const session = await loginMutation.mutateAsync(parsed.data);
      await signIn(session);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";

      logger.error("Login failed", error);
      setSubmitError(message);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background px-5 pt-6">
      <View className="mt-10 gap-2">
        <Text className="text-4xl font-extrabold text-foreground">
          Welcome back
        </Text>
        <Text className="text-base text-muted-foreground">
          Log in to continue tracking your drone deliveries.
        </Text>
      </View>

      <View className="mt-10 gap-5">
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
                placeholder="Enter your password"
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
          disabled={loginMutation.isPending}
          className="rounded-xl bg-primary px-4 py-3 active:opacity-90 disabled:opacity-50"
        >
          <Text className="text-center text-base font-bold text-primary-foreground">
            {loginMutation.isPending ? "Logging in..." : "Log in"}
          </Text>
        </Pressable>
      </View>

      <View className="mb-8 mt-auto flex-row items-center justify-center gap-1">
        <Text className="text-muted-foreground">No account yet?</Text>
        <Link href="/auth/register" className="font-semibold text-primary">
          Register
        </Link>
      </View>
    </SafeAreaView>
  );
};

export default Login;
