/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Line, Plane, Sphere } from '@react-three/drei';
import { Euler, Face, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { CuboidModel } from '../models/CuboidModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import {
  RESIZE_HANDLE_SIZE,
  MOVE_HANDLE_OFFSET,
  MOVE_HANDLE_RADIUS,
  HIGHLIGHT_HANDLE_COLOR,
  RESIZE_HANDLE_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_COLOR_2,
  MOVE_HANDLE_COLOR_3,
} from '../constants';
import { Util } from '../Util';
import { ElementModel } from '../models/ElementModel';
import RotateHandle from '../components/rotateHandle';

const Cuboid = ({
  id,
  cx,
  cy,
  lx = 1,
  ly = 1,
  lz = 1,
  rotation = [0, 0, 0],
  color = 'silver',
  lineColor = 'black',
  lineWidth = 0.1,
  selected = false,
  locked = false,
}: CuboidModel) => {
  const setCommonStore = useStore((state) => state.set);
  const viewState = useStore((state) => state.viewState);
  const moveHandleType = useStore((state) => state.moveHandleType);
  const rotateHandleType = useStore((state) => state.rotateHandleType);
  const resizeHandleType = useStore((state) => state.resizeHandleType);
  const getElementById = useStore((state) => state.getElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const addElement = useStore((state) => state.addElement);
  const setElementPosition = useStore((state) => state.setElementPosition);
  const setElementNormal = useStore((state) => state.setElementNormal);
  const objectTypeToAdd = useStore((state) => state.objectTypeToAdd);
  const selectMe = useStore((state) => state.selectMe);

  const {
    camera,
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [normal, setNormal] = useState<Vector3>();
  const ray = useMemo(() => new Raycaster(), []);

  const elementModel = getElementById(id);
  const baseRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const faceNormalRef = useRef<Vector3>(Util.UNIT_VECTOR_POS_Z);
  const gridLength = useRef<number>(10);
  const gridPositionRef = useRef<Vector3>(new Vector3(0, 0, 0));
  const gridRotationRef = useRef<Euler>(new Euler(0, 0, 0));
  const gridScale = useRef<Vector3>(new Vector3(1, 1, 1));
  const resizeHandleLLTopRef = useRef<Mesh>();
  const resizeHandleULTopRef = useRef<Mesh>();
  const resizeHandleLRTopRef = useRef<Mesh>();
  const resizeHandleURTopRef = useRef<Mesh>();
  const resizeHandleLLBotRef = useRef<Mesh>();
  const resizeHandleULBotRef = useRef<Mesh>();
  const resizeHandleLRBotRef = useRef<Mesh>();
  const resizeHandleURBotRef = useRef<Mesh>();
  const moveHandleLowerFaceRef = useRef<Mesh>();
  const moveHandleUpperFaceRef = useRef<Mesh>();
  const moveHandleLeftFaceRef = useRef<Mesh>();
  const moveHandleRightFaceRef = useRef<Mesh>();
  const moveHandleTopFaceRef = useRef<Mesh>();

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLLTop = useMemo(() => new Vector3(-hx, -hy, hz), [hx, hy, hz]);
  const positionULTop = useMemo(() => new Vector3(-hx, hy, hz), [hx, hy, hz]);
  const positionLRTop = useMemo(() => new Vector3(hx, -hy, hz), [hx, hy, hz]);
  const positionURTop = useMemo(() => new Vector3(hx, hy, hz), [hx, hy, hz]);
  const positionLLBot = useMemo(() => new Vector3(-hx, -hy, -hz), [hx, hy, hz]);
  const positionULBot = useMemo(() => new Vector3(-hx, hy, -hz), [hx, hy, hz]);
  const positionLRBot = useMemo(() => new Vector3(hx, -hy, -hz), [hx, hy, hz]);
  const positionURBot = useMemo(() => new Vector3(hx, hy, -hz), [hx, hy, hz]);

  const handleLift = MOVE_HANDLE_RADIUS;
  const positionLowerFace = useMemo(() => new Vector3(0, -hy - MOVE_HANDLE_OFFSET, handleLift - hz), [hy, hz]);
  const positionUpperFace = useMemo(() => new Vector3(0, hy + MOVE_HANDLE_OFFSET, handleLift - hz), [hy, hz]);
  const positionLeftFace = useMemo(() => new Vector3(-hx - MOVE_HANDLE_OFFSET, 0, handleLift - hz), [hx, hz]);
  const positionRightFace = useMemo(() => new Vector3(hx + MOVE_HANDLE_OFFSET, 0, handleLift - hz), [hx, hz]);
  const positionTopFace = useMemo(() => new Vector3(0, 0, hz + MOVE_HANDLE_OFFSET), [hz]);

  useEffect(() => {
    const handlePointerUp = () => {
      grabRef.current = null;
      setShowGrid(false);
      setCommonStore((state) => {
        state.enableOrbitController = true;
      });
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('poinerup', handlePointerUp);
    };
  }, []);

  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (e.intersections.length > 0) {
        const intersected = e.intersections[0].object === e.eventObject;
        if (intersected) {
          setHoveredHandle(handle);
          if (
            // unfortunately, I cannot find a way to tell the type of an enum variable
            handle === MoveHandleType.Top ||
            handle === MoveHandleType.Upper ||
            handle === MoveHandleType.Lower ||
            handle === MoveHandleType.Left ||
            handle === MoveHandleType.Right ||
            handle === RotateHandleType.Upper ||
            handle === RotateHandleType.Lower
          ) {
            domElement.style.cursor = 'move';
          } else {
            domElement.style.cursor = 'pointer';
          }
        }
      }
    },
    [],
  );

  const noHoverHandle = useCallback(() => {
    setHoveredHandle(null);
    domElement.style.cursor = 'default';
  }, []);

  // only these elements are allowed to be on the cuboid
  const legalOnCuboid = (type: ObjectType) => {
    return type === ObjectType.Sensor;
  };

  const setupGridHelper = (face: Vector3) => {
    faceNormalRef.current = face;
    if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_POS_Z)) {
      gridLength.current = Math.max(lx, ly);
      gridPositionRef.current = new Vector3(0, 0, hz);
      gridRotationRef.current = new Euler(Math.PI / 2, 0, 0);
      gridScale.current = new Vector3(lx / gridLength.current, 1, ly / gridLength.current);
    } else if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_POS_X)) {
      // east face in view coordinate system
      gridLength.current = Math.max(ly, lz);
      gridPositionRef.current = new Vector3(hx, 0, 0);
      gridRotationRef.current = new Euler(0, 0, Util.HALF_PI);
      gridScale.current = new Vector3(ly / gridLength.current, 1, lz / gridLength.current);
    } else if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_NEG_X)) {
      // west face in view coordinate system
      gridLength.current = Math.max(ly, lz);
      gridPositionRef.current = new Vector3(-hx, 0, 0);
      gridRotationRef.current = new Euler(0, 0, -Util.HALF_PI);
      gridScale.current = new Vector3(ly / gridLength.current, 1, lz / gridLength.current);
    } else if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_NEG_Y)) {
      // south face in the view coordinate system
      gridLength.current = Math.max(lx, lz);
      gridPositionRef.current = new Vector3(0, -hy, 0);
      gridRotationRef.current = new Euler(0, 0, 0);
      gridScale.current = new Vector3(lx / gridLength.current, 1, lz / gridLength.current);
    } else if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_POS_Y)) {
      // north face in the view coordinate system
      gridLength.current = Math.max(lx, lz);
      gridPositionRef.current = new Vector3(0, hy, 0);
      gridRotationRef.current = new Euler(0, 0, 0);
      gridScale.current = new Vector3(lx / gridLength.current, 1, lz / gridLength.current);
    }
  };

  const ratio = Math.max(1, Math.max(lx, ly) / 8);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
  const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;
  const lowerRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, Math.min(-1.2 * hy, -hy - 0.75), RESIZE_HANDLE_SIZE / 2 - hz];
  }, [hy, hz]);
  const upperRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, Math.max(1.2 * hy, hy + 0.75), RESIZE_HANDLE_SIZE / 2 - hz];
  }, [hy, hz]);

  return (
    <group name={'Cuboid Group ' + id} position={[cx, cy, hz]} rotation={[0, 0, rotation[2]]}>
      {/* draw rectangular cuboid */}
      <Box
        castShadow={viewState.shadowEnabled}
        receiveShadow={viewState.shadowEnabled}
        userData={{ simulation: true, aabb: true }}
        uuid={id}
        ref={baseRef}
        args={[lx, ly, lz]}
        name={'Cuboid'}
        onPointerDown={(e) => {
          if (e.button === 2) return; // ignore right-click
          selectMe(id, e, ActionType.Select);
          const selectedElement = getSelectedElement();
          if (selectedElement?.id === id) {
            // no child of this cuboid is clicked
            if (legalOnCuboid(objectTypeToAdd) && elementModel) {
              setShowGrid(true);
              const intersection = e.intersections[0];
              addElement(elementModel, intersection.point, intersection.face?.normal);
              setCommonStore((state) => {
                state.objectTypeToAdd = ObjectType.None;
              });
            }
          } else {
            // a child of this cuboid is clicked
            if (selectedElement) {
              if (legalOnCuboid(selectedElement.type as ObjectType)) {
                setShowGrid(true);
                grabRef.current = selectedElement;
                let face;
                for (const x of e.intersections) {
                  if (x.object === baseRef.current) {
                    face = x.face;
                    break;
                  }
                }
                if (face) {
                  setupGridHelper(face.normal);
                  if (!normal || !normal.equals(face.normal)) {
                    setNormal(face.normal);
                  }
                }
                setCommonStore((state) => {
                  state.enableOrbitController = false;
                });
              }
            }
          }
        }}
        onPointerMove={(e) => {
          if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
            const mouse = new Vector2();
            mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
            mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
            ray.setFromCamera(mouse, camera);
            let intersects;
            switch (grabRef.current.type) {
              case ObjectType.Sensor:
                if (baseRef.current) {
                  intersects = ray.intersectObjects([baseRef.current]);
                  if (intersects.length > 0) {
                    let p = intersects[0].point;
                    const face = intersects[0].face;
                    if (face) {
                      const n = face.normal;
                      if (normal && !normal.equals(n)) setNormal(n);
                      setupGridHelper(n);
                      setElementNormal(grabRef.current.id, n.x, n.y, n.z);
                    }
                    if (elementModel) {
                      p = Util.relativeCoordinates(p.x, p.y, p.z, elementModel);
                    }
                    setElementPosition(grabRef.current.id, p.x, p.y, p.z);
                  }
                }
                break;
            }
          }
        }}
        onContextMenu={(e) => {
          selectMe(id, e, ActionType.Select);
          setCommonStore((state) => {
            state.pastePoint.copy(e.intersections[0].point);
            const face = e.intersections[0].face;
            if (face) {
              state.pasteNormal = face.normal.clone();
            }
            state.clickObjectType = ObjectType.Cuboid;
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === baseRef.current;
              if (intersected) {
                state.contextMenuObjectType = ObjectType.Cuboid;
              }
            }
          });
        }}
        onPointerOver={(e) => {
          if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === baseRef.current;
            if (intersected) {
              setHovered(true);
            }
          }
        }}
        onPointerOut={(e) => {
          setHovered(false);
        }}
      >
        <meshStandardMaterial attach="material" color={color} />
      </Box>

      {showGrid && (
        <gridHelper
          name={'Cuboid Grid'}
          position={gridPositionRef.current}
          rotation={gridRotationRef.current}
          scale={gridScale.current}
          args={[gridLength.current, 20, 'gray', 'gray']}
        />
      )}

      {!selected && (
        <>
          {/* draw wireframe lines top */}
          <Line
            points={[positionLLTop, positionLRTop]}
            name={'Line LL-LR Top'}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            points={[positionLRTop, positionURTop]}
            name={'Line LR-UR Top'}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            points={[positionURTop, positionULTop]}
            name={'Line UR-UL Top'}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            points={[positionULTop, positionLLTop]}
            name={'Line UL-LL Top'}
            lineWidth={lineWidth}
            color={lineColor}
          />

          {/* draw wireframe lines lower face */}
          <Line
            points={[positionLLBot, positionLRBot]}
            name={'Line LL-LR Bottom'}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            points={[positionLRBot, positionURBot]}
            name={'Line LR-UR Bottom'}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            points={[positionURBot, positionULBot]}
            name={'Line UR-UL Bottom'}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            points={[positionULBot, positionLLBot]}
            name={'Line UL-LL Bottom'}
            lineWidth={lineWidth}
            color={lineColor}
          />

          {/* draw wireframe vertical lines */}
          <Line
            points={[positionLLBot, positionLLTop]}
            name={'Line LL-LL Vertical'}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            points={[positionLRBot, positionLRTop]}
            name={'Line LR-LR Vertical'}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            points={[positionULBot, positionULTop]}
            name={'Line UL-UL Vertical'}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            points={[positionURBot, positionURTop]}
            name={'Line UR-UR Vertical'}
            lineWidth={lineWidth}
            color={lineColor}
          />
        </>
      )}

      {/* draw handles */}
      {selected && !locked && (
        <>
          {/* resize handles */}
          <Box
            ref={resizeHandleLLTopRef}
            name={ResizeHandleType.LowerLeftTop}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={positionLLTop}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.LowerLeftTop);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.LowerLeftTop || resizeHandleType === ResizeHandleType.LowerLeftTop
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleULTopRef}
            name={ResizeHandleType.UpperLeftTop}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={positionULTop}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.UpperLeftTop);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.UpperLeftTop || resizeHandleType === ResizeHandleType.UpperLeftTop
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleLRTopRef}
            name={ResizeHandleType.LowerRightTop}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={positionLRTop}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.LowerRightTop);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.LowerRightTop || resizeHandleType === ResizeHandleType.LowerRightTop
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleURTopRef}
            name={ResizeHandleType.UpperRightTop}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={positionURTop}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.UpperRightTop);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.UpperRightTop || resizeHandleType === ResizeHandleType.UpperRightTop
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleLLBotRef}
            name={ResizeHandleType.LowerLeft}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={new Vector3(-hx, -hy, RESIZE_HANDLE_SIZE / 2 - hz)}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleLLBotRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleLLBotRef.current!.localToWorld(new Vector3(lx, ly, 0));
                  state.resizeAnchor.set(anchor.x, anchor.y);
                });
              }
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.LowerLeft);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.LowerLeft || resizeHandleType === ResizeHandleType.LowerLeft
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleULBotRef}
            name={ResizeHandleType.UpperLeft}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={new Vector3(-hx, hy, RESIZE_HANDLE_SIZE / 2 - hz)}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleULBotRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleULBotRef.current!.localToWorld(new Vector3(lx, -ly, 0));
                  state.resizeAnchor.set(anchor.x, anchor.y);
                });
              }
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.UpperLeft);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.UpperLeft || resizeHandleType === ResizeHandleType.UpperLeft
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleLRBotRef}
            name={ResizeHandleType.LowerRight}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={new Vector3(hx, -hy, RESIZE_HANDLE_SIZE / 2 - hz)}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleLRBotRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleLRBotRef.current!.localToWorld(new Vector3(-lx, ly, 0));
                  state.resizeAnchor.set(anchor.x, anchor.y);
                });
              }
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.LowerRight);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.LowerRight || resizeHandleType === ResizeHandleType.LowerRight
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleURBotRef}
            name={ResizeHandleType.UpperRight}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={new Vector3(hx, hy, RESIZE_HANDLE_SIZE / 2 - hz)}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleURBotRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleURBotRef.current!.localToWorld(new Vector3(-lx, -ly, 0));
                  state.resizeAnchor.set(anchor.x, anchor.y);
                });
              }
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.UpperRight);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.UpperRight || resizeHandleType === ResizeHandleType.UpperRight
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>

          {/* move handles */}
          <Sphere
            ref={moveHandleLowerFaceRef}
            args={[moveHandleSize, 6, 6]}
            name={MoveHandleType.Lower}
            position={positionLowerFace}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Lower);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === MoveHandleType.Lower || moveHandleType === MoveHandleType.Lower
                  ? HIGHLIGHT_HANDLE_COLOR
                  : MOVE_HANDLE_COLOR_2
              }
            />
          </Sphere>
          <Sphere
            ref={moveHandleUpperFaceRef}
            args={[moveHandleSize, 6, 6]}
            name={MoveHandleType.Upper}
            position={positionUpperFace}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Upper);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === MoveHandleType.Upper || moveHandleType === MoveHandleType.Upper
                  ? HIGHLIGHT_HANDLE_COLOR
                  : MOVE_HANDLE_COLOR_2
              }
            />
          </Sphere>
          <Sphere
            ref={moveHandleLeftFaceRef}
            args={[moveHandleSize, 6, 6]}
            name={MoveHandleType.Left}
            position={positionLeftFace}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Left);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === MoveHandleType.Left || moveHandleType === MoveHandleType.Left
                  ? HIGHLIGHT_HANDLE_COLOR
                  : MOVE_HANDLE_COLOR_1
              }
            />
          </Sphere>
          <Sphere
            ref={moveHandleRightFaceRef}
            args={[moveHandleSize, 6, 6]}
            name={MoveHandleType.Right}
            position={positionRightFace}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Right);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === MoveHandleType.Right || moveHandleType === MoveHandleType.Right
                  ? HIGHLIGHT_HANDLE_COLOR
                  : MOVE_HANDLE_COLOR_1
              }
            />
          </Sphere>
          <Sphere
            ref={moveHandleTopFaceRef}
            args={[moveHandleSize, 6, 6]}
            name={MoveHandleType.Top}
            position={positionTopFace}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Top);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === MoveHandleType.Top || moveHandleType === MoveHandleType.Top
                  ? HIGHLIGHT_HANDLE_COLOR
                  : MOVE_HANDLE_COLOR_3
              }
            />
          </Sphere>

          {/* rotate handles */}
          <RotateHandle
            id={id}
            position={lowerRotateHandlePosition}
            color={
              hoveredHandle === RotateHandleType.Lower || rotateHandleType === RotateHandleType.Lower
                ? HIGHLIGHT_HANDLE_COLOR
                : RESIZE_HANDLE_COLOR
            }
            ratio={ratio}
            handleType={RotateHandleType.Lower}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
          <RotateHandle
            id={id}
            position={upperRotateHandlePosition}
            color={
              hoveredHandle === RotateHandleType.Upper || rotateHandleType === RotateHandleType.Upper
                ? HIGHLIGHT_HANDLE_COLOR
                : RESIZE_HANDLE_COLOR
            }
            ratio={ratio}
            handleType={RotateHandleType.Upper}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
        </>
      )}

      {hovered && !selected && (
        <textSprite
          name={'Label'}
          text={'Box'}
          fontSize={20}
          fontFace={'Times Roman'}
          textHeight={0.2}
          position={[0, 0, hz + 0.2]}
        />
      )}
    </group>
  );
};

export default React.memo(Cuboid);
