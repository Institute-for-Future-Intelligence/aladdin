/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { Plane } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import MoveHandle from 'src/components/moveHandle';
import ResizeHandle from 'src/components/resizeHandle';
import RotateHandle from 'src/components/rotateHandle';
import { GROUND_ID, HALF_PI, RESIZE_HANDLE_SIZE, TWO_PI } from 'src/constants';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';
import { Util } from 'src/Util';
import { Euler, Mesh, Vector3 } from 'three';
import * as Selector from '../../stores/selector';
import { useHandleSize } from '../wall/hooks';
import { useRefStore } from 'src/stores/commonRef';

interface HandlesProps {
  id: string;
  args: number[];
}

type IntersectionPlaneData = {
  position: Vector3;
  rotation: Euler;
};

enum CuboidFace {
  Top = 'Top',
  NS = 'NS',
  EW = 'EW',
}

const Handles = ({ id, args }: HandlesProps) => {
  const [hx, hy, hz] = args;

  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);

  const orthographic = useStore(Selector.viewState.orthographic);
  const addedCuboidId = useStore(Selector.addedCuboidId);

  const [intersectionPlaneData, setIntersectionPlaneData] = useState<IntersectionPlaneData | null>(null);

  const { gl, raycaster } = useThree();
  const size = useHandleSize();

  const cuboidWorldBottomHeight = useRef<number | null>(null);
  const cuboidWorldPosition = useRef<number[] | null>(null);
  const cuboidWorldRotation = useRef<number | null>(null);
  const parentWorldRotation = useRef<number | null>(null);
  const parentWorldPosition = useRef<Vector3 | null>(null);
  const childPositionMap = useRef<Map<string, Vector3>>(new Map());
  const childSideMap = useRef<Map<string, [string, number]>>(new Map());

  const intersectionPlaneRef = useRef<Mesh>(null);

  const lowerRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, Math.min(-1.2 * hy, -hy - 0.75) - size * 2, RESIZE_HANDLE_SIZE / 2 - hz];
  }, [hy, hz, size]);

  const upperRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, Math.max(1.2 * hy, hy + 0.75) + size * 2, RESIZE_HANDLE_SIZE / 2 - hz];
  }, [hy, hz, size]);

  const showIntersectionPlane = intersectionPlaneData !== null;
  const showTopResizeHandles = !orthographic;
  const showMoveAndRotateHandles = !addedCuboidId;

  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (usePrimitiveStore.getState().duringCameraInteraction) return;
      if (e.intersections.length > 0) {
        // QUICK FIX: For some reason, the top one can sometimes be the ground, so we also go to the second one
        const intersected =
          e.intersections[0].object === e.eventObject ||
          (e.intersections.length > 1 && e.intersections[1].object === e.eventObject);
        if (intersected) {
          setCommonStore((state) => {
            state.hoveredHandle = handle;
            const cm = getElementById(id);
            if (cm) {
              state.selectedElementAngle = cm.rotation[2];
              state.selectedElementHeight = cm.lz;
            }
          });
          if (Util.isMoveHandle(handle)) {
            gl.domElement.style.cursor = 'move';
          } else if (handle === RotateHandleType.Upper || handle === RotateHandleType.Lower) {
            gl.domElement.style.cursor = 'grab';
          } else {
            gl.domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'pointer';
          }
        }
      }
    },
    [],
  );

  const noHoverHandle = useCallback(() => {
    setCommonStore((state) => {
      state.hoveredHandle = null;
    });
    gl.domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'default';
  }, []);

  const getWorldRotation = (id: string): number => {
    const el = getElementById(id);
    if (!el) return 0;

    const rotation = el.rotation[2];
    if (el.parentId === GROUND_ID) return rotation;

    return rotation + getWorldRotation(el.parentId);
  };

  const setCuboidHeight = (id: string, newLz: number) => {
    setCommonStore((state) => {
      const cuboid = state.elements.find((e) => e.id === id);
      if (!cuboid) return;
      cuboid.lz = newLz;
      cuboid.cz = newLz / 2;
      state.selectedElementHeight = newLz;
    });
  };

  const isRefElement = (type: string) => {
    switch (type) {
      case ObjectType.SolarPanel:
      case ObjectType.Human:
      case ObjectType.Flower:
      case ObjectType.Tree:
        return true;
    }
    return false;
  };

  const isAbsPosChildType = (type: string) => {
    return isRefElement(type) || type === ObjectType.Cuboid;
  };

  const resizeXY = (pointer: Vector3) => {
    setCommonStore((state) => {
      const cuboid = state.elements.find((e) => e.id === id);
      if (!cuboid) return;

      const p = pointer.clone().setZ(0);
      const anchor = useStore.getState().resizeAnchor.clone().setZ(0);

      const v = new Vector3().subVectors(p, anchor).applyEuler(new Euler(0, 0, -(cuboidWorldRotation.current ?? 0)));
      const worldCenter = new Vector3().addVectors(p, anchor).multiplyScalar(0.5);
      const { pos, rot } = Util.getWorldDataById(cuboid.parentId);
      const center = new Vector3().subVectors(worldCenter, pos).applyEuler(new Euler(0, 0, -rot));
      cuboid.cx = center.x;
      cuboid.cy = center.y;
      const newLx = Math.abs(v.x);
      const newLy = Math.abs(v.y);
      cuboid.lx = newLx;
      cuboid.ly = newLy;

      const currWorldPosition = new Vector3(center.x, center.y, cuboid.cz).applyEuler(new Euler(0, 0, rot)).add(pos);
      const currWorldRotation = cuboid.rotation[2] + rot;
      if (childPositionMap.current.size > 0) {
        for (const e of state.elements) {
          const childWorldPosition = childPositionMap.current.get(e.id);
          if (childWorldPosition) {
            const relPos = childWorldPosition
              .clone()
              .sub(currWorldPosition)
              .applyEuler(new Euler(0, 0, -currWorldRotation));
            if (isRefElement(e.type)) {
              const c = childSideMap.current.get(e.id);
              if (c) {
                const [face, sign] = c;
                if (face === CuboidFace.Top) {
                  e.cx = relPos.x;
                  e.cy = relPos.y;
                } else if (face === CuboidFace.NS) {
                  e.cx = relPos.x;
                  e.cy = Math.sign(sign) * (newLy / 2);
                } else if (face === CuboidFace.EW) {
                  e.cx = Math.sign(sign) * (newLx / 2);
                  e.cy = relPos.y;
                }
              }
            } else if (e.type === ObjectType.Cuboid) {
              e.cx = relPos.x;
              e.cy = relPos.y;
            } else {
              e.cx = relPos.x / newLx;
              e.cy = relPos.y / newLy;
            }
          }
        }
      }
    });
  };

  const resizeLx = (pointer: Vector3) => {
    setCommonStore((state) => {
      const cuboid = state.elements.find((e) => e.id === id);
      if (!cuboid) return;

      const p = pointer.clone().setZ(0);
      const anchor = useStore.getState().resizeAnchor.clone().setZ(0);

      const v = new Vector3().subVectors(p, anchor).applyEuler(new Euler(0, 0, -(cuboidWorldRotation.current ?? 0)));
      const worldCenter = new Vector3().addVectors(p, anchor).multiplyScalar(0.5);
      const { pos, rot } = Util.getWorldDataById(cuboid.parentId);
      const center = new Vector3().subVectors(worldCenter, pos).applyEuler(new Euler(0, 0, -rot));
      cuboid.cx = center.x;
      const newLx = Math.abs(v.x);
      cuboid.lx = newLx;

      const currWorldPosition = new Vector3(center.x, center.y, cuboid.cz).applyEuler(new Euler(0, 0, rot)).add(pos);
      const currWorldRotation = cuboid.rotation[2] + rot;
      if (childPositionMap.current.size > 0) {
        for (const e of state.elements) {
          const childWorldPosition = childPositionMap.current.get(e.id);
          if (childWorldPosition) {
            const relPos = childWorldPosition
              .clone()
              .sub(currWorldPosition)
              .applyEuler(new Euler(0, 0, -currWorldRotation));
            if (isRefElement(e.type)) {
              const c = childSideMap.current.get(e.id);
              if (c) {
                const [face, sign] = c;
                if (face === CuboidFace.Top) {
                  e.cx = relPos.x;
                } else if (face === CuboidFace.NS) {
                  e.cx = relPos.x;
                } else if (face === CuboidFace.EW) {
                  e.cx = Math.sign(sign) * (newLx / 2);
                }
              }
            } else if (e.type === ObjectType.Cuboid) {
              e.cx = relPos.x;
            } else {
              e.cx = relPos.x / newLx;
            }
          }
        }
      }
    });
  };

  const resizeLy = (pointer: Vector3) => {
    setCommonStore((state) => {
      const cuboid = state.elements.find((e) => e.id === id);
      if (!cuboid) return;

      const p = pointer.clone().setZ(0);
      const anchor = useStore.getState().resizeAnchor.clone().setZ(0);

      const v = new Vector3().subVectors(p, anchor).applyEuler(new Euler(0, 0, -(cuboidWorldRotation.current ?? 0)));
      const worldCenter = new Vector3().addVectors(p, anchor).multiplyScalar(0.5);
      const { pos, rot } = Util.getWorldDataById(cuboid.parentId);
      const center = new Vector3().subVectors(worldCenter, pos).applyEuler(new Euler(0, 0, -rot));
      cuboid.cy = center.y;
      const newLy = Math.abs(v.y);
      cuboid.ly = newLy;

      const currWorldPosition = new Vector3(center.x, center.y, cuboid.cz).applyEuler(new Euler(0, 0, rot)).add(pos);
      const currWorldRotation = cuboid.rotation[2] + rot;
      if (childPositionMap.current.size > 0) {
        for (const e of state.elements) {
          const childWorldPosition = childPositionMap.current.get(e.id);
          if (childWorldPosition) {
            const relPos = childWorldPosition
              .clone()
              .sub(currWorldPosition)
              .applyEuler(new Euler(0, 0, -currWorldRotation));
            if (isRefElement(e.type)) {
              const c = childSideMap.current.get(e.id);
              if (c) {
                const [face, sign] = c;
                if (face === CuboidFace.Top) {
                  e.cy = relPos.y;
                } else if (face === CuboidFace.NS) {
                  e.cy = Math.sign(sign) * (newLy / 2);
                } else if (face === CuboidFace.EW) {
                  e.cy = relPos.y;
                }
              }
            } else if (e.type === ObjectType.Cuboid) {
              e.cy = relPos.y;
            } else {
              e.cy = relPos.y / newLy;
            }
          }
        }
      }
    });
  };

  const resizeLz = (pointer: Vector3) => {
    if (cuboidWorldBottomHeight.current !== null) {
      const newLz = Math.max(1, pointer.z - cuboidWorldBottomHeight.current);
      setCommonStore((state) => {
        for (const e of state.elements) {
          if (e.id === id) {
            e.lz = newLz;
            e.cz = newLz / 2;
            state.selectedElementHeight = newLz;
          }
          if (e.parentId === id && isRefElement(e.type)) {
            const c = childSideMap.current.get(e.id);
            if (c && c[0] === CuboidFace.Top) {
              e.cz = newLz / 2;
            }
          }
        }
      });
    }
  };

  const handleRotate = (pointer: Vector3) => {
    if (cuboidWorldPosition.current) {
      const [cx, cy] = cuboidWorldPosition.current;
      let rotation =
        Math.atan2(cx - pointer.x, pointer.y - cy) +
        (useStore.getState().rotateHandleType === RotateHandleType.Upper ? 0 : Math.PI);
      const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * TWO_PI : 0;
      if (parentWorldRotation.current) {
        rotation -= parentWorldRotation.current;
      }
      useStore.getState().updateElementRotationById(id, 0, 0, rotation + offset);
    }
  };

  // pointer down events
  const handleBottomResizeHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (
      (e.intersections.length > 0 && e.intersections[0].object.name === e.object.name) ||
      useStore.getState().addedCuboidId
    ) {
      const cuboid = getElementById(id);
      if (cuboid && cuboid.parentId !== GROUND_ID) {
        setIntersectionPlaneData({ position: new Vector3(0, 0, -hz), rotation: new Euler() });
        const { pos: parentWorldPos, rot: parentWorldRot } = Util.getWorldDataById(cuboid.parentId);
        parentWorldPosition.current = parentWorldPos;
        parentWorldRotation.current = parentWorldRot;
        cuboidWorldRotation.current = parentWorldRot + cuboid.rotation[2];
        const cuboidWorldPosition = new Vector3(cuboid.cx, cuboid.cy, cuboid.cz)
          .applyEuler(new Euler(0, 0, parentWorldRot))
          .add(parentWorldPos);

        const children = useStore
          .getState()
          .elements.filter(
            (e) => e.parentId === cuboid.id && (isAbsPosChildType(e.type) || Util.isIdentical(e.normal, [0, 0, 1])),
          );
        childPositionMap.current.clear();
        childSideMap.current.clear();
        for (const child of children) {
          const worldPos = new Vector3();
          if (isRefElement(child.type)) {
            worldPos.set(child.cx, child.cy, child.cz);
            if (Math.abs(child.cz - hz) < 0.01) {
              childSideMap.current.set(child.id, [CuboidFace.Top, 1]);
            } else if (Math.abs(Math.abs(child.cx) - hx) < 0.01) {
              childSideMap.current.set(child.id, [CuboidFace.EW, Math.sign(child.cx)]);
            } else {
              childSideMap.current.set(child.id, [CuboidFace.NS, Math.sign(child.cy)]);
            }
          } else if (child.type === ObjectType.Cuboid) {
            worldPos.set(child.cx, child.cy, child.cz);
          } else {
            worldPos.set(child.cx * cuboid.lx, child.cy * cuboid.ly, 0);
          }
          worldPos.applyEuler(new Euler(0, 0, cuboidWorldRotation.current)).add(cuboidWorldPosition);
          childPositionMap.current.set(child.id, worldPos);
        }
      }
      setCommonStore((state) => {
        state.selectedElementIdSet.clear();
        state.selectedElementIdSet.add(id);
        state.selectedElement = state.elements.find((e) => e.id === id) ?? null;
      });
    }
  };

  const handleTopResizeHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].object.name === e.object.name) {
      const handleObject = e.intersections[0].object;
      const cameraDirection = useStore.getState().cameraDirection;
      const rotation = Math.atan2(cameraDirection.x, cameraDirection.y) + getWorldRotation(id);
      setIntersectionPlaneData({ position: handleObject.position.clone(), rotation: new Euler(-HALF_PI, rotation, 0) });
      const topHandleWorldPosition = handleObject.localToWorld(new Vector3());
      cuboidWorldBottomHeight.current = topHandleWorldPosition.z - hz * 2;
      const children = useStore.getState().elements.filter((e) => e.parentId === id && isRefElement(e.type));

      childSideMap.current.clear();
      for (const child of children) {
        const worldPos = new Vector3();
        worldPos.set(child.cx, child.cy, child.cz);
        if (Math.abs(child.cz - hz) < 0.01) {
          childSideMap.current.set(child.id, [CuboidFace.Top, 1]);
        }
      }

      setCommonStore((state) => {
        state.selectedElementIdSet.clear();
        state.selectedElementIdSet.add(id);
        state.selectedElement = state.elements.find((e) => e.id === id) ?? null;
      });
    }
  };

  const handleRotateHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].object.name === e.object.name) {
      setIntersectionPlaneData({ position: new Vector3(0, 0, -hz), rotation: new Euler(0, 0, 0) });
      const handleGroup = e.eventObject;
      cuboidWorldPosition.current = handleGroup.localToWorld(new Vector3()).toArray();
      const cuboid = getElementById(id);
      if (cuboid) {
        parentWorldRotation.current = getWorldRotation(cuboid.parentId);
      }
    }
  };

  const handleMoveHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0) {
      const handleType = e.intersections[0].eventObject.name;
      switch (handleType) {
        case MoveHandleType.Lower:
        case MoveHandleType.Upper:
        case MoveHandleType.Left:
        case MoveHandleType.Right:
        case MoveHandleType.Top: {
          useStore.getState().set((state) => {
            const cuboid = state.elements.find((e) => e.id === id) ?? null;
            if (!cuboid) return;

            state.selectedElement = cuboid;
            if (cuboid.parentId === GROUND_ID) {
              for (const e of state.elements) {
                if (state.selectedElementIdSet.has(e.id) && !Util.isElementAllowedMultipleMoveOnGround(e)) {
                  state.selectedElementIdSet.delete(e.id);
                }
              }
            } else {
              state.selectedElementIdSet.clear();
              state.selectedElementIdSet.add(cuboid.id);
            }
            state.moveHandleType = handleType;
          });
          useRefStore.getState().setEnableOrbitController(false);
          break;
        }
      }
    }
  };

  // pointer move event
  const handleIntersectionPlaneMove = (e: ThreeEvent<PointerEvent>) => {
    // set ray cast, need change wall together
    if (intersectionPlaneRef.current) {
      const intersections = raycaster.intersectObject(intersectionPlaneRef.current);
      if (intersections.length) {
        const pointer = intersections[0].point;
        // resize
        const resizeHandleType = useStore.getState().resizeHandleType;
        if (resizeHandleType) {
          if (Util.isTopResizeHandle(resizeHandleType)) {
            resizeLz(pointer);
          } else if (Util.isXResizeHandle(resizeHandleType)) {
            resizeLx(pointer);
          } else if (Util.isYResizeHandle(resizeHandleType)) {
            resizeLy(pointer);
          } else {
            resizeXY(pointer);
          }
        }
        // rotate
        else if (useStore.getState().rotateHandleType) {
          handleRotate(pointer);
        }
      }
    }
  };

  // pointer up
  const handleIntersectionPlanePointerUp = () => {
    setIntersectionPlaneData(null);
    cuboidWorldBottomHeight.current = null;
    cuboidWorldPosition.current = null;
    cuboidWorldRotation.current = null;
    parentWorldRotation.current = null;
    parentWorldPosition.current = null;
  };

  return (
    <>
      {/* intersection plane */}
      {showIntersectionPlane && (
        <Plane
          name="Cuboid Intersection Plane"
          ref={intersectionPlaneRef}
          args={[10000, 10000]}
          position={intersectionPlaneData.position}
          rotation={intersectionPlaneData.rotation}
          visible={false}
          onPointerMove={handleIntersectionPlaneMove}
          onPointerUp={handleIntersectionPlanePointerUp}
        />
      )}

      {/* bottom resize handles */}
      <group
        name="Bottom Resize Handle Group"
        position={[0, 0, -hz + size / 2]}
        onPointerDown={handleBottomResizeHandlePointerDown}
      >
        <ResizeHandle
          handleType={ResizeHandleType.UpperLeft}
          position={[-hx, hy, 0]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.UpperRight}
          position={[hx, hy, 0]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.LowerLeft}
          position={[-hx, -hy, 0]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.LowerRight}
          position={[hx, -hy, 0]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.Left}
          position={[-hx, 0, 0]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.Right}
          position={[hx, 0, 0]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.Upper}
          position={[0, hy, 0]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.Lower}
          position={[0, -hy, 0]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
      </group>

      {/* top resize handles */}
      {showTopResizeHandles && (
        <group name="Cuboid Top Resize Handle Group" onPointerDown={handleTopResizeHandlePointerDown}>
          <ResizeHandle
            handleType={ResizeHandleType.LowerLeftTop}
            position={[-hx, -hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.UpperLeftTop}
            position={[-hx, hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.LowerRightTop}
            position={[hx, -hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.UpperRightTop}
            position={[hx, hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
        </group>
      )}

      {/* move and rotate handles */}
      {showMoveAndRotateHandles && (
        <>
          {/* move handles */}
          <group name="Cuboid Move Handle Group" onPointerDown={handleMoveHandlePointerDown}>
            <MoveHandle
              handleType={MoveHandleType.Lower}
              position={[0, -hy - size * 1.2, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Upper}
              position={[0, hy + size * 1.2, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Left}
              position={[-hx - size * 1.2, 0, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Right}
              position={[hx + size * 1.2, 0, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Top}
              position={[0, 0, hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
          </group>

          {/* rotate handles */}
          <group name="Cuboid Rotate Handle Group" onPointerDown={handleRotateHandlePointerDown}>
            <RotateHandle
              id={id}
              handleType={RotateHandleType.Lower}
              position={lowerRotateHandlePosition}
              ratio={size * 4}
              hoverHandle={hoverHandle}
              noHoverHandle={noHoverHandle}
            />
            <RotateHandle
              id={id}
              position={upperRotateHandlePosition}
              handleType={RotateHandleType.Upper}
              ratio={size * 4}
              hoverHandle={hoverHandle}
              noHoverHandle={noHoverHandle}
            />
          </group>
        </>
      )}
    </>
  );
};

export default React.memo(Handles);
