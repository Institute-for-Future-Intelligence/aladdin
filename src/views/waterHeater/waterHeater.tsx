/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Box, Cylinder, Plane } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { useSelected } from 'src/hooks';
import { WaterHeaterModel } from 'src/models/WaterHeaterModel';
import { SolarPanelUtil } from '../solarPanel/SolarPanelUtil';
import { useStore } from 'src/stores/common';
import * as Selector from '../../stores/selector';
import { ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';
import { useHandleSize } from '../wall/hooks';
import ResizeHandle from '../solarPanel/resizeHandle';
import MoveHandle from '../solarPanel/moveHandle';
import { DoubleSide, Euler, Group, Mesh, Object3D, Object3DEventMap, Raycaster, Scene, Vector3 } from 'three';
import { useRefStore } from 'src/stores/commonRef';
import { Operation, SurfaceType } from '../solarPanel/refSolarPanel';
import { FOUNDATION_GROUP_NAME, FOUNDATION_NAME } from '../foundation/foundation';
import RotateHandle from '../solarPanel/rotateHandle';
import { RoofUtil } from '../roof/RoofUtil';
import { Util } from 'src/Util';
import { tempEuler, tempQuaternion_0, tempVector3_0, tempVector3_1, tempVector3_3 } from 'src/helpers';
import { WATER_HEATER_WRAPPER_NAME } from './waterHeaterWrapper';
import PanelBox from '../solarPanel/panelBox';
import PolarGrid, { PolarGridRefProps } from '../solarPanel/polarGrid';
import { WaterHeaterUtil } from './waterHeaterUtil';

const MOUNT_LEFT = 'Mount Left';
const MOUNT_RIGHT = 'Mount Right';

/**
 * todos:
 * - resize y
 * - material
 * - text
 * - move/resize validation
 * - copy/cut/paste
 * - context menu
 * - lock wireframe
 * - simulation
 */

const WaterHeater = React.memo((waterHeater: WaterHeaterModel) => {
  const { id, cx, cy, cz, lx, ly, lz, rotation, normal, relativeAzimuth, parentType, locked } = waterHeater;

  // constant
  const panelLength = lx;
  const panelWidth = ly;
  const panelThickness = 0.05;
  const waterTankRadius = 0.3;
  const waterTankLength = panelLength + 0.25;
  const mountHeight = lz - waterTankRadius * 2; // surface to tank bottom, lz is from surface to top
  const angle = Math.asin((mountHeight + waterTankRadius) / panelWidth);
  const rotateHandleOffset = 0.5;

  // variable ref
  const operationRef = useRef<Operation | null>(null);
  const worldRotationRef = useRef<number | null>(null); // keep world rotation same when moving between different foundations
  const newParentIdRef = useRef<string | null>(null);
  const newFoundationIdRef = useRef<string | null>(null);
  const anchorRef = useRef(new Vector3()); // anchor for resize and rotate, top surface of foundation/cuboid/roof when on top surfaces, bottom surface of panel when on side surfaces
  const dirVectorRef = useRef(new Vector3());
  const parentGroupRef = useRef<Object3D | null>(null);

  // mesh ref
  const groupRef = useRef<Group>(null!);
  const azimuthGroupRef = useRef<Group>(null!);
  const boxGroupMeshRef = useRef<Group>(null!);
  const waterTankRef = useRef<Mesh>(null!);
  const resizeHandleGroupRef = useRef<Group>(null!);
  const rotateHandleGroupRef = useRef<Group>(null!);
  const xYIntersectionPlaneRef = useRef<Mesh>(null!);
  const xZIntersectionPlaneRef = useRef<Mesh>(null!);
  const mountGroupRef = useRef<Group>(null!);
  const polarGridRef = useRef<PolarGridRefProps>(null!);
  const heightHandleRef = useRef<Mesh>(null!);
  const waterTankGroupRef = useRef<Group>(null!);
  const panelGroupRef = useRef<Group>(null!);

  // states
  const [showXYIntersectionPlane, setShowXYIntersectionPlane] = useState(false);
  const [showXZIntersectionPlane, setShowXZIntersectionPlane] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showPolarGrid, setShowPolerGrid] = useState(false);

  const selected = useSelected(id);
  const handleSize = useHandleSize();
  const { set, get, raycaster } = useThree();

  const surfaceType = useMemo(
    () => SolarPanelUtil.getSurfaceType(parentType, new Vector3().fromArray(normal)),
    [parentType, normal],
  );

  const azimuthEuler = useMemo(() => {
    if (surfaceType === SurfaceType.Horizontal) {
      return new Euler(0, 0, relativeAzimuth, 'ZXY');
    } else {
      return new Euler(0, 0, 0, 'ZXY');
    }
  }, [surfaceType, relativeAzimuth]);

  const isShowRotateHandle = useMemo(() => {
    return selected && surfaceType === SurfaceType.Horizontal && !locked;
  }, [selected, surfaceType, locked]);

  // functions
  const setCommonStore = useStore(Selector.set);

  const setFrameLoop = (frameloop: 'always' | 'demand') => {
    set({ frameloop });
  };

  /** Return first intersectable mesh's point, parent group and type */
  const getIntersectionData = (raycaster: Raycaster, scene: Scene, operation: Operation) => {
    switch (operation) {
      case Operation.Move: {
        const intersections = raycaster.intersectObjects(scene.children);
        for (const intersection of intersections) {
          if (intersection.object.name.includes('Roof')) {
            const foundation = SolarPanelUtil.findParentGroup(intersection.object, [FOUNDATION_NAME]);
            if (!foundation) return null;
            return {
              intersection: intersection,
              parentGroup: foundation,
              parentType: ObjectType.Roof,
            };
          }
        }
        break;
      }
      case Operation.ResizeX:
      case Operation.ResizeY:
      case Operation.RotateLower:
      case Operation.RotateUpper: {
        if (!showXYIntersectionPlane || !xYIntersectionPlaneRef.current || !parentGroupRef.current) return null;
        const intersections = raycaster.intersectObjects([xYIntersectionPlaneRef.current]);
        const intersection = intersections[0];
        // BUG: intersection plane position is incorrect(z=0) at the first calculation. (plane object parent is null, don't know why)
        if (!intersection || Util.isEqual(intersection.point.z, 0)) return null;
        return { intersection: intersections[0], parentGroup: parentGroupRef.current, parentType: parentType };
      }
      case Operation.ResizeHeight: {
        if (!showXZIntersectionPlane || !xZIntersectionPlaneRef.current || !parentGroupRef.current) return null;
        const intersections = raycaster.intersectObjects([xZIntersectionPlaneRef.current]);
        const intersection = intersections[0];
        // BUG: intersection plane position is incorrect(z=0) at the first calculation. (plane object parent is null, don't know why)
        if (!intersection || Util.isEqual(intersection.point.z, 0)) return null;
        return { intersection: intersections[0], parentGroup: parentGroupRef.current, parentType: parentType };
      }
    }
    return null;
  };

  const updateGroupRotation = (x: number, y: number, z: number) => {
    if (groupRef.current) {
      groupRef.current.rotation.set(x, y, z, 'ZXY');
    }
  };

  const handleParentChange = (
    currentWrapper: Object3D<Object3DEventMap> | null,
    newParent: Object3D<Object3DEventMap>,
    newParentType: ObjectType,
    object: Object3D<Object3DEventMap>,
  ) => {
    const newWrapper = newParent.children.find((obj) => obj.name === WATER_HEATER_WRAPPER_NAME);
    if (newWrapper && currentWrapper && newWrapper !== currentWrapper) {
      // remove from current wrapper
      currentWrapper.children = currentWrapper.children.filter((obj) => obj !== groupRef.current);
      // add to new wrapper
      newWrapper.children.push(groupRef.current);
      groupRef.current.parent = newWrapper;

      const userData = newWrapper.parent?.userData;
      if (userData && userData.id && userData.fId) {
        newParentIdRef.current = userData.id;
        newFoundationIdRef.current = userData.fId;
      }
      if (newParentType === ObjectType.Roof) {
        const roofId = SolarPanelUtil.getRoofId(object);
        if (roofId) {
          newParentIdRef.current = roofId;
        }
      }
    }
  };

  // update child meshes position due to resize
  const updateChildMeshes = () => {
    if (!boxGroupMeshRef.current) return;
    const [hx, hy] = boxGroupMeshRef.current.scale.toArray().map((v) => v / 2);

    // resize handle
    if (resizeHandleGroupRef.current) {
      for (const obj of resizeHandleGroupRef.current.children) {
        switch (obj.name) {
          case ResizeHandleType.Left: {
            obj.position.x = -hx;
            break;
          }
          case ResizeHandleType.Right: {
            obj.position.x = hx;
            break;
          }
          case ResizeHandleType.Upper: {
            obj.position.y = hy;
            break;
          }
          case ResizeHandleType.Lower: {
            obj.position.y = -hy;
            break;
          }
        }
      }
    }
    // water tank
    if (waterTankRef.current) {
      waterTankRef.current.scale.y = boxGroupMeshRef.current.scale.x + 0.25;
    }
    // mount
    if (mountGroupRef.current) {
      for (const obj of mountGroupRef.current.children) {
        switch (obj.name) {
          case MOUNT_LEFT: {
            obj.position.x = -boxGroupMeshRef.current.scale.x * 0.4;
            break;
          }
          case MOUNT_RIGHT: {
            obj.position.x = boxGroupMeshRef.current.scale.x * 0.4;
            break;
          }
        }
      }
    }
  };

  const updatePolarGrid = (val: number) => {
    if (polarGridRef.current) {
      polarGridRef.current.setAzimuth(val);
    }
  };

  // events
  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    event.stopPropagation();
    SolarPanelUtil.setSelected(id, true);
    if (event.button === 2) {
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.WaterHeater;
      });
    }
  };

  const onMoveHandlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!selected || !groupRef.current) return;
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    operationRef.current = Operation.Move;

    const parentGroup = SolarPanelUtil.findParentGroup(groupRef.current, [FOUNDATION_GROUP_NAME]);
    if (parentGroup) {
      worldRotationRef.current =
        tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0.set(0, 0, 0, 0))).z +
        relativeAzimuth;
    }
  };

  const onResizeHandleGroupPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!selected || !groupRef.current || !azimuthGroupRef.current) return;
    if (e.intersections.length == 0 || e.intersections[0].object !== e.object) return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    switch (e.object.name) {
      case ResizeHandleType.Left:
      case ResizeHandleType.Right: {
        operationRef.current = Operation.ResizeX;
        break;
      }
      case ResizeHandleType.Upper:
      case ResizeHandleType.Lower: {
        operationRef.current = Operation.ResizeY;
        break;
      }
    }
    if (surfaceType === SurfaceType.Horizontal) {
      azimuthGroupRef.current.localToWorld(anchorRef.current.set(-e.object.position.x, -e.object.position.y, 0));
      groupRef.current.getWorldPosition(dirVectorRef.current).sub(anchorRef.current).normalize();
    } else {
      azimuthGroupRef.current.localToWorld(anchorRef.current.set(-e.object.position.x, -e.object.position.y, 0));
      azimuthGroupRef.current.getWorldPosition(dirVectorRef.current).sub(anchorRef.current).normalize();
    }
    setShowXYIntersectionPlane(true);
    parentGroupRef.current = SolarPanelUtil.findParentGroup(groupRef.current, [FOUNDATION_GROUP_NAME]);
  };

  const onHeightHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!selected || !groupRef.current || !azimuthGroupRef.current) return;
    if (e.intersections.length == 0 || e.intersections[0].object !== e.object) return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    operationRef.current = Operation.ResizeHeight;
    parentGroupRef.current = SolarPanelUtil.findParentGroup(groupRef.current, [FOUNDATION_GROUP_NAME]);
    setShowXZIntersectionPlane(true);
    // not safe?
    setTimeout(() => {
      if (xZIntersectionPlaneRef.current) {
        const cp = get().camera.position;
        e.intersections[0].object.localToWorld(tempVector3_0.set(0, 0, 0));
        xZIntersectionPlaneRef.current.lookAt(cp.x, cp.y, tempVector3_0.z);
        e.intersections[0].object.localToWorld(anchorRef.current.set(0, 0, -lz));
        setTimeout(() => {
          xZIntersectionPlaneRef.current.userData.state = true;
        }, 10);
      }
    }, 0);
  };

  const onRotateHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!azimuthGroupRef.current || !rotateHandleGroupRef.current) return;
    if (e.intersections.length == 0 || e.intersections[0].object !== e.object) return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    switch (e.eventObject.name) {
      case RotateHandleType.Upper: {
        operationRef.current = Operation.RotateUpper;
        break;
      }
      case RotateHandleType.Lower: {
        operationRef.current = Operation.RotateLower;
        break;
      }
    }
    azimuthGroupRef.current.getWorldPosition(anchorRef.current);
    anchorRef.current.z = 0;
    setShowXYIntersectionPlane(true);
    setShowPolerGrid(true);
    parentGroupRef.current = SolarPanelUtil.findParentGroup(groupRef.current, [FOUNDATION_GROUP_NAME]);
  };

  // update common state here
  const onWindowPointerUp = useCallback(() => {
    if (!operationRef.current) return;

    const oldElement = useStore.getState().elements.find((e) => e.id === id) as WaterHeaterModel;

    switch (operationRef.current) {
      case Operation.Move: {
        setCommonStore((state) => {
          if (!groupRef.current || !operationRef.current) return;

          const pointer = useRefStore.getState().pointer;
          raycaster.setFromCamera(pointer, get().camera);
          const intersectionData = getIntersectionData(raycaster, get().scene, operationRef.current);

          const waterHeater = state.elements.find((e) => e.id === id) as WaterHeaterModel;
          if (!waterHeater) return;

          // change parent first if needed
          if (waterHeater.parentId !== newParentIdRef.current && newParentIdRef.current && newFoundationIdRef.current) {
            waterHeater.parentId = newParentIdRef.current;
            waterHeater.foundationId = newFoundationIdRef.current;
          }

          waterHeater.cx = groupRef.current.position.x;
          waterHeater.cy = groupRef.current.position.y;
          waterHeater.cz = groupRef.current.position.z;

          if (worldRotationRef.current !== null && intersectionData?.parentGroup) {
            waterHeater.relativeAzimuth =
              worldRotationRef.current -
              tempEuler.setFromQuaternion(
                intersectionData.parentGroup.getWorldQuaternion(tempQuaternion_0.set(0, 0, 0, 0)),
              ).z;
          }

          if (intersectionData?.intersection) {
            const surfaceType = SolarPanelUtil.getSurfaceType(
              intersectionData.parentType,
              intersectionData.intersection.normal,
            );
            if (surfaceType === SurfaceType.Horizontal) {
              waterHeater.rotation = [0, 0, 0];
              waterHeater.normal = [0, 0, 1];
            } else {
              const { x, y, z } = groupRef.current.rotation;
              const normal = tempVector3_0.set(0, 0, 1).applyEuler(groupRef.current.rotation);
              waterHeater.rotation = [x, y, z];
              waterHeater.normal = [normal.x, normal.y, normal.z];
            }
          } else {
            const { x, y, z } = groupRef.current.rotation;
            const normal = tempVector3_0.set(0, 0, 1).applyEuler(groupRef.current.rotation);
            waterHeater.rotation = [x, y, z];
            waterHeater.normal = [normal.x, normal.y, normal.z];
          }
        });
        break;
      }
      case Operation.ResizeX: {
        setCommonStore((state) => {
          if (!boxGroupMeshRef.current || !groupRef.current) return;
          const waterHeater = state.elements.find((e) => e.id === id) as WaterHeaterModel | undefined;
          if (!waterHeater) return;
          waterHeater.lx = boxGroupMeshRef.current.scale.x;
          waterHeater.ly = boxGroupMeshRef.current.scale.y;
          if (waterHeater.parentType === ObjectType.Roof) {
            state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
          }
          [waterHeater.cx, waterHeater.cy, waterHeater.cz] = groupRef.current.position;
        });
        break;
      }
      case Operation.ResizeHeight: {
        setCommonStore((state) => {
          if (!waterTankGroupRef.current) return;
          const waterHeater = state.elements.find((e) => e.id === id) as WaterHeaterModel | undefined;
          if (!waterHeater) return;
          waterHeater.lz = waterTankGroupRef.current.position.z + waterTankRadius;
        });
        break;
      }
      case Operation.RotateLower:
      case Operation.RotateUpper: {
        setCommonStore((state) => {
          if (!azimuthGroupRef.current) return;
          const waterHeater = state.elements.find((e) => e.id === id) as WaterHeaterModel | undefined;
          if (!waterHeater) return;
          const angle = SolarPanelUtil.getRelativeAzimuth(azimuthGroupRef.current.rotation.z);
          waterHeater.relativeAzimuth = angle;
        });
        break;
      }
    }

    // // check validation and add undo
    // const newElement = useStore.getState().elements.find((e) => e.id === id) as WaterHeaterModel;
    // if (oldElement && newElement) {
    //   if (SolarPanelUtil.isNewPositionOk(newElement)) {
    //     SolarPanelUtil.addUndoable(oldElement, operationRef.current);
    //   } else {
    //     setTimeout(() => {
    //       setCommonStore((state) => {
    //         const idx = state.elements.findIndex((e) => e.id === id);
    //         if (idx !== -1) {
    //           state.elements[idx] = oldElement;
    //         }
    //       });
    //     }, 10);
    //   }
    // }
    WaterHeaterUtil.addUndoable(oldElement, operationRef.current);

    if (get().frameloop !== 'demand') {
      setFrameLoop('demand');
    }
    useRefStore.getState().setEnableOrbitController(true);
    operationRef.current = null;
    worldRotationRef.current = null;
    newParentIdRef.current = null;
    newFoundationIdRef.current = null;
    // newParentTypeRef.current = null;
    parentGroupRef.current = null;
    setShowXYIntersectionPlane(false);
    setShowXZIntersectionPlane(false);
    setShowPolerGrid(false);
  }, []);

  // onPointerUp
  useEffect(() => {
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, [onWindowPointerUp]);

  useFrame(({ camera, scene, raycaster }) => {
    if (!groupRef.current || !azimuthGroupRef.current || !selected || !operationRef.current) return;

    const pointer = useRefStore.getState().pointer;
    raycaster.setFromCamera(pointer, camera);
    const intersectionData = getIntersectionData(raycaster, scene, operationRef.current);
    if (!intersectionData) return;

    const { intersection, parentGroup, parentType } = intersectionData;
    const point = intersection.point;

    switch (operationRef.current) {
      case Operation.Move: {
        if (!parentType) break;

        // change parent
        handleParentChange(groupRef.current.parent, parentGroup, parentType, intersection.object);

        switch (parentType) {
          case ObjectType.Roof: {
            const roofSegmentUserData = SolarPanelUtil.getRoofSegmentData(intersection.object);
            if (roofSegmentUserData) {
              const { roofId, foundation, centroid, roofSegments } = roofSegmentUserData;
              if (foundation && centroid && roofSegments && roofId) {
                const posRelToFoundation = new Vector3()
                  .subVectors(point, new Vector3(foundation.cx, foundation.cy, foundation.cz))
                  .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
                const posRelToCentroid = posRelToFoundation.clone().sub(centroid);
                const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
                groupRef.current.position.x = posRelToFoundation.x;
                groupRef.current.position.y = posRelToFoundation.y;
                groupRef.current.position.z = posRelToFoundation.z;
                // on flat top surface
                if (Util.isEqual(rotation[0], 0)) {
                  updateGroupRotation(0, 0, 0);
                  if (worldRotationRef.current !== null) {
                    azimuthGroupRef.current.rotation.set(0, 0, worldRotationRef.current - parentGroup.rotation.z);
                  } else {
                    azimuthGroupRef.current.rotation.set(0, 0, relativeAzimuth);
                  }
                } else {
                  updateGroupRotation(rotation[0], rotation[1], rotation[2]);
                  azimuthGroupRef.current.rotation.set(0, 0, 0);
                }
              }
            }
            break;
          }
        }
        break;
      }
      case Operation.ResizeX:
      case Operation.ResizeY: {
        const anchor = anchorRef.current;
        const anchorToPoint = tempVector3_0.subVectors(point, anchor);
        const anchorToCenter = dirVectorRef.current;
        const angle = anchorToPoint.angleTo(anchorToCenter);
        const d = anchorToPoint.length() * Math.cos(angle);
        const distance = d;

        if (surfaceType === SurfaceType.Vertical) {
        } else {
          const dist = distance;

          const center = tempVector3_0
            .copy(anchorToCenter)
            .multiplyScalar(dist / 2)
            .add(anchor)
            .sub(parentGroup.getWorldPosition(tempVector3_3))
            .applyQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0).invert());

          const d = Math.abs(dist);
          if (operationRef.current === Operation.ResizeX) {
            boxGroupMeshRef.current.scale.x = d;
          } else if (operationRef.current === Operation.ResizeY) {
            // boxGroupMeshRef.current.scale.y = d;
            // if (polesRef.current) {
            //   polesRef.current.update({ ly: d });
            // }
          }
          groupRef.current.position.x = center.x;
          groupRef.current.position.y = center.y;
          groupRef.current.position.z = center.z;
          // setMaterialSize(operationRef.current, dist);
        }

        updateChildMeshes();
        break;
      }
      case Operation.RotateUpper: {
        tempVector3_0.subVectors(point, anchorRef.current).setZ(0);
        let angle = tempVector3_0.angleTo(tempVector3_1.set(0, 1, 0));
        if (tempVector3_0.x > 0) {
          angle = -angle;
        }
        azimuthGroupRef.current.rotation.z =
          angle - tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0)).z;
        updatePolarGrid(azimuthGroupRef.current.rotation.z);
        break;
      }
      case Operation.RotateLower: {
        tempVector3_0.subVectors(point, anchorRef.current).setZ(0);
        let angle = tempVector3_0.angleTo(tempVector3_1.set(0, -1, 0));
        if (tempVector3_0.x < 0) {
          angle = -angle;
        }

        azimuthGroupRef.current.rotation.z =
          angle - tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0)).z;
        updatePolarGrid(azimuthGroupRef.current.rotation.z);
        break;
      }
      case Operation.ResizeHeight: {
        if (xZIntersectionPlaneRef.current.userData.state && waterTankGroupRef.current) {
          const newLz = Util.clamp(point.z - anchorRef.current.z, waterTankRadius * 2, panelWidth + waterTankRadius);
          const newWaterTankCz = newLz - waterTankRadius;
          const newMountHeight = newLz - waterTankRadius * 2;

          waterTankGroupRef.current.position.z = newWaterTankCz;

          if (panelGroupRef.current && mountGroupRef.current) {
            mountGroupRef.current.scale.y = newMountHeight;
            mountGroupRef.current.position.z = newMountHeight / 2;

            panelGroupRef.current.position.z = newWaterTankCz;
            panelGroupRef.current.rotation.x = Math.asin(newWaterTankCz / panelWidth);
          }
        }
        break;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[cx, cy, cz]}
      rotation={[rotation[0], rotation[1], rotation[2], 'ZXY']}
      onPointerDown={onGroupPointerDown}
    >
      {/* auzimuth group */}
      <group ref={azimuthGroupRef} rotation={azimuthEuler}>
        {/* water tank group */}
        <group ref={waterTankGroupRef} position={[0, panelWidth / 2, waterTankRadius + mountHeight]}>
          {/* water tank */}
          <Cylinder
            ref={waterTankRef}
            args={[waterTankRadius, waterTankRadius, 1]}
            rotation={[0, 0, HALF_PI]}
            scale={[1, waterTankLength, 1]}
          >
            <meshStandardMaterial color={'grey'} />
          </Cylinder>
          {/* height handle */}
          {selected && (
            <Box
              ref={heightHandleRef}
              args={[handleSize, 0.1, handleSize]}
              position={[0, 0, waterTankRadius]}
              onPointerDown={onHeightHandlePointerDown}
            >
              <meshBasicMaterial color={'white'} />
            </Box>
          )}
        </group>

        {/* panel group */}
        <group
          ref={panelGroupRef}
          position={[0, panelWidth / 2, waterTankRadius + mountHeight]}
          rotation={[angle, 0, 0]}
        >
          <group position={[0, -panelWidth / 2, panelThickness / 2]}>
            {/* panel box group */}
            <group ref={boxGroupMeshRef} scale={[panelLength, panelWidth, panelThickness]}>
              {/* panel box mesh */}
              <PanelBox onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                {/* <Materials solarPanel={solarPanel} lx={materialLx} ly={materialLy} /> */}
                <meshStandardMaterial color={'grey'} />
              </PanelBox>
              {/* simulation panel */}
              <Plane name={'Water Heater Simulation Plane'} uuid={id} userData={{ simulation: true }} visible={false}>
                <meshBasicMaterial side={DoubleSide} />
              </Plane>
            </group>

            {/* move/resize handle */}
            {selected && (
              <>
                {/* move handle */}
                <MoveHandle onPointerDown={onMoveHandlePointerDown} />

                {/* resize handle */}
                <group
                  name="Resize_Handles_Group"
                  ref={resizeHandleGroupRef}
                  onPointerDown={onResizeHandleGroupPointerDown}
                >
                  <ResizeHandle cx={panelLength / 2} cy={0} type={ResizeHandleType.Right} size={handleSize} />
                  <ResizeHandle cx={-panelLength / 2} cy={0} type={ResizeHandleType.Left} size={handleSize} />
                </group>
              </>
            )}
          </group>
        </group>

        {/* mount */}
        <group
          ref={mountGroupRef}
          position={[0, panelWidth / 2, mountHeight / 2]}
          rotation={[HALF_PI, 0, 0]}
          scale={[1, mountHeight + 0.1, 1]}
        >
          {/* should use scale */}
          <Cylinder name={MOUNT_LEFT} args={[0.05, 0.05, 1]} position={[-panelLength * 0.4, 0, 0]}>
            <meshStandardMaterial color={'grey'} />
          </Cylinder>
          <Cylinder name={MOUNT_RIGHT} args={[0.05, 0.05, 1]} position={[panelLength * 0.4, 0, 0]}>
            <meshStandardMaterial color={'grey'} />
          </Cylinder>
        </group>

        {/* rotate handles group */}
        {isShowRotateHandle && (
          <group name={'Rotate_Handles_Group'} ref={rotateHandleGroupRef} position={[0, 0, mountHeight / 2]}>
            <RotateHandle
              name={RotateHandleType.Upper}
              positionY={panelWidth / 2 + waterTankRadius + rotateHandleOffset}
              onPointerDown={onRotateHandlePointerDown}
            />
            <RotateHandle
              name={RotateHandleType.Lower}
              positionY={-panelWidth / 2 - rotateHandleOffset}
              onPointerDown={onRotateHandlePointerDown}
            />
          </group>
        )}

        {/* XZ intersection plane */}
        {showXZIntersectionPlane && (
          <Plane
            ref={xZIntersectionPlaneRef}
            args={[10000, 10000]}
            position={[0, panelWidth / 2, 0]}
            rotation={[HALF_PI, 0, 0, 'ZXY']}
            visible={false}
          >
            <meshBasicMaterial color={'darkgrey'} />
          </Plane>
        )}
      </group>

      {/* XY intersection plane */}
      {showXYIntersectionPlane && (
        <Plane ref={xYIntersectionPlaneRef} args={[10000, 10000]} position={[0, 0, mountHeight / 2]} visible={false}>
          <meshBasicMaterial color={'darkgrey'} />
        </Plane>
      )}
      {/* polar grid group */}
      {showPolarGrid && <PolarGrid ref={polarGridRef} lx={lx} ly={ly} relativeAzimuth={relativeAzimuth} />}
    </group>
  );
});

export default WaterHeater;
