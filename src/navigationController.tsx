/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { Camera, useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef } from 'react';
import { MyPointerLockControls } from './js/MyPointerLockControls';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';

const NavigationController = () => {
  const setCommonStore = useStore(Selector.set);
  const controlRef = useRef<MyPointerLockControls>(null);

  const { gl, invalidate, get, set } = useThree();

  // add orbit control event listener
  useEffect(() => {
    if (controlRef.current) {
      controlRef.current.addEventListener('change', render);
      controlRef.current.addEventListener('lock', lock);
      controlRef.current.addEventListener('unlock', unlock);
      document.addEventListener('keydown', keyDown);
    }
    // copy a reference before the cleanup call
    const c = controlRef.current;
    return () => {
      if (c) {
        c.removeEventListener('change', render);
        c.removeEventListener('lock', lock);
        c.removeEventListener('unlock', unlock);
      }
    };
  }, []);

  const initialCamera = useMemo(() => {
    const camera = get().camera;
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 1, 2);
    camera.position.set(0, 0, 2);
    return camera;
  }, []);

  const initialDomElement = useMemo(() => {
    return gl.domElement;
  }, []);

  // animation
  useFrame((state) => {
    if (controlRef.current) {
      invalidate();
    }
  });

  const render = () => {
    console.log('aaa');
    invalidate();
  };

  const lockControl = () => {
    if (controlRef.current) {
      controlRef.current.lock();
    }
  };

  const keyDown = (e: KeyboardEvent) => {
    if (controlRef.current) {
      switch (e.key) {
        case 'ArrowLeft':
          controlRef.current.moveRight(-0.1);
          break;
        case 'ArrowRight':
          controlRef.current.moveRight(0.1);
          break;
        case 'ArrowUp':
          controlRef.current.moveForward(0.1);
          break;
        case 'ArrowDown':
          controlRef.current.moveForward(-0.1);
          break;
      }
    }
  };

  const lock = () => {};

  const unlock = () => {};

  return (
    <>
      <myPointerLockControls ref={controlRef} args={[initialCamera, initialDomElement]} />
    </>
  );
};

export default React.memo(NavigationController);
