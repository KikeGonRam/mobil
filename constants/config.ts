import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:8080/api/v1',
  ios: 'http://localhost:8080/api/v1',
  default: 'http://localhost:8080/api/v1',
});

function normalizeApiUrl(value: string | undefined): string {
  if (!value) {
    return DEFAULT_API_URL;
  }

  return value.replace(/\/$/, '');
}

export const AppConfig = {
  apiUrl: normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL),
};