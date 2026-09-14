import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJson<T>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(key);
  return value ? (JSON.parse(value) as T) : null;
}

export function writeJson<T>(key: string, value: T) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

export function removeStoredValue(key: string) {
  return AsyncStorage.removeItem(key);
}
