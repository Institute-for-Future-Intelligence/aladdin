/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { Plane } from '@react-three/drei';
import { Box3, DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { IntersectionPlaneType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import { ElementModel } from '../models/ElementModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { MOVE_HANDLE_OFFSET, MOVE_HANDLE_RADIUS } from '../constants';
import { Util } from '../Util';
import { UndoableMove } from '../undo/UndoableMove';
import { UndoableResize } from '../undo/UndoableResize';
import { UndoableRotate } from '../undo/UndoableRotate';
import { UndoableAdd } from '../undo/UndoableAdd';
import { WallModel } from 'src/models/WallModel';

interface WallAbsPos {
  leftPointAbsPos: Vector3;
  rightPointAbsPos: Vector3;
  centerPointAbsPos: Vector3;
}

const Ground = () => {
  const setCommonStore = useStore(Selector.set);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectNone = useStore(Selector.selectNone);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const moveHandleType = useStore(Selector.moveHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeAnchor = useStore(Selector.resizeAnchor);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setElementSize = useStore(Selector.setElementSize);
  const setElementRotation = useStore(Selector.updateElementRotationById);
  const updateElementCzById = useStore(Selector.updateElementCzById);
  const updateElementLzById = useStore(Selector.updateElementLzById);
  const addElement = useStore(Selector.addElement);
  const getElementById = useStore(Selector.getElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);
  const addUndoable = useStore(Selector.addUndoable);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const groundColor = useStore(Selector.viewState.groundColor);
  const groundModel = useStore((state) => state.world.ground);

  const {
    camera,
    gl: { domElement },
    scene,
  } = useThree();
  const groundPlaneRef = useRef<Mesh>();
  const intersectionPlaneRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const newDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldRotationRef = useRef<number[]>([0, 0, 1]);
  const newRotationRef = useRef<number[]>([0, 0, 1]);
  const wallsAbsPosMapRef = useRef<Map<string, WallAbsPos>>(new Map());

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const ray = useMemo(() => new Raycaster(), []);
  const cosAngle = useMemo(() => {
    if (grabRef.current) {
      return Math.cos(grabRef.current.rotation[2]);
    }
    return 1;
  }, [grabRef.current?.rotation]);
  const sinAngle = useMemo(() => {
    if (grabRef.current) {
      return Math.sin(grabRef.current.rotation[2]);
    }
    return 0;
  }, [grabRef.current?.rotation]);

  let intersectionPlaneType = IntersectionPlaneType.Ground;
  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  const intersectionPlaneAngle = useMemo(() => new Euler(), []);

  if (grabRef.current) {
    if (moveHandleType === MoveHandleType.Top) {
      intersectionPlaneType = IntersectionPlaneType.Horizontal;
      intersectionPlanePosition.set(grabRef.current.cx, grabRef.current.cy, grabRef.current.lz + MOVE_HANDLE_OFFSET);
      intersectionPlaneAngle.set(0, 0, 0);
    } else if (
      moveHandleType === MoveHandleType.Left ||
      moveHandleType === MoveHandleType.Right ||
      moveHandleType === MoveHandleType.Lower ||
      moveHandleType === MoveHandleType.Upper ||
      resizeHandleType === ResizeHandleType.LowerLeft ||
      resizeHandleType === ResizeHandleType.UpperLeft ||
      resizeHandleType === ResizeHandleType.LowerRight ||
      resizeHandleType === ResizeHandleType.UpperRight ||
      rotateHandleType === RotateHandleType.Lower ||
      rotateHandleType === RotateHandleType.Upper
    ) {
      intersectionPlaneType = IntersectionPlaneType.Horizontal;
      intersectionPlanePosition.set(grabRef.current.cx, grabRef.current.cy, MOVE_HANDLE_RADIUS);
      intersectionPlaneAngle.set(0, 0, 0);
    } else if (resizeHandleType) {
      intersectionPlaneType = IntersectionPlaneType.Vertical;
      const handlePosition = getResizeHandlePosition(grabRef.current, resizeHandleType);
      const cameraDir = getCameraDirection();
      const rotation = -Math.atan2(cameraDir.x, cameraDir.y);
      intersectionPlanePosition.set(handlePosition.x, handlePosition.y, 0);
      intersectionPlaneAngle.set(-Math.PI / 2, 0, rotation, 'ZXY');
    }
  }

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (e.intersections.length > 0) {
      const groundClicked = e.intersections[0].object === groundPlaneRef.current;
      if (groundClicked) {
        selectNone();
        setCommonStore((state) => {
          state.pastePoint.copy(e.intersections[0].point);
          state.clickObjectType = ObjectType.Ground;
          state.contextMenuObjectType = ObjectType.Ground;
          state.pasteNormal = Util.UNIT_VECTOR_POS_Z;
        });
      }
    }
  };

  const handlePointerUp = () => {
    if (grabRef.current) {
      const elem = getElementById(grabRef.current.id);
      if (resizeHandleType) {
        if (elem) {
          newPositionRef.current.x = elem.cx;
          newPositionRef.current.y = elem.cy;
          newPositionRef.current.z = elem.cz;
          newDimensionRef.current.x = elem.lx;
          newDimensionRef.current.y = elem.ly;
          newDimensionRef.current.z = elem.lz;
        }
        if (
          newPositionRef.current.distanceToSquared(oldPositionRef.current) > 0.0001 &&
          newDimensionRef.current.distanceToSquared(oldDimensionRef.current) > 0.0001
        ) {
          const undoableResize = {
            name: 'Resize',
            timestamp: Date.now(),
            resizedElement: grabRef.current,
            oldCx: oldPositionRef.current.x,
            oldCy: oldPositionRef.current.y,
            oldCz: oldPositionRef.current.z,
            newCx: newPositionRef.current.x,
            newCy: newPositionRef.current.y,
            newCz: newPositionRef.current.z,
            oldLx: oldDimensionRef.current.x,
            oldLy: oldDimensionRef.current.y,
            oldLz: oldDimensionRef.current.z,
            newLx: newDimensionRef.current.x,
            newLy: newDimensionRef.current.y,
            newLz: newDimensionRef.current.z,
            undo: () => {
              setElementPosition(
                undoableResize.resizedElement.id,
                undoableResize.oldCx,
                undoableResize.oldCy,
                undoableResize.oldCz,
              );
              setElementSize(
                undoableResize.resizedElement.id,
                undoableResize.oldLx,
                undoableResize.oldLy,
                undoableResize.oldLz,
              );
            },
            redo: () => {
              setElementPosition(
                undoableResize.resizedElement.id,
                undoableResize.newCx,
                undoableResize.newCy,
                undoableResize.newCz,
              );
              setElementSize(
                undoableResize.resizedElement.id,
                undoableResize.newLx,
                undoableResize.newLy,
                undoableResize.newLz,
              );
            },
          } as UndoableResize;
          addUndoable(undoableResize);
        }
      } else if (rotateHandleType) {
        if (elem) {
          newRotationRef.current = [...elem.rotation];
        }
        const oldRotation = new Vector3().fromArray(oldRotationRef.current);
        const newRotation = new Vector3().fromArray(newRotationRef.current);
        if (newRotation.distanceToSquared(oldRotation) > 0.0001) {
          const undoableRotate = {
            name: 'Rotate',
            timestamp: Date.now(),
            rotatedElement: grabRef.current,
            oldRotation: oldRotationRef.current,
            newRotation: newRotationRef.current,
            undo: () => {
              setElementRotation(
                undoableRotate.rotatedElement.id,
                undoableRotate.oldRotation[0],
                undoableRotate.oldRotation[1],
                undoableRotate.oldRotation[2],
              );
            },
            redo: () => {
              setElementRotation(
                undoableRotate.rotatedElement.id,
                undoableRotate.newRotation[0],
                undoableRotate.newRotation[1],
                undoableRotate.newRotation[2],
              );
            },
          } as UndoableRotate;
          addUndoable(undoableRotate);
        }
      } else {
        if (elem) {
          newPositionRef.current.x = elem.cx;
          newPositionRef.current.y = elem.cy;
          newPositionRef.current.z = elem.cz;
        }
        if (newPositionRef.current.distanceToSquared(oldPositionRef.current) > 0.0001) {
          const undoableMove = {
            name: 'Move',
            timestamp: Date.now(),
            movedElement: grabRef.current,
            oldCx: oldPositionRef.current.x,
            oldCy: oldPositionRef.current.y,
            oldCz: oldPositionRef.current.z,
            newCx: newPositionRef.current.x,
            newCy: newPositionRef.current.y,
            newCz: newPositionRef.current.z,
            undo: () => {
              setElementPosition(
                undoableMove.movedElement.id,
                undoableMove.oldCx,
                undoableMove.oldCy,
                undoableMove.oldCz,
              );
            },
            redo: () => {
              setElementPosition(
                undoableMove.movedElement.id,
                undoableMove.newCx,
                undoableMove.newCy,
                undoableMove.newCz,
              );
            },
          } as UndoableMove;
          addUndoable(undoableMove);
        }
      }
      grabRef.current = null;
    }
    setCommonStore((state) => {
      state.moveHandleType = null;
      state.resizeHandleType = null;
      state.rotateHandleType = null;
      state.enableOrbitController = true;
    });
    setMinX(null);
    setMaxX(null);
  };

  const [minX, setMinX] = useState<number | null>(null);
  const [maxX, setMaxX] = useState<number | null>(null);
  const [minY, setMinY] = useState<number | null>(null);
  const [maxY, setMaxY] = useState<number | null>(null);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    setCommonStore((state) => {
      state.contextMenuObjectType = null;
    });
    if (e.intersections.length > 0) {
      const groundClicked = e.intersections[0].object === groundPlaneRef.current;
      if (groundClicked) {
        setCommonStore((state) => {
          state.clickObjectType = ObjectType.Ground;
          state.selectedElement = null;
        });
        selectNone();
        if (legalOnGround(objectTypeToAdd)) {
          const position = e.intersections[0].point;
          const id = addElement(groundModel, position);
          const addedElement = getElementById(id);
          const undoableAdd = {
            name: 'Add',
            timestamp: Date.now(),
            addedElement: addedElement,
            undo: () => {
              removeElementById(undoableAdd.addedElement.id, false);
            },
            redo: () => {
              setCommonStore((state) => {
                state.elements.push(undoableAdd.addedElement);
                state.selectedElement = undoableAdd.addedElement;
              });
            },
          } as UndoableAdd;
          addUndoable(undoableAdd);
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
          });
        }
      } else {
        const selectedElement = getSelectedElement();
        if (selectedElement) {
          if (legalOnGround(selectedElement.type as ObjectType)) {
            grabRef.current = selectedElement;
            oldPositionRef.current.x = selectedElement.cx;
            oldPositionRef.current.y = selectedElement.cy;
            oldPositionRef.current.z = selectedElement.cz;
            oldDimensionRef.current.x = selectedElement.lx;
            oldDimensionRef.current.y = selectedElement.ly;
            oldDimensionRef.current.z = selectedElement.lz;
            oldRotationRef.current = [...selectedElement.rotation];
            if (selectedElement.type !== ObjectType.Foundation && selectedElement.type !== ObjectType.Cuboid) {
              setCommonStore((state) => {
                state.enableOrbitController = false;
              });
            }

            if (selectedElement.type === ObjectType.Foundation) {
              const map = new Map<string, WallAbsPos>();
              const parentCenter = new Vector3(selectedElement.cx, selectedElement.cy);
              for (const e of useStore.getState().elements) {
                if (e.parentId === selectedElement.id) {
                  if (e.type === ObjectType.Wall) {
                    const wall = e as WallModel;
                    const centerPointAbsPos = new Vector3().addVectors(
                      parentCenter,
                      new Vector3(wall.cx, wall.cy).applyEuler(new Euler(0, 0, selectedElement.rotation[2])),
                    );
                    const leftPointAbsPos = new Vector3().addVectors(
                      parentCenter,
                      new Vector3(wall.leftPoint[0], wall.leftPoint[1]).applyEuler(
                        new Euler(0, 0, selectedElement.rotation[2]),
                      ),
                    );
                    const rightPointAbsPos = new Vector3().addVectors(
                      parentCenter,
                      new Vector3(wall.rightPoint[0], wall.rightPoint[1]).applyEuler(
                        new Euler(0, 0, selectedElement.rotation[2]),
                      ),
                    );
                    map.set(wall.id, { centerPointAbsPos, leftPointAbsPos, rightPointAbsPos });
                  } else if (e.type === ObjectType.SolarPanel) {
                    // to do
                  } else if (e.type === ObjectType.Sensor) {
                    // to do
                  }
                }
              }
              wallsAbsPosMapRef.current = map;

              const min = new Vector3(+Infinity, +Infinity, +Infinity);
              const max = new Vector3(-Infinity, -Infinity, -Infinity);
              for (const content of scene.children) {
                if (content.name === 'Content') {
                  const children = content.children.filter((c) => c.userData['parentId'] === selectedElement.id);
                  for (const c of children) {
                    const box = new Box3().setFromObject(c);
                    min.min(box.min);
                    max.max(box.max);
                  }
                }
              }
              const p = e.intersections[0].point;
              if (p.x > max.x) {
                setMinX(max.x + 1);
                setMaxX(null);
              } else if (p.x < min.x) {
                setMaxX(min.x - 1);
                setMinX(null);
              }
              if (p.y > max.y) {
                setMinY(max.y + 1);
                setMaxY(null);
              } else if (p.y < min.y) {
                setMaxY(min.y - 1);
                setMinY(null);
              }
            }
          }
        }
      }
    }
  };

  const handleGroudPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
      const mouse = new Vector2();
      mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
      mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      let intersects;
      switch (grabRef.current.type) {
        case ObjectType.Human:
        case ObjectType.Tree:
          if (groundPlaneRef.current) {
            intersects = ray.intersectObjects([groundPlaneRef.current]);
            if (intersects.length > 0) {
              const p = intersects[0].point;
              setElementPosition(grabRef.current.id, p.x, p.y);
            }
          }
          break;
        case ObjectType.Foundation:
          if (intersectionPlaneRef.current) {
            intersects = ray.intersectObjects([intersectionPlaneRef.current]);
            if (intersects.length > 0) {
              const p = intersects[0].point;
              if (moveHandleType) {
                handleMove(p);
              } else if (resizeHandleType) {
                handleResize(p);
              } else if (rotateHandleType) {
                handleRotate(p);
              }
            }
          }
          break;
        case ObjectType.Cuboid:
          if (intersectionPlaneRef.current) {
            if (intersectionPlaneType === IntersectionPlaneType.Horizontal) {
              intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects.length > 0) {
                const p = intersects[0].point;
                if (moveHandleType) {
                  if (moveHandleType === MoveHandleType.Top) {
                    setElementPosition(grabRef.current.id, p.x, p.y);
                  } else {
                    handleMove(p);
                  }
                } else if (resizeHandleType) {
                  handleResize(p);
                } else if (rotateHandleType) {
                  handleRotate(p);
                }
              }
            }
          }
          break;
      }
    }
  };

  const handleIntersectionPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
      const mouse = new Vector2();
      mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
      mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      let intersects;
      if (
        grabRef.current.type === ObjectType.Cuboid &&
        intersectionPlaneRef.current &&
        intersectionPlaneType === IntersectionPlaneType.Vertical
      ) {
        if (
          resizeHandleType === ResizeHandleType.LowerLeftTop ||
          resizeHandleType === ResizeHandleType.UpperLeftTop ||
          resizeHandleType === ResizeHandleType.LowerRightTop ||
          resizeHandleType === ResizeHandleType.UpperRightTop
        ) {
          intersects = ray.intersectObjects([intersectionPlaneRef.current]);
          if (intersects.length > 0) {
            const p = intersects[0].point;
            updateElementCzById(grabRef.current.id, Math.max(0.5, p.z / 2));
            updateElementLzById(grabRef.current.id, Math.max(1, p.z));
          }
        }
      }
    }
  };

  // only these elements are allowed to be on the ground
  const legalOnGround = (type: ObjectType) => {
    return (
      type === ObjectType.Foundation ||
      type === ObjectType.Cuboid ||
      type === ObjectType.Tree ||
      type === ObjectType.Human
    );
  };

  const handleResize = (p: Vector3) => {
    let px = p.x,
      py = p.y;
    if (minX !== null) {
      px = Math.max(p.x, minX);
    }
    if (maxX != null) {
      px = Math.min(p.x, maxX);
    }
    if (minY !== null) {
      py = Math.max(p.y, minY);
    }
    if (maxY != null) {
      py = Math.min(p.y, maxY);
    }
    const P = new Vector3(px, py);
    const resizeAnchor2D = new Vector3(resizeAnchor.x, resizeAnchor.y);
    const R = resizeAnchor2D.distanceTo(P);
    const angle = Math.atan2(P.x - resizeAnchor.x, P.y - resizeAnchor.y) + grabRef.current!.rotation[2];
    const lx = Math.abs(R * Math.sin(angle));
    const ly = Math.abs(R * Math.cos(angle));
    const c = new Vector3().addVectors(P, resizeAnchor2D).divideScalar(2);
    setElementSize(grabRef.current!.id, lx, ly);
    setElementPosition(grabRef.current!.id, c.x, c.y);
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.parentId === grabRef.current!.id) {
          const wall = wallsAbsPosMapRef.current.get(e.id);
          if (wall) {
            const { centerPointAbsPos, leftPointAbsPos, rightPointAbsPos } = wall;
            const centerPointRelativePos = new Vector3()
              .subVectors(centerPointAbsPos, c)
              .applyEuler(new Euler(0, 0, -grabRef.current!.rotation[2]));
            const leftPointRelativePos = new Vector3()
              .subVectors(leftPointAbsPos, c)
              .applyEuler(new Euler(0, 0, -grabRef.current!.rotation[2]));
            const rightPointRelativePos = new Vector3()
              .subVectors(rightPointAbsPos, c)
              .applyEuler(new Euler(0, 0, -grabRef.current!.rotation[2]));
            e.cx = centerPointRelativePos.x;
            e.cy = centerPointRelativePos.y;
            (e as WallModel).leftPoint = [leftPointRelativePos.x, leftPointRelativePos.y, grabRef.current!.lz];
            (e as WallModel).rightPoint = [rightPointRelativePos.x, rightPointRelativePos.y, grabRef.current!.lz];
          }
        }
      }
      state.updateWallPointOnFoundation = !state.updateWallPointOnFoundation;
    });
  };

  const handleRotate = (p: Vector3) => {
    const { cx, cy } = grabRef.current!;
    const rotation = Math.atan2(cx - p.x, p.y - cy) + (rotateHandleType === RotateHandleType.Upper ? 0 : Math.PI);
    const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * Math.PI * 2 : 0;
    setElementRotation(grabRef.current!.id, 0, 0, rotation + offset);
  };

  const handleMove = (p: Vector3) => {
    let x0, y0;
    const hx = grabRef.current!.lx / 2 + MOVE_HANDLE_OFFSET;
    const hy = grabRef.current!.ly / 2 + MOVE_HANDLE_OFFSET;
    switch (moveHandleType) {
      case MoveHandleType.Upper:
        x0 = p.x + sinAngle * hy;
        y0 = p.y - cosAngle * hy;
        setElementPosition(grabRef.current!.id, x0, y0);
        break;
      case MoveHandleType.Lower:
        x0 = p.x - sinAngle * hy;
        y0 = p.y + cosAngle * hy;
        setElementPosition(grabRef.current!.id, x0, y0);
        break;
      case MoveHandleType.Left:
        x0 = p.x + cosAngle * hx;
        y0 = p.y + sinAngle * hx;
        setElementPosition(grabRef.current!.id, x0, y0);
        break;
      case MoveHandleType.Right:
        x0 = p.x - cosAngle * hx;
        y0 = p.y - sinAngle * hx;
        setElementPosition(grabRef.current!.id, x0, y0);
        break;
    }
  };

  return (
    <>
      {grabRef.current && intersectionPlaneType !== IntersectionPlaneType.Ground && (
        <Plane
          ref={intersectionPlaneRef}
          visible={false}
          name={'Groud Intersection Plane'}
          rotation={intersectionPlaneAngle}
          position={intersectionPlanePosition}
          args={[1000, 1000]}
          onPointerMove={handleIntersectionPointerMove}
        >
          <meshStandardMaterial side={DoubleSide} />
        </Plane>
      )}
      <Plane
        receiveShadow={shadowEnabled}
        ref={groundPlaneRef}
        name={'Ground'}
        rotation={[0, 0, 0]}
        position={[0, 0, 0]}
        args={[10000, 10000]}
        renderOrder={-2}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handleGroudPointerMove}
      >
        <meshStandardMaterial depthTest={false} color={groundColor} />
      </Plane>
    </>
  );
};

export default React.memo(Ground);
