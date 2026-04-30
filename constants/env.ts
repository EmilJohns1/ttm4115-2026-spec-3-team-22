import { Platform } from "react-native";

const EXPLICIT_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
const emulatorFallbackApiUrl =
  Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000";
/**
 * Backend API base URL used by service-layer fetch calls.
 *
 * For physical devices, set EXPO_PUBLIC_API_URL to your machine's LAN IP,
 * for example: http://192.168.1.42:8000
 */
export const API_URL = EXPLICIT_API_URL || emulatorFallbackApiUrl;
