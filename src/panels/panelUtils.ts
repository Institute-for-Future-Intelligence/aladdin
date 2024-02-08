/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { usePrimitiveStore } from '../stores/commonPrimitive';

export const turnOffVisualization = () => {
  usePrimitiveStore.getState().set((state) => {
    state.showSolarRadiationHeatmap = false;
    state.showHeatFluxes = false;
  });
};
