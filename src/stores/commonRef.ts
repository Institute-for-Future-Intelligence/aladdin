/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { createWithEqualityFn } from 'zustand/traditional';
import { RefObject } from 'react';
import { MyOrbitControls } from 'src/js/MyOrbitControls';
import { Camera, Group, Vector2, WebGLRenderer } from 'three';
import { useStore } from './common';

export interface RefStoreState {
  setEnableOrbitController: (b: boolean) => void;
  selectNone: () => void;
  contentRef: RefObject<Group> | null;
  compassRef: React.MutableRefObject<HTMLCanvasElement | null> | null;
  orbitControlsRef: RefObject<MyOrbitControls> | null;
  humanRef: RefObject<Group> | null;
  treeRef: RefObject<Group> | null;
  flowerRef: RefObject<Group> | null;
  foundationRef: RefObject<Group> | null;
  cuboidRef: RefObject<Group> | null;
  listenToAutoDeletionByDeleteRef: React.MutableRefObject<boolean> | null;
  listenToAutoDeletionByCutRef: React.MutableRefObject<boolean> | null;
  solarPanelCountRef: React.MutableRefObject<HTMLSpanElement> | null;
  setListenToAutoDeletionByDelete: (b: boolean) => void;
  setListenToAutoDeletionByCut: (b: boolean) => void;
  canvas: { gl: WebGLRenderer; camera: Camera } | null;
  pointer: Vector2;
}

export const useRefStore = createWithEqualityFn<RefStoreState>()((set, get) => {
  return {
    setEnableOrbitController: (b: boolean) => {
      if (useStore.getState().viewState.navigationView) {
        return;
      }
      set((state) => {
        if (state.orbitControlsRef?.current) {
          state.orbitControlsRef.current.enabled = b;
        }
        return state;
      });
    },
    selectNone: () => {
      set({
        humanRef: null,
        treeRef: null,
        foundationRef: null,
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
    listenToAutoDeletionByCutRef: null,
    listenToAutoDeletionByDeleteRef: null,
    setListenToAutoDeletionByCut: (b: boolean) => {
      const listenToAutoDeletionByCutRef = get().listenToAutoDeletionByCutRef;
      if (listenToAutoDeletionByCutRef) {
        listenToAutoDeletionByCutRef.current = b;
      }
    },
    setListenToAutoDeletionByDelete: (b: boolean) => {
      const listenToAutoDeletionByDeleteRef = get().listenToAutoDeletionByDeleteRef;
      if (listenToAutoDeletionByDeleteRef) {
        listenToAutoDeletionByDeleteRef.current = b;
      }
    },
    canvas: null,
    pointer: new Vector2(),
    solarPanelCountRef: null,
  };
});
