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
import { Box, Plane, Sphere } from '@react-three/drei';
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
  ORIGIN_VECTOR2,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  TWO_PI,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
  UNIT_VECTOR_POS_Z_ARRAY,
  ZERO_TOLERANCE,
} from '../constants';
import { Util } from '../Util';
import { ElementModel } from '../models/ElementModel';
import RotateHandle from '../components/rotateHandle';
import { PolarGrid } from './polarGrid';
import Wireframe from '../components/wireframe';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { UndoableAdd } from '../undo/UndoableAdd';
import { UndoableMove } from '../undo/UndoableMove';
import { UndoableResize } from '../undo/UndoableResize';
import { UndoableChange } from '../undo/UndoableChange';
import i18n from '../i18n/i18n';
import { Point2 } from '../models/Point2';
import { PolygonModel } from '../models/PolygonModel';
import { ElementGrid } from './elementGrid';

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
  const language = useStore(Selector.language);
  const orthographic = useStore(Selector.viewState.orthographic);
  const moveHandleType = useStore(Selector.moveHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addElement = useStore(Selector.addElement);
  const removeElementById = useStore(Selector.removeElementById);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLyById = useStore(Selector.updateElementLyById);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setElementSize = useStore(Selector.setElementSize);
  const setElementNormal = useStore(Selector.setElementNormal);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const selectMe = useStore(Selector.selectMe);
  const updateSolarPanelRelativeAzimuthById = useStore(Selector.updateSolarPanelRelativeAzimuthById);
  const resizeAnchor = useStore(Selector.resizeAnchor);
  const getPvModule = useStore(Selector.getPvModule);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const addUndoable = useStore(Selector.addUndoable);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const isAddingElement = useStore(Selector.isAddingElement);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);
  const updatePolygonVertexPositionById = useStore(Selector.updatePolygonVertexPositionById);
  const setEnableOrbitController = useStore(Selector.setEnableOrbitController);

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
  const gridPositionRef = useRef<Vector3>(new Vector3(0, 0, 0));
  const gridRotationRef = useRef<Euler>(new Euler(0, 0, 0));
  const gridDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
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
  const oldVerticesRef = useRef<Point2[]>([]);
  const newVerticesRef = useRef<Point2[]>([]);
  const intersectPlaneRef = useRef<Mesh>();
  const resizeAnchorRef = useRef(useStore.getState().resizeAnchor);
  const enableFineGridRef = useRef(useStore.getState().enableFineGrid);

  const lang = { lng: language };
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

  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  if (grabRef.current && grabRef.current.type === ObjectType.SolarPanel) {
    intersectionPlanePosition.set(0, 0, cuboidModel.lz / 2 + (grabRef.current as SolarPanelModel).poleHeight);
  }

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      resizeAnchorRef.current = state.resizeAnchor;
      enableFineGridRef.current = state.enableFineGrid;
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handlePointerUp = () => {
      grabRef.current = null;
      setShowGrid(false);
      setEnableOrbitController(true);
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
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
            domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'pointer';
          }
        }
      }
    },
    [],
  );

  const noHoverHandle = useCallback(() => {
    setHoveredHandle(null);
    domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'default';
  }, []);

  // only these elements are allowed to be on the cuboid
  const legalOnCuboid = (type: ObjectType) => {
    return (
      type === ObjectType.Human ||
      type === ObjectType.Tree ||
      type === ObjectType.Polygon ||
      type === ObjectType.Sensor ||
      type === ObjectType.SolarPanel
    );
  };

  const setupGridParams = (face: Vector3) => {
    faceNormalRef.current = face;
    if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_POS_Z)) {
      gridPositionRef.current = new Vector3(0, 0, hz);
      gridRotationRef.current = new Euler(0, 0, 0);
      gridDimensionRef.current.set(hx, hy, hz);
    } else if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_POS_X)) {
      // east face in view coordinate system
      gridPositionRef.current = new Vector3(hx, 0, 0);
      gridRotationRef.current = new Euler(0, HALF_PI, 0);
      gridDimensionRef.current.set(hz, hy, hx);
    } else if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_NEG_X)) {
      // west face in view coordinate system
      gridPositionRef.current = new Vector3(-hx, 0, 0);
      gridRotationRef.current = new Euler(0, -HALF_PI, 0);
      gridDimensionRef.current.set(hz, hy, hx);
    } else if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_NEG_Y)) {
      // south face in the view coordinate system
      gridPositionRef.current = new Vector3(0, -hy, 0);
      gridRotationRef.current = new Euler(HALF_PI, 0, 0);
      gridDimensionRef.current.set(hx, hz, hy);
    } else if (Util.isSame(faceNormalRef.current, UNIT_VECTOR_POS_Y)) {
      // north face in the view coordinate system
      gridPositionRef.current = new Vector3(0, hy, 0);
      gridRotationRef.current = new Euler(-HALF_PI, 0, 0);
      gridDimensionRef.current.set(hx, hz, hy);
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

  const onTopSurface = Util.isIdentical(grabRef.current?.normal, UNIT_VECTOR_POS_Z_ARRAY);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    if (!isAddingElement()) {
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
            setupGridParams(face.normal);
            if (!normal || !normal.equals(face.normal)) {
              setNormal(face.normal);
            }
          }
          setEnableOrbitController(false);
          oldPositionRef.current.x = selectedElement.cx;
          oldPositionRef.current.y = selectedElement.cy;
          oldPositionRef.current.z = selectedElement.cz;
          oldNormalRef.current.fromArray(selectedElement.normal);
          oldDimensionRef.current.x = selectedElement.lx;
          oldDimensionRef.current.y = selectedElement.ly;
          oldDimensionRef.current.z = selectedElement.lz;
          switch (selectedElement.type) {
            case ObjectType.SolarPanel:
              oldAzimuthRef.current = (selectedElement as SolarPanelModel).relativeAzimuth;
              break;
            case ObjectType.Polygon:
              oldVerticesRef.current = (selectedElement as PolygonModel).vertices.map((v) => ({ ...v }));
              break;
          }
        }
      }
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && cuboidModel) {
      if (grabRef.current.type === ObjectType.SolarPanel && onTopSurface) return;
      if (grabRef.current.parentId === id && grabRef.current.type && !grabRef.current.locked) {
        const mouse = new Vector2(
          (e.offsetX / domElement.clientWidth) * 2 - 1,
          1 - (e.offsetY / domElement.clientHeight) * 2,
        );
        ray.setFromCamera(mouse, camera);
        if (baseRef.current) {
          const intersects = ray.intersectObjects([baseRef.current]);
          if (intersects.length > 0) {
            let p = intersects[0].point;
            const face = intersects[0].face;
            if (moveHandleType) {
              if (face) {
                const n = face.normal;
                if (normal && !normal.equals(n)) {
                  setNormal(n);
                }
                setupGridParams(n);
                setElementNormal(grabRef.current.id, n.x, n.y, n.z);
              }
              p = Util.relativeCoordinates(p.x, p.y, p.z, cuboidModel);
              if (grabRef.current.type === ObjectType.Polygon) {
                const polygon = grabRef.current as PolygonModel;
                if (moveHandleType === MoveHandleType.Default) {
                  const centroid = Util.calculatePolygonCentroid(polygon.vertices);
                  const dx = p.x - centroid.x;
                  const dy = p.y - centroid.y;
                  const copy = polygon.vertices.map((v) => ({ ...v }));
                  copy.forEach((v: Point2) => {
                    v.x += dx;
                    v.y += dy;
                  });
                  // update all the vertices at once with the DEEP COPY above
                  // do not update each vertex's position one by one (it is slower)
                  updatePolygonVerticesById(polygon.id, copy);
                }
              } else {
                setElementPosition(grabRef.current.id, p.x, p.y, p.z);
              }
            } else if (resizeHandleType) {
              switch (grabRef.current.type) {
                case ObjectType.SolarPanel:
                  const solarPanel = grabRef.current as SolarPanelModel;
                  const wp = new Vector3(p.x, p.y, p.z);
                  const vd = new Vector3().subVectors(wp, resizeAnchor);
                  const vh = new Vector3().subVectors(
                    Util.absoluteCoordinates(solarPanel.cx, solarPanel.cy, solarPanel.cz, cuboidModel),
                    resizeAnchor,
                  );
                  if (normal && Math.abs(normal.z - 1) < ZERO_TOLERANCE) {
                    vh.setZ(0);
                  }
                  const vhd = vd.projectOnVector(vh);
                  const d = vhd.length();
                  const pvModel = getPvModule(solarPanel.pvModelName);
                  let newLx = solarPanel.lx;
                  let newLy = solarPanel.ly;
                  if (solarPanel.orientation === Orientation.portrait) {
                    if (resizeHandleType === ResizeHandleType.Left || resizeHandleType === ResizeHandleType.Right) {
                      const nx = Math.max(1, Math.ceil((d - pvModel.width / 2) / pvModel.width));
                      newLx = nx * pvModel.width;
                    } else {
                      const ny = Math.max(1, Math.ceil((d - pvModel.length / 2) / pvModel.length));
                      newLy = ny * pvModel.length;
                    }
                  } else {
                    if (resizeHandleType === ResizeHandleType.Left || resizeHandleType === ResizeHandleType.Right) {
                      const nx = Math.max(1, Math.ceil((d - pvModel.length / 2) / pvModel.length));
                      newLx = nx * pvModel.length;
                    } else {
                      const ny = Math.max(1, Math.ceil((d - pvModel.width / 2) / pvModel.width));
                      newLy = ny * pvModel.width;
                    }
                  }
                  const wc = new Vector3().addVectors(resizeAnchor, vhd.normalize().multiplyScalar(d / 2));
                  const rc = Util.relativeCoordinates(wc.x, wc.y, wc.z, cuboidModel);
                  // TODO: check vertical surfaces
                  setElementSize(solarPanel.id, newLx, newLy);
                  setElementPosition(solarPanel.id, rc.x, rc.y);
                  break;
                case ObjectType.Polygon:
                  if (resizeHandleType === ResizeHandleType.Default) {
                    const polygon = grabRef.current as PolygonModel;
                    // snap to the grid (do not call Util.relativeCoordinates because we have to snap in the middle)
                    p.x -= cuboidModel.cx;
                    p.y -= cuboidModel.cy;
                    p.applyEuler(new Euler().fromArray(cuboidModel.rotation.map((a) => -a)));
                    p = enableFineGridRef.current ? Util.snapToFineGrid(p) : Util.snapToNormalGrid(p);
                    p.x /= cuboidModel.lx;
                    p.y /= cuboidModel.ly;
                    updatePolygonVertexPositionById(polygon.id, polygon.selectedIndex, p.x, p.y);
                  }
                  break;
              }
            }
          }
        }
      }
    }
  };

  const handleSolarPanelPointerMoveOnTopSurface = (e: ThreeEvent<PointerEvent>) => {
    if (intersectPlaneRef.current && grabRef.current && cuboidModel) {
      if (grabRef.current.type !== ObjectType.SolarPanel || !onTopSurface) return;
      const solarPanel = grabRef.current as SolarPanelModel;
      if (solarPanel.parentId !== id || solarPanel.locked) return;
      const mouse = new Vector2(
        (e.offsetX / domElement.clientWidth) * 2 - 1,
        1 - (e.offsetY / domElement.clientHeight) * 2,
      );
      ray.setFromCamera(mouse, camera);
      const intersects = ray.intersectObjects([intersectPlaneRef.current]);
      if (intersects.length > 0) {
        let p = intersects[0].point;
        if (moveHandleType) {
          p = Util.relativeCoordinates(p.x, p.y, p.z, cuboidModel);
          if (isSolarPanelNewPositionOk(solarPanel, p.x, p.y)) {
            setElementPosition(solarPanel.id, p.x, p.y, p.z);
          }
        } else if (rotateHandleType) {
          const pr = cuboidModel.rotation[2]; //parent rotation
          const pc = new Vector2(cuboidModel.cx, cuboidModel.cy); //world parent center
          const cc = new Vector2(cuboidModel.lx * solarPanel.cx, cuboidModel.ly * solarPanel.cy) //local current center
            .rotateAround(ORIGIN_VECTOR2, pr); //add parent rotation
          const wc = new Vector2().addVectors(cc, pc); //world current center
          const rotation =
            -pr + Math.atan2(-p.x + wc.x, p.y - wc.y) + (rotateHandleType === RotateHandleType.Lower ? 0 : Math.PI);
          const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * TWO_PI : 0; // make sure angle is between -PI to PI
          const newAzimuth = rotation + offset;
          if (isSolarPanelNewAzimuthOk(solarPanel, newAzimuth)) {
            updateSolarPanelRelativeAzimuthById(solarPanel.id, newAzimuth);
            newAzimuthRef.current = newAzimuth;
            setCommonStore((state) => {
              state.selectedElementAngle = newAzimuth;
            });
          }
        } else if (resizeHandleType) {
          const resizeAnchor = resizeAnchorRef.current;
          const pvModel = getPvModule(solarPanel.pvModelName);
          const wp = new Vector2(p.x, p.y);
          const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
          const distance = wp.distanceTo(resizeAnchor2D);
          const angle = solarPanel.relativeAzimuth + rotation[2]; // world panel azimuth
          const rp = new Vector2().subVectors(wp, resizeAnchor2D); // relative vector from anchor to pointer
          switch (resizeHandleType) {
            case ResizeHandleType.Lower:
            case ResizeHandleType.Upper:
              {
                const sign = resizeHandleType === ResizeHandleType.Lower ? 1 : -1;
                const theta = rp.angle() - angle + sign * HALF_PI;
                let dyl = distance * Math.cos(theta);
                if (solarPanel.orientation === Orientation.portrait) {
                  const nx = Math.max(1, Math.ceil((dyl - pvModel.length / 2) / pvModel.length));
                  dyl = nx * pvModel.length;
                } else {
                  const nx = Math.max(1, Math.ceil((dyl - pvModel.width / 2) / pvModel.width));
                  dyl = nx * pvModel.width;
                }
                const wcx = resizeAnchor.x + (sign * (dyl * Math.sin(angle))) / 2;
                const wcy = resizeAnchor.y - (sign * (dyl * Math.cos(angle))) / 2;
                const wc = new Vector2(wcx, wcy); // world panel center
                const wbc = new Vector2(cx, cy); // world foundation center
                const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                const newCx = rc.x / lx;
                const newCy = rc.y / ly;
                if (isSolarPanelNewSizeOk(solarPanel, newCx, newCy, solarPanel.lx, dyl)) {
                  updateElementLyById(solarPanel.id, dyl);
                  setElementPosition(solarPanel.id, newCx, newCy);
                }
              }
              break;
            case ResizeHandleType.Left:
            case ResizeHandleType.Right:
              {
                let sign = resizeHandleType === ResizeHandleType.Left ? -1 : 1;
                const theta = rp.angle() - angle + (resizeHandleType === ResizeHandleType.Left ? Math.PI : 0);
                let dxl = distance * Math.cos(theta);
                if (solarPanel.orientation === Orientation.portrait) {
                  const nx = Math.max(1, Math.ceil((dxl - pvModel.width / 2) / pvModel.width));
                  dxl = nx * pvModel.width;
                } else {
                  const nx = Math.max(1, Math.ceil((dxl - pvModel.length / 2) / pvModel.length));
                  dxl = nx * pvModel.length;
                }
                const wcx = resizeAnchor.x + (sign * (dxl * Math.cos(angle))) / 2;
                const wcy = resizeAnchor.y + (sign * (dxl * Math.sin(angle))) / 2;
                const wc = new Vector2(wcx, wcy);
                const wbc = new Vector2(cx, cy);
                const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                const newCx = rc.x / lx;
                const newCy = rc.y / ly;
                if (isSolarPanelNewSizeOk(solarPanel, newCx, newCy, dxl, solarPanel.ly)) {
                  updateElementLxById(solarPanel.id, dxl);
                  setElementPosition(solarPanel.id, newCx, newCy);
                }
              }
              break;
          }
        }
      }
    }
  };

  const isSolarPanelNewPositionOk = (sp: SolarPanelModel, cx: number, cy: number) => {
    const clone = JSON.parse(JSON.stringify(sp)) as SolarPanelModel;
    clone.cx = cx;
    clone.cy = cy;
    return Util.isSolarPanelWithinHorizontalSurface(clone, cuboidModel);
  };

  const isSolarPanelNewAzimuthOk = (sp: SolarPanelModel, az: number) => {
    const clone = JSON.parse(JSON.stringify(sp)) as SolarPanelModel;
    clone.relativeAzimuth = az;
    return Util.isSolarPanelWithinHorizontalSurface(clone, cuboidModel);
  };

  const isSolarPanelNewSizeOk = (sp: SolarPanelModel, cx: number, cy: number, lx: number, ly: number) => {
    // check if the new length will cause the solar panel to intersect with the foundation
    if (sp.tiltAngle !== 0 && 0.5 * ly * Math.abs(Math.sin(sp.tiltAngle)) > sp.poleHeight) {
      return false;
    }
    // check if the new size will be within the foundation
    const clone = JSON.parse(JSON.stringify(sp)) as SolarPanelModel;
    clone.cx = cx;
    clone.cy = cy;
    clone.lx = lx;
    clone.ly = ly;
    return Util.isSolarPanelWithinHorizontalSurface(clone, cuboidModel);
  };

  const handlePointerUp = () => {
    if (!grabRef.current) return;
    const elem = getElementById(grabRef.current.id);
    if (!elem || elem.parentId !== id) return;
    if (elem.type === ObjectType.Polygon) {
      if (moveHandleType || resizeHandleType) {
        newVerticesRef.current = (elem as PolygonModel).vertices.map((v) => ({ ...v }));
        const undoableEditPolygon = {
          name: moveHandleType ? 'Move Polygon' : 'Resize Polygon',
          timestamp: Date.now(),
          oldValue: oldVerticesRef.current,
          newValue: newVerticesRef.current,
          changedElementId: elem.id,
          undo: () => {
            updatePolygonVerticesById(undoableEditPolygon.changedElementId, undoableEditPolygon.oldValue as Point2[]);
          },
          redo: () => {
            updatePolygonVerticesById(undoableEditPolygon.changedElementId, undoableEditPolygon.newValue as Point2[]);
          },
        } as UndoableChange;
        addUndoable(undoableEditPolygon);
      }
    } else {
      if (resizeHandleType) {
        newPositionRef.current.x = elem.cx;
        newPositionRef.current.y = elem.cy;
        newPositionRef.current.z = elem.cz;
        newDimensionRef.current.x = elem.lx;
        newDimensionRef.current.y = elem.ly;
        newDimensionRef.current.z = elem.lz;
        if (
          newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE &&
          newDimensionRef.current.distanceToSquared(oldDimensionRef.current) > ZERO_TOLERANCE
        ) {
          const undoableResize = {
            name: 'Resize',
            timestamp: Date.now(),
            resizedElementId: grabRef.current.id,
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
                undoableResize.resizedElementId,
                undoableResize.oldCx,
                undoableResize.oldCy,
                undoableResize.oldCz,
              );
              setElementSize(
                undoableResize.resizedElementId,
                undoableResize.oldLx,
                undoableResize.oldLy,
                undoableResize.oldLz,
              );
            },
            redo: () => {
              setElementPosition(
                undoableResize.resizedElementId,
                undoableResize.newCx,
                undoableResize.newCy,
                undoableResize.newCz,
              );
              setElementSize(
                undoableResize.resizedElementId,
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
          if (Math.abs(newAzimuthRef.current - oldAzimuthRef.current) > ZERO_TOLERANCE) {
            const undoableRotate = {
              name: 'Rotate',
              timestamp: Date.now(),
              oldValue: oldAzimuthRef.current,
              newValue: newAzimuthRef.current,
              changedElementId: solarPanel.id,
              undo: () => {
                updateSolarPanelRelativeAzimuthById(undoableRotate.changedElementId, undoableRotate.oldValue as number);
              },
              redo: () => {
                updateSolarPanelRelativeAzimuthById(undoableRotate.changedElementId, undoableRotate.newValue as number);
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
        if (newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE) {
          const undoableMove = {
            name: 'Move',
            timestamp: Date.now(),
            movedElementId: grabRef.current.id,
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
                undoableMove.movedElementId,
                undoableMove.oldCx,
                undoableMove.oldCy,
                undoableMove.oldCz,
              );
              if (undoableMove.oldNormal) {
                setElementNormal(
                  undoableMove.movedElementId,
                  undoableMove.oldNormal.x,
                  undoableMove.oldNormal.y,
                  undoableMove.oldNormal.z,
                );
              }
            },
            redo: () => {
              setElementPosition(
                undoableMove.movedElementId,
                undoableMove.newCx,
                undoableMove.newCy,
                undoableMove.newCz,
              );
              if (undoableMove.newNormal) {
                setElementNormal(
                  undoableMove.movedElementId,
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

      {/* intersection plane that goes through the center of the selected solar panel */}
      {grabRef.current?.type === ObjectType.SolarPanel && onTopSurface && !grabRef.current.locked && (
        <Plane
          ref={intersectPlaneRef}
          name={'Cuboid Intersection Plane'}
          position={intersectionPlanePosition}
          args={[lx, ly]}
          visible={false}
          onPointerMove={handleSolarPanelPointerMoveOnTopSurface}
        />
      )}

      {showGrid && (
        <>
          {(moveHandleType || resizeHandleType) && (
            <ElementGrid
              hx={gridDimensionRef.current.x}
              hy={gridDimensionRef.current.y}
              hz={gridDimensionRef.current.z}
              position={gridPositionRef.current}
              rotation={gridRotationRef.current}
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
              onPointerOut={noHoverHandle}
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
              onPointerOut={noHoverHandle}
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
              onPointerOut={noHoverHandle}
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
              onPointerOut={noHoverHandle}
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
            onPointerOut={noHoverHandle}
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
            onPointerOut={noHoverHandle}
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
            onPointerOut={noHoverHandle}
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
            onPointerOut={noHoverHandle}
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

          {!addedCuboidId && (
            <>
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
                onPointerOut={noHoverHandle}
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
                onPointerOut={noHoverHandle}
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
                onPointerOut={noHoverHandle}
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
                onPointerOut={noHoverHandle}
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
                onPointerOut={noHoverHandle}
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
        </>
      )}

      {hovered && !selected && (
        <textSprite
          name={'Label'}
          text={
            i18n.t('shared.CuboidElement', lang) + (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '')
          }
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
