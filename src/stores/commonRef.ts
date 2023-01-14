/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { RefObject } from 'react';
import { MyOrbitControls } from 'src/js/MyOrbitControls';
import { Group } from 'three';
import create from 'zustand';

export interface RefStoreState {
  setEnableOrbitController: (b: boolean) => void;
  selectNone: () => void;
  contentRef: RefObject<Group> | null;
  compassRef: RefObject<Group> | null;
  orbitControlsRef: RefObject<MyOrbitControls> | null;
  humanRef: RefObject<Group> | null;
  treeRef: RefObject<Group> | null;
  flowerRef: RefObject<Group> | null;
  foundationRef: RefObject<Group> | null;
  cuboidRef: RefObject<Group> | null;
}

export const useRefStore = create<RefStoreState>((set, get) => {
  return {
    setEnableOrbitController: (b: boolean) => {
      set((state) => {
        if (state.orbitControlsRef?.current) {
          state.orbitControlsRef.current.enabled = b;
        }
      });
    },
    selectNone: () => {
      set((state) => {
        state.humanRef = null;
        state.treeRef = null;
        state.foundationRef = null;
      });
    },
    contentRef: null,
    compassRef: null,
    orbitControlsRef: null,
    humanRef: null,
    treeRef: null,
    flowerRef: null,
    foundationRef: null,
    cuboidRef: null,
  };
});
