/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Box, Circle, Cone, Cylinder, Line, Plane, Ring, Sphere, Torus } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';
import {
  DoubleSide,
  Euler,
  Group,
  Mesh,
  Object3D,
  Object3DEventMap,
  Quaternion,
  Raycaster,
  Scene,
  Vector3,
} from 'three';
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

enum Operation {
  Move = 'Move',
  RotateUpper = 'RotateUpper',
  RotateLower = 'RotateLower',
  ResizeX = 'ResizeX',
  ResizeY = 'ResizeY',
  Tilt = 'Tilt',
}

const tempVector3_0 = new Vector3();
const tempVector3_1 = new Vector3();
const tempVector3_2 = new Vector3();
const tempVector3_3 = new Vector3();
const tempEuler = new Euler();
const tempQuaternion_0 = new Quaternion();

const INTERSECTION_PLANE_XY = 'Intersection Plane XY';

const RefSolarPanel = React.memo((refSolarPanel: SolarPanelModel) => {
  const {
    id,
    cx,
    cy,
    cz,
    lx,
    ly,
    lz,
    rotation,
    relativeAzimuth,
    tiltAngle,
    parentId,
    parentType,
    // poleHeight,
    poleRadius,
  } = refSolarPanel;
  const poleHeight = 2;

  const [hlx, hly, hlz] = [lx / 2, ly / 2, lz / 2];

  const selected = useSelected(id);
  // const handleSize = useHandleSize(); // todo: performance issue: wrap handles into new component
  const handleSize = 0.3;
  const RotateHandleDist = 1;

  const { set, get } = useThree();

  const setCommonStore = useStore(Selector.set);

  const [showXYIntersectionPlane, setShowXYIntersectionPlane] = useState(false);

  // meshes ref
  const groupRef = useRef<Group>(null!);
  const boxMeshRef = useRef<Mesh>(null!);
  const resizeHandleGroupRef = useRef<Group>(null!);
  const rotateHandleGroupRef = useRef<Group>(null!);
  const topRotationGroupRef = useRef<Group>(null!);
  const polesGroupRef = useRef<Group>(null!);
  const intersectionPlaneRef = useRef<Mesh>(null!);

  // vairables
  const worldRotationRef = useRef<number | null>(null); // keep sp world rotation same when moving between different foundations
  const anchorRef = useRef(new Vector3()); // anchor for resize and rotate, top surface of foundation/cuboid/roof when on top surfaces, bottom surface of panel when on side surfaces
  const unitVecterRef = useRef(new Vector3());
  const newParentIdRef = useRef<string | null>(null);
  const newFoundationIdRef = useRef<string | null>(null);
  const newParentTypeRef = useRef<ObjectType | null>(null);
  const operationRef = useRef<Operation | null>(null);
  const parentGroupRef = useRef<Object3D | null>(null);

  const isOnTop = useMemo(() => SolarPanelUtil.isOnFlatTopSurface(parentType, rotation[0]), [parentType, rotation[0]]);
  const panelCenterHeight = useMemo(() => lz / 2 + (isOnTop ? poleHeight : 0), [poleHeight, lz, isOnTop]);

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

    // update poles
    if (polesGroupRef.current) {
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

  const handleChangeParent = (
    currentWrapper: Object3D<Object3DEventMap> | null,
    newParent: Object3D<Object3DEventMap>,
    newParentType: ObjectType,
    object: Object3D<Object3DEventMap>,
  ) => {
    // todo: different element has different structure
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

  const updateRotationOnCuboid = (normal?: Vector3) => {
    if (!normal) return;
    const { x, y, z } = normal;
    // top face
    if (Util.isEqual(z, 1)) {
      // todo: hard code for now
      groupRef.current.rotation.set(0, 0, 0);
      if (worldRotationRef.current !== null) {
        topRotationGroupRef.current.rotation.z = worldRotationRef.current - tempEuler.z;
      } else {
        topRotationGroupRef.current.rotation.z = relativeAzimuth;
      }
      topTiltGroupRef.current.rotation.x = tiltAngle;
      return;
    }
    // north face
    if (Util.isEqual(x, 0) && Util.isEqual(y, 1)) {
      groupRef.current.rotation.set(-HALF_PI, 0, 0);
    }
    // south face
    else if (Util.isEqual(x, 0) && Util.isEqual(y, -1)) {
      groupRef.current.rotation.set(HALF_PI, 0, 0);
    }
    // west face
    else if (Util.isEqual(x, -1) && Util.isEqual(y, 0)) {
      groupRef.current.rotation.set(HALF_PI, 0, -HALF_PI, 'ZXY');
    }
    // east face
    else if (Util.isEqual(x, 1) && Util.isEqual(y, 0)) {
      groupRef.current.rotation.set(HALF_PI, 0, HALF_PI, 'ZXY');
    }
    topRotationGroupRef.current.rotation.set(0, 0, 0);
    topTiltGroupRef.current.rotation.set(0, 0, 0);
  };

  const setHandlesVisibility = (rotate: boolean, tilt: boolean) => {
    if (rotateHandleGroupRef.current) {
      rotateHandleGroupRef.current.visible = rotate;
    }
    if (tiltHandleRef.current) {
      tiltHandleRef.current.setVisiable(tilt);
    }
  };

  const updateHandlesVisibility = (parentType: ObjectType, rotationX: number, poleHeight: number) => {
    switch (parentType) {
      case ObjectType.Foundation: {
        setHandlesVisibility(true, poleHeight !== 0);
        break;
      }
      case ObjectType.Wall: {
        setHandlesVisibility(false, true);
        break;
      }
      case ObjectType.Cuboid:
      case ObjectType.Roof: {
        const isOnFlatTopSurface = Util.isEqual(rotationX, 0);
        if (isOnFlatTopSurface) {
          setHandlesVisibility(true, poleHeight !== 0);
        } else {
          setHandlesVisibility(false, false);
        }
        break;
      }
    }
  };

  // ===== Events =====
  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    SolarPanelUtil.setSelected(id, true);
  };

  const onMoveHandlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!selected || !groupRef.current || !topRotationGroupRef.current) return;
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
    if (!selected || !topRotationGroupRef.current) return;
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
    if (isOnTop) {
      topRotationGroupRef.current.localToWorld(
        anchorRef.current.set(
          -e.object.position.x,
          -e.object.position.y * Math.abs(Math.cos(tiltAngle)),
          -lz / 2 - poleHeight,
        ),
      );
    } else {
      topRotationGroupRef.current.localToWorld(
        anchorRef.current.set(-e.object.position.x, -e.object.position.y, -lz / 2),
      );
    }
    setShowXYIntersectionPlane(true);
    parentGroupRef.current = SolarPanelUtil.findParentGroup(groupRef.current, [
      WALL_GROUP_NAME,
      FOUNDATION_GROUP_NAME,
      CUBOID_WRAPPER_NAME,
    ]);
  };

  const onRotateHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!topRotationGroupRef.current || !rotateHandleGroupRef.current.visible) return;
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
    topRotationGroupRef.current.getWorldPosition(anchorRef.current);
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
    topRotationGroupRef.current.getWorldPosition(anchorRef.current);
  };

  const onTiltHandlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!topTiltGroupRef.current || !tiltHandleRef.current) return;
    const anchorToPoint = tempVector3_0.subVectors(e.point, anchorRef.current);
    const posVector = topRotationGroupRef.current.localToWorld(tempVector3_1.set(0, -1, 0)).sub(anchorRef.current);
    const b = anchorToPoint.angleTo(posVector);
    const sign = Math.sign(HALF_PI - b);
    const angle = sign * anchorToPoint.angleTo(topRotationGroupRef.current.getWorldDirection(tempVector3_2));
    topTiltGroupRef.current.rotation.x = angle;
    tiltHandleRef.current.setRotationX(angle);
  };

  // update common state here
  const onWindowPointerUp = useCallback(() => {
    switch (operationRef.current) {
      case Operation.Move: {
        setCommonStore((state) => {
          if (!groupRef.current) return;

          const sp = state.elements.find((e) => e.id === id) as SolarPanelModel | undefined;
          if (!sp) return;

          // change parent first if needed
          // todo: sp on roof parent id is foundation. need change?
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
              // todo: hard code for now
              sp.rotation = [0, 0, 0];
            }
          } else {
            sp.cx = groupRef.current.position.x;
            sp.cy = groupRef.current.position.y;
            sp.cz = groupRef.current.position.z;

            if (worldRotationRef.current !== null) {
              const parentGroup = SolarPanelUtil.findParentGroup(groupRef.current, [
                FOUNDATION_GROUP_NAME,
                CUBOID_WRAPPER_NAME,
              ]);
              if (parentGroup) {
                sp.relativeAzimuth =
                  worldRotationRef.current -
                  tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0.set(0, 0, 0, 0))).z;
              }
            }
            if (sp.parentType === ObjectType.Roof || sp.parentType === ObjectType.Cuboid) {
              const { x, y, z } = groupRef.current.rotation;
              // on top face
              if (Util.isEqual(groupRef.current.rotation.x, 0)) {
                sp.rotation = [0, 0, 0];
              } else {
                sp.rotation = [x, y, z];
              }
              // todo: is sp.normal needed?
            } else {
              sp.rotation = [0, 0, 0];
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
          }
        });
        break;
      }
      case Operation.RotateLower:
      case Operation.RotateUpper: {
        setCommonStore((state) => {
          if (!topRotationGroupRef.current) return;
          const sp = state.elements.find((e) => e.id === id) as SolarPanelModel | undefined;
          if (!sp) return;
          const angle = SolarPanelUtil.getRelativeAzimuth(topRotationGroupRef.current.rotation.z);
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

  useEffect(() => {
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, []);

  useFrame(({ camera, scene, raycaster }) => {
    if (!groupRef.current || !topRotationGroupRef.current || !selected || !operationRef.current) return;

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
        handleChangeParent(groupRef.current.parent, parentGroup, parentType, intersection.object);

        // updating mesh
        switch (parentType) {
          case ObjectType.Foundation: {
            groupRef.current.position.x = point.x - parentGroup.position.x;
            groupRef.current.position.y = point.y - parentGroup.position.y;
            groupRef.current.position.z = point.z - parentGroup.position.z;
            groupRef.current.position.applyEuler(tempEuler.set(0, 0, -parentGroup.rotation.z));
            groupRef.current.rotation.set(0, 0, 0);
            if (worldRotationRef.current !== null) {
              topRotationGroupRef.current.rotation.z = worldRotationRef.current - parentGroup.rotation.z;
            } else {
              topRotationGroupRef.current.rotation.z = relativeAzimuth;
            }
            topTiltGroupRef.current.rotation.x = tiltAngle;
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

              // todo: hard code for now
              groupRef.current.rotation.set(HALF_PI, 0, 0);
              topRotationGroupRef.current.rotation.set(0, 0, 0);
              topTiltGroupRef.current.rotation.set(0, 0, 0);
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
                  groupRef.current.rotation.set(0, 0, 0, 'ZXY');
                  if (worldRotationRef.current !== null) {
                    topRotationGroupRef.current.rotation.set(0, 0, worldRotationRef.current - parentGroup.rotation.z);
                  } else {
                    topRotationGroupRef.current.rotation.set(0, 0, relativeAzimuth);
                  }
                  topTiltGroupRef.current.rotation.x = tiltAngle;
                } else {
                  groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2], 'ZXY');
                  topRotationGroupRef.current.rotation.set(0, 0, 0);
                  topTiltGroupRef.current.rotation.set(0, 0, 0);
                }
                // e.normal = normal.toArray(); // todo: normal seems doesn't affect anything
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

        updateHandlesVisibility(parentType, groupRef.current.rotation.x, poleHeight);
        if (SolarPanelUtil.isOnFlatTopSurface(parentType, groupRef.current.rotation.x)) {
          polesGroupRef.current.visible = true;
          topRotationGroupRef.current.position.z = poleHeight + lz / 2;
        } else {
          polesGroupRef.current.visible = false;
          topRotationGroupRef.current.position.z = lz / 2;
        }
        break;
      }
      case Operation.ResizeX:
      case Operation.ResizeY: {
        const anchor = anchorRef.current;
        const pointerOnPlane = tempVector3_0.subVectors(point, anchor);
        const dirVector = groupRef.current.getWorldPosition(tempVector3_1).sub(anchor).normalize();
        const angle = pointerOnPlane.angleTo(dirVector);
        const length = pointerOnPlane.length() * Math.cos(angle);
        dirVector.multiplyScalar(length / 2);

        const parentCenter = parentGroup.getWorldPosition(tempVector3_3);

        const center = tempVector3_2
          .addVectors(anchor, dirVector)
          .sub(parentCenter)
          .applyQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0).invert());

        if (operationRef.current === Operation.ResizeX) {
          boxMeshRef.current.scale.x = Math.abs(length);
        } else if (operationRef.current === Operation.ResizeY) {
          boxMeshRef.current.scale.y = Math.abs(length);
        }
        groupRef.current.position.x = center.x;
        groupRef.current.position.y = center.y;
        groupRef.current.position.z = center.z;

        updateChildMeshes();
        break;
      }
      case Operation.RotateUpper: {
        tempVector3_0.subVectors(point, anchorRef.current).setZ(0);
        let angle = tempVector3_0.angleTo(tempVector3_1.set(0, 1, 0));
        if (tempVector3_0.x > 0) {
          angle = -angle;
        }
        topRotationGroupRef.current.rotation.z =
          angle - tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0)).z;
        break;
      }
      case Operation.RotateLower: {
        tempVector3_0.subVectors(point, anchorRef.current).setZ(0);
        let angle = tempVector3_0.angleTo(tempVector3_1.set(0, -1, 0));
        if (tempVector3_0.x < 0) {
          angle = -angle;
        }

        topRotationGroupRef.current.rotation.z =
          angle - tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0)).z;
        break;
      }
    }
  });

  const groupEuler = useMemo(() => {
    if (parentType === ObjectType.Wall) {
      return new Euler(HALF_PI, 0, 0);
    }
    // on cuboid or roof side faces
    if ((parentType === ObjectType.Cuboid || parentType === ObjectType.Roof) && !Util.isEqual(rotation[0], 0)) {
      return new Euler(rotation[0], rotation[1], rotation[2], 'ZXY');
    }
    return new Euler();
  }, [parentType, ...rotation]);

  const topRotationEuler = useMemo(() => {
    if (parentType === ObjectType.Wall) {
      return new Euler();
    }
    // on cuboid or roof side faces
    if ((parentType === ObjectType.Cuboid || parentType === ObjectType.Roof) && !Util.isEqual(rotation[0], 0)) {
      return new Euler();
    }
    return new Euler(0, 0, relativeAzimuth);
  }, [parentType, ...rotation, relativeAzimuth]);

  const topTiltEuler = useMemo(() => {
    if (!isOnTop) return new Euler(0, 0, 0);
    return new Euler(tiltAngle, 0, 0);
  }, [isOnTop, tiltAngle]);

  // ===

  const topTiltGroupRef = useRef<Group>(null!);

  const tiltHandleRef = useRef<TiltHandleRefPros>(null!);

  // ===

  // todo: rotate handle visiable on wall
  return (
    <group
      name={`Ref_Solar_Panel_Group ${id}`}
      ref={groupRef}
      position={[cx, cy, cz]}
      rotation={groupEuler}
      onPointerDown={onGroupPointerDown}
      onPointerMissed={() => {
        if (selected) {
          SolarPanelUtil.setSelected(id, false);
        }
      }}
    >
      <group
        name={'Top_Rotation_Group'}
        ref={topRotationGroupRef}
        position={[0, 0, panelCenterHeight]}
        rotation={topRotationEuler}
      >
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
            visible={selected}
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
        </group>

        {/* XY intersection plane */}
        {showXYIntersectionPlane && (
          <Plane name={INTERSECTION_PLANE_XY} ref={intersectionPlaneRef} args={[10, 10]} visible={false}>
            <meshBasicMaterial color={'darkgrey'} />
          </Plane>
        )}

        {/* rotate handles group */}
        <group name={'Rotate_Handles_Group'} ref={rotateHandleGroupRef} visible={selected && isOnTop}>
          <RotateHandle
            name={RotateHandleType.Upper}
            position={[0, hly + RotateHandleDist, 0]}
            onPointerDown={onRotateHandlePointerDown}
          />
          <RotateHandle
            name={RotateHandleType.Lower}
            position={[0, -hly - RotateHandleDist, 0]}
            onPointerDown={onRotateHandlePointerDown}
          />
        </group>

        <TiltHandle
          ref={tiltHandleRef}
          tiltAngle={tiltAngle}
          visiable={selected && (isOnTop || parentType === ObjectType.Wall)}
          onPointerDown={onTiltHandlePointerDown}
          onPointerMove={onTiltHandlePointerMove}
        />
      </group>

      {/* poles */}
      <group name={'Poles_Group'} ref={polesGroupRef} visible={isOnTop}>
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

interface TiltHandleProps {
  tiltAngle: number;
  visiable: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
}

interface TiltHandleRefPros {
  setVisiable: (b: boolean) => void;
  setRotationX: (n: number) => void;
}

const TiltHandle = forwardRef<TiltHandleRefPros, TiltHandleProps>(
  ({ tiltAngle, visiable, onPointerDown, onPointerMove }, ref) => {
    const tiltHandleSize = 1;
    const degree = useMemo(() => new Array(13).fill(0), []);

    const [showTiltAngle, setShowTiltAngle] = useState(false);

    const tiltHandleGroupRef = useRef<Group>(null!);
    const tiltHandlePointerRef = useRef<Group>(null!);

    useImperativeHandle(
      ref,
      () => {
        return {
          setVisiable(b: boolean) {
            if (tiltHandleGroupRef.current) {
              tiltHandleGroupRef.current.visible = b;
            }
          },
          setRotationX(n: number) {
            if (tiltHandlePointerRef.current) {
              tiltHandlePointerRef.current.rotation.x = n;
            }
          },
        };
      },
      [],
    );

    const onTiltHandlePointerDown = (event: ThreeEvent<PointerEvent>) => {
      setShowTiltAngle(true);
      onPointerDown(event);
    };

    const onTiltHandlePointerMove = (event: ThreeEvent<PointerEvent>) => {
      onPointerMove(event);
    };

    // onPointerUp
    useEffect(() => {
      const onPointerUp = () => {
        setShowTiltAngle(false);
      };
      window.addEventListener('pointerup', onPointerUp);
      return () => window.addEventListener('pointerup', onPointerUp);
    }, []);

    return (
      <group name={'Tilt_Handle_Group'} ref={tiltHandleGroupRef} visible={visiable}>
        {/* ring handles */}
        <Ring
          name={RotateHandleType.Tilt}
          args={[1, 1.1, 18, 2, -HALF_PI, Math.PI]}
          rotation={[0, -HALF_PI, 0, 'ZXY']}
          onPointerDown={onTiltHandlePointerDown}
        >
          <meshBasicMaterial side={DoubleSide} />
        </Ring>
        {showTiltAngle && (
          <>
            {/* tilt handle intersection plane */}
            <Ring
              name={'Tilt_Handle_Intersection_Plane'}
              args={[tiltHandleSize, 2 * tiltHandleSize, 18, 2, -HALF_PI, Math.PI]}
              rotation={[0, -HALF_PI, 0]}
              onPointerMove={onTiltHandlePointerMove}
            >
              <meshBasicMaterial depthTest={false} transparent={true} opacity={0.5} side={DoubleSide} />
            </Ring>
            {/* scale */}
            {degree.map((e, i) => {
              return (
                <group key={i} rotation={new Euler((Math.PI / 12) * i - HALF_PI, 0, 0, 'ZXY')}>
                  <Line
                    points={[
                      [0, 0, 1.8 * tiltHandleSize],
                      [0, 0, 2 * tiltHandleSize],
                    ]}
                    color={'white'}
                    transparent={true}
                    opacity={0.5}
                  />
                  <textSprite
                    userData={{ unintersectable: true }}
                    text={`${i * 15 - 90}°`}
                    fontSize={20 * tiltHandleSize}
                    fontFace={'Times Roman'}
                    textHeight={0.15 * tiltHandleSize}
                    position={[0, 0, 1.6 * tiltHandleSize]}
                  />
                </group>
              );
            })}
            {/* pointer group */}
            <group ref={tiltHandlePointerRef} rotation={[tiltAngle, 0, 0]}>
              {/* pointer */}
              <Line
                points={[
                  [0, 0, tiltHandleSize],
                  [0, 0, 1.75 * tiltHandleSize],
                ]}
              />

              {/* show current degree */}
              <textSprite
                userData={{ unintersectable: true }}
                text={`${Math.floor((tiltAngle / Math.PI) * 180)}°`}
                fontSize={20 * tiltHandleSize}
                fontFace={'Times Roman'}
                textHeight={0.2 * tiltHandleSize}
                position={[0, 0, 0.75 * tiltHandleSize]}
              />
            </group>
          </>
        )}
      </group>
    );
  },
);

const RotateHandle = ({
  position,
  name,
  onPointerDown,
}: {
  name: string;
  position: [number, number, number];
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) => {
  return (
    <group name={name} position={position} rotation={[HALF_PI, 0, 0]} onPointerDown={onPointerDown}>
      <Torus args={[0.15, 0.05, 6, 8, (3 / 2) * Math.PI]} rotation={[HALF_PI, 0, HALF_PI]}>
        <meshBasicMaterial color={'white'} />
      </Torus>
      <Cone args={[0.1, 0.1, 6]} rotation={[HALF_PI, 0, 0]} position={[0.15, 0, 0.05]}>
        <meshBasicMaterial color={'white'} />
      </Cone>
      <Circle args={[0.05, 6]} rotation={[0, HALF_PI, 0]} position={[0, 0, 0.15]}>
        <meshBasicMaterial color={'white'} />
      </Circle>
      <Plane args={[0.35, 0.35]} position={[0, 0.05, 0]} rotation={[-HALF_PI, 0, 0]} visible={false} />
    </group>
  );
};

export default RefSolarPanel;
