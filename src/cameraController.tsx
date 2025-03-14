/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { Camera, useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  OrthographicCamera as THREEOrthographicCamera,
  PerspectiveCamera as THREEPerspectiveCamera,
  Vector3,
} from 'three';
import { DEFAULT_SHADOW_CAMERA_FAR, DEFAULT_FOV, HALF_PI } from './constants';
import { MyOrbitControls } from './js/MyOrbitControls';
import { useStore } from './stores/common';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { useRefStore } from './stores/commonRef';
import * as Selector from './stores/selector';

const getCameraDirection = (cam: Camera) => {
  const dir = new Vector3().subVectors(cam.localToWorld(new Vector3(0, 0, 1000)), cam.position);
  if (dir.x === 0 && dir.y === 0) {
    cam.getWorldDirection(dir);
  }
  return dir;
};

const setCompassRotation = (camera: Camera) => {
  const compass = document.getElementById('compassCanvas');
  const setCameraUnderGround = (b: boolean) => {
    usePrimitiveStore.getState().set((state) => {
      state.isCameraUnderGround = b;
    });
  };
  if (compass) {
    const dircXY = getCameraDirection(camera).normalize();
    const rotationZ = Math.atan2(dircXY.y, dircXY.x) + Math.PI / 2;
    const deg = (rotationZ / Math.PI) * 180;

    compass.style.transform = `rotate(${deg}deg)`;

    const isCameraUnderGround = camera.position.z < 0.001;

    if (isCameraUnderGround && !usePrimitiveStore.getState().isCameraUnderGround) {
      setCameraUnderGround(true);
    } else if (!isCameraUnderGround && usePrimitiveStore.getState().isCameraUnderGround) {
      setCameraUnderGround(false);
    }
  }
};

