/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { RefObject } from 'react';
import { MyOrbitControls } from 'src/js/MyOrbitControls';
import { Group } from 'three';
import create from 'zustand';

export interface CommonStoreRef {
  compassRef: RefObject<Group> | null;
  orbitControlsRef: RefObject<MyOrbitControls> | null;
  setEnableOrbitController: (b: boolean) => void;
}

export const useStoreRef = create<CommonStoreRef>((set, get) => {
  return {
    compassRef: null,
    orbitControlsRef: null,
    setEnableOrbitController: (b: boolean) => {
      set((state) => {
        if (state.orbitControlsRef?.current) {
          state.orbitControlsRef.current.enabled = b;
        }
      });
    },
  };
});
