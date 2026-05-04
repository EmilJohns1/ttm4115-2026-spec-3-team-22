import { API_URL } from "@/constants/env";
import { getAccessToken } from "@/utils/api-client";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  console.log("[notifications] starting registration, isDevice:", Device.isDevice);
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  console.log("[notifications] existing permission status:", existing);
  const finalStatus =
    existing === "granted"
      ? existing
      : (await Notifications.requestPermissionsAsync()).status;

  console.log("[notifications] final permission status:", finalStatus);
  if (finalStatus !== "granted") return null;

  const projectId =
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
      ?.eas?.projectId;

  console.log("[notifications] projectId:", projectId);
  const { data: token } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  console.log("[notifications] token:", token);
  return token;
}

export async function registerPushToken(token: string): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) return;
  await fetch(`${API_URL}/auth/device-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token }),
  });
}

export async function deregisterPushToken(): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) return;
  await fetch(`${API_URL}/auth/device-token`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
