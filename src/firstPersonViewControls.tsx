import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MyPointerLockControls } from './js/MyPointerLockControls';
import { useStore } from './stores/common';
import { setCompassRotation } from './cameraController';
import { useRefStore } from './stores/commonRef';

const MOVE_SPEED = 5;
const VIEW_HEIGHT = 3;

const FirstPersonViewControls = () => {
  const { gl, camera, set, get } = useThree();

  camera.position.z = VIEW_HEIGHT;
  camera.lookAt(0, 0, VIEW_HEIGHT);

  const controlsRef = useRef<MyPointerLockControls>();
  const moveForwardRef = useRef(false);
  const moveBackwardRef = useRef(false);
  const moveLeftRef = useRef(false);
  const moveRightRef = useRef(false);

  const [isLocked, setIsLocked] = useState(false);
  const isLockedRef = useRef(false);

  const setLock = (b: boolean) => {
    setIsLocked(b);
    isLockedRef.current = b;
    useStore.getState().set((state) => {
      state.viewState.firstPersonView = b;
      state.viewState.enableRotate = !b;
    });

    // after unlock pointer, reset orbit control view and compass
    if (!b) {
      const orbitControls = useRefStore.getState().orbitControlsRef;
      if (orbitControls && orbitControls.current) {
        orbitControls.current.target.set(0, 0, 0);
        orbitControls.current.update();
        setCompassRotation(get().camera);
      }
    }
  };

  // lock pointer onmount
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.lock();
    }
  }, []);

  // keyboard event
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          moveForwardRef.current = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          moveLeftRef.current = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          moveBackwardRef.current = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          moveRightRef.current = true;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          moveForwardRef.current = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          moveLeftRef.current = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          moveBackwardRef.current = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          moveRightRef.current = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set frameloop to 'always' in first person view, to avoid manually request frame and update camera state.
  useEffect(() => {
    if (isLocked) {
      set((state) => {
        state.frameloop = 'always';
      });
    } else {
      set((state) => {
        state.frameloop = 'demand';
      });
    }
  }, [isLocked]);

  useFrame((state, delta) => {
    if (controlsRef.current && isLockedRef.current) {
      let forwardDist = 0;
      let rightDist = 0;
      if (moveForwardRef.current || moveBackwardRef.current) {
        forwardDist = Number(moveForwardRef.current) - Number(moveBackwardRef.current);
      }
      if (moveRightRef.current || moveLeftRef.current) {
        rightDist = Number(moveRightRef.current) - Number(moveLeftRef.current);
      }

      controlsRef.current.moveForward(forwardDist * delta * MOVE_SPEED);
      controlsRef.current.moveRight(rightDist * delta * MOVE_SPEED);

      setCompassRotation(camera);
    }
  });

  return <myPointerLockControls ref={controlsRef} args={[camera, gl.domElement]} setLock={setLock} />;
};

export default React.memo(FirstPersonViewControls);
