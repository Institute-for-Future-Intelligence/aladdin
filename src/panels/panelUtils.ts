/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { usePrimitiveStore } from '../stores/commonPrimitive';

export const turnOffisualization = () => {
  usePrimitiveStore.getState().set((state) => {
    state.showSolarRadiationHeatmap = false;
    state.showHeatFluxes = false;
  });
};
