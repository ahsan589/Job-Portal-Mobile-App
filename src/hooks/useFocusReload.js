import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export const useFocusReload = (reloadFn, deps = []) => {
  useFocusEffect(
    useCallback(() => {
      if (typeof reloadFn === 'function') {
        reloadFn();
      }
    }, deps)
  );
};


