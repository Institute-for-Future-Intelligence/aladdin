/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';

export interface PrimitiveStoreState {
  duringCameraInteraction: boolean;
}

export const usePrimitiveStore = create<PrimitiveStoreState>((set, get) => {
  return {
    duringCameraInteraction: false,
  };
});
