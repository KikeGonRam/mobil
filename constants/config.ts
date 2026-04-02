import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveLanHostFromExpo(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const [host] = hostUri.split(':');

  return host || null;
}

const expoLanHost = resolveLanHostFromExpo();

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:8080/api/v1',
  ios: 'http://localhost:8080/api/v1',
  default: 'http://localhost:8080/api/v1',
});

const DEVICE_FALLBACK_API_URL = expoLanHost ? `http://${expoLanHost}:8080/api/v1` : DEFAULT_API_URL;

function normalizeApiUrl(value: string | undefined): string {
  if (!value) {
    return DEVICE_FALLBACK_API_URL;
  }

  return value.replace(/\/$/, '');
}

export const AppConfig = {
  apiUrl: normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL ?? DEVICE_FALLBACK_API_URL),
};