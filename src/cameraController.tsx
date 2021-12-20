import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { Camera, useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { DEFAULT_FAR, DEFAULT_FOV, HALF_PI } from './constants';
import { MyOrbitControls } from './js/MyOrbitControls';
import { useRefStore, useStore } from './stores/common';
import * as Selector from './stores/selector';

const CameraController = () => {
  const setCommonStore = useStore(Selector.set);
  const orthographic = useStore(Selector.viewState.orthographic);
  const enableRotate = useStore(Selector.viewState.enableRotate);
  const autoRotate = useStore(Selector.viewState.autoRotate);
  const fileChanged = useStore(Selector.fileChanged);

  const sceneRadius = useStore(Selector.sceneRadius);
  const cameraPosition = useStore(Selector.viewState.cameraPosition);
  const cameraZoom = useStore(Selector.viewState.cameraZoom);
  const cameraPositionLength = Math.hypot(cameraPosition.x, cameraPosition.y, cameraPosition.z);
  const panRadius = (orthographic ? cameraZoom * 50 : cameraPositionLength * 10) * sceneRadius;
  const minPan = useMemo(() => new Vector3(-panRadius, -panRadius, 0), [panRadius]);
  const maxPan = useMemo(() => new Vector3(panRadius, panRadius, panRadius / 2), [panRadius]);

  const { gl, invalidate, get, set } = useThree();

  const initialOrbitCamera = useMemo(() => {
    const camera = get().camera;
    camera.up.set(0, 0, 1);
    return camera;
  }, []);
  const initialOrbitDomElement = useMemo(() => {
    return gl.domElement;
  }, []);

  const orbitControlRef = useRef<MyOrbitControls>(null);
  const persCameraRef = useRef<Camera>(null);
  const orthCameraRef = useRef<Camera>(null);

  // save orbitControlRef to common store
  useEffect(() => {
    if (orbitControlRef && orbitControlRef.current) {
      useRefStore.setState((state) => {
        state.orbitControlsRef = orbitControlRef;
      });
    }
  }, []);

  // add orbit control event listener
  useEffect(() => {
    if (orbitControlRef.current) {
      orbitControlRef.current.addEventListener('change', render);
      orbitControlRef.current.addEventListener('end', onInteractionEnd);
    }
    return () => {
      if (orbitControlRef.current) {
        orbitControlRef.current.removeEventListener('change', render);
        orbitControlRef.current.removeEventListener('end', onInteractionEnd);
      }
    };
  }, []);

  // open new/other file
  useEffect(() => {
    const viewState = useStore.getState().viewState;

    if (orbitControlRef.current) {
      if (persCameraRef.current) {
        const cameraPosition = getVector(viewState.cameraPosition);
        const panCenter = getVector(viewState.panCenter);
        persCameraRef.current.position.copy(cameraPosition);
        persCameraRef.current.lookAt(panCenter);
        persCameraRef.current.zoom = 1;
        if (!orthographic) {
          orbitControlRef.current.object = persCameraRef.current;
          orbitControlRef.current.target.copy(panCenter);
        }
      }

      if (orthCameraRef.current) {
        // old files have no cameraPosition2D and panCenter2D: 12/19/2021
        const cameraPosition2D = viewState.cameraPosition2D
          ? getVector(viewState.cameraPosition2D)
          : new Vector3(0, 0, 20);
        const panCenter2D = viewState.panCenter2D ? getVector(viewState.panCenter2D) : cameraPosition2D.clone().setZ(0);
        orthCameraRef.current.position.copy(cameraPosition2D);
        orthCameraRef.current.rotation.set(0, 0, 0);
        orthCameraRef.current.lookAt(panCenter2D);
        orthCameraRef.current.zoom = viewState.cameraZoom;
        if (orthographic) {
          orbitControlRef.current.object = orthCameraRef.current;
          orbitControlRef.current.target.copy(panCenter2D);
        }
      }

      orbitControlRef.current.update();
    }

    handleElementRotation();
  }, [fileChanged]);

  // switch camera
  useEffect(() => {
    if (!orthCameraRef.current || !persCameraRef.current || !orbitControlRef.current) {
      return;
    }

    const viewState = useStore.getState().viewState;
    const orbitControl = orbitControlRef.current;
    const orthCam = orthCameraRef.current;
    const persCam = persCameraRef.current;

    if (orthographic) {
      const cameraPosition2D = viewState.cameraPosition2D
        ? getVector(viewState.cameraPosition2D)
        : new Vector3(0, 0, 20);
      const panCenter2D = viewState.panCenter2D ? getVector(viewState.panCenter2D) : cameraPosition2D.clone().setZ(0);
      orthCam.position.copy(cameraPosition2D);
      orthCam.rotation.set(0, 0, 0);
      orbitControl.object = orthCam;
      orbitControl.target.copy(panCenter2D);
      set({ camera: orthCam });
    } else {
      persCam.position.copy(getVector(viewState.cameraPosition));
      orbitControl.object = persCam;
      orbitControl.target.copy(getVector(viewState.panCenter));
      set({ camera: persCam });
    }

    handleElementRotation();
  }, [orthographic]);

  const render = () => {
    invalidate();
    if (!useStore.getState().viewState.orthographic) {
      handleElementRotation();
      if (orbitControlRef.current) {
        orbitControlRef.current.target.clamp(minPan, maxPan);
      }
    }
  };

  const onInteractionEnd = () => {
    setCommonStore((state) => {
      // FIXME: why can't set function be used with a proxy?
      // Using set or copy will result in crash in run time.
      if (orbitControlRef.current) {
        const v = state.viewState;
        const cam = get().camera;
        const cameraPosition = cam.position.clone();
        const targetPosition = orbitControlRef.current.target.clone();
        if (v.orthographic) {
          if (cam.zoom && !isNaN(cam.zoom)) {
            v.cameraZoom = cam.zoom;
          } else {
            v.cameraZoom = 20;
          }
          // for old files that do not have cameraPosition2D and panCenter2D (note on 12/19/2021)
          if (!v.cameraPosition2D) v.cameraPosition2D = new Vector3();
          if (!v.panCenter2D) v.panCenter2D = new Vector3();
          v.cameraPosition2D.x = cameraPosition.x;
          v.cameraPosition2D.y = cameraPosition.y;
          v.cameraPosition2D.z = cameraPosition.z;
          v.panCenter2D.x = targetPosition.x;
          v.panCenter2D.y = targetPosition.y;
          v.panCenter2D.z = targetPosition.z;
        } else {
          v.cameraPosition.x = cameraPosition.x;
          v.cameraPosition.y = cameraPosition.y;
          v.cameraPosition.z = cameraPosition.z;
          v.panCenter.x = targetPosition.x;
          v.panCenter.y = targetPosition.y;
          v.panCenter.z = targetPosition.z;
        }
      }
    });
  };

  const getCameraDirection = (cam: Camera) => {
    const dir = new Vector3().subVectors(cam.localToWorld(new Vector3(0, 0, 1000)), cam.position);
    if (dir.x === 0 && dir.y === 0) {
      cam.getWorldDirection(dir);
    }
    return dir;
  };

  // the vector saved in firebase is serialized, we have to convet them to real vector
  // the better do it when we load files at the first place
  const getVector = (v: Vector3) => {
    return new Vector3(v.x, v.y, v.z);
  };

  // animation
  useFrame((state) => {
    if (autoRotate && orbitControlRef.current) {
      orbitControlRef.current.update();
    }
  });

  // *****
  // other components ref
  const compassMounted = useRefStore((state) => state.compassRef);

  // on mount
  useEffect(() => {
    handleElementRotation();
  }, [compassMounted]);

  // set element whose rotation is related to camera position
  const handleElementRotation = () => {
    // compass
    const compassRef = useRefStore.getState().compassRef;
    if (compassRef?.current) {
      const dircXY = getCameraDirection(get().camera);
      const rotationZ = (-Math.PI * 17) / 18 + Math.atan2(dircXY.x, dircXY.y);
      compassRef.current.rotation.set(-Math.PI / 3, 0, rotationZ);
    }

    // human

    // tree
  };

  return (
    <>
      <PerspectiveCamera ref={persCameraRef} fov={DEFAULT_FOV} far={DEFAULT_FAR} up={[0, 0, 1]} />
      <OrthographicCamera ref={orthCameraRef} up={[0, 0, 1]} />
      <myOrbitControls
        ref={orbitControlRef}
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
      />
    </>
  );
};

export default React.memo(CameraController);
