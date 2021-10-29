/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Line, Sphere, Plane, Extrude } from '@react-three/drei';
import { Euler, Mesh, Raycaster, RepeatWrapping, Shape, TextureLoader, Vector2, Vector3 } from 'three';
import { CommonStoreState, useStore } from '../stores/common';
import { FoundationModel } from '../models/FoundationModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  ActionType,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  WallSide,
} from '../types';
import {
  HIGHLIGHT_HANDLE_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_COLOR_2,
  MOVE_HANDLE_OFFSET,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
} from '../constants';
import { Util } from '../Util';
import { ElementModel } from '../models/ElementModel';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { PolarGrid } from '../grid';
import { WallModel } from 'src/models/WallModel';
import RotateHandle from '../components/rotateHandle';
import WireFrame from 'src/components/wireFrame';
import WallExteriorImage from '../resources/WallExteriorImage.png';
import * as Selector from 'src/stores/selector';

interface wallJoint {
  id: string;
  point: Vector3;
  l: number;
  height: number;
  wallID: string;
  wallSide: WallSide;
}

const Foundation = ({
  id,
  cx,
  cy,
  lx = 1,
  ly = 1,
  lz = 0.1,
  rotation = [0, 0, 0],
  color = 'gray',
  lineColor = 'black',
  lineWidth = 0.2,
  locked = false,
  selected = false,
}: FoundationModel) => {
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getInitialWallsID = useStore(Selector.getInitialWallsID);

  const setCommonStore = useStore(Selector.set);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setElementSize = useStore(Selector.setElementSize);

  const updateElementById = useStore(Selector.updateElementById);
  const deleteElementById = useStore(Selector.deleteElementById);
  const selectMe = useStore(Selector.selectMe);
  const addElement = useStore(Selector.addElement);

  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const deletedWallID = useStore(Selector.deletedWallID);
  const shadowEnabled = useStore(Selector.viewstate.shadowEnabled);
  const groundImage = useStore(Selector.viewstate.groundImage);

  const moveHandleType = useStore((state) => state.moveHandleType);
  const resizeHandleType = useStore((state) => state.resizeHandleType);
  const rotateHandleType = useStore((state) => state.rotateHandleType);
  const resizeAnchor = useStore((state) => state.resizeAnchor);

  const {
    camera,
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [hoveredResizeHandleLL, setHoveredResizeHandleLL] = useState(false);
  const [hoveredResizeHandleUL, setHoveredResizeHandleUL] = useState(false);
  const [hoveredResizeHandleLR, setHoveredResizeHandleLR] = useState(false);
  const [hoveredResizeHandleUR, setHoveredResizeHandleUR] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);

  const buildingWallIDRef = useRef<string | null>(null);
  const [buildingWallID, setBuildingWallID] = useState<string | null>(null);
  const [buildingWall, setBuildingWall] = useState<WallModel | null>(null);
  const [isSettingWallStartPoint, setIsSettingWallStartPoint] = useState(false);
  const [isSettingWallEndPoint, setIsSettingWallEndPoint] = useState(false);
  const [enableWallMagnet, setEnableWallMagnet] = useState(true);
  const [magnetedPoint, setMagnetedPoint] = useState<Vector3 | null>(null);
  const [wallPoints, setWallPoints] = useState<Map<string, { leftPoint: Vector3; rightPoint: Vector3 }>>(new Map());
  const [wallJointsMap, setWallJointsMap] = useState<Map<string, string>>(new Map());
  const [wallJointsSet, setWallJointsSet] = useState<Set<string>>(new Set());
  const [wallJointsArray, setWallJointsArray] = useState<wallJoint[]>([]);
  const [mapUpdate, setMapUpdate] = useState(false);

  const baseRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const intersecPlaneRef = useRef<Mesh>();
  const resizeHandleLLRef = useRef<Mesh>();
  const resizeHandleULRef = useRef<Mesh>();
  const resizeHandleLRRef = useRef<Mesh>();
  const resizeHandleURRef = useRef<Mesh>();
  const moveHandleLowerRef = useRef<Mesh>();
  const moveHandleUpperRef = useRef<Mesh>();
  const moveHandleLeftRef = useRef<Mesh>();
  const moveHandleRightRef = useRef<Mesh>();
  const ray = useMemo(() => new Raycaster(), []);

  const elementModel = getElementById(id) as FoundationModel;
  const handleLift = MOVE_HANDLE_RADIUS / 2;
  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLL = useMemo(() => new Vector3(-hx, -hy, hz), [hx, hy, hz]);
  const positionUL = useMemo(() => new Vector3(-hx, hy, hz), [hx, hy, hz]);
  const positionLR = useMemo(() => new Vector3(hx, -hy, hz), [hx, hy, hz]);
  const positionUR = useMemo(() => new Vector3(hx, hy, hz), [hx, hy, hz]);

  useEffect(() => {
    const initialWallsID = getInitialWallsID(id);
    for (const id of initialWallsID) {
      const wall = getElementById(id) as WallModel;
      if (wall) {
        const leftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1]);
        const rightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1]);
        wallPoints.set(id, { leftPoint, rightPoint });

        if (wall.leftJoints.length > 0) {
          const targetWall = getElementById(wall.leftJoints[0].id) as WallModel;
          if (targetWall) {
            wallJointsMap.set(id, targetWall.id);
            wallJointsMap.set(targetWall.id, id);
          }
        }
        if (wall.rightJoints.length > 0) {
          const targetWall = getElementById(wall.rightJoints[0].id) as WallModel;
          if (targetWall) {
            wallJointsMap.set(id, targetWall.id);
            wallJointsMap.set(targetWall.id, id);
          }
        }
      }
    }
    setWallPoints(wallPoints);
  }, []);

  useEffect(() => {
    if (deletedWallID) {
      wallPoints.delete(deletedWallID);

      const joint = wallJointsMap.get(deletedWallID);
      if (joint) {
        wallJointsMap.delete(joint);
        wallJointsMap.delete(deletedWallID);
        const id = joint < deletedWallID ? joint + deletedWallID : deletedWallID + joint;
        wallJointsSet.delete(id);
        wallJointsArray.filter((v) => {
          return v.id !== deletedWallID;
        });
        setWallJointsMap(wallJointsMap);
        setWallJointsSet(wallJointsSet);
        setWallJointsArray([...wallJointsArray]);
        setMapUpdate(!mapUpdate);
      }
    }
  }, [deletedWallID]);

  useEffect(() => {
    if (buildingWallID) {
      const w = getElementById(buildingWallID) as WallModel;
      if (w) {
        setBuildingWall(w);
      }
    }
  }, [buildingWallID]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Shift':
          setEnableWallMagnet(false);
          break;
        case 'Escape':
          if (buildingWallIDRef.current) {
            deleteElementById(buildingWallIDRef.current);
            setIsSettingWallStartPoint(false);
            setIsSettingWallEndPoint(false);
            setBuildingWallID(null);
            setBuildingWall(null);
            setCommonStore((state) => {
              state.buildingWallID = null;
            });
          }
          break;
      }
    };
    const onKeyUp = () => {
      setEnableWallMagnet(true);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    wallJointsSet.clear();
    const array: wallJoint[] = [];
    wallJointsMap.forEach((v, k, m) => {
      const id = v <= k ? v + k : k + v;
      if (!wallJointsSet.has(id)) {
        const wall1 = getElementById(v) as WallModel;
        const wall2 = getElementById(k) as WallModel;
        if (wall1 && wall2) {
          const deltaAngle = Math.abs(wall2.relativeAngle - wall1.relativeAngle);
          const a = Math.abs(Math.PI - deltaAngle);
          let l1 = wall1.ly / Math.tan(a);
          let l2 = wall2.ly / Math.tan(a);
          // l1 = l1 > wall1.ly ? wall1.ly : l1;
          // l2 = l2 > wall2.ly ? wall2.ly : l2;
          let l = Math.max(l1, l2);
          if (a === 0) {
            l = 0;
          }
          const height = Math.min(wall1.lz, wall2.lz);

          let point: Vector3 | null = null;
          let wallSide: WallSide | null = null;
          if (isEuqal(wall1.leftPoint, wall2.rightPoint)) {
            point = new Vector3(wall1.leftPoint[0], wall1.leftPoint[1], wall1.leftPoint[2]);
            wallSide = l1 > l2 ? WallSide.Left : WallSide.Right;
          } else if (isEuqal(wall1.rightPoint, wall2.leftPoint)) {
            point = new Vector3(wall1.rightPoint[0], wall1.rightPoint[1], wall1.rightPoint[2]);
            wallSide = l1 > l2 ? WallSide.Right : WallSide.Left;
          }
          wallJointsSet.add(id);
          if (point && wallSide) {
            array.push({ id, point, l, height, wallID: l1 > l2 ? wall1.id : wall2.id, wallSide });
          }
        }
      }
    });
    setWallJointsSet(wallJointsSet);
    setWallJointsArray(array);
  }, [mapUpdate]);

  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  const intersectionPlaneRotation = useMemo(() => new Euler(), []);

  if (grabRef.current && grabRef.current.type === ObjectType.SolarPanel) {
    intersectionPlanePosition.set(0, 0, grabRef.current.poleHeight);
    intersectionPlaneRotation.set(0, 0, 0);
  }

  const isEuqal = (v1: number[], v2: number[]) => {
    return Math.abs(v1[0] - v2[0]) < 0.01 && Math.abs(v1[1] - v2[1]) < 0.01 && Math.abs(v1[2] - v2[2]) < 0.01;
  };

  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (e.intersections.length > 0) {
        const intersected = e.intersections[0].object === e.eventObject;
        if (intersected) {
          setHoveredHandle(handle);
          if (
            // unfortunately, I cannot find a way to tell the type of an enum variable
            handle === MoveHandleType.Upper ||
            handle === MoveHandleType.Lower ||
            handle === MoveHandleType.Left ||
            handle === MoveHandleType.Right ||
            handle === RotateHandleType.Lower ||
            handle === RotateHandleType.Upper
          ) {
            domElement.style.cursor = 'move';
          } else {
            domElement.style.cursor = 'pointer';
          }
          switch (handle) {
            case ResizeHandleType.LowerLeft:
              setHoveredResizeHandleLL(true);
              break;
            case ResizeHandleType.UpperLeft:
              setHoveredResizeHandleUL(true);
              break;
            case ResizeHandleType.LowerRight:
              setHoveredResizeHandleLR(true);
              break;
            case ResizeHandleType.UpperRight:
              setHoveredResizeHandleUR(true);
              break;
          }
        }
      }
    },
    [],
  );

  const noHoverHandle = useCallback(() => {
    setHoveredHandle(null);
    setHoveredResizeHandleLL(false);
    setHoveredResizeHandleUL(false);
    setHoveredResizeHandleLR(false);
    setHoveredResizeHandleUR(false);
    domElement.style.cursor = 'default';
  }, []);

  // only these elements are allowed to be on the foundation
  const legalOnFoundation = (type: ObjectType) => {
    switch (type) {
      case ObjectType.Sensor:
      case ObjectType.SolarPanel:
      case ObjectType.Wall:
        return true;
      default:
        return false;
    }
  };

  const findMagnetPoint = (
    wallPoints: Map<string, { leftPoint: Vector3; rightPoint: Vector3 }>,
    pointer: Vector3,
    minDist: number,
  ) => {
    let min = minDist;
    let targetPoint: Vector3 | null = null;
    let targetID: string | null = null;
    let targetSide: WallSide | null = null;
    for (const [id, points] of wallPoints) {
      if (id === buildingWallID || (grabRef.current && id === grabRef.current.id)) continue;
      const { leftPoint, rightPoint } = points;
      const distStart = leftPoint.distanceTo(pointer);
      const distEnd = rightPoint.distanceTo(pointer);
      const flag = distStart <= distEnd;
      const dist = flag ? distStart : distEnd;
      const point = flag ? leftPoint : rightPoint;
      if (dist < min) {
        min = dist;
        targetPoint = point;
        targetID = id;
        targetSide = flag ? WallSide.Left : WallSide.Right;
      } else {
        setMagnetedPoint(null);
      }
    }
    return { targetID, targetPoint, targetSide };
  };

  const stickToNormalGrid = (v: Vector3) => {
    return new Vector3(Math.round(v.x), Math.round(v.y), v.z);
  };

  const stickToFineGrid = (v: Vector3) => {
    const x = parseFloat((Math.floor(v.x / 0.2) * 0.2).toFixed(1));
    const y = parseFloat((Math.floor(v.y / 0.2) * 0.2).toFixed(1));
    return new Vector3(x, y, v.z);
  };

  const ratio = Math.max(1, Math.max(lx, ly) / 8);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
  const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;
  const rotateHandleSize = 0.6 * ratio;

  const lowerRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, -hy - rotateHandleSize, 0];
  }, [hy]);
  const upperRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, hy + rotateHandleSize, 0];
  }, [hy]);

  const texture = useMemo(() => {
    return new TextureLoader().load(WallExteriorImage, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0.013);
      texture.repeat.set(0.5, 1 / 4);
    });
  }, []);

  return (
    <group name={'Foundation Group ' + id} position={[cx, cy, hz]} rotation={[0, 0, rotation[2]]}>
      {/* draw rectangle */}
      <Box
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
        uuid={id}
        userData={{ aabb: true }}
        ref={baseRef}
        name={'Foundation'}
        args={[lx, ly, lz]}
        onContextMenu={(e) => {
          selectMe(id, e, ActionType.Select);
          setCommonStore((state) => {
            state.pastePoint.copy(e.intersections[0].point);
            state.clickObjectType = ObjectType.Foundation;
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === baseRef.current;
              if (intersected) {
                state.contextMenuObjectType = ObjectType.Foundation;
              }
            }
            state.pasteNormal = Util.UNIT_VECTOR_POS_Z;
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
        onPointerDown={(e) => {
          if (e.button === 2) return; // ignore right-click
          setCommonStore((state) => {
            state.contextMenuObjectType = null;
          });
          selectMe(id, e, ActionType.Select);
          const selectedElement = getSelectedElement();
          // no child of this foundation is clicked
          if (selectedElement?.id === id) {
            if (legalOnFoundation(objectTypeToAdd) && elementModel) {
              setShowGrid(true);
              addElement(elementModel, e.intersections[0].point);
              setCommonStore((state) => {
                state.objectTypeToAdd = ObjectType.None;
              });
            }
          }
          // a child of this foundation is clicked
          else {
            if (selectedElement) {
              if (legalOnFoundation(selectedElement.type as ObjectType)) {
                grabRef.current = selectedElement;
                setShowGrid(true);
                // TODO: resizeHandleType === null ?
                // if (resizeHandleType) {
                //   setCommonStore((state) => {
                //     state.enableOrbitController = false;
                //   });
                // }
              }
            }
          }
          if (buildingWallID && baseRef.current) {
            setCommonStore((state) => {
              state.enableOrbitController = false;
            });
            const intersects = ray.intersectObjects([baseRef.current]);
            let pos = intersects[0].point;
            if (!enableWallMagnet) {
              pos = stickToFineGrid(Util.wallRelativePosition(pos, elementModel));
            } else if (magnetedPoint) {
              pos = magnetedPoint;
              setMagnetedPoint(null);
            } else {
              pos = stickToNormalGrid(Util.wallRelativePosition(pos, elementModel));
            }
            if (isSettingWallStartPoint) {
              setWallPoints(wallPoints.set(buildingWallID, { leftPoint: pos, rightPoint: new Vector3() }));
              updateElementById(buildingWallID, { leftPoint: [pos.x, pos.y, pos.z] });
              setIsSettingWallStartPoint(false);
              setIsSettingWallEndPoint(true);
            }
          }
        }}
        onPointerUp={(e) => {
          if (grabRef.current) {
            const elem = getElementById(grabRef.current.id);
            if (elem && elem.type === ObjectType.Wall) {
              const wall = elem as WallModel;
              const leftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1], wall.leftPoint[2]);
              const rightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1], wall.rightPoint[2]);
              setWallPoints(wallPoints.set(grabRef.current.id, { leftPoint: leftPoint, rightPoint: rightPoint }));
            }
            grabRef.current = null;
          }
          if (!buildingWallID) {
            setShowGrid(false);
          }
          if (buildingWallID && baseRef.current) {
            const intersects = ray.intersectObjects([baseRef.current]);
            let pos = intersects[0].point;
            if (!enableWallMagnet) {
              pos = stickToFineGrid(Util.wallRelativePosition(pos, elementModel));
            } else if (magnetedPoint) {
              pos = magnetedPoint;
              setMagnetedPoint(null);
            } else {
              pos = stickToNormalGrid(Util.wallRelativePosition(pos, elementModel));
            }
            if (isSettingWallEndPoint) {
              const leftPoint = wallPoints.get(buildingWallID)?.leftPoint ?? new Vector3();
              setWallPoints(wallPoints.set(buildingWallID, { leftPoint: leftPoint, rightPoint: pos }));
              updateElementById(buildingWallID, { rightPoint: [pos.x, pos.y, pos.z] });
              setCommonStore((state) => {
                state.objectTypeToAdd = ObjectType.None;
              });
              setIsSettingWallEndPoint(false);
              setBuildingWallID(null);
              buildingWallIDRef.current = null;
              setCommonStore((state) => {
                state.buildingWallID = null;
              });
            }
          }
          setCommonStore((state) => {
            state.enableOrbitController = true;
          });
        }}
        onPointerMove={(e) => {
          if (!grabRef.current && !buildingWallID && objectTypeToAdd !== ObjectType.Wall) {
            return;
          }
          const mouse = new Vector2();
          mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
          mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
          ray.setFromCamera(mouse, camera);
          if (baseRef.current && elementModel) {
            const intersects = ray.intersectObjects([baseRef.current]);
            let p = intersects[0].point;
            if (grabRef.current && grabRef.current.type && !grabRef.current.locked && intersects.length > 0) {
              switch (grabRef.current.type) {
                case ObjectType.Sensor:
                  p = Util.relativeCoordinates(p.x, p.y, p.z, elementModel);
                  setElementPosition(grabRef.current.id, p.x, p.y);
                  break;
                case ObjectType.Wall:
                  if (
                    resizeHandleType &&
                    (resizeHandleType === ResizeHandleType.LowerLeft ||
                      resizeHandleType === ResizeHandleType.LowerRight)
                  ) {
                    p = Util.wallRelativePosition(p, elementModel);
                    let { targetID, targetPoint, targetSide } = findMagnetPoint(wallPoints, p, 1);
                    if (enableWallMagnet) {
                      if (targetPoint) {
                        p = targetPoint;
                        setMagnetedPoint(targetPoint);
                      } else {
                        p = stickToNormalGrid(p);
                      }
                    } else {
                      p = stickToFineGrid(p);
                      targetPoint = null;
                    }

                    const relativResizeAnchor = Util.wallRelativePosition(resizeAnchor, elementModel);
                    const lx = p.distanceTo(relativResizeAnchor);
                    const relativeCenter = new Vector3().addVectors(p, relativResizeAnchor).divideScalar(2);
                    let angle =
                      Math.atan2(p.y - relativResizeAnchor.y, p.x - relativResizeAnchor.x) -
                      (resizeHandleType === ResizeHandleType.LowerLeft ? Math.PI : 0);
                    angle = angle >= 0 ? angle : (Math.PI * 2 + angle) % (Math.PI * 2);
                    const leftPoint = resizeHandleType === ResizeHandleType.LowerLeft ? p : relativResizeAnchor;
                    const rightPoint = resizeHandleType === ResizeHandleType.LowerLeft ? relativResizeAnchor : p;

                    updateElementById(grabRef.current.id, {
                      cx: relativeCenter.x,
                      cy: relativeCenter.y,
                      lx: lx,
                      relativeAngle: angle,
                      leftPoint: [leftPoint.x, leftPoint.y, leftPoint.z],
                      rightPoint: [rightPoint.x, rightPoint.y, rightPoint.z],
                    });

                    if (targetID && targetPoint && targetSide) {
                      const wall_1 = getElementById(targetID) as WallModel;
                      const wall_2 = getElementById(grabRef.current.id) as WallModel;
                      if (wall_1 && wall_2) {
                        let deltaAngle = angle - wall_1.relativeAngle;

                        if (targetSide === WallSide.Left && resizeHandleType === ResizeHandleType.LowerRight) {
                          if ((deltaAngle >= 0 && deltaAngle < Math.PI) || deltaAngle < -Math.PI) {
                            // gap
                            updateElementById(targetID, {
                              leftOffset: 0,
                              leftJoints: [{ id: grabRef.current.id, side: WallSide.Right }],
                            });
                            updateElementById(grabRef.current.id, {
                              rightOffset: 0,
                              rightJoints: [{ id: targetID, side: WallSide.Left }],
                            });
                            wallJointsMap.delete(wall_1.id);
                            wallJointsMap.delete(wall_2.id);
                            setWallJointsMap(wallJointsMap);
                          } else if (
                            (deltaAngle > Math.PI && deltaAngle < (Math.PI * 3) / 2) ||
                            (deltaAngle > -Math.PI && deltaAngle < -Math.PI / 2)
                          ) {
                            const a = deltaAngle - Math.PI;
                            const l1 = wall_1.ly / Math.tan(a);
                            const l2 = wall_2.ly / Math.tan(a);
                            updateElementById(targetID, {
                              leftOffset: l1,
                              leftJoints: [{ id: grabRef.current.id, side: WallSide.Right }],
                            });
                            updateElementById(grabRef.current.id, {
                              rightOffset: l2,
                              rightJoints: [{ id: targetID, side: WallSide.Left }],
                            });
                            wallJointsMap.set(targetID, grabRef.current.id);
                            wallJointsMap.set(grabRef.current.id, targetID);
                            setWallJointsMap(wallJointsMap);
                            setMapUpdate(!mapUpdate);
                          } else {
                            // do nothing
                            updateElementById(targetID, {
                              leftOffset: 0,
                              leftJoints: [{ id: grabRef.current.id, side: WallSide.Right }],
                            });
                            updateElementById(grabRef.current.id, {
                              rightOffset: 0,
                              rightJoints: [{ id: targetID, side: WallSide.Left }],
                            });
                            wallJointsMap.delete(wall_1.id);
                            wallJointsMap.delete(wall_2.id);
                            setWallJointsMap(wallJointsMap);
                          }
                        } else if (targetSide === WallSide.Right && resizeHandleType === ResizeHandleType.LowerLeft) {
                          if ((deltaAngle > 0 && deltaAngle < Math.PI / 2) || deltaAngle < (-Math.PI / 2) * 3) {
                            // do nothing
                            updateElementById(targetID, {
                              rightOffset: 0,
                              rightJoints: [{ id: grabRef.current.id, side: WallSide.Left }],
                            });
                            updateElementById(grabRef.current.id, {
                              leftOffset: 0,
                              leftJoints: [{ id: targetID, side: WallSide.Right }],
                            });
                            wallJointsMap.delete(wall_1.id);
                            wallJointsMap.delete(wall_2.id);
                            setWallJointsMap(wallJointsMap);
                          } else if (
                            (deltaAngle > Math.PI / 2 && deltaAngle < Math.PI) ||
                            (deltaAngle > (-Math.PI / 2) * 3 && deltaAngle < -Math.PI / 2)
                          ) {
                            const a = Math.PI - deltaAngle;
                            const l1 = wall_1.ly / Math.tan(a);
                            const l2 = wall_2.ly / Math.tan(a);
                            updateElementById(targetID, {
                              rightOffset: l1,
                              rightJoints: [{ id: grabRef.current.id, side: WallSide.Left }],
                            });
                            updateElementById(grabRef.current.id, {
                              leftOffset: l2,
                              leftJoints: [{ id: targetID, side: WallSide.Right }],
                            });
                            wallJointsMap.set(targetID, grabRef.current.id);
                            wallJointsMap.set(grabRef.current.id, targetID);
                            setWallJointsMap(wallJointsMap);
                            setMapUpdate(!mapUpdate);
                          } else {
                            // gap
                            updateElementById(targetID, {
                              rightOffset: 0,
                              rightJoints: [{ id: grabRef.current.id, side: WallSide.Left }],
                            });
                            updateElementById(grabRef.current.id, {
                              leftOffset: 0,
                              leftJoints: [{ id: targetID, side: WallSide.Right }],
                            });
                            wallJointsMap.delete(wall_1.id);
                            wallJointsMap.delete(wall_2.id);
                            setWallJointsMap(wallJointsMap);
                          }
                        }
                      }
                    } else {
                      const currentWall = getElementById(grabRef.current.id) as WallModel;
                      if (
                        currentWall &&
                        currentWall.leftJoints.length > 0 &&
                        resizeHandleType === ResizeHandleType.LowerLeft
                      ) {
                        const targetWallID = wallJointsMap.get(grabRef.current.id);
                        const targetWall = getElementById(targetWallID ?? '') as WallModel;
                        if (targetWallID && targetWall) {
                          for (const joint of targetWall.rightJoints) {
                            if (joint.id === grabRef.current.id) {
                              updateElementById(targetWallID, { rightOffset: 0, rightJoints: [] });
                              break;
                            }
                          }
                        }
                        updateElementById(grabRef.current.id, { leftOffset: 0, leftJoints: [] });
                        wallJointsMap.delete(wallJointsMap.get(grabRef.current.id) as string);
                        wallJointsMap.delete(grabRef.current.id);
                        setWallJointsMap(wallJointsMap);
                      } else if (
                        currentWall.rightJoints.length > 0 &&
                        resizeHandleType === ResizeHandleType.LowerRight
                      ) {
                        const targetWallID = wallJointsMap.get(grabRef.current.id);
                        const targetWall = getElementById(targetWallID ?? '') as WallModel;
                        if (targetWallID && targetWall) {
                          for (const joint of targetWall.leftJoints) {
                            if (joint.id === grabRef.current.id) {
                              updateElementById(targetWallID, { leftOffset: 0, leftJoints: [] });
                              break;
                            }
                          }
                        }
                        updateElementById(grabRef.current.id, { rightOffset: 0, rightJoints: [] });
                        wallJointsMap.delete(wallJointsMap.get(grabRef.current.id) as string);
                        wallJointsMap.delete(grabRef.current.id);
                        setWallJointsMap(wallJointsMap);
                      }
                    }

                    const currentWall = getElementById(grabRef.current.id) as WallModel;
                    if (
                      resizeHandleType === ResizeHandleType.LowerRight &&
                      currentWall &&
                      currentWall.leftJoints.length > 0
                    ) {
                      const targetWall = getElementById(currentWall.leftJoints[0].id) as WallModel;
                      const targetSide = currentWall.leftJoints[0].side;
                      if (targetWall) {
                        const deltaAngle = angle - targetWall.relativeAngle;
                        if (targetSide === WallSide.Right) {
                          if ((deltaAngle > 0 && deltaAngle < Math.PI / 2) || deltaAngle < (-Math.PI / 2) * 3) {
                            // reset
                            updateElementById(targetWall.id, {
                              rightOffset: 0,
                            });
                            updateElementById(grabRef.current.id, {
                              leftOffset: 0,
                            });
                            const currID =
                              currentWall.id <= targetWall.id
                                ? currentWall.id + targetWall.id
                                : targetWall.id + currentWall.id;
                            const array = wallJointsArray.filter((v) => {
                              return v.id !== currID;
                            });
                            setWallJointsArray(array);
                            wallJointsMap.delete(currentWall.id);
                            wallJointsMap.delete(targetWall.id);
                            setWallJointsMap(wallJointsMap);
                          } else if (
                            (deltaAngle > Math.PI / 2 && deltaAngle < Math.PI) ||
                            (deltaAngle > (-Math.PI / 2) * 3 && deltaAngle < -Math.PI)
                          ) {
                            const a = Math.PI - deltaAngle;
                            const l1 = targetWall.ly / Math.tan(a);
                            const l2 = currentWall.ly / Math.tan(a);
                            const currID =
                              currentWall.id <= targetWall.id
                                ? currentWall.id + targetWall.id
                                : targetWall.id + currentWall.id;
                            let hasJoint = false;
                            for (const joint of wallJointsArray) {
                              if (joint.id === currID) {
                                joint.l = Math.max(l1, l2);
                                hasJoint = true;
                                break;
                              }
                            }
                            if (!hasJoint) {
                              updateElementById(targetWall.id, {
                                rightOffset: l1,
                                rightJoints: [{ id: grabRef.current.id, side: WallSide.Left }],
                              });
                              updateElementById(grabRef.current.id, {
                                leftOffset: l2,
                                leftJoints: [{ id: targetWall.id, side: WallSide.Right }],
                              });
                              wallJointsMap.set(targetWall.id, grabRef.current.id);
                              wallJointsMap.set(grabRef.current.id, targetWall.id);
                              setWallJointsMap(wallJointsMap);
                              setMapUpdate(!mapUpdate);
                            } else {
                              updateElementById(targetWall.id, {
                                rightOffset: l1,
                              });
                              updateElementById(grabRef.current.id, {
                                leftOffset: l2,
                              });
                              setWallJointsArray([...wallJointsArray]);
                            }
                          } else {
                            // gap
                            wallJointsMap.delete(currentWall.id);
                            wallJointsMap.delete(targetWall.id);
                            setWallJointsMap(wallJointsMap);
                            updateElementById(targetWall.id, {
                              rightOffset: 0,
                            });
                            updateElementById(grabRef.current.id, {
                              leftOffset: 0,
                            });
                            const currID =
                              currentWall.id <= targetWall.id
                                ? currentWall.id + targetWall.id
                                : targetWall.id + currentWall.id;
                            const array = wallJointsArray.filter((v) => {
                              return v.id !== currID;
                            });
                            setWallJointsArray(array);
                          }
                        }
                      }
                    } else if (resizeHandleType === ResizeHandleType.LowerLeft && currentWall.rightJoints.length > 0) {
                      const targetWall = getElementById(currentWall.rightJoints[0].id) as WallModel;
                      const targetSide = currentWall.rightJoints[0].side;
                      if (targetWall) {
                        const deltaAngle = angle - targetWall.relativeAngle;
                        if (targetSide === WallSide.Left) {
                          if ((deltaAngle >= 0 && deltaAngle < Math.PI) || deltaAngle < -Math.PI) {
                            // gap
                            updateElementById(targetWall.id, {
                              leftOffset: 0,
                            });
                            updateElementById(grabRef.current.id, {
                              rightOffset: 0,
                            });
                            wallJointsMap.delete(currentWall.id);
                            wallJointsMap.delete(targetWall.id);
                            setWallJointsMap(wallJointsMap);
                            const currID =
                              currentWall.id <= targetWall.id
                                ? currentWall.id + targetWall.id
                                : targetWall.id + currentWall.id;
                            const array = wallJointsArray.filter((v) => {
                              return v.id !== currID;
                            });
                          } else if (
                            (deltaAngle > Math.PI && deltaAngle < (Math.PI * 3) / 2) ||
                            (deltaAngle > -Math.PI && deltaAngle < -Math.PI / 2)
                          ) {
                            const a = deltaAngle - Math.PI;
                            const l1 = targetWall.ly / Math.tan(a);
                            const l2 = currentWall.ly / Math.tan(a);
                            const currID =
                              currentWall.id <= targetWall.id
                                ? currentWall.id + targetWall.id
                                : targetWall.id + currentWall.id;
                            let hasJoint = false;
                            for (const joint of wallJointsArray) {
                              if (joint.id === currID) {
                                joint.l = Math.max(l1, l2);
                                hasJoint = true;
                                break;
                              }
                            }
                            if (!hasJoint) {
                              updateElementById(targetWall.id, {
                                leftOffset: l1,
                                leftJoints: [{ id: grabRef.current.id, side: WallSide.Right }],
                              });
                              updateElementById(grabRef.current.id, {
                                rightOffset: l2,
                                rightJoints: [{ id: targetWall.id, side: WallSide.Left }],
                              });
                              wallJointsMap.set(targetWall.id, grabRef.current.id);
                              wallJointsMap.set(grabRef.current.id, targetWall.id);
                              setWallJointsMap(wallJointsMap);
                              setMapUpdate(!mapUpdate);
                            } else {
                              updateElementById(targetWall.id, {
                                leftOffset: l1,
                              });
                              updateElementById(grabRef.current.id, {
                                rightOffset: l2,
                              });
                              setWallJointsArray([...wallJointsArray]);
                            }
                          } else {
                            // reset

                            updateElementById(targetWall.id, {
                              leftOffset: 0,
                            });
                            updateElementById(grabRef.current.id, {
                              rightOffset: 0,
                            });
                            wallJointsMap.delete(targetWall.id);
                            wallJointsMap.delete(grabRef.current.id);
                            setWallJointsMap(wallJointsMap);
                            setMapUpdate(!mapUpdate);
                            const currID =
                              currentWall.id <= targetWall.id
                                ? currentWall.id + targetWall.id
                                : targetWall.id + currentWall.id;
                            const array = wallJointsArray.filter((v) => {
                              return v.id !== currID;
                            });
                          }
                        }
                      }
                    }
                  }
                  break;
              }
            }
            if (objectTypeToAdd === ObjectType.Wall) {
              const wallID = addElement(elementModel, p);
              buildingWallIDRef.current = wallID;
              setBuildingWallID(wallID);
              setIsSettingWallStartPoint(true);
              setShowGrid(true);
              setCommonStore((state) => {
                state.buildingWallID = wallID;
                state.objectTypeToAdd = ObjectType.None;
              });
            }
            if (buildingWallID) {
              p = Util.wallRelativePosition(p, elementModel);
              let { targetID, targetPoint, targetSide } = findMagnetPoint(wallPoints, p, 1);
              if (enableWallMagnet) {
                if (targetPoint) {
                  p = targetPoint;
                  setMagnetedPoint(targetPoint);
                } else {
                  p = stickToNormalGrid(p);
                }
              } else {
                p = stickToFineGrid(p);
                targetPoint = null;
              }
              if (isSettingWallStartPoint) {
                let wall: ElementModel | null = null;
                if (targetID && targetSide === WallSide.Right) {
                  wall = updateElementById(buildingWallID, {
                    cx: p.x,
                    cy: p.y,
                    leftJoints: [{ id: targetID, side: WallSide.Right }],
                  });
                  updateElementById(targetID, { rightJoints: [{ id: buildingWallID, side: WallSide.Left }] });
                } else {
                  wall = updateElementById(buildingWallID, {
                    cx: p.x,
                    cy: p.y,
                  });
                }
                if (wall) {
                  setBuildingWall(wall as WallModel);
                }
              } else if (isSettingWallEndPoint && buildingWall) {
                const leftPoint = new Vector3(buildingWall.cx, buildingWall.cy);
                const lx = p.distanceTo(leftPoint);
                const relativeCenter = new Vector3().addVectors(p, leftPoint).divideScalar(2);
                let angle = Math.atan2(p.y - leftPoint.y, p.x - leftPoint.x);
                angle = angle >= 0 ? angle : Math.PI * 2 + angle;
                updateElementById(buildingWallID, {
                  cx: relativeCenter.x,
                  cy: relativeCenter.y,
                  lx: lx,
                  relativeAngle: angle,
                  rightPoint: [p.x, p.y, p.z],
                });

                if (buildingWall.leftJoints.length > 0) {
                  const currentWall = buildingWall;
                  const targetWall = getElementById(currentWall.leftJoints[0].id) as WallModel;
                  const targetSide = currentWall.leftJoints[0].side;
                  if (targetWall) {
                    const deltaAngle = angle - targetWall.relativeAngle;
                    if (targetSide === WallSide.Right) {
                      if ((deltaAngle > 0 && deltaAngle < Math.PI / 2) || deltaAngle < (-Math.PI / 2) * 3) {
                        // reset
                        updateElementById(targetWall.id, {
                          rightOffset: 0,
                        });
                        updateElementById(currentWall.id, {
                          leftOffset: 0,
                        });
                        const currID =
                          currentWall.id <= targetWall.id
                            ? currentWall.id + targetWall.id
                            : targetWall.id + currentWall.id;
                        const array = wallJointsArray.filter((v) => {
                          return v.id !== currID;
                        });
                        setWallJointsArray(array);
                        wallJointsMap.delete(currentWall.id);
                        wallJointsMap.delete(targetWall.id);
                        setWallJointsMap(wallJointsMap);
                      } else if (
                        (deltaAngle > Math.PI / 2 && deltaAngle < Math.PI) ||
                        (deltaAngle > (-Math.PI / 2) * 3 && deltaAngle < -Math.PI)
                      ) {
                        const a = Math.PI - deltaAngle;
                        const l1 = targetWall.ly / Math.tan(a);
                        const l2 = currentWall.ly / Math.tan(a);
                        const currID =
                          currentWall.id <= targetWall.id
                            ? currentWall.id + targetWall.id
                            : targetWall.id + currentWall.id;
                        let hasJoint = false;
                        for (const joint of wallJointsArray) {
                          if (joint.id === currID) {
                            joint.l = Math.max(l1, l2);
                            hasJoint = true;
                            break;
                          }
                        }
                        if (!hasJoint) {
                          updateElementById(targetWall.id, {
                            rightOffset: l1,
                            rightJoints: [{ id: currentWall.id, side: WallSide.Left }],
                          });
                          updateElementById(currentWall.id, {
                            leftOffset: l2,
                            leftJoints: [{ id: targetWall.id, side: WallSide.Right }],
                          });
                          wallJointsMap.set(targetWall.id, currentWall.id);
                          wallJointsMap.set(currentWall.id, targetWall.id);
                          setWallJointsMap(wallJointsMap);
                          setMapUpdate(!mapUpdate);
                        } else {
                          updateElementById(targetWall.id, {
                            rightOffset: l1,
                          });
                          updateElementById(currentWall.id, {
                            leftOffset: l2,
                          });
                          setWallJointsArray([...wallJointsArray]);
                        }
                      } else {
                        // gap
                        wallJointsMap.delete(currentWall.id);
                        wallJointsMap.delete(targetWall.id);
                        setWallJointsMap(wallJointsMap);
                        updateElementById(targetWall.id, {
                          rightOffset: 0,
                        });
                        updateElementById(currentWall.id, {
                          leftOffset: 0,
                        });
                        const currID =
                          currentWall.id <= targetWall.id
                            ? currentWall.id + targetWall.id
                            : targetWall.id + currentWall.id;
                        const array = wallJointsArray.filter((v) => {
                          return v.id !== currID;
                        });
                        setWallJointsArray(array);
                      }
                    }
                  }
                }
                if (targetID && targetPoint && targetSide) {
                  const wall_1 = getElementById(targetID) as WallModel;
                  const wall_2 = getElementById(buildingWall.id) as WallModel;
                  if (wall_1 && wall_2) {
                    let deltaAngle = angle - wall_1.relativeAngle;
                    if (targetSide === WallSide.Left) {
                      if ((deltaAngle >= 0 && deltaAngle < Math.PI) || deltaAngle < -Math.PI) {
                        // gap
                        updateElementById(targetID, {
                          leftOffset: 0,
                          leftJoints: [{ id: buildingWall.id, side: WallSide.Right }],
                        });
                        updateElementById(buildingWall.id, {
                          rightOffset: 0,
                          rightJoints: [{ id: targetID, side: WallSide.Left }],
                        });
                        wallJointsMap.delete(wall_1.id);
                        wallJointsMap.delete(wall_2.id);
                        setWallJointsMap(wallJointsMap);
                      } else if (
                        (deltaAngle > Math.PI && deltaAngle < (Math.PI * 3) / 2) ||
                        (deltaAngle > -Math.PI && deltaAngle < -Math.PI / 2)
                      ) {
                        const a = deltaAngle - Math.PI;
                        const l1 = wall_1.ly / Math.tan(a);
                        const l2 = wall_2.ly / Math.tan(a);
                        updateElementById(targetID, {
                          leftOffset: l1,
                          leftJoints: [{ id: buildingWall.id, side: WallSide.Right }],
                        });
                        updateElementById(buildingWall.id, {
                          rightOffset: l2,
                          rightJoints: [{ id: targetID, side: WallSide.Left }],
                        });
                        wallJointsMap.set(targetID, buildingWall.id);
                        wallJointsMap.set(buildingWall.id, targetID);
                        setWallJointsMap(wallJointsMap);
                        setMapUpdate(!mapUpdate);
                      } else {
                        // do nothing
                        updateElementById(targetID, {
                          leftOffset: 0,
                          leftJoints: [{ id: buildingWall.id, side: WallSide.Right }],
                        });
                        updateElementById(buildingWall.id, {
                          rightOffset: 0,
                          rightJoints: [{ id: targetID, side: WallSide.Left }],
                        });
                        wallJointsMap.delete(wall_1.id);
                        wallJointsMap.delete(wall_2.id);
                        setWallJointsMap(wallJointsMap);
                      }
                    }
                  }
                } else {
                  const currentWall = getElementById(buildingWall.id) as WallModel;
                  if (currentWall.rightJoints.length > 0) {
                    const targetWallID = wallJointsMap.get(buildingWall.id);
                    const targetWall = getElementById(targetWallID ?? '') as WallModel;
                    if (targetWallID && targetWall) {
                      for (const joint of targetWall.leftJoints) {
                        if (joint.id === buildingWall.id) {
                          updateElementById(targetWallID, { leftOffset: 0, leftJoints: [] });
                          break;
                        }
                      }
                    }
                    updateElementById(buildingWall.id, { rightOffset: 0, rightJoints: [] });
                    wallJointsMap.delete(wallJointsMap.get(buildingWall.id) as string);
                    wallJointsMap.delete(buildingWall.id);
                    setWallJointsMap(wallJointsMap);
                  }
                }
              }
            }
          }
        }}
      >
        <meshStandardMaterial
          attach="material"
          color={color}
          transparent={groundImage}
          opacity={groundImage ? 0.25 : 1}
        />
      </Box>

      {/* wall joints */}
      {wallJointsArray.map((value, index) => {
        const { point, l, height, wallID, wallSide } = value;

        const wall = getElementById(wallID) as WallModel;
        if (wall) {
          const { cx, cy, lx, ly, relativeAngle } = wall;
          const c = new Vector2(cx, cy);
          const rx = wallSide === WallSide.Left ? -lx / 2 + l : lx / 2 - l;
          const r1 = new Vector2(rx, ly).rotateAround(new Vector2(), relativeAngle);
          const r2 = new Vector2(rx, 0).rotateAround(new Vector2(), relativeAngle);
          const point1 = new Vector2().addVectors(c, r1);
          const point2 = new Vector2().addVectors(c, r2);

          const shape = new Shape();
          shape.moveTo(point.x, point.y);
          shape.lineTo(point1.x, point1.y);
          shape.lineTo(point2.x, point2.y);
          shape.lineTo(point.x, point.y);

          const settings = {
            depth: height + 0.05,
            bevelEnabled: false,
          };
          return (
            <Extrude key={index} args={[shape, settings]}>
              {/* <meshStandardMaterial attachArray="material" color="white" /> */}
              <meshStandardMaterial attachArray="material" map={texture} />
              <meshStandardMaterial attachArray="material" map={texture} />
            </Extrude>
          );
        }
      })}

      {/* intersection plane */}
      {grabRef.current?.type === ObjectType.SolarPanel && !grabRef.current.locked && (
        <Plane
          ref={intersecPlaneRef}
          position={intersectionPlanePosition}
          rotation={intersectionPlaneRotation}
          args={[lx, ly]}
          visible={false}
          onPointerMove={(e) => {
            if (grabRef.current) {
              const mouse = new Vector2();
              mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
              mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
              ray.setFromCamera(mouse, camera);
              let intersects;
              if (intersecPlaneRef.current) {
                const solarPanel = grabRef.current as SolarPanelModel;
                intersects = ray.intersectObjects([intersecPlaneRef.current]);
                if (intersects.length > 0) {
                  let p = intersects[0].point; //World coordinate
                  if (moveHandleType && elementModel) {
                    p = Util.relativeCoordinates(p.x, p.y, p.z, elementModel);
                    setElementPosition(solarPanel.id, p.x, p.y); //Relative coordinate
                  } else if (rotateHandleType) {
                    const parent = getElementById(solarPanel.parent.id);
                    if (parent) {
                      const pr = parent.rotation[2]; //parent rotation
                      const pc = new Vector2(parent.cx, parent.cy); //world parent center
                      const cc = new Vector2(parent.lx * solarPanel.cx, parent.ly * solarPanel.cy) //local current center
                        .rotateAround(new Vector2(0, 0), pr); //add parent rotation
                      const wc = new Vector2().addVectors(cc, pc); //world current center
                      const rotation =
                        -pr +
                        Math.atan2(-p.x + wc.x, p.y - wc.y) +
                        (rotateHandleType === RotateHandleType.Lower ? 0 : Math.PI);
                      const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * Math.PI * 2 : 0; // make sure angle is between -PI to PI
                      updateElementById(solarPanel.id, { relativeAzimuth: rotation + offset });
                      setCommonStore((state) => {
                        state.selectedElementAngle = rotation + offset;
                      });
                    }
                  } else if (resizeHandleType) {
                    switch (resizeHandleType) {
                      case ResizeHandleType.Lower:
                        {
                          const wp = new Vector2(p.x, p.y);
                          const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
                          const d = wp.distanceTo(resizeAnchor2D);
                          const angle = solarPanel.relativeAzimuth + rotation[2]; // world panel azimuth
                          const rp = new Vector2().subVectors(wp, resizeAnchor2D); // relative vector from anchor to pointer
                          const theta = -angle + rp.angle() + Math.PI / 2;
                          let dyl = d * Math.cos(theta);
                          if (solarPanel.orientation === Orientation.portrait) {
                            const nx = Math.max(
                              1,
                              Math.ceil((dyl - solarPanel.pvModel.length / 2) / solarPanel.pvModel.length),
                            );
                            dyl = nx * solarPanel.pvModel.length;
                          } else {
                            const nx = Math.max(
                              1,
                              Math.ceil((dyl - solarPanel.pvModel.width / 2) / solarPanel.pvModel.width),
                            );
                            dyl = nx * solarPanel.pvModel.width;
                          }
                          setElementSize(solarPanel.id, solarPanel.lx, dyl);

                          const wcx = resizeAnchor.x + (dyl * Math.sin(angle)) / 2;
                          const wcy = resizeAnchor.y - (dyl * Math.cos(angle)) / 2;
                          const wc = new Vector2(wcx, wcy); // world panel center
                          const wbc = new Vector2(cx, cy); // world foundation center
                          const rc = new Vector2().subVectors(wc, wbc).rotateAround(new Vector2(0, 0), -rotation[2]);
                          setElementPosition(solarPanel.id, rc.x / lx, rc.y / ly);
                        }
                        break;
                      case ResizeHandleType.Upper:
                        {
                          const wp = new Vector2(p.x, p.y);
                          const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
                          const d = wp.distanceTo(resizeAnchor2D);
                          const angle = solarPanel.relativeAzimuth + rotation[2];
                          const rp = new Vector2().subVectors(wp, resizeAnchor2D);
                          const theta = -angle + rp.angle() - Math.PI / 2;
                          let dyl = d * Math.cos(theta);
                          if (solarPanel.orientation === Orientation.portrait) {
                            const nx = Math.max(
                              1,
                              Math.ceil((dyl - solarPanel.pvModel.length / 2) / solarPanel.pvModel.length),
                            );
                            dyl = nx * solarPanel.pvModel.length;
                          } else {
                            const nx = Math.max(
                              1,
                              Math.ceil((dyl - solarPanel.pvModel.width / 2) / solarPanel.pvModel.width),
                            );
                            dyl = nx * solarPanel.pvModel.width;
                          }
                          setElementSize(solarPanel.id, solarPanel.lx, dyl);

                          const wcx = resizeAnchor.x - (dyl * Math.sin(angle)) / 2;
                          const wcy = resizeAnchor.y + (dyl * Math.cos(angle)) / 2;
                          const wc = new Vector2(wcx, wcy);
                          const wbc = new Vector2(cx, cy);
                          const rc = new Vector2().subVectors(wc, wbc).rotateAround(new Vector2(0, 0), -rotation[2]);
                          setElementPosition(solarPanel.id, rc.x / lx, rc.y / ly);
                        }
                        break;
                      case ResizeHandleType.Left:
                        {
                          const wp = new Vector2(p.x, p.y);
                          const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
                          const d = wp.distanceTo(resizeAnchor2D);
                          const angle = solarPanel.relativeAzimuth + rotation[2];
                          const rp = new Vector2().subVectors(wp, resizeAnchor2D);
                          const theta = rp.angle() - angle + Math.PI;
                          let dxl = d * Math.cos(theta);
                          if (solarPanel.orientation === Orientation.portrait) {
                            const nx = Math.max(
                              1,
                              Math.ceil((dxl - solarPanel.pvModel.width / 2) / solarPanel.pvModel.width),
                            );
                            dxl = nx * solarPanel.pvModel.width;
                          } else {
                            const nx = Math.max(
                              1,
                              Math.ceil((dxl - solarPanel.pvModel.length / 2) / solarPanel.pvModel.length),
                            );
                            dxl = nx * solarPanel.pvModel.length;
                          }
                          setElementSize(solarPanel.id, dxl, solarPanel.ly);

                          const wcx = resizeAnchor.x - (dxl * Math.cos(angle)) / 2;
                          const wcy = resizeAnchor.y - (dxl * Math.sin(angle)) / 2;
                          const wc = new Vector2(wcx, wcy);
                          const wbc = new Vector2(cx, cy);
                          const rc = new Vector2().subVectors(wc, wbc).rotateAround(new Vector2(0, 0), -rotation[2]);
                          setElementPosition(solarPanel.id, rc.x / lx, rc.y / ly);
                        }
                        break;
                      case ResizeHandleType.Right:
                        {
                          const wp = new Vector2(p.x, p.y);
                          const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
                          const d = wp.distanceTo(resizeAnchor2D);
                          const angle = solarPanel.relativeAzimuth + rotation[2];
                          const rp = new Vector2().subVectors(wp, resizeAnchor2D);
                          const theta = -angle + rp.angle();
                          let dxl = d * Math.cos(theta);
                          if (solarPanel.orientation === Orientation.portrait) {
                            const nx = Math.max(
                              1,
                              Math.ceil((dxl - solarPanel.pvModel.width / 2) / solarPanel.pvModel.width),
                            );
                            dxl = nx * solarPanel.pvModel.width;
                          } else {
                            const nx = Math.max(
                              1,
                              Math.ceil((dxl - solarPanel.pvModel.length / 2) / solarPanel.pvModel.length),
                            );
                            dxl = nx * solarPanel.pvModel.length;
                          }
                          setElementSize(solarPanel.id, dxl, solarPanel.ly);

                          const wcx = resizeAnchor.x + (dxl * Math.cos(angle)) / 2;
                          const wcy = resizeAnchor.y + (dxl * Math.sin(angle)) / 2;
                          const wc = new Vector2(wcx, wcy);
                          const wbc = new Vector2(cx, cy);
                          const rc = new Vector2().subVectors(wc, wbc).rotateAround(new Vector2(0, 0), -rotation[2]);
                          setElementPosition(solarPanel.id, rc.x / lx, rc.y / ly);
                        }
                        break;
                    }
                  }
                }
              }
            }
          }}
          onPointerUp={(e) => {
            grabRef.current = null;
            setShowGrid(false);
            setCommonStore((state) => {
              state.enableOrbitController = true;
            });
          }}
        />
      )}

      {showGrid && !groundImage && (
        <>
          {rotateHandleType && grabRef.current?.type === ObjectType.SolarPanel && (
            <PolarGrid element={grabRef.current} height={grabRef.current.poleHeight} />
          )}
          {(moveHandleType || resizeHandleType || buildingWallID) && <FoundationGrid args={[lx, ly, lz]} />}
        </>
      )}

      {/* wireFrame */}
      {!selected && <WireFrame args={[lx, ly, lz]} />}

      {/* draw handles */}
      {selected && !locked && (
        <>
          {/* resize handles */}
          <Box
            ref={resizeHandleLLRef}
            position={[positionLL.x, positionLL.y, 0]}
            args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
            name={ResizeHandleType.LowerLeft}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleLLRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleLLRef.current!.localToWorld(new Vector3(lx, ly, 0));
                  state.resizeAnchor.copy(anchor);
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
            ref={resizeHandleULRef}
            position={[positionUL.x, positionUL.y, 0]}
            args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
            name={ResizeHandleType.UpperLeft}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleULRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleULRef.current!.localToWorld(new Vector3(lx, -ly, 0));
                  state.resizeAnchor.copy(anchor);
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
            ref={resizeHandleLRRef}
            position={[positionLR.x, positionLR.y, 0]}
            args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
            name={ResizeHandleType.LowerRight}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleLRRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleLRRef.current!.localToWorld(new Vector3(-lx, ly, 0));
                  state.resizeAnchor.copy(anchor);
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
            ref={resizeHandleURRef}
            position={[positionUR.x, positionUR.y, 0]}
            args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
            name={ResizeHandleType.UpperRight}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleURRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleURRef.current!.localToWorld(new Vector3(-lx, -ly, 0));
                  state.resizeAnchor.copy(anchor);
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
            ref={moveHandleLowerRef}
            args={[moveHandleSize, 6, 6]}
            position={[0, -hy - MOVE_HANDLE_OFFSET, handleLift]}
            name={MoveHandleType.Lower}
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
            ref={moveHandleUpperRef}
            args={[moveHandleSize, 6, 6]}
            position={[0, hy + MOVE_HANDLE_OFFSET, handleLift]}
            name={MoveHandleType.Upper}
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
            ref={moveHandleLeftRef}
            args={[moveHandleSize, 6, 6]}
            position={[-hx - MOVE_HANDLE_OFFSET, handleLift, 0]}
            name={MoveHandleType.Left}
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
            ref={moveHandleRightRef}
            args={[moveHandleSize, 6, 6]}
            position={[hx + MOVE_HANDLE_OFFSET, 0, handleLift]}
            name={MoveHandleType.Right}
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

          {/* rotation handle */}
          <RotateHandle
            id={id}
            position={lowerRotateHandlePosition}
            color={
              hoveredHandle === RotateHandleType.Lower || rotateHandleType === RotateHandleType.Lower
                ? HIGHLIGHT_HANDLE_COLOR
                : RESIZE_HANDLE_COLOR
            }
            ratio={rotateHandleSize}
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
            ratio={rotateHandleSize}
            handleType={RotateHandleType.Upper}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
        </>
      )}

      {/* text */}
      <>
        {hovered && !selected && (
          <textSprite
            name={'Label'}
            text={'Foundation'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[0, 0, hz + 0.2]}
          />
        )}
        {!locked && hoveredResizeHandleLL && (
          <textSprite
            name={'Label'}
            text={'LL'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[-hx, -hy, hz + 0.2]}
          />
        )}
        {!locked && hoveredResizeHandleUL && (
          <textSprite
            name={'Label'}
            text={'UL'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[-hx, hy, hz + 0.2]}
          />
        )}
        {!locked && hoveredResizeHandleLR && (
          <textSprite
            name={'Label'}
            text={'LR'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[hx, -hy, hz + 0.2]}
          />
        )}
        {!locked && hoveredResizeHandleUR && (
          <textSprite
            name={'Label'}
            text={'UR'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[hx, hy, hz + 0.2]}
          />
        )}
      </>
    </group>
  );
};

const FoundationGrid = React.memo(({ args }: { args: [lx: number, ly: number, lz: number] }) => {
  const lx = args[0] / 2;
  const ly = args[1] / 2;
  const lz = args[2] / 2;

  const pointsX: number[] = [0];
  const pointsY: number[] = [0];

  const lineColor = 'white';
  const lineWidth = 0.5;

  for (let i = 1; i <= lx; i++) {
    pointsX.push(i);
    pointsX.push(-i);
  }

  for (let i = 1; i <= ly; i++) {
    pointsY.push(i);
    pointsY.push(-i);
  }

  return (
    <group position={[0, 0, lz + 0.01]}>
      {pointsX.map((value) => {
        return (
          <Line
            key={value}
            points={[
              [value, -ly, 0],
              [value, ly, 0],
            ]}
            color={lineColor}
            lineWidth={lineWidth}
            depthWrite={false}
          />
        );
      })}
      {pointsY.map((value) => {
        return (
          <Line
            key={value}
            points={[
              [-lx, value, 0],
              [lx, value, 0],
            ]}
            color={lineColor}
            lineWidth={lineWidth}
          />
        );
      })}
    </group>
  );
});

export default React.memo(Foundation);