const CameraController = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const orthographic = useStore(Selector.viewState.orthographic);
  const enableRotate = useStore(Selector.viewState.enableRotate);
  const autoRotate = useStore(Selector.viewState.autoRotate);
  const fileChanged = useStore(Selector.fileChanged);
  const sceneRadius = useStore(Selector.sceneRadius);
  const cameraPosition = useStore(Selector.viewState.cameraPosition);
  const cameraZoom = useStore(Selector.viewState.cameraZoom);
  const shadowCameraFar = useStore(Selector.viewState.shadowCameraFar) ?? DEFAULT_SHADOW_CAMERA_FAR;
  const navigationView = useStore(Selector.viewState.navigationView);
  const navigationMoveSpeed = usePrimitiveStore(Selector.navigationMoveSpeed);
  const navigationTurnSpeed = usePrimitiveStore(Selector.navigationTurnSpeed);
  const showCloudFileTitleDialogFlag = useStore(Selector.showCloudFileTitleDialogFlag);
  const saveLocalFileDialogVisible = usePrimitiveStore(Selector.saveLocalFileDialogVisible);

  const enabledNavigationControls = navigationView && !orthographic;
  const cameraPositionLength = Math.hypot(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
  const panRadius = (orthographic ? cameraZoom * 50 : cameraPositionLength * 10) * sceneRadius;
  const minPan = useMemo(() => new Vector3(-panRadius, -panRadius, 0), [panRadius]);
  const maxPan = useMemo(() => new Vector3(panRadius, panRadius, panRadius / 2), [panRadius]);

  const { gl, invalidate, get, set, camera } = useThree();

  const initialOrbitCamera = useMemo(() => {
    const camera = get().camera;
    camera.up.set(0, 0, 1);
    return camera;
  }, []);

  const initialOrbitDomElement = useMemo(() => {
    return gl.domElement;
  }, []);

  const orbitControlsRef = useRef<MyOrbitControls>(null);
  const persCameraRef = useRef<THREEPerspectiveCamera>(null);
  const orthCameraRef = useRef<THREEOrthographicCamera>(null);

  useEffect(() => {
    useRefStore.setState({
      canvas: { gl, camera },
    });
    if (!orthographic && persCameraRef.current) {
      useRefStore.setState({
        canvas: { gl, camera: persCameraRef.current },
      });
    }
  }, [orthographic]);

  useEffect(() => {
    const cp = useStore.getState().viewState.cameraPosition2D;
    if (cp && cp.length > 2 && cp[2] < 100) {
      setCommonStore((state) => {
        state.viewState.cameraPosition2D[2] = 150;
      });
    }
  }, []);

  // save orbitControlsRef to common ref store
  useEffect(() => {
    if (orbitControlsRef && orbitControlsRef.current) {
      useRefStore.setState({
        orbitControlsRef: orbitControlsRef,
      });
    }
  }, []);

  // add orbit control event listener
  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.addEventListener('change', render);
      orbitControlsRef.current.addEventListener('start', onInteractionStart);
      orbitControlsRef.current.addEventListener('end', onInteractionEnd);
    }
    // copy a reference before the cleanup call
    const oc = orbitControlsRef.current;
    return () => {
      if (oc) {
        oc.removeEventListener('change', render);
        oc.removeEventListener('start', onInteractionStart);
        oc.removeEventListener('end', onInteractionEnd);
      }
    };
  }, [enabledNavigationControls]);

  // open new/other file
  useEffect(() => {
    const viewState = useStore.getState().viewState;
    if (orbitControlsRef.current) {
      if (persCameraRef.current) {
        if (enabledNavigationControls) {
          const camera = get().camera;
          const positionNav = viewState.cameraPositionNav ?? [5, -30, 1];
          const rotationNav = viewState.cameraRotationNav ?? [
            1.5374753309166491, 0.16505866097993566, 0.005476951734475092,
          ];
          camera.position.fromArray(positionNav);
          camera.rotation.fromArray([rotationNav[0], rotationNav[1], rotationNav[2], 'XYZ']);
        } else {
          const cameraPosition = getVector(viewState.cameraPosition ?? [0, 0, 20]);
          const panCenter = getVector(viewState.panCenter ?? [0, 0, 0]);
          persCameraRef.current.position.copy(cameraPosition);
          persCameraRef.current.lookAt(panCenter);
          persCameraRef.current.zoom = 1;
          if (!orthographic) {
            orbitControlsRef.current.object = persCameraRef.current;
            orbitControlsRef.current.target.copy(panCenter);
          }
        }
        camera.updateMatrixWorld();
        setCompassRotation(get().camera);
      }
      if (orthCameraRef.current) {
        // old files have no cameraPosition2D and panCenter2D: 12/19/2021
        const cameraPosition2D = getVector(viewState.cameraPosition2D ?? [0, 0, 1000]).setZ(1000);
        const panCenter2D = getVector(viewState.panCenter2D ?? [0, 0, 0]);
        orthCameraRef.current.position.copy(cameraPosition2D);
        orthCameraRef.current.rotation.set(0, 0, 0);
        orthCameraRef.current.lookAt(panCenter2D);
        orthCameraRef.current.zoom = viewState.cameraZoom;
        if (orthographic) {
          orbitControlsRef.current.object = orthCameraRef.current;
          orbitControlsRef.current.target.copy(panCenter2D);
        }
      }
    }
  }, [fileChanged]);

  // switch camera
  useEffect(() => {
    if (!orthCameraRef.current || !persCameraRef.current || !orbitControlsRef.current) return;

    const viewState = useStore.getState().viewState;
    const orbitControl = orbitControlsRef.current;
    const orthCam = orthCameraRef.current;
    const persCam = persCameraRef.current;
    if (orthographic) {
      orthCam.rotation.set(0, 0, 0);
      orbitControl.object = orthCam;
      orbitControl.target.copy(getVector(viewState.panCenter2D ?? [0, 0, 0]));
      set({ camera: orthCam });
    } else {
      orbitControl.object = persCam;
      orbitControl.target.copy(getVector(viewState.panCenter ?? [0, 0, 0]));
      set({ camera: persCam });
      setCompassRotation(get().camera);
    }
  }, [orthographic]);

  // camera zoom in 2D view (no need to do this in 3D view)
  useEffect(() => {
    if (orthographic) {
      if (orbitControlsRef.current) {
        if (orthCameraRef.current) {
          orthCameraRef.current.zoom = cameraZoom;
          orbitControlsRef.current.object = orthCameraRef.current;
        }
        render();
        orbitControlsRef.current.update();
      }
    }
  }, [cameraZoom]);

  const render = () => {
    invalidate();
    if (!useStore.getState().viewState.orthographic) {
      setCompassRotation(get().camera);
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.clamp(minPan, maxPan);
      }
    }
  };

  const onInteractionStart = () => {
    usePrimitiveStore.getState().set((state) => {
      state.duringCameraInteraction = true;
    });
  };

  const onInteractionEnd = () => {
    usePrimitiveStore.getState().set((state) => {
      state.duringCameraInteraction = false;
    });
    setCommonStore((state) => {
      if (!orbitControlsRef.current) return;
      const v = state.viewState;
      const cam = get().camera;
      const cameraPosition = cam.position;
      const targetPosition = orbitControlsRef.current.target;
      if (v.orthographic) {
        if (cam.zoom && !isNaN(cam.zoom)) {
          v.cameraZoom = cam.zoom;
        } else {
          v.cameraZoom = 20;
        }
        v.cameraPosition2D = [cameraPosition.x, cameraPosition.y, 150];
        v.panCenter2D = [targetPosition.x, targetPosition.y, targetPosition.z];
      } else if (enabledNavigationControls) {
        // Do not save the pan center in the navigation mode as the camera position in this mode
        // may be way off, which can surprise the user when they exit the navigation mode and try
        // to rotate the view. It is difficult to get the pan center back unless they reset the view.
        // const panCenter = cam.localToWorld(new Vector3(0, 0, -50));
        // v.panCenter = [panCenter.x, panCenter.y, 0];
        v.cameraPositionNav = [cameraPosition.x, cameraPosition.y, cameraPosition.z];
        v.cameraRotationNav = [cam.rotation.x, cam.rotation.y, cam.rotation.z];
        state.cameraDirection = getCameraDirection(cam);
      } else {
        v.cameraPosition = [cameraPosition.x, cameraPosition.y, cameraPosition.z];
        v.panCenter = [targetPosition.x, targetPosition.y, targetPosition.z];
        state.cameraDirection = getCameraDirection(cam);
      }
    });
  };

  const getVector = (n: number[] | Vector3) => {
    if (n && Array.isArray(n)) {
      return new Vector3(n[0], n[1], n[2]);
    }
    // some of our old files are saved as serialized vector
    if (n && n.x !== null) {
      return new Vector3(n.x, n.y, n.z);
    }
    return new Vector3(0, 0, 5);
  };

  // animation
  useFrame(() => {
    if (autoRotate && orbitControlsRef.current) {
      orbitControlsRef.current.update();
    }
  });

  // other components ref
  const compassMounted = useRefStore((state) => state.compassRef);

  // on mount
  useEffect(() => {
    setCompassRotation(get().camera);
  }, [compassMounted]);

  // key event
  useEffect(() => {
    if (!orbitControlsRef.current) return;

    if (enabledNavigationControls && !saveLocalFileDialogVisible && !showCloudFileTitleDialogFlag) {
      orbitControlsRef.current.listenToKeyEvents(window);
    } else {
      orbitControlsRef.current.removeKeyEvents();
    }
  }, [enabledNavigationControls, saveLocalFileDialogVisible, showCloudFileTitleDialogFlag]);

  // switch to navigation controls
  useEffect(() => {
    if (!orbitControlsRef.current) return;

    const viewState = useStore.getState().viewState;

    if (enabledNavigationControls) {
      const camera = get().camera;
      const positionNav = viewState.cameraPositionNav ?? [5, -30, 1];
      const rotationNav = viewState.cameraRotationNav ?? [
        1.5374753309166491, 0.16505866097993566, 0.005476951734475092,
      ];
      camera.position.fromArray(positionNav);
      camera.rotation.fromArray([rotationNav[0], rotationNav[1], rotationNav[2], 'XYZ']);
      camera.updateMatrixWorld();
      setCompassRotation(get().camera);
    } else {
      if (orbitControlsRef.current && persCameraRef.current) {
        const cameraPosition = getVector(viewState.cameraPosition ?? [0, 0, 20]);
        const panCenter = getVector(viewState.panCenter ?? [0, 0, 0]);
        persCameraRef.current.position.copy(cameraPosition);
        persCameraRef.current.lookAt(panCenter);
        persCameraRef.current.zoom = 1;
        if (!orthographic) {
          orbitControlsRef.current.object = persCameraRef.current;
          orbitControlsRef.current.target.copy(panCenter);
        }
        persCameraRef.current.updateMatrixWorld();
        setCompassRotation(persCameraRef.current);
      }
    }
    invalidate();
  }, [enabledNavigationControls]);

  return (
    <>
      <PerspectiveCamera ref={persCameraRef} fov={DEFAULT_FOV} far={shadowCameraFar} up={[0, 0, 1]} />
      <OrthographicCamera ref={orthCameraRef} up={[0, 0, 1]} />
      <myOrbitControls
        ref={orbitControlsRef}
        args={[initialOrbitCamera, initialOrbitDomElement]}
        autoRotate={autoRotate}
        enableRotate={enableRotate}
        enablePan={true}
        enableZoom={true}
        enableDamping={false}
        maxAzimuthAngle={Infinity}
        minAzimuthAngle={-Infinity}
        maxPolarAngle={HALF_PI}
        minPolarAngle={0}
        moveSpeed={navigationMoveSpeed ?? 3}
        turnSpeed={navigationTurnSpeed ?? 3}
      />
    </>
  );
});

export default CameraController;
