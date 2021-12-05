/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import Facade_Texture_00 from '../resources/building_facade_00.png';
import Facade_Texture_01 from '../resources/building_facade_01.png';
import Facade_Texture_02 from '../resources/building_facade_02.png';
import Facade_Texture_03 from '../resources/building_facade_03.png';
import Facade_Texture_04 from '../resources/building_facade_04.png';
import Facade_Texture_05 from '../resources/building_facade_05.png';
import Facade_Texture_06 from '../resources/building_facade_06.png';
import Facade_Texture_07 from '../resources/building_facade_07.png';
import Facade_Texture_08 from '../resources/building_facade_08.png';
import Facade_Texture_09 from '../resources/building_facade_09.png';
import Facade_Texture_10 from '../resources/building_facade_10.png';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Sphere } from '@react-three/drei';
import { Euler, Mesh, Raycaster, RepeatWrapping, TextureLoader, Vector2, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { CuboidModel } from '../models/CuboidModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  ActionType,
  CuboidTexture,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
} from '../types';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_COLOR_2,
  MOVE_HANDLE_COLOR_3,
  MOVE_HANDLE_OFFSET,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  TWO_PI,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from '../constants';
import { Util } from '../Util';
import { ElementModel } from '../models/ElementModel';
import RotateHandle from '../components/rotateHandle';
import { PolarGrid } from '../polarGrid';
import Wireframe from '../components/wireframe';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { UndoableAdd } from '../undo/UndoableAdd';
import { UndoableMove } from '../undo/UndoableMove';
import { UndoableResize } from '../undo/UndoableResize';
import { UndoableChange } from '../undo/UndoableChange';

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
  textureTypes = [
    CuboidTexture.NoTexture,
    CuboidTexture.NoTexture,
    CuboidTexture.NoTexture,
    CuboidTexture.NoTexture,
    CuboidTexture.NoTexture,
    CuboidTexture.NoTexture,
  ],
}: CuboidModel) => {
  const setCommonStore = useStore(Selector.set);
  const orthographic = useStore(Selector.viewState.orthographic);
  const moveHandleType = useStore(Selector.moveHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addElement = useStore(Selector.addElement);
  const removeElementById = useStore(Selector.removeElementById);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setElementSize = useStore(Selector.setElementSize);
  const setElementNormal = useStore(Selector.setElementNormal);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const selectMe = useStore(Selector.selectMe);
  const updateSolarPanelRelativeAzimuthById = useStore(Selector.updateSolarPanelRelativeAzimuthById);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLyById = useStore(Selector.updateElementLyById);
  const resizeAnchor = useStore(Selector.resizeAnchor);
  const getPvModule = useStore(Selector.getPvModule);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const addUndoable = useStore(Selector.addUndoable);

  const {
    camera,
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [normal, setNormal] = useState<Vector3>();
  const ray = useMemo(() => new Raycaster(), []);

  const cuboidModel = getElementById(id) as CuboidModel;
  const baseRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const faceNormalRef = useRef<Vector3>(UNIT_VECTOR_POS_Z);
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
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldNormalRef = useRef<Vector3>(new Vector3());
  const newNormalRef = useRef<Vector3>(new Vector3());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const newDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldAzimuthRef = useRef<number>(0);
  const newAzimuthRef = useRef<number>(0);

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLLTop = useMemo(() => new Vector3(-hx, -hy, hz), [hx, hy, hz]);
  const positionULTop = useMemo(() => new Vector3(-hx, hy, hz), [hx, hy, hz]);
  const positionLRTop = useMemo(() => new Vector3(hx, -hy, hz), [hx, hy, hz]);
  const positionURTop = useMemo(() => new Vector3(hx, hy, hz), [hx, hy, hz]);

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

  const fetchTextureImage = (textureType: CuboidTexture) => {
    switch (textureType) {
      case CuboidTexture.Facade01:
        return Facade_Texture_01;
      case CuboidTexture.Facade02:
        return Facade_Texture_02;
      case CuboidTexture.Facade03:
        return Facade_Texture_03;
      case CuboidTexture.Facade04:
        return Facade_Texture_04;
      case CuboidTexture.Facade05:
        return Facade_Texture_05;
      case CuboidTexture.Facade06:
        return Facade_Texture_06;
      case CuboidTexture.Facade07:
        return Facade_Texture_07;
      case CuboidTexture.Facade08:
        return Facade_Texture_08;
      case CuboidTexture.Facade09:
        return Facade_Texture_09;
      case CuboidTexture.Facade10:
        return Facade_Texture_10;
      default:
        return Facade_Texture_00;
    }
  };

  const fetchRepeatDividers = (textureType: CuboidTexture) => {
    switch (textureType) {
      case CuboidTexture.Facade01:
        return { x: 14, y: 6.5 };
      case CuboidTexture.Facade02:
        return { x: 14, y: 6.5 };
      case CuboidTexture.Facade03:
        return { x: 10, y: 12 };
      case CuboidTexture.Facade04:
        return { x: 20, y: 11 };
      case CuboidTexture.Facade05:
        return { x: 15, y: 10 };
      case CuboidTexture.Facade06:
        return { x: 11, y: 3.5 };
      case CuboidTexture.Facade07:
        return { x: 11, y: 10 };
      case CuboidTexture.Facade08:
        return { x: 16, y: 9 };
      case CuboidTexture.Facade09:
        return { x: 10, y: 9 };
      case CuboidTexture.Facade10:
        return { x: 12, y: 9 };
      default:
        return { x: 1, y: 1 }; // maybe for rooftop
    }
  };

  const textureLoaderEast = useMemo(() => {
    return new TextureLoader().load(textureTypes ? fetchTextureImage(textureTypes[0]) : Facade_Texture_00, (t) => {
      const param = fetchRepeatDividers(textureTypes[0]);
      t.repeat.set(ly / param.x, lz / param.y);
      t.rotation = HALF_PI;
      t.center.x = 1;
      t.center.y = 0;
      t.wrapS = t.wrapT = RepeatWrapping;
      setTextureEast(t);
    });
  }, [textureTypes[0], ly, lz]);
  const [textureEast, setTextureEast] = useState(textureLoaderEast);

  const textureLoaderWest = useMemo(() => {
    return new TextureLoader().load(textureTypes ? fetchTextureImage(textureTypes[1]) : Facade_Texture_00, (t) => {
      const param = fetchRepeatDividers(textureTypes[1]);
      t.repeat.set(ly / param.x, lz / param.y);
      t.rotation = -HALF_PI;
      t.wrapS = t.wrapT = RepeatWrapping;
      setTextureWest(t);
    });
  }, [textureTypes[1], ly, lz]);
  const [textureWest, setTextureWest] = useState(textureLoaderWest);

  const textureLoaderNorth = useMemo(() => {
    return new TextureLoader().load(textureTypes ? fetchTextureImage(textureTypes[2]) : Facade_Texture_00, (t) => {
      const param = fetchRepeatDividers(textureTypes[2]);
      t.repeat.set(lx / param.x, lz / param.y);
      t.rotation = Math.PI;
      t.center.x = 0;
      t.center.y = 1;
      t.wrapS = t.wrapT = RepeatWrapping;
      setTextureNorth(t);
    });
  }, [textureTypes[2], lx, lz]);
  const [textureNorth, setTextureNorth] = useState(textureLoaderNorth);

  const textureLoaderSouth = useMemo(() => {
    return new TextureLoader().load(textureTypes ? fetchTextureImage(textureTypes[3]) : Facade_Texture_00, (t) => {
      const param = fetchRepeatDividers(textureTypes[3]);
      t.repeat.set(lx / param.x, lz / param.y);
      t.wrapS = t.wrapT = RepeatWrapping;
      setTextureSouth(t);
    });
  }, [textureTypes[3], lx, lz]);
  const [textureSouth, setTextureSouth] = useState(textureLoaderSouth);

  const textureLoaderTop = useMemo(() => {
    return new TextureLoader().load(textureTypes ? fetchTextureImage(textureTypes[4]) : Facade_Texture_00, (t) => {
      const param = fetchRepeatDividers(textureTypes[4]);
      t.repeat.set(lx / param.x, ly / param.y);
      t.wrapS = t.wrapT = RepeatWrapping;
      setTextureTop(t);
    });
  }, [textureTypes[4], lx, ly]);
  const [textureTop, setTextureTop] = useState(textureLoaderTop);

  // dispose texture loaders to avoid memory leak
  // (not sure why, but we must dispose textureLoaderEast etc. instead of textureEast etc.)
  useEffect(() => {
    return () => {
      textureLoaderEast.dispose();
      textureLoaderWest.dispose();
      textureLoaderNorth.dispose();
      textureLoaderSouth.dispose();
      textureLoaderTop.dispose();
    };
  }, [textureLoaderEast, textureLoaderWest, textureLoaderNorth, textureLoaderSouth, textureLoaderTop]);

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
            handle === MoveHandleType.Right
          ) {
            domElement.style.cursor = 'move';
          } else if (handle === RotateHandleType.Upper || handle === RotateHandleType.Lower) {
            domElement.style.cursor = 'grab';
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
    return (
      type === ObjectType.Human ||
      type === ObjectType.Tree ||
      type === ObjectType.Sensor ||
      type === ObjectType.SolarPanel
    );
  };

  const setupGridHelper = (face: Vector3) => {
    faceNormalRef.current = face;
    if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_POS_Z)) {
      gridLength.current = Math.max(lx, ly);
      gridPositionRef.current = new Vector3(0, 0, hz);
      gridRotationRef.current = new Euler(HALF_PI, 0, 0);
      gridScale.current = new Vector3(lx / gridLength.current, 1, ly / gridLength.current);
    } else if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_POS_X)) {
      // east face in view coordinate system
      gridLength.current = Math.max(ly, lz);
      gridPositionRef.current = new Vector3(hx, 0, 0);
      gridRotationRef.current = new Euler(0, 0, HALF_PI);
      gridScale.current = new Vector3(ly / gridLength.current, 1, lz / gridLength.current);
    } else if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_NEG_X)) {
      // west face in view coordinate system
      gridLength.current = Math.max(ly, lz);
      gridPositionRef.current = new Vector3(-hx, 0, 0);
      gridRotationRef.current = new Euler(0, 0, -HALF_PI);
      gridScale.current = new Vector3(ly / gridLength.current, 1, lz / gridLength.current);
    } else if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_NEG_Y)) {
      // south face in the view coordinate system
      gridLength.current = Math.max(lx, lz);
      gridPositionRef.current = new Vector3(0, -hy, 0);
      gridRotationRef.current = new Euler(0, 0, 0);
      gridScale.current = new Vector3(lx / gridLength.current, 1, lz / gridLength.current);
    } else if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_POS_Y)) {
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

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    if (!useStore.getState().buildingWindowID && !useStore.getState().buildingWallID) {
      selectMe(id, e, ActionType.Select);
    }
    const selectedElement = getSelectedElement();
    if (selectedElement?.id === id) {
      // no child of this cuboid is clicked
      if (legalOnCuboid(objectTypeToAdd) && cuboidModel) {
        setShowGrid(true);
        const intersection = e.intersections[0];
        const addedElement = addElement(cuboidModel, intersection.point, intersection.face?.normal);
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
      // a child of this cuboid is clicked
      if (selectedElement && selectedElement.parentId === id) {
        if (legalOnCuboid(selectedElement.type)) {
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
          oldPositionRef.current.x = selectedElement.cx;
          oldPositionRef.current.y = selectedElement.cy;
          oldPositionRef.current.z = selectedElement.cz;
          oldNormalRef.current.fromArray(selectedElement.normal);
          oldDimensionRef.current.x = selectedElement.lx;
          oldDimensionRef.current.y = selectedElement.ly;
          oldDimensionRef.current.z = selectedElement.lz;
          if (selectedElement.type === ObjectType.SolarPanel) {
            oldAzimuthRef.current = (selectedElement as SolarPanelModel).relativeAzimuth;
          }
        }
      }
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && !grabRef.current.locked) {
      if (grabRef.current.parentId === id && grabRef.current.type) {
        const mouse = new Vector2();
        mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
        mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
        ray.setFromCamera(mouse, camera);
        let intersects;
        if (baseRef.current) {
          intersects = ray.intersectObjects([baseRef.current]);
          if (intersects.length > 0) {
            let p = intersects[0].point;
            const face = intersects[0].face;
            if (moveHandleType && cuboidModel) {
              if (face) {
                const n = face.normal;
                if (normal && !normal.equals(n)) {
                  setNormal(n);
                }
                setupGridHelper(n);
                setElementNormal(grabRef.current.id, n.x, n.y, n.z);
              }
              p = Util.relativeCoordinates(p.x, p.y, p.z, cuboidModel);
              setElementPosition(grabRef.current.id, p.x, p.y, p.z);
            } else if (rotateHandleType) {
              const parent = getElementById(grabRef.current.parentId);
              if (parent) {
                const pr = parent.rotation[2]; //parent rotation
                const pc = new Vector2(parent.cx, parent.cy); //world parent center
                const cc = new Vector2(parent.lx * grabRef.current.cx, parent.ly * grabRef.current.cy) //local current center
                  .rotateAround(new Vector2(0, 0), pr); //add parent rotation
                const wc = new Vector2().addVectors(cc, pc); //world current center
                const rotation =
                  -pr +
                  Math.atan2(-p.x + wc.x, p.y - wc.y) +
                  (rotateHandleType === RotateHandleType.Lower ? 0 : Math.PI);
                const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * TWO_PI : 0; // make sure angle is between -PI to PI
                if (grabRef.current?.type === ObjectType.SolarPanel) {
                  updateSolarPanelRelativeAzimuthById(grabRef.current.id, rotation + offset);
                  newAzimuthRef.current = rotation + offset;
                }
                setCommonStore((state) => {
                  state.selectedElementAngle = rotation + offset;
                });
              }
            } else if (resizeHandleType && cuboidModel) {
              const solarPanel = grabRef.current as SolarPanelModel;
              const wp = new Vector3(p.x, p.y, p.z);
              const vd = new Vector3().subVectors(wp, resizeAnchor);
              const vh = new Vector3().subVectors(
                Util.absoluteCoordinates(solarPanel.cx, solarPanel.cy, solarPanel.cz, cuboidModel),
                resizeAnchor,
              );
              if (normal && normal.z === 1) {
                vh.setZ(0);
              }
              const vhd = vd.projectOnVector(vh);
              let d = vhd.length();
              const pvModel = getPvModule(solarPanel.pvModelName);
              if (solarPanel.orientation === Orientation.portrait) {
                if (resizeHandleType === ResizeHandleType.Left || resizeHandleType === ResizeHandleType.Right) {
                  const nx = Math.max(1, Math.ceil((d - pvModel.width / 2) / pvModel.width));
                  d = nx * pvModel.width;
                  updateElementLxById(solarPanel.id, d);
                } else {
                  const ny = Math.max(1, Math.ceil((d - pvModel.length / 2) / pvModel.length));
                  d = ny * pvModel.length;
                  updateElementLyById(solarPanel.id, d);
                }
              } else {
                if (resizeHandleType === ResizeHandleType.Left || resizeHandleType === ResizeHandleType.Right) {
                  const nx = Math.max(1, Math.ceil((d - pvModel.length / 2) / pvModel.length));
                  d = nx * pvModel.length;
                  updateElementLxById(solarPanel.id, d);
                } else {
                  const ny = Math.max(1, Math.ceil((d - pvModel.width / 2) / pvModel.width));
                  d = ny * pvModel.width;
                  updateElementLyById(solarPanel.id, d);
                }
              }
              const wc = new Vector3().addVectors(resizeAnchor, vhd.normalize().multiplyScalar(d / 2));
              const rc = Util.relativeCoordinates(wc.x, wc.y, wc.z, cuboidModel);
              setElementPosition(solarPanel.id, rc.x, rc.y, rc.z);
            }
          }
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (grabRef.current) {
      const elem = getElementById(grabRef.current.id);
      if (elem && elem.parentId === id) {
        if (resizeHandleType) {
          newPositionRef.current.x = elem.cx;
          newPositionRef.current.y = elem.cy;
          newPositionRef.current.z = elem.cz;
          newDimensionRef.current.x = elem.lx;
          newDimensionRef.current.y = elem.ly;
          newDimensionRef.current.z = elem.lz;
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
          if (grabRef.current && grabRef.current.type === ObjectType.SolarPanel) {
            const solarPanel = grabRef.current as SolarPanelModel;
            if (Math.abs(newAzimuthRef.current - oldAzimuthRef.current) > 0.001) {
              const undoableRotate = {
                name: 'Rotate',
                timestamp: Date.now(),
                oldValue: oldAzimuthRef.current,
                newValue: newAzimuthRef.current,
                undo: () => {
                  updateSolarPanelRelativeAzimuthById(solarPanel.id, undoableRotate.oldValue as number);
                },
                redo: () => {
                  updateSolarPanelRelativeAzimuthById(solarPanel.id, undoableRotate.newValue as number);
                },
              } as UndoableChange;
              addUndoable(undoableRotate);
            }
          }
        } else {
          // for moving sensors and solar panels
          newPositionRef.current.x = elem.cx;
          newPositionRef.current.y = elem.cy;
          newPositionRef.current.z = elem.cz;
          newNormalRef.current.fromArray(elem.normal);
          if (newPositionRef.current.distanceToSquared(oldPositionRef.current) > 0.0001) {
            const undoableMove = {
              name: 'Move',
              timestamp: Date.now(),
              movedElement: grabRef.current,
              oldCx: oldPositionRef.current.x,
              oldCy: oldPositionRef.current.y,
              oldCz: oldPositionRef.current.z,
              oldNormal: oldNormalRef.current.clone(),
              newCx: newPositionRef.current.x,
              newCy: newPositionRef.current.y,
              newCz: newPositionRef.current.z,
              newNormal: newNormalRef.current.clone(),
              undo: () => {
                setElementPosition(
                  undoableMove.movedElement.id,
                  undoableMove.oldCx,
                  undoableMove.oldCy,
                  undoableMove.oldCz,
                );
                if (undoableMove.oldNormal) {
                  setElementNormal(
                    undoableMove.movedElement.id,
                    undoableMove.oldNormal.x,
                    undoableMove.oldNormal.y,
                    undoableMove.oldNormal.z,
                  );
                }
              },
              redo: () => {
                setElementPosition(
                  undoableMove.movedElement.id,
                  undoableMove.newCx,
                  undoableMove.newCy,
                  undoableMove.newCz,
                );
                if (undoableMove.newNormal) {
                  setElementNormal(
                    undoableMove.movedElement.id,
                    undoableMove.newNormal.x,
                    undoableMove.newNormal.y,
                    undoableMove.newNormal.z,
                  );
                }
              },
            } as UndoableMove;
            addUndoable(undoableMove);
          }
        }
      }
      grabRef.current = null;
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0) {
      const intersected = e.intersections[0].object === baseRef.current;
      if (intersected) {
        setHovered(true);
      }
    }
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    selectMe(id, e, ActionType.Select);
    setCommonStore((state) => {
      state.pastePoint.copy(e.intersections[0].point);
      const face = e.intersections[0].face;
      if (face) {
        state.pasteNormal = face.normal.clone();
        if (Util.isSame(face.normal, UNIT_VECTOR_POS_X)) {
          state.selectedSideIndex = 0;
        } else if (Util.isSame(face.normal, UNIT_VECTOR_NEG_X)) {
          state.selectedSideIndex = 1;
        } else if (Util.isSame(face.normal, UNIT_VECTOR_POS_Y)) {
          state.selectedSideIndex = 2;
        } else if (Util.isSame(face.normal, UNIT_VECTOR_NEG_Y)) {
          state.selectedSideIndex = 3;
        } else if (Util.isSame(face.normal, UNIT_VECTOR_POS_Z)) {
          state.selectedSideIndex = 4;
        }
      }
      state.clickObjectType = ObjectType.Cuboid;
      if (e.intersections.length > 0) {
        const intersected = e.intersections[0].object === baseRef.current;
        if (intersected) {
          state.contextMenuObjectType = ObjectType.Cuboid;
        }
      }
    });
  };

  const faces: number[] = [0, 1, 2, 3, 4, 5];
  const textures = [textureEast, textureWest, textureNorth, textureSouth, textureTop, null];

  return (
    <group name={'Cuboid Group ' + id} userData={{ aabb: true }} position={[cx, cy, hz]} rotation={[0, 0, rotation[2]]}>
      {/* draw rectangular cuboid */}
      <Box
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
        userData={{ simulation: true, stand: true }}
        uuid={id}
        ref={baseRef}
        args={[lx, ly, lz]}
        name={'Cuboid'}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={(e) => setHovered(false)}
      >
        {cuboidModel && cuboidModel.faceColors ? (
          faces.map((i) => {
            if (textureTypes && textureTypes[i] !== CuboidTexture.NoTexture) {
              return <meshStandardMaterial key={i} attachArray="material" color={'white'} map={textures[i]} />;
            } else {
              return (
                <meshStandardMaterial
                  key={i}
                  attachArray="material"
                  color={cuboidModel.faceColors ? cuboidModel.faceColors[i] : color}
                  map={textures[i]}
                />
              );
            }
          })
        ) : (
          <meshStandardMaterial attach="material" color={color} />
        )}
      </Box>

      {showGrid && (
        <>
          {(moveHandleType || resizeHandleType) && (
            <gridHelper
              name={'Cuboid Grid'}
              position={gridPositionRef.current}
              rotation={gridRotationRef.current}
              scale={gridScale.current}
              args={[gridLength.current, 20, 'gray', 'gray']}
            />
          )}
          {rotateHandleType && grabRef.current && grabRef.current.type === ObjectType.SolarPanel && (
            <PolarGrid element={grabRef.current} height={(grabRef.current as SolarPanelModel).poleHeight + hz} />
          )}
        </>
      )}

      {!selected && <Wireframe hx={hx} hy={hy} hz={hz} />}

      {/* draw handles */}
      {selected && !locked && (
        <>
          {/* resize handles */}
          {!orthographic && (
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
          )}
          {!orthographic && (
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
          )}
          {!orthographic && (
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
                  hoveredHandle === ResizeHandleType.LowerRightTop ||
                  resizeHandleType === ResizeHandleType.LowerRightTop
                    ? HIGHLIGHT_HANDLE_COLOR
                    : RESIZE_HANDLE_COLOR
                }
              />
            </Box>
          )}
          {!orthographic && (
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
                  hoveredHandle === ResizeHandleType.UpperRightTop ||
                  resizeHandleType === ResizeHandleType.UpperRightTop
                    ? HIGHLIGHT_HANDLE_COLOR
                    : RESIZE_HANDLE_COLOR
                }
              />
            </Box>
          )}
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
            ref={resizeHandleULBotRef}
            name={ResizeHandleType.UpperLeft}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={new Vector3(-hx, hy, RESIZE_HANDLE_SIZE / 2 - hz)}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleULBotRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleULBotRef.current!.localToWorld(new Vector3(lx, -ly, 0));
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
            ref={resizeHandleLRBotRef}
            name={ResizeHandleType.LowerRight}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={new Vector3(hx, -hy, RESIZE_HANDLE_SIZE / 2 - hz)}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleLRBotRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleLRBotRef.current!.localToWorld(new Vector3(-lx, ly, 0));
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
            ref={resizeHandleURBotRef}
            name={ResizeHandleType.UpperRight}
            args={[resizeHandleSize, resizeHandleSize, resizeHandleSize]}
            position={new Vector3(hx, hy, RESIZE_HANDLE_SIZE / 2 - hz)}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleURBotRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleURBotRef.current!.localToWorld(new Vector3(-lx, -ly, 0));
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
