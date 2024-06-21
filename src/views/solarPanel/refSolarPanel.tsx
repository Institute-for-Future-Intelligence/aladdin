/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Box, Cylinder, Plane, Sphere } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { ObjectType, Orientation, ResizeHandleType, RotateHandleType, TrackerType } from 'src/types';
import { Euler, Group, Mesh, Object3D, Object3DEventMap, Raycaster, Scene, Vector3 } from 'three';
import { useSelected } from '../../hooks';
import * as Selector from '../../stores/selector';
import { SOLAR_PANELS_WRAPPER_NAME } from './solarPanelWrapper';
import { HALF_PI } from 'src/constants';
import { SharedUtil } from '../SharedUtil';
import { FOUNDATION_GROUP_NAME, FOUNDATION_NAME } from '../foundation/foundation';
import { RoofUtil } from '../roof/RoofUtil';
import { CUBOID_WRAPPER_NAME } from '../cuboid';
import { Util } from 'src/Util';
import { WALL_GROUP_NAME } from '../wall/wallRenderer';
import { SolarPanelUtil } from './SolarPanelUtil';
import RotateHandle from './rotateHandle';
import TiltHandle, { TiltHandleRefPros } from './tiltHandle';
import { tempEuler, tempQuaternion_0, tempVector3_0, tempVector3_1, tempVector3_2, tempVector3_3 } from 'src/helpers';
import SunBeam, { NormalPointer, SunBeamRefProps } from './sunBeam';
import TrackerGroup, { TrackerGroupRefProps } from './trackerGroup';
import { PvModel } from 'src/models/PvModel';

enum Operation {
  Move = 'Move',
  RotateUpper = 'RotateUpper',
  RotateLower = 'RotateLower',
  ResizeX = 'ResizeX',
  ResizeY = 'ResizeY',
  Tilt = 'Tilt',
  None = 'None',
}

export enum SurfaceType {
  Vertical = 'Vertical',
  Horizontal = 'Horizontal',
  Inclined = 'Inclined',
}

const INTERSECTION_PLANE_XY_NAME = 'Intersection Plane XY';

// todo: handle right click
// bug: pointer down should check if it's the first element.
// bug: resize when tracker is enabled. auzi and tilt should use tracker group value.
// bug: tilt anchor on cuboid vertial surfaces have problem. anchor is not on same plane with pointer

