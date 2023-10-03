/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import * as Selector from '../stores/selector';

export const useSelected = (id: string) => {
  return useStore((state) => state.selectedElementIdSet.has(id));
};

export const useLanguage = () => {
  return { lng: useStore(Selector.language) };
};
