/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Line, Sphere, Plane } from '@react-three/drei';
import { DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { FoundationModel } from '../models/FoundationModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { ActionType, MoveHandleType, ObjectType, Orientation, ResizeHandleType, RotateHandleType } from '../types';
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
  const maxLxLy = Math.max(lx, ly);

  const setCommonStore = useStore((state) => state.set);
  const viewState = useStore((state) => state.viewState);
  const moveHandleType = useStore((state) => state.moveHandleType);
  const resizeHandleType = useStore((state) => state.resizeHandleType);
  const rotateHandleType = useStore((state) => state.rotateHandleType);
  const resizeAnchor = useStore((state) => state.resizeAnchor);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const getElementById = useStore((state) => state.getElementById);
  const objectTypeToAdd = useStore((state) => state.objectTypeToAdd);
  const addElement = useStore((state) => state.addElement);
  const setElementPosition = useStore((state) => state.setElementPosition);
  const setElementSize = useStore((state) => state.setElementSize);
  const updateElementById = useStore((state) => state.updateElementById);
  const selectMe = useStore((state) => state.selectMe);
  const deleteElementById = useStore((state) => state.deleteElementById);
  const getInitialWallsID = useStore((state) => state.getInitialWallsID);
  const deletedWallID = useStore((state) => state.deletedWallID);

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
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [wallPoints, setWallPoints] = useState<Map<string, { startPoint: Vector3; endPoint: Vector3 }>>(new Map());

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
      walls.add(id);
      const wall = getElementById(id) as WallModel;
      if (wall) {
        // wall.points are not vector3 type at runtime
        const startPoint = new Vector3(wall.startPoint.x, wall.startPoint.y);
        const endPoint = new Vector3(wall.endPoint.x, wall.endPoint.y);
        wallPoints.set(id, { startPoint, endPoint });
      }
    }
    setWalls(walls);
    setWallPoints(wallPoints);
  }, []);

  useEffect(() => {
    if (deletedWallID) {
      walls.delete(deletedWallID);
      wallPoints.delete(deletedWallID);
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

  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  const intersectionPlaneRotation = useMemo(() => new Euler(), []);

  if (grabRef.current && grabRef.current.type === ObjectType.SolarPanel) {
    intersectionPlanePosition.set(0, 0, grabRef.current.poleHeight);
    intersectionPlaneRotation.set(0, 0, 0);
  }

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
    wallPoints: Map<string, { startPoint: Vector3; endPoint: Vector3 }>,
    pointer: Vector3,
    minDist: number,
  ) => {
    let min = minDist;
    let targetPoint: Vector3 | null = null;

    for (const [id, points] of wallPoints) {
      if (id === buildingWallID || (grabRef.current && id === grabRef.current.id)) continue;
      const { startPoint, endPoint } = points;
      const distStart = startPoint.distanceTo(pointer);
      const distEnd = endPoint.distanceTo(pointer);
      const flag = distStart <= distEnd;
      const dist = flag ? distStart : distEnd;
      const point = flag ? startPoint : endPoint;
      if (dist < min) {
        min = dist;
        targetPoint = point;
      } else {
        setMagnetedPoint(null);
      }
    }
    return targetPoint;
  };

  const transferCurrentPoint = (p: Vector3, elementModel: ElementModel) => {
    const relativeP = Util.wallRelativePosition(p.x, p.y, elementModel);
    const targetPoint = findMagnetPoint(wallPoints, relativeP, 0.5);
    if (targetPoint) {
      setMagnetedPoint(targetPoint);
      p = Util.wallAbsolutePosition(targetPoint.x, targetPoint.y, elementModel);
    }
    return p;
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

  return (
    <group name={'Foundation Group ' + id} position={[cx, cy, hz]} rotation={[0, 0, rotation[2]]}>
      {/* draw rectangle */}
      <Box
        castShadow={viewState.shadowEnabled}
        receiveShadow={viewState.shadowEnabled}
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
            state.pasteNormal = Util.UNIT_VECTOR_POS_Y;
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
            const intersects = ray.intersectObjects([baseRef.current]);
            let pos = intersects[0].point;
            if (magnetedPoint) {
              pos = magnetedPoint;
              setMagnetedPoint(null);
            } else {
              pos = Util.wallRelativePosition(pos.x, pos.y, elementModel);
            }
            if (isSettingWallStartPoint) {
              setWallPoints(wallPoints.set(buildingWallID, { startPoint: pos, endPoint: new Vector3() }));
              updateElementById(buildingWallID, { startPoint: pos });
              setIsSettingWallStartPoint(false);
              setIsSettingWallEndPoint(true);
            } else if (isSettingWallEndPoint) {
              const startPoint = wallPoints.get(buildingWallID)?.startPoint ?? new Vector3();
              setWallPoints(wallPoints.set(buildingWallID, { startPoint: startPoint, endPoint: pos }));
              updateElementById(buildingWallID, { endPoint: pos });
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
        }}
        onPointerUp={(e) => {
          if (grabRef.current) {
            const wall = getElementById(grabRef.current.id) as WallModel;
            if (wall) {
              const startPoint = wall.startPoint;
              const endPoint = wall.endPoint;
              setWallPoints(wallPoints.set(grabRef.current.id, { startPoint: startPoint, endPoint: endPoint }));
            }
            grabRef.current = null;
          }
          if (!buildingWallID) {
            setShowGrid(false);
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
                    if (enableWallMagnet) {
                      p = transferCurrentPoint(p, elementModel);
                    }
                    const lx = p.distanceTo(resizeAnchor);
                    const asbCenter = new Vector3().addVectors(p, resizeAnchor).divideScalar(2);
                    const relativeCenter = Util.wallRelativePosition(asbCenter.x, asbCenter.y, elementModel);
                    const angle =
                      Math.atan2(p.y - resizeAnchor.y, p.x - resizeAnchor.x) -
                      elementModel.rotation[2] +
                      (resizeHandleType === ResizeHandleType.LowerLeft ? Math.PI : 0);
                    const startPoint = Util.wallRelativePosition(resizeAnchor.x, resizeAnchor.y, elementModel);
                    const endPoint = Util.wallRelativePosition(p.x, p.y, elementModel);
                    updateElementById(grabRef.current.id, {
                      cx: relativeCenter.x,
                      cy: relativeCenter.y,
                      lx: lx,
                      relativeAngle: angle,
                      startPoint: startPoint,
                      endPoint: endPoint,
                    });
                  }
                  break;
              }
            }
            if (objectTypeToAdd === ObjectType.Wall) {
              const wallID = addElement(elementModel, p);
              setWalls(walls.add(wallID));
              setBuildingWallID(wallID);
              buildingWallIDRef.current = wallID;
              setCommonStore((state) => {
                state.buildingWallID = wallID;
              });
              setIsSettingWallStartPoint(true);
              setShowGrid(true);
              setCommonStore((state) => {
                state.objectTypeToAdd = ObjectType.None;
              });
            }
            if (buildingWallID) {
              if (enableWallMagnet) {
                p = transferCurrentPoint(p, elementModel);
              }
              if (isSettingWallStartPoint) {
                const relativePos = Util.wallRelativePosition(p.x, p.y, elementModel);
                const wall = updateElementById(buildingWallID, {
                  cx: relativePos.x,
                  cy: relativePos.y,
                });
                if (wall) {
                  setBuildingWall(wall as WallModel);
                }
              } else if (isSettingWallEndPoint && buildingWall) {
                const startPoint = Util.wallAbsolutePosition(buildingWall.cx, buildingWall.cy, elementModel);
                const lx = p.distanceTo(startPoint);
                const absCenter = new Vector3().addVectors(p, startPoint).divideScalar(2);
                const relativeCenter = Util.wallRelativePosition(absCenter.x, absCenter.y, elementModel);
                const angle = Math.atan2(p.y - startPoint.y, p.x - startPoint.x) - elementModel.rotation[2];
                updateElementById(buildingWallID, {
                  cx: relativeCenter.x,
                  cy: relativeCenter.y,
                  lx: lx,
                  relativeAngle: angle,
                });
              }
            }
          }
        }}
      >
        <meshStandardMaterial
          attach="material"
          color={color}
          transparent={viewState.groundImage}
          opacity={viewState.groundImage ? 0.25 : 1}
        />
      </Box>

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

      {showGrid && !viewState.groundImage && (
        <>
          {rotateHandleType && grabRef.current?.type === ObjectType.SolarPanel && (
            <PolarGrid element={grabRef.current} height={grabRef.current.poleHeight} />
          )}
          {(moveHandleType || resizeHandleType || buildingWallID) && (
            <gridHelper
              name={'Foundation Grid'}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, lz]}
              scale={[lx / maxLxLy, 1, ly / maxLxLy]}
              args={[maxLxLy, 50, 'gray', 'gray']}
            />
          )}
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

export default React.memo(Foundation);
