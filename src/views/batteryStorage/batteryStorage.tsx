/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Box, Plane } from '@react-three/drei';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';
import { Euler, Group, Mesh, Object3D, Object3DEventMap, Raycaster, Scene, Vector3 } from 'three';
import * as Selector from '../../stores/selector';
import { useStore } from 'src/stores/common';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { SolarPanelUtil } from '../solarPanel/SolarPanelUtil';
import { ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';
import { useSelected } from 'src/hooks';
import { useRefStore } from 'src/stores/commonRef';
import { FOUNDATION_GROUP_NAME, FOUNDATION_NAME } from '../foundation/foundation';
import { BATTERY_STORAGE_WRAPPER_NAME, Operation } from './batteryStorageConstants';
import { tempEuler, tempQuaternion_0, tempVector3_0, tempVector3_1, tempVector3_2, tempVector3_3 } from 'src/helpers';
import { HALF_PI } from 'src/constants';
import HandlesGroup, { HandlesGroupRefProps } from './handlesGroup';
import { BatteryStorageUtil } from './batteryStorageUtil';
import { Util } from 'src/Util';
import PolarGrid, { PolarGridRefProps } from '../solarPanel/polarGrid';
import Label from './label';
import Wireframe from 'src/components/wireframe';
import { TEXT_SPRITE_NAME } from './horizontalRuler';
import Material, { BatteryStroageMaterialRef } from './material';

/**
 * todo:
 * - simulation
 */
const MIN_SIZE = 0.5;
/**
 * cz is 0
 */
const BatteryStorage = (batteryStorage: BatteryStorageModel) => {
  const {
    id,
    parentId,
    cx,
    cy,
    lx,
    ly,
    lz,
    rotation,
    locked,
    color = 'white',
    showLabel,
    lineColor = 'black',
    lineWidth = 0.2,
  } = batteryStorage;

  // meshes ref
  const groupRef = useRef<Group>(null!);
  const centerGroupRef = useRef<Group>(null!);
  const boxRef = useRef<Mesh>(null!);
  const intersectionPlaneRef = useRef<Mesh>(null!);
  const handlesGroupRef = useRef<HandlesGroupRefProps>(null!);
  const polarGridGroupRef = useRef<Group>(null!);
  const polarGridRef = useRef<PolarGridRefProps>(null!);
  const materialRef = useRef<BatteryStroageMaterialRef>(null!);

  // common state
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const setCommonStore = useStore(Selector.set);

  // hooks
  const { set, get } = useThree();
  const selected = useSelected(id);

  // inner state
  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const [showPolarGrid, setShowPolerGrid] = useState(false);
  // const [hovered, setHovered] = useState(false);

  // variables ref
  const operationRef = useRef<Operation>(Operation.None);
  const worldRotationRef = useRef<number | null>(null); // keep world rotation same when moving between different foundations
  const moveOffsetVector = useRef<Vector3>(new Vector3());
  const intersectionPlanePositionRef = useRef(new Vector3());
  const intersectionPlaneRotationRef = useRef(new Euler(0, 0, 0, 'ZXY'));
  const directionVectorRef = useRef(new Vector3());
  const parentGroupRef = useRef<Object3D | null>(null);
  const newParentIdRef = useRef<string | null>(null);

  // constants
  const [hx, hy, hz] = [lx / 2, ly / 2, lz / 2];
  const [rx, ry, rz] = rotation;
  const showHandles = selected && !locked;

  // functions
  const setFrameLoop = (frameloop: 'always' | 'demand') => {
    set({ frameloop });
  };

  /** Return first intersectable mesh's point, parent group */
  const getIntersectionData = (raycaster: Raycaster, scene: Scene, operation: Operation) => {
    switch (operation) {
      case Operation.Move: {
        const intersections = raycaster.intersectObjects(scene.children);
        for (const intersection of intersections) {
          if (intersection.object.name === FOUNDATION_NAME) {
            const parent = intersection.object.parent;
            if (!parent) return null;
            return {
              intersection: intersection,
              parentGroup: parent,
            };
          }
        }
        break;
      }
      case Operation.ResizeX:
      case Operation.ResizeY:
      case Operation.ResizeXY:
      case Operation.ResizeZ:
      case Operation.RotateLower:
      case Operation.RotateUpper: {
        if (!showIntersectionPlane || !intersectionPlaneRef.current || !parentGroupRef.current) return null;
        const intersections = raycaster.intersectObjects([intersectionPlaneRef.current]);
        const intersection = intersections[0];
        if (!intersection || Util.isEqual(intersection.point.z, 0)) return null;
        return { intersection: intersections[0], parentGroup: parentGroupRef.current };
      }
    }
    return null;
  };

  const handleParentChange = (
    currentWrapper: Object3D<Object3DEventMap> | null,
    newParent: Object3D<Object3DEventMap>,
  ) => {
    const newWrapper = newParent.children.find((obj) => obj.name === BATTERY_STORAGE_WRAPPER_NAME);
    if (newWrapper && currentWrapper && newWrapper !== currentWrapper) {
      // remove from current wrapper
      currentWrapper.children = currentWrapper.children.filter((obj) => obj !== groupRef.current);
      // add to new wrapper
      newWrapper.children.push(groupRef.current);
      groupRef.current.parent = newWrapper;

      const userData = newWrapper.parent?.userData;
      if (userData && userData.id && userData.fId) {
        newParentIdRef.current = userData.id;
      }
    }
  };

  const updatePolarGridValue = (val: number) => {
    if (polarGridRef.current) {
      polarGridRef.current.setAzimuth(val);
    }
  };

  // events
  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    SolarPanelUtil.setSelected(id, true);
    // right click
    if (event.button === 2) {
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.BatteryStorage;
      });
    }
  };

  const onMoveHandlesGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    operationRef.current = Operation.Move;

    moveOffsetVector.current.set(-event.object.position.x, -event.object.position.y, 0);
    // remember world rotation
    const parentGroup = SolarPanelUtil.findParentGroup(groupRef.current, [FOUNDATION_GROUP_NAME]);
    if (parentGroup) {
      worldRotationRef.current =
        tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0.set(0, 0, 0, 0))).z +
        groupRef.current.rotation.z;
    }
  };

  const onResizeHandlesGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (
      event.intersections.length == 0 ||
      (event.intersections[0].object !== event.object && event.intersections[0].object.name !== TEXT_SPRITE_NAME)
    )
      return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    const handleType = event.object.name as ResizeHandleType;
    const isTopHandles = handleType.includes('Top');
    if (isTopHandles) {
      operationRef.current = Operation.ResizeZ;
      const foundation = useStore.getState().elements.find((e) => e.id === parentId);
      if (foundation) {
        const cameraDirection = useStore.getState().cameraDirection;
        const angle =
          Math.atan2(-cameraDirection.y, -cameraDirection.x) - groupRef.current.rotation.z - foundation.rotation[2];
        intersectionPlanePositionRef.current.copy(event.object.position);
        intersectionPlaneRotationRef.current.set(HALF_PI, 0, -HALF_PI + angle, 'ZXY');
      }
    } else {
      if (handleType === ResizeHandleType.Left || handleType === ResizeHandleType.Right) {
        operationRef.current = Operation.ResizeX;
        if (groupRef.current) {
          directionVectorRef.current.subVectors(
            groupRef.current.localToWorld(tempVector3_0.set(1, 0, 0)),
            groupRef.current.localToWorld(tempVector3_1.set(0, 0, 0)),
          );
        }
      } else if (handleType === ResizeHandleType.Upper || handleType === ResizeHandleType.Lower) {
        operationRef.current = Operation.ResizeY;
        if (groupRef.current) {
          directionVectorRef.current.subVectors(
            groupRef.current.localToWorld(tempVector3_0.set(0, 1, 0)),
            groupRef.current.localToWorld(tempVector3_1.set(0, 0, 0)),
          );
        }
      } else {
        operationRef.current = Operation.ResizeXY;
        if (groupRef.current) {
          directionVectorRef.current.subVectors(
            groupRef.current.localToWorld(tempVector3_0.set(1, 0, 0)),
            groupRef.current.localToWorld(tempVector3_1.set(0, 0, 0)),
          );
        }
      }
      intersectionPlanePositionRef.current.set(0, 0, 0);
      intersectionPlaneRotationRef.current.set(0, 0, 0);
    }
    parentGroupRef.current = SolarPanelUtil.findParentGroup(groupRef.current, [FOUNDATION_GROUP_NAME]);
    setShowIntersectionPlane(true);
  };

  const onRotateHandlesGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    if (event.object.name === RotateHandleType.Lower) {
      operationRef.current = Operation.RotateLower;
    } else if (event.object.name === RotateHandleType.Upper) {
      operationRef.current = Operation.RotateUpper;
    } else {
      operationRef.current = Operation.None;
    }
    setShowIntersectionPlane(true);
    setShowPolerGrid(true);
    intersectionPlanePositionRef.current.set(0, 0, 0);
    intersectionPlaneRotationRef.current.set(0, 0, 0);
    parentGroupRef.current = SolarPanelUtil.findParentGroup(groupRef.current, [FOUNDATION_GROUP_NAME]);
  };

  const onWindowPointerUp = useCallback(() => {
    if (operationRef.current === Operation.None) return;

    const oldElement = useStore.getState().elements.find((e) => e.id === id) as BatteryStorageModel | undefined;
    setCommonStore((state) => {
      if (groupRef.current && centerGroupRef.current && boxRef.current) {
        const batteryStorage = state.elements.find((e) => e.id === id && e.type === ObjectType.BatteryStorage) as
          | BatteryStorageModel
          | undefined;
        if (batteryStorage) {
          batteryStorage.cx = groupRef.current.position.x;
          batteryStorage.cy = groupRef.current.position.y;
          batteryStorage.cz = centerGroupRef.current.position.z;
          batteryStorage.lx = boxRef.current.scale.x;
          batteryStorage.ly = boxRef.current.scale.y;
          batteryStorage.lz = boxRef.current.scale.z;
          batteryStorage.rotation[2] = groupRef.current.rotation.z;
          if (newParentIdRef.current && newParentIdRef.current) {
            batteryStorage.parentId = newParentIdRef.current;
            batteryStorage.foundationId = newParentIdRef.current;
          }
        }
      }
    });
    if (oldElement) {
      BatteryStorageUtil.addUndoable(oldElement, operationRef.current);
    }
    setFrameLoop('demand');
    useRefStore.getState().setEnableOrbitController(true);
    setShowIntersectionPlane(false);
    operationRef.current = Operation.None;
    newParentIdRef.current = null;
    setShowPolerGrid(false);
  }, []);

  // window pointer up
  useEffect(() => {
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, [onWindowPointerUp]);

  useFrame(({ camera, scene, raycaster }) => {
    if (!groupRef.current && operationRef.current === Operation.None) return;

    const pointer = useRefStore.getState().pointer;
    raycaster.setFromCamera(pointer, camera);
    const intersectionData = getIntersectionData(raycaster, scene, operationRef.current);
    if (!intersectionData) return;
    const { intersection, parentGroup } = intersectionData;
    const point = intersection.point;

    switch (operationRef.current) {
      case Operation.Move: {
        if (parentGroup) {
          handleParentChange(groupRef.current.parent, parentGroup);
          if (worldRotationRef.current !== null) {
            groupRef.current.rotation.z = worldRotationRef.current - parentGroup.rotation.z;
          } else {
            groupRef.current.rotation.z = rz;
          }
          const moveOffset = tempVector3_0
            .copy(moveOffsetVector.current)
            .applyEuler(tempEuler.set(0, 0, parentGroup.rotation.z + groupRef.current.rotation.z));
          groupRef.current.position.x = point.x + moveOffset.x - parentGroup.position.x;
          groupRef.current.position.y = point.y + moveOffset.y - parentGroup.position.y;
          groupRef.current.position.applyEuler(tempEuler.set(0, 0, -parentGroup.rotation.z));
        }
        break;
      }
      case Operation.ResizeX:
      case Operation.ResizeY: {
        const anchor = useStore.getState().resizeAnchor;
        const anchorToPoint = tempVector3_0.subVectors(point, anchor);
        const angle = anchorToPoint.angleTo(directionVectorRef.current);
        const _dist = anchorToPoint.length() * Math.cos(angle);
        const dist = _dist > 0 ? Math.max(MIN_SIZE, _dist) : Math.min(-MIN_SIZE, _dist);

        const center = tempVector3_0
          .copy(directionVectorRef.current)
          .multiplyScalar(dist / 2)
          .add(anchor)
          .sub(parentGroup.getWorldPosition(tempVector3_3))
          .applyQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0).invert());

        const d = Math.abs(dist);
        if (operationRef.current === Operation.ResizeX) {
          boxRef.current.scale.x = d;
        } else if (operationRef.current === Operation.ResizeY) {
          boxRef.current.scale.y = d;
        }
        if (materialRef.current) {
          materialRef.current.update(boxRef.current.scale.x, boxRef.current.scale.y, lz);
        }
        groupRef.current.position.x = center.x;
        groupRef.current.position.y = center.y;
        break;
      }
      case Operation.ResizeXY: {
        const p = point.clone().setZ(0);
        const anchor = useStore.getState().resizeAnchor.clone().setZ(0);
        const v = tempVector3_0
          .subVectors(p, anchor)
          .applyEuler(tempEuler.set(0, 0, -groupRef.current.rotation.z - parentGroup.rotation.z));
        const worldCenter = tempVector3_1.addVectors(p, anchor).multiplyScalar(0.5);
        const center = tempVector3_2
          .subVectors(worldCenter, parentGroup.position)
          .setZ(0)
          .applyEuler(tempEuler.set(0, 0, -parentGroup.rotation.z));
        const newLx = Math.abs(v.x);
        const newLy = Math.abs(v.y);
        if (newLx > MIN_SIZE && newLy > MIN_SIZE) {
          groupRef.current.position.x = center.x;
          groupRef.current.position.y = center.y;
          boxRef.current.scale.x = newLx;
          boxRef.current.scale.y = newLy;
          if (materialRef.current) {
            materialRef.current.update(newLx, newLy, lz);
          }
        }
        break;
      }
      case Operation.ResizeZ: {
        if (centerGroupRef.current) {
          const newLz = Math.max(MIN_SIZE, point.z - parentGroup.position.z * 2);
          boxRef.current.scale.z = newLz;
          centerGroupRef.current.position.z = newLz / 2;
          if (materialRef.current) {
            materialRef.current.update(lx, ly, newLz);
          }
        }
        break;
      }
      case Operation.RotateLower: {
        const dir = tempVector3_0
          .subVectors(point, groupRef.current.localToWorld(tempVector3_1.set(0, 0, 0)))
          .setZ(0)
          .normalize();
        const worldRotation = Math.atan2(dir.y, dir.x);
        groupRef.current.rotation.z = worldRotation - parentGroup.rotation.z + HALF_PI;
        updatePolarGridValue(groupRef.current.rotation.z);
        break;
      }
      case Operation.RotateUpper: {
        const dir = tempVector3_0
          .subVectors(point, groupRef.current.localToWorld(tempVector3_1.set(0, 0, 0)))
          .setZ(0)
          .normalize();
        const worldRotation = Math.atan2(dir.y, dir.x);
        groupRef.current.rotation.z = worldRotation - parentGroup.rotation.z - HALF_PI;
        updatePolarGridValue(groupRef.current.rotation.z);
        break;
      }
    }

    const [hx, hy, hz] = boxRef.current.scale.toArray().map((v) => v / 2);
    if (handlesGroupRef.current) {
      handlesGroupRef.current.update(hx, hy, hz);
    }
  });

  return (
    <>
      {/* bottom surface group */}
      <group ref={groupRef} position={[cx, cy, 0]} rotation={[0, 0, rz]} onPointerDown={onGroupPointerDown}>
        {/* center surface group */}
        <group ref={centerGroupRef} position={[0, 0, hz]}>
          <Box ref={boxRef} scale={[lx, ly, lz]} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
            <Material ref={materialRef} lx={lx} ly={ly} lz={lz} color={color} />
          </Box>
        </group>

        {/* handles group */}
        {showHandles && (
          <HandlesGroup
            ref={handlesGroupRef}
            id={id}
            hx={hx}
            hy={hy}
            hz={hz}
            fId={parentId}
            onMoveHandlePointerDown={onMoveHandlesGroupPointerDown}
            onResizeHandlePointerDown={onResizeHandlesGroupPointerDown}
            onRotateHandlePointerDown={onRotateHandlesGroupPointerDown}
          />
        )}

        {/* label */}
        {showLabel && !selected && <Label element={batteryStorage} groupRef={groupRef} />}

        {/* wireframe */}
        {!selected && (
          <group position={[0, 0, hz]}>
            <Wireframe hx={hx} hy={hy} hz={hz} lineColor={lineColor} lineWidth={lineWidth} />
          </group>
        )}

        {/* intersection plane */}
        {showIntersectionPlane && (
          <Plane
            name={'Intersection Plane'}
            ref={intersectionPlaneRef}
            args={[10000, 10000]}
            position={intersectionPlanePositionRef.current}
            rotation={intersectionPlaneRotationRef.current}
            visible={false}
          />
        )}
      </group>

      {/* polar grid */}
      {showPolarGrid && (
        <group ref={polarGridGroupRef} position={[cx, cy, 0]}>
          <PolarGrid ref={polarGridRef} lx={lx} ly={ly} relativeAzimuth={rotation[2]} />
        </group>
      )}
    </>
  );
};

export default BatteryStorage;
