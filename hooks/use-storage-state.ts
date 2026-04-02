import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useStorageState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const storedValue = await AsyncStorage.getItem(key);

      if (storedValue) {
        try {
          setState(JSON.parse(storedValue) as T);
        } catch {
          setState(initialValue);
        }
      }

      setIsReady(true);
    })();
  }, [initialValue, key]);

  const updateState = (nextValue: T | ((current: T) => T)) => {
    setState((current) => {
      const resolved = typeof nextValue === 'function' ? (nextValue as (current: T) => T)(current) : nextValue;

      void AsyncStorage.setItem(key, JSON.stringify(resolved));

      return resolved;
    });
  };

  return [state, updateState, isReady] as const;
}