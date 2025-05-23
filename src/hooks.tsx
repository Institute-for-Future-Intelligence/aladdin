/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import * as Selector from './stores/selector';
import { useMemo } from 'react';

export const useSelected = (id: string) => {
  return useStore((state) => state.selectedElementIdSet.has(id) && !state.groupActionMode);
};

export const useLanguage = () => {
  const language = useStore(Selector.language);
  return useMemo(() => {
    return { lng: language };
  }, [language]);
};

export const useWeather = (city: string | null) => {
  return useStore.getState().getWeather(city ?? 'Boston MA, USA');
  // useMemo may cache undefined
  // return useMemo(() => useStore.getState().getWeather(city ?? 'Boston MA, USA'), [city]);
};