const RefSolarPanel = React.memo((refSolarPanel: SolarPanelModel) => {
  const {
    id,
    cx,
    cy,
    cz,
    lx,
    ly,
    // lz,
    rotation,
    normal,
    relativeAzimuth,
    tiltAngle,
    parentId,
    parentType,
    // poleHeight,
    poleRadius,
    drawSunBeam,
    trackerType = TrackerType.NO_TRACKER,
    pvModelName = 'SPR-X21-335-BLK',
    orientation = Orientation.landscape,
  } = refSolarPanel;
  const poleHeight = 1;

  const pvModel = useStore.getState().pvModules[pvModelName] as PvModel;
  const lz = Math.max(pvModel.thickness, 0.02);

  const [hlx, hly, hlz] = [lx / 2, ly / 2, lz / 2];

  const selected = useSelected(id);
  // const handleSize = useHandleSize(); // todo: performance issue: wrap handles into new component
  const handleSize = 0.3;
  const RotateHandleDist = 1;

  const { set, get, raycaster } = useThree();

  const setCommonStore = useStore(Selector.set);

  const [showXYIntersectionPlane, setShowXYIntersectionPlane] = useState(false);

  // meshes ref
  const groupRef = useRef<Group>(null!);
  const trackerGroupRef = useRef<TrackerGroupRefProps>(null!);
  const topAzimuthGroupRef = useRef<Group>(null!);
  const topTiltGroupRef = useRef<Group>(null!);
  const boxMeshRef = useRef<Mesh>(null!);
  const resizeHandleGroupRef = useRef<Group>(null!);
  const rotateHandleGroupRef = useRef<Group>(null!);
  const tiltHandleRef = useRef<TiltHandleRefPros>(null!);
  const polesGroupRef = useRef<Group>(null!);
  const sunBeamGroupRef = useRef<SunBeamRefProps>(null!);
  const intersectionPlaneRef = useRef<Mesh>(null!);

  // vairables
  const worldRotationRef = useRef<number | null>(null); // keep sp world rotation same when moving between different foundations
  const anchorRef = useRef(new Vector3()); // anchor for resize and rotate, top surface of foundation/cuboid/roof when on top surfaces, bottom surface of panel when on side surfaces
  const dirVectorRef = useRef(new Vector3());
  const newParentIdRef = useRef<string | null>(null);
  const newFoundationIdRef = useRef<string | null>(null);
  const newParentTypeRef = useRef<ObjectType | null>(null);
  const operationRef = useRef<Operation | null>(null);
  const parentGroupRef = useRef<Object3D | null>(null); // todo: improve performance

  const surfaceType = useMemo(
    () => SolarPanelUtil.getSurfaceType(parentType, new Vector3().fromArray(normal)),
    [parentType, normal],
  );

  const trackerEnabled = useMemo(
    () => SolarPanelUtil.isTrackerEnabled(surfaceType, trackerType),
    [surfaceType, trackerType],
  );

  // panel center height offset due to tilt angle on vertical surface, tiltAngle is negetive when on vertical surface
  const tiltHandleoffsetZ = useMemo(() => -hly * Math.sin(Math.min(0, tiltAngle)), [tiltAngle, hly]);

  const panelCenterHeight = useMemo(() => {
    switch (surfaceType) {
      case SurfaceType.Horizontal: {
        return hlz + poleHeight;
      }
      case SurfaceType.Vertical: {
        return hlz + tiltHandleoffsetZ;
      }
      case SurfaceType.Inclined: {
        return hlz;
      }
    }
  }, [poleHeight, hlz, surfaceType, tiltHandleoffsetZ]);

  const isShowResizeHandle = useCallback(() => {
    return selected;
  }, [selected]);

  const isShowRotateHandle = useCallback(() => {
    return selected && surfaceType === SurfaceType.Horizontal && !trackerEnabled;
  }, [selected, surfaceType, trackerType, trackerEnabled]);

  const isShowTiltHandle = useCallback(() => {
    if (!selected || trackerEnabled) return false;
    if (surfaceType === SurfaceType.Vertical) return true;
    if (surfaceType === SurfaceType.Horizontal && poleHeight > 0) return true;
    return false;
  }, [selected, surfaceType, poleHeight, trackerEnabled]);

  const setFrameLoop = (frameloop: 'always' | 'demand') => {
    set({ frameloop });
  };

  // update child meshes position due to resize
  const updateChildMeshes = () => {
    if (!boxMeshRef.current) return;
    const [hx, hy] = boxMeshRef.current.scale.toArray().map((v) => v / 2);

    // update resize handle
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

    // update rotate handle
    if (rotateHandleGroupRef.current) {
      for (const obj of rotateHandleGroupRef.current.children) {
        switch (obj.name) {
          case RotateHandleType.Lower: {
            obj.position.y = -hy - RotateHandleDist;
            break;
          }
          case RotateHandleType.Upper: {
            obj.position.y = hy + RotateHandleDist;
            break;
          }
        }
      }
    }

    // todo: update poles
    if (polesGroupRef.current) {
    }
  };

  const updateRotationOnCuboid = (normal?: Vector3) => {
    if (!normal) return;
    const { x, y, z } = normal;
    // top face
    if (Util.isEqual(z, 1)) {
      updateGroupRotation(0, 0, 0);
      if (worldRotationRef.current !== null) {
        topAzimuthGroupRef.current.rotation.z = worldRotationRef.current - tempEuler.z;
      } else {
        topAzimuthGroupRef.current.rotation.z = relativeAzimuth;
      }
      return;
    }
    // north face
    if (Util.isEqual(x, 0) && Util.isEqual(y, 1)) {
      updateGroupRotation(HALF_PI, 0, Math.PI);
    }
    // south face
    else if (Util.isEqual(x, 0) && Util.isEqual(y, -1)) {
      updateGroupRotation(HALF_PI, 0, 0);
    }
    // west face
    else if (Util.isEqual(x, -1) && Util.isEqual(y, 0)) {
      updateGroupRotation(HALF_PI, 0, -HALF_PI);
    }
    // east face
    else if (Util.isEqual(x, 1) && Util.isEqual(y, 0)) {
      updateGroupRotation(HALF_PI, 0, HALF_PI);
    }
    topAzimuthGroupRef.current.rotation.set(0, 0, 0);
  };

  const updateGroupRotation = (x: number, y: number, z: number) => {
    if (groupRef.current) {
      groupRef.current.rotation.set(x, y, z, 'ZXY');
    }
    if (sunBeamGroupRef.current) {
      sunBeamGroupRef.current.setRotationX(-x);
    }
  };

  const updateAuzimuthGroupZ = (z: number) => {
    if (topAzimuthGroupRef.current) {
      topAzimuthGroupRef.current.position.z = z;
    }
    if (sunBeamGroupRef.current) {
      sunBeamGroupRef.current.setPositionZ(z);
    }
  };

  const updateTilt = (angle: number, z: number) => {
    if (topTiltGroupRef.current) {
      topTiltGroupRef.current.rotation.x = angle;
    }
    if (tiltHandleRef.current) {
      tiltHandleRef.current.update(angle, z);
    }
  };

  /** Return first intersectable mesh's point, parent group and type */
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
              parentType: ObjectType.Foundation,
            };
          }
          if (intersection.object.name.includes(SharedUtil.WALL_OUTSIDE_SURFACE_MESH_NAME)) {
            const parent = intersection.object.parent;
            if (!parent) return null;
            return {
              intersection: intersection,
              parentGroup: parent,
              parentType: ObjectType.Wall,
            };
          }
          if (intersection.object.name.includes('Roof')) {
            const foundation = SolarPanelUtil.findParentGroup(intersection.object, [FOUNDATION_NAME]);
            if (!foundation) return null;
            return {
              intersection: intersection,
              parentGroup: foundation,
              parentType: ObjectType.Roof,
            };
          }
          if (intersection.object.name.includes('Cuboid')) {
            const parent = SolarPanelUtil.findParentGroup(intersection.object, [CUBOID_WRAPPER_NAME]);
            if (!parent) return null;
            return {
              intersection: intersection,
              parentGroup: parent,
              parentType: ObjectType.Cuboid,
            };
          }
        }
        break;
      }
      case Operation.ResizeX:
      case Operation.ResizeY:
      case Operation.RotateLower:
      case Operation.RotateUpper: {
        if (!showXYIntersectionPlane || !intersectionPlaneRef.current || !parentGroupRef.current) return null;
        const intersections = raycaster.intersectObjects([intersectionPlaneRef.current]);
        const intersection = intersections[0];
        // BUG: intersection plane position is incorrect(z=0) at the first calculation. (plane object parent is null, don't know why)
        if (!intersection || Util.isEqual(intersection.point.z, 0)) return null;
        return { intersection: intersections[0], parentGroup: parentGroupRef.current, parentType: parentType };
      }
    }
    return null;
  };

  const getResizeDistanceByModule = (operation: Operation, d: number) => {
    const { length, width } = SolarPanelUtil.getUnitSize(orientation, pvModel.length, pvModel.width);
    if (operation === Operation.ResizeX) {
      if (d < length && d > -length) {
        d = length;
      }
      return Math.round(d / length) * length;
    } else if (operation === Operation.ResizeY) {
      if (d < width && d > -width) {
        d = width;
      }
      return Math.round(d / width) * width;
    }
    return d;
  };

  const handleParentChange = (
    currentWrapper: Object3D<Object3DEventMap> | null,
    newParent: Object3D<Object3DEventMap>,
    newParentType: ObjectType,
    object: Object3D<Object3DEventMap>,
  ) => {
    const newWrapper = newParent.children.find((obj) => obj.name === SOLAR_PANELS_WRAPPER_NAME);
    if (newWrapper && currentWrapper && newWrapper !== currentWrapper) {
      // remove from current wrapper
      currentWrapper.children = currentWrapper.children.filter((obj) => obj !== groupRef.current);
      // add to new wrapper
      newWrapper.children.push(groupRef.current);
      groupRef.current.parent = newWrapper;

      const userData = newWrapper.parent?.userData;
      if (userData && userData.id && userData.fId) {
        newParentIdRef.current = userData.id; // todo: sp on roof pId === fId?
        newFoundationIdRef.current = userData.fId;
      }
      if (newParentType === ObjectType.Roof) {
        const roofId = SolarPanelUtil.getRoofId(object);
        if (roofId) {
          newParentIdRef.current = roofId;
        }
      }
    }
    newParentTypeRef.current = newParentType;
  };

  // ===== Events =====
  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    SolarPanelUtil.setSelected(id, true);
    if (event.button === 2) {
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.SolarPanel;
      });
    }
  };

  const onMoveHandlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!selected || !groupRef.current || !topAzimuthGroupRef.current) return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    operationRef.current = Operation.Move;

    const parentGroup = SolarPanelUtil.findParentGroup(groupRef.current, [FOUNDATION_GROUP_NAME, CUBOID_WRAPPER_NAME]);
    if (parentGroup) {
      worldRotationRef.current =
        tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0.set(0, 0, 0, 0))).z +
        relativeAzimuth;
    }
  };

  const onResizeHandleGroupPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!selected || !groupRef.current || !topAzimuthGroupRef.current) return;
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
      topAzimuthGroupRef.current.localToWorld(
        anchorRef.current.set(
          -e.object.position.x,
          -e.object.position.y * Math.abs(Math.cos(tiltAngle)),
          -hlz - poleHeight,
        ),
      );
      groupRef.current.getWorldPosition(dirVectorRef.current).sub(anchorRef.current).normalize();
    } else {
      topAzimuthGroupRef.current.localToWorld(anchorRef.current.set(-e.object.position.x, -e.object.position.y, 0));
      topAzimuthGroupRef.current.getWorldPosition(dirVectorRef.current).sub(anchorRef.current).normalize();
    }
    setShowXYIntersectionPlane(true);
    parentGroupRef.current = SolarPanelUtil.findParentGroup(groupRef.current, [
      WALL_GROUP_NAME,
      FOUNDATION_GROUP_NAME,
      CUBOID_WRAPPER_NAME,
    ]);
  };

  const onRotateHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!topAzimuthGroupRef.current || !rotateHandleGroupRef.current) return;
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
    topAzimuthGroupRef.current.getWorldPosition(anchorRef.current);
    anchorRef.current.z = 0;
    setShowXYIntersectionPlane(true);
    parentGroupRef.current = SolarPanelUtil.findParentGroup(groupRef.current, [
      FOUNDATION_GROUP_NAME,
      CUBOID_WRAPPER_NAME,
    ]);
  };

  const onTiltHandlePointerDown = () => {
    operationRef.current = Operation.Tilt;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    if (surfaceType === SurfaceType.Vertical) {
      groupRef.current.getWorldPosition(anchorRef.current);
    } else {
      topAzimuthGroupRef.current.getWorldPosition(anchorRef.current);
    }
  };

  const onTiltHandlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!topAzimuthGroupRef.current || !topTiltGroupRef.current || !tiltHandleRef.current) return;
    const anchorToPoint = tempVector3_0.subVectors(e.point, anchorRef.current);
    const posVector = topAzimuthGroupRef.current.localToWorld(tempVector3_1.set(0, -1, 0)).sub(anchorRef.current);
    const b = anchorToPoint.angleTo(posVector);
    const sign = Math.sign(HALF_PI - b);
    const angle = sign * anchorToPoint.angleTo(topAzimuthGroupRef.current.getWorldDirection(tempVector3_2));

    if (surfaceType === SurfaceType.Vertical) {
      const a = angle > 0 ? -angle : angle;
      const z = hlz - hly * Math.sin(a);
      updateAuzimuthGroupZ(z);
      updateTilt(a, -z);
    } else {
      updateTilt(angle, 0);
    }
  };

  // update common state here
  const onWindowPointerUp = useCallback(() => {
    switch (operationRef.current) {
      case Operation.Move: {
        setCommonStore((state) => {
          if (!groupRef.current || !operationRef.current) return;

          const pointer = useRefStore.getState().pointer;
          raycaster.setFromCamera(pointer, get().camera);
          const intersectionData = getIntersectionData(raycaster, get().scene, operationRef.current);
          if (!intersectionData) return;

          const { intersection, parentGroup, parentType } = intersectionData;

          const sp = state.elements.find((e) => e.id === id) as SolarPanelModel | undefined;
          if (!sp) return;

          // change parent first if needed
          if (sp.parentId !== newParentIdRef.current && newParentIdRef.current && newFoundationIdRef.current) {
            sp.parentId = newParentIdRef.current;
            sp.foundationId = newFoundationIdRef.current;
          }
          if (newParentTypeRef.current && newParentTypeRef.current !== sp.parentType) {
            sp.parentType = newParentTypeRef.current;
          }

          if (sp.parentType === ObjectType.Wall) {
            // todo: should use ref to find parent
            const parentWall = state.elements.find((e) => e.id === sp.parentId);
            if (parentWall) {
              sp.cx = groupRef.current.position.x / parentWall.lx;
              sp.cy = 0;
              sp.cz = groupRef.current.position.z / parentWall.lz;
              sp.rotation = [HALF_PI, 0, 0];
              sp.normal = [0, -1, 0];
            }
          } else {
            sp.cx = groupRef.current.position.x;
            sp.cy = groupRef.current.position.y;
            sp.cz = groupRef.current.position.z;

            if (worldRotationRef.current !== null) {
              sp.relativeAzimuth =
                worldRotationRef.current -
                tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0.set(0, 0, 0, 0))).z;
            }

            const surfaceType = SolarPanelUtil.getSurfaceType(parentType, intersection.normal);
            if (surfaceType === SurfaceType.Horizontal) {
              sp.rotation = [0, 0, 0];
              sp.normal = [0, 0, 1];
            } else {
              const { x, y, z } = groupRef.current.rotation;
              const normal = tempVector3_0.set(0, 0, 1).applyEuler(groupRef.current.rotation);
              sp.rotation = [x, y, z];
              sp.normal = [normal.x, normal.y, normal.z];
            }
          }
        });
        break;
      }
      case Operation.ResizeX:
      case Operation.ResizeY: {
        setCommonStore((state) => {
          if (!boxMeshRef.current || !groupRef.current) return;
          const sp = state.elements.find((e) => e.id === id) as SolarPanelModel | undefined;
          if (!sp) return;
          sp.lx = boxMeshRef.current.scale.x;
          sp.ly = boxMeshRef.current.scale.y;
          // todo: should use ref to find parent
          if (sp.parentType === ObjectType.Wall) {
            const parentWall = state.elements.find((e) => e.id === sp.parentId);
            if (parentWall) {
              sp.cx = groupRef.current.position.x / parentWall.lx;
              sp.cy = 0;
              sp.cz = groupRef.current.position.z / parentWall.lz;
            }
          } else {
            [sp.cx, sp.cy, sp.cz] = groupRef.current.position;
          }
        });
        break;
      }
      case Operation.RotateLower:
      case Operation.RotateUpper: {
        setCommonStore((state) => {
          if (!topAzimuthGroupRef.current) return;
          const sp = state.elements.find((e) => e.id === id) as SolarPanelModel | undefined;
          if (!sp) return;
          const angle = SolarPanelUtil.getRelativeAzimuth(topAzimuthGroupRef.current.rotation.z);
          sp.relativeAzimuth = angle;
        });
        break;
      }
      case Operation.Tilt: {
        setCommonStore((state) => {
          if (!topTiltGroupRef.current) return;
          const sp = state.elements.find((e) => e.id === id) as SolarPanelModel | undefined;
          if (!sp) return;
          sp.tiltAngle = topTiltGroupRef.current.rotation.x;
        });
        break;
      }
    }
    if (get().frameloop !== 'demand') {
      setFrameLoop('demand');
    }
    useRefStore.getState().setEnableOrbitController(true);
    operationRef.current = null;
    worldRotationRef.current = null;
    newParentIdRef.current = null;
    newFoundationIdRef.current = null;
    newParentTypeRef.current = null;
    parentGroupRef.current = null;
    setShowXYIntersectionPlane(false);
  }, []);

  // onPointerUp
  useEffect(() => {
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, []);

  useFrame(({ camera, scene, raycaster }) => {
    if (!groupRef.current || !topAzimuthGroupRef.current || !selected || !operationRef.current) return;

    // handle tilt on tilt intersection plane, because it doesn't interact with other elements
    if (operationRef.current === Operation.Tilt) return;

    const pointer = useRefStore.getState().pointer;
    raycaster.setFromCamera(pointer, camera);
    const intersectionData = getIntersectionData(raycaster, scene, operationRef.current);
    if (!intersectionData) return;

    const { intersection, parentGroup, parentType } = intersectionData;
    const point = intersection.point;

    switch (operationRef.current) {
      case Operation.Move: {
        if (!parentType) break;
        handleParentChange(groupRef.current.parent, parentGroup, parentType, intersection.object);

        // updating mesh
        switch (parentType) {
          case ObjectType.Foundation: {
            groupRef.current.position.x = point.x - parentGroup.position.x;
            groupRef.current.position.y = point.y - parentGroup.position.y;
            groupRef.current.position.z = point.z - parentGroup.position.z;
            groupRef.current.position.applyEuler(tempEuler.set(0, 0, -parentGroup.rotation.z));
            updateGroupRotation(0, 0, 0);
            if (worldRotationRef.current !== null) {
              topAzimuthGroupRef.current.rotation.z = worldRotationRef.current - parentGroup.rotation.z;
            } else {
              topAzimuthGroupRef.current.rotation.z = relativeAzimuth;
            }
            break;
          }
          case ObjectType.Wall: {
            const foundationGroup = SolarPanelUtil.findParentGroup(parentGroup, [FOUNDATION_GROUP_NAME]);
            if (foundationGroup) {
              parentGroup.localToWorld(tempVector3_0.set(0, 0, 0));
              tempVector3_1
                .set(0, 0, 0)
                .subVectors(point, tempVector3_0)
                .applyEuler(tempEuler.set(0, 0, -foundationGroup.rotation.z - parentGroup.rotation.z));

              groupRef.current.position.x = tempVector3_1.x;
              groupRef.current.position.y = 0;
              groupRef.current.position.z = tempVector3_1.z;
              updateGroupRotation(HALF_PI, 0, 0);
              topAzimuthGroupRef.current.rotation.set(0, 0, 0);
            }
            break;
          }
          case ObjectType.Roof: {
            const roofSegmentUserData = SolarPanelUtil.getRoofSegmentData(intersection.object);
            if (roofSegmentUserData) {
              const { roofId, foundation, centroid, roofSegments } = roofSegmentUserData;
              if (foundation && centroid && roofSegments && roofId) {
                const posRelToFoundation = new Vector3()
                  .subVectors(point, new Vector3(foundation.cx, foundation.cy))
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
                    topAzimuthGroupRef.current.rotation.set(0, 0, worldRotationRef.current - parentGroup.rotation.z);
                  } else {
                    topAzimuthGroupRef.current.rotation.set(0, 0, relativeAzimuth);
                  }
                } else {
                  updateGroupRotation(rotation[0], rotation[1], rotation[2]);
                  topAzimuthGroupRef.current.rotation.set(0, 0, 0);
                }
              }
            }
            break;
          }
          case ObjectType.Cuboid: {
            parentGroup.getWorldPosition(tempVector3_0);
            parentGroup.getWorldQuaternion(tempQuaternion_0);
            tempEuler.setFromQuaternion(tempQuaternion_0);
            groupRef.current.position.subVectors(point, tempVector3_0).applyQuaternion(tempQuaternion_0.invert());
            updateRotationOnCuboid(intersection.normal);
          }
        }

        const surfaceType = SolarPanelUtil.getSurfaceType(parentType, intersection.normal);

        if (surfaceType === SurfaceType.Horizontal) {
          polesGroupRef.current.visible = true;
          updateAuzimuthGroupZ(poleHeight + hlz);
        } else {
          polesGroupRef.current.visible = false;
          updateAuzimuthGroupZ(hlz);
        }

        // update tilt
        switch (surfaceType) {
          case SurfaceType.Horizontal: {
            updateTilt(tiltAngle, 0); // update handle
            break;
          }
          case SurfaceType.Vertical: {
            const angle = Math.min(0, tiltAngle);
            const z = hlz - hly * Math.sin(angle);
            updateAuzimuthGroupZ(z);
            updateTilt(angle, -z);
            break;
          }
          case SurfaceType.Inclined: {
            updateTilt(0, 0); // update handle
            break;
          }
        }

        // update tracker. have to put this last to overwrite other values.
        if (SolarPanelUtil.isTrackerEnabled(surfaceType, trackerType)) {
          topAzimuthGroupRef.current.rotation.set(0, 0, 0);
          topTiltGroupRef.current.rotation.set(0, 0, 0);
          trackerGroupRef.current.update(
            trackerType,
            tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0)).z,
          );
        } else {
          trackerGroupRef.current.reset();
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
        const distance = getResizeDistanceByModule(operationRef.current, d);

        if (surfaceType === SurfaceType.Vertical) {
          const centerToSurface = groupRef.current
            .getWorldPosition(tempVector3_0)
            .sub(topAzimuthGroupRef.current.getWorldPosition(tempVector3_1));

          const center = tempVector3_2
            .copy(anchorToCenter)
            .multiplyScalar(distance / 2)
            .add(anchor)
            .add(centerToSurface)
            .sub(parentGroup.getWorldPosition(tempVector3_3))
            .applyQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0).invert());

          groupRef.current.position.x = center.x;
          groupRef.current.position.z = center.z;
          // bug: can't update auzimuth group z on cuboid. because anchor and pointer won't be on same vertical plane.
          if (parentType === ObjectType.Cuboid) {
            groupRef.current.position.y = center.y;
          }

          if (operationRef.current === Operation.ResizeX) {
            boxMeshRef.current.scale.x = Math.abs(distance);
          } else if (operationRef.current === Operation.ResizeY) {
            boxMeshRef.current.scale.y = Math.abs(distance);
            // bug: can't update auzimuth group z on cuboid. because anchor and pointer won't be on same vertical plane.
            if (parentType === ObjectType.Wall) {
              updateAuzimuthGroupZ(Math.abs((distance / 2) * Math.sin(tiltAngle)));
            }
          }
        } else {
          const center = tempVector3_0
            .copy(anchorToCenter)
            .multiplyScalar(distance / 2)
            .add(anchor)
            .sub(parentGroup.getWorldPosition(tempVector3_3))
            .applyQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0).invert());

          if (operationRef.current === Operation.ResizeX) {
            boxMeshRef.current.scale.x = Math.abs(distance);
          } else if (operationRef.current === Operation.ResizeY) {
            boxMeshRef.current.scale.y = Math.abs(distance);
          }
          groupRef.current.position.x = center.x;
          groupRef.current.position.y = center.y;
          groupRef.current.position.z = center.z;
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
        topAzimuthGroupRef.current.rotation.z =
          angle - tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0)).z;
        break;
      }
      case Operation.RotateLower: {
        tempVector3_0.subVectors(point, anchorRef.current).setZ(0);
        let angle = tempVector3_0.angleTo(tempVector3_1.set(0, -1, 0));
        if (tempVector3_0.x < 0) {
          angle = -angle;
        }

        topAzimuthGroupRef.current.rotation.z =
          angle - tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0)).z;
        break;
      }
    }
  });

  const topAzimuthEuler = useMemo(() => {
    if (surfaceType === SurfaceType.Horizontal && !trackerEnabled) {
      return new Euler(0, 0, relativeAzimuth, 'ZXY');
    } else {
      return new Euler(0, 0, 0, 'ZXY');
    }
  }, [surfaceType, relativeAzimuth, trackerEnabled]);

  const topTiltEuler = useMemo(() => {
    if (trackerEnabled) return new Euler(0, 0, 0, 'ZXY');
    if (surfaceType === SurfaceType.Horizontal && poleHeight > 0) {
      return new Euler(tiltAngle, 0, 0, 'ZXY');
    } else if (surfaceType === SurfaceType.Vertical) {
      return new Euler(Math.min(0, tiltAngle), 0, 0, 'ZXY');
    } else {
      return new Euler(0, 0, 0, 'ZXY');
    }
  }, [poleHeight, surfaceType, tiltAngle, trackerEnabled]);

  // ==============================================
  return (
    <group
      name={`Ref_Solar_Panel_Group ${id}`}
      ref={groupRef}
      position={[cx, cy, cz]}
      rotation={[rotation[0], rotation[1], rotation[2], 'ZXY']}
      onPointerDown={onGroupPointerDown}
      onPointerMissed={() => {
        if (selected) {
          SolarPanelUtil.setSelected(id, false);
        }
      }}
    >
      {/* auzimuth group */}
      <group
        name={'Top_Azimuth_Group'}
        ref={topAzimuthGroupRef}
        position={[0, 0, panelCenterHeight]}
        rotation={topAzimuthEuler}
      >
        {/* tracker group */}
        <TrackerGroup ref={trackerGroupRef} tiltAngle={tiltAngle} trackerType={trackerType} surfaceType={surfaceType}>
          {/* tilt group */}
          <group name={'Top_Tilt_Group'} ref={topTiltGroupRef} rotation={topTiltEuler}>
            {/* panel */}
            <Box name="Box_Mesh" ref={boxMeshRef} scale={[lx, ly, lz]}>
              <meshStandardMaterial color={'blue'} />
            </Box>

            {/* move handle */}
            <Sphere name="Move_Handle" args={[handleSize]} visible={selected} onPointerDown={onMoveHandlePointerDown} />

            {/* resize handles group */}
            <group
              name="Resize_Handles_Group"
              ref={resizeHandleGroupRef}
              visible={isShowResizeHandle()}
              onPointerDown={onResizeHandleGroupPointerDown}
            >
              <Box name={ResizeHandleType.Right} position={[hlx, 0, 0.1]} args={[handleSize, handleSize, 0.1]}>
                <meshBasicMaterial color="yellow" />
              </Box>
              <Box name={ResizeHandleType.Left} position={[-hlx, 0, 0.1]} args={[handleSize, handleSize, 0.1]} />
              <Box name={ResizeHandleType.Upper} position={[0, hly, 0.1]} args={[handleSize, handleSize, 0.1]}>
                <meshBasicMaterial color="red" />
              </Box>
              <Box name={ResizeHandleType.Lower} position={[0, -hly, 0.1]} args={[handleSize, handleSize, 0.1]} />
            </group>

            {/* normal pointer group for sun beam */}
            {drawSunBeam && <NormalPointer />}
          </group>
        </TrackerGroup>

        {/* XY intersection plane */}
        {showXYIntersectionPlane && (
          <Plane name={INTERSECTION_PLANE_XY_NAME} ref={intersectionPlaneRef} args={[10000, 10000]} visible={false}>
            <meshBasicMaterial color={'darkgrey'} />
          </Plane>
        )}

        {/* rotate handles group */}
        {isShowRotateHandle() && (
          <group name={'Rotate_Handles_Group'} ref={rotateHandleGroupRef}>
            <RotateHandle
              name={RotateHandleType.Upper}
              positionY={hly + RotateHandleDist}
              onPointerDown={onRotateHandlePointerDown}
            />
            <RotateHandle
              name={RotateHandleType.Lower}
              positionY={-hly - RotateHandleDist}
              onPointerDown={onRotateHandlePointerDown}
            />
          </group>
        )}

        {/* tilt handle */}
        {isShowTiltHandle() && (
          <TiltHandle
            ref={tiltHandleRef}
            tiltAngle={tiltAngle}
            positionZ={-tiltHandleoffsetZ}
            isOnVerticalSurface={surfaceType === SurfaceType.Vertical}
            onPointerDown={onTiltHandlePointerDown}
            onPointerMove={onTiltHandlePointerMove}
          />
        )}
      </group>

      {/* sun beam group */}
      {drawSunBeam && (
        <SunBeam
          ref={sunBeamGroupRef}
          topTiltGroupRef={topTiltGroupRef}
          positionZ={panelCenterHeight}
          rotationX={-rotation[0]}
        />
      )}

      {/* poles */}
      <group name={'Poles_Group'} ref={polesGroupRef} visible={surfaceType === SurfaceType.Horizontal}>
        <Cylinder
          userData={{ unintersectable: true }}
          args={[poleRadius, poleRadius, poleHeight, 4]}
          position={[0, 0, poleHeight / 2]}
          rotation={[HALF_PI, 0, 0]}
        >
          <meshStandardMaterial color={'grey'} />
        </Cylinder>
      </group>
    </group>
  );
});

export default RefSolarPanel;
