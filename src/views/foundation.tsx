/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import FoundationTexture00 from '../resources/foundation_00.png';
import FoundationTexture01 from '../resources/foundation_01.png';
import FoundationTexture02 from '../resources/foundation_02.png';
import FoundationTexture03 from '../resources/foundation_03.png';
import FoundationTexture04 from '../resources/foundation_04.png';
import FoundationTexture05 from '../resources/foundation_05.png';
import FoundationTexture06 from '../resources/foundation_06.png';
import FoundationTexture07 from '../resources/foundation_07.png';
import GlowImage from '../resources/glow.png';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Circle, Cylinder, Plane, Sphere, useTexture } from '@react-three/drei';
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  Euler,
  FrontSide,
  Group,
  Mesh,
  Raycaster,
  RepeatWrapping,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three';
import { useStore } from '../stores/common';
import { useStoreRef } from '../stores/commonRef';
import { FoundationModel } from '../models/FoundationModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  ActionType,
  FoundationTexture,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  SolarStructure,
  WallSide,
} from '../types';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_COLOR_2,
  MOVE_HANDLE_RADIUS,
  ORIGIN_VECTOR2,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  TWO_PI,
  UNIT_VECTOR_POS_Z,
  ZERO_TOLERANCE,
} from '../constants';
import { Util } from '../Util';
import { ElementModel } from '../models/ElementModel';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import { PolarGrid } from './polarGrid';
import { WallModel } from '../models/WallModel';
import RotateHandle from '../components/rotateHandle';
import Wireframe from '../components/wireframe';
import * as Selector from '../stores/selector';
import { FlippedWallSide, UndoableAdd, UndoableAddWall } from '../undo/UndoableAdd';
import { UndoableMove } from '../undo/UndoableMove';
import { UndoableResize, UndoableResizeWall } from '../undo/UndoableResize';
import { UndoableChange } from '../undo/UndoableChange';
import { ElementGrid } from './elementGrid';
import i18n from '../i18n/i18n';
import { PolygonModel } from '../models/PolygonModel';
import { Point2 } from '../models/Point2';
import { HorizontalRuler } from './horizontalRuler';
import { showError } from '../helpers';
import { SolarCollector } from '../models/SolarCollector';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { getSunDirection } from '../analysis/sunTools';

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
  textureType = FoundationTexture.NoTexture,
  solarStructure,
  solarReceiverApertureWidth = 0.6,
  solarReceiverHeight = solarStructure === SolarStructure.FocusPipe ? 10 : 20,
  solarReceiverPipeRelativeLength = 0.9,
  solarReceiverPipePoleNumber = 5,
  solarTowerRadius = 0.5,
  solarTowerCentralReceiverRadius = 0.75,
  solarTowerCentralReceiverHeight = 2,
  solarUpdraftTowerChimneyRadius,
  solarUpdraftTowerChimneyHeight,
  solarUpdraftTowerCollectorRadius,
  solarUpdraftTowerCollectorHeight,
}: FoundationModel) => {
  const language = useStore(Selector.language);
  const orthographic = useStore(Selector.viewState.orthographic);
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const setCommonStore = useStore(Selector.set);
  const updateDesignInfo = useStore(Selector.updateDesignInfo);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setElementSize = useStore(Selector.setElementSize);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLyById = useStore(Selector.updateElementLyById);
  const updateWallLeftJointsById = useStore(Selector.updateWallLeftJointsById);
  const updateWallRightJointsById = useStore(Selector.updateWallRightJointsById);
  const updateWallLeftPointById = useStore(Selector.updateWallLeftPointById);
  const updateSolarCollectorRelativeAzimuthById = useStore(Selector.updateSolarCollectorRelativeAzimuthById);
  const updatePolygonVertexPositionById = useStore(Selector.updatePolygonVertexPositionById);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);
  const removeElementById = useStore(Selector.removeElementById);
  const selectMe = useStore(Selector.selectMe);
  const addElement = useStore(Selector.addElement);
  const getPvModule = useStore(Selector.getPvModule);
  const deletedWallID = useStore(Selector.deletedWallId);
  const updateWallMapOnFoundation = useStore(Selector.updateWallMapOnFoundation);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const groundImage = useStore(Selector.viewState.groundImage);
  const addedFoundationID = useStore(Selector.addedFoundationId);
  const addUndoable = useStore(Selector.addUndoable);
  const isAddingElement = useStore(Selector.isAddingElement);
  const overlapWithSibling = useStore(Selector.overlapWithSibling);
  const hoveredHandle = useStore(Selector.hoveredHandle);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const solarRadiationHeatmapReflectionOnly = useStore(Selector.viewState.solarRadiationHeatmapReflectionOnly);
  const getHeatmap = useStore(Selector.getHeatmap);

  const {
    camera,
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [addedWallID, setAddedWallID] = useState<string | null>(null);

  const isSettingWallStartPointRef = useRef(false);
  const isSettingWallEndPointRef = useRef(false);
  const elementsStateBeforeResizingRef = useRef<ElementModel[] | null>(null);
  const flippedWallSide = useRef<FlippedWallSide>(FlippedWallSide.null);

  // Use 1: Directly use to get wall points to snap.
  // Use 2: Need update first before other use. Intend to reduce call getElementById()
  const wallMapOnFoundation = useRef<Map<string, WallModel>>(new Map());

  const objectTypeToAddRef = useRef(useStore.getState().objectTypeToAdd);
  const hoveredHandleRef = useRef(useStore.getState().hoveredHandle);
  const moveHandleTypeRef = useRef(useStore.getState().moveHandleType);
  const resizeHandleTypeRef = useRef(useStore.getState().resizeHandleType);
  const resizeAnchorRef = useRef(useStore.getState().resizeAnchor);
  const rotateHandleTypeRef = useRef(useStore.getState().rotateHandleType);
  const enableFineGridRef = useRef(useStore.getState().enableFineGrid);
  const groupRef = useRef<Group>(null);
  const baseRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const intersectPlaneRef = useRef<Mesh>();
  const resizeHandleLLRef = useRef<Mesh>();
  const resizeHandleULRef = useRef<Mesh>();
  const resizeHandleLRRef = useRef<Mesh>();
  const resizeHandleURRef = useRef<Mesh>();
  const moveHandleLowerRef = useRef<Mesh>();
  const moveHandleUpperRef = useRef<Mesh>();
  const moveHandleLeftRef = useRef<Mesh>();
  const moveHandleRightRef = useRef<Mesh>();
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const newDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldAzimuthRef = useRef<number>(0);
  const newAzimuthRef = useRef<number>(0);
  const oldVerticesRef = useRef<Point2[]>([]);
  const newVerticesRef = useRef<Point2[]>([]);
  const oldJointsRef = useRef<string[]>([]);
  const newJointsRef = useRef<string[]>([]);
  const oldPointRef = useRef<number[][]>([]);
  const newPointRef = useRef<number[][]>([]);

  const lang = { lng: language };
  const mouse = useMemo(() => new Vector2(), []);
  const ray = useMemo(() => new Raycaster(), []);
  const foundationModel = getElementById(id) as FoundationModel;
  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLL = useMemo(() => new Vector3(-hx, -hy, hz), [hx, hy, hz]);
  const positionUL = useMemo(() => new Vector3(-hx, hy, hz), [hx, hy, hz]);
  const positionLR = useMemo(() => new Vector3(hx, -hy, hz), [hx, hy, hz]);
  const positionUR = useMemo(() => new Vector3(hx, hy, hz), [hx, hy, hz]);

  const ratio = Math.max(1, Math.max(lx, ly) / 8);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
  const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;
  const rotateHandleSize = 0.6 * ratio;
  const glowTexture = useTexture(GlowImage);
  const haloSize = solarTowerCentralReceiverHeight * 2 + 1;

  const lowerRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, -hy - rotateHandleSize, 0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hy]);
  const upperRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, hy + rotateHandleSize, 0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hy]);

  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  if (grabRef.current) {
    let poleHeight = -1;
    switch (grabRef.current.type) {
      case ObjectType.SolarPanel:
        poleHeight = (grabRef.current as SolarPanelModel).poleHeight;
        break;
      case ObjectType.ParabolicTrough:
        // pole height of parabolic trough is relative to its half width
        const trough = grabRef.current as ParabolicTroughModel;
        poleHeight = trough.poleHeight + trough.lx / 2;
        break;
      case ObjectType.ParabolicDish:
        // pole height of parabolic dish is relative to its radius
        const dish = grabRef.current as ParabolicDishModel;
        poleHeight = dish.poleHeight + dish.lx / 2 + (dish.lx * dish.lx) / (4 * dish.latusRectum);
        break;
      case ObjectType.FresnelReflector:
        // pole height of Fresnel reflector is relative to its half width
        const reflector = grabRef.current as FresnelReflectorModel;
        poleHeight = reflector.poleHeight + reflector.lx / 2;
        break;
    }
    if (poleHeight >= 0) {
      intersectionPlanePosition.set(0, 0, foundationModel.lz / 2 + poleHeight);
    }
  }

  const solarReceiverPipePoles = useMemo<Vector3[] | undefined>(() => {
    if (solarStructure !== SolarStructure.FocusPipe) return undefined;
    const array: Vector3[] = [];
    const dy = (solarReceiverPipeRelativeLength * ly) / (solarReceiverPipePoleNumber + 1);
    for (let i = 1; i <= solarReceiverPipePoleNumber; i++) {
      array.push(new Vector3(0, i * dy - (solarReceiverPipeRelativeLength * ly) / 2, solarReceiverHeight / 2 + lz / 2));
    }
    return array;
  }, [solarStructure, lx, ly, lz, solarReceiverPipePoleNumber, solarReceiverHeight, solarReceiverPipeRelativeLength]);

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      objectTypeToAddRef.current = state.objectTypeToAdd;
      hoveredHandleRef.current = state.hoveredHandle;
      moveHandleTypeRef.current = state.moveHandleType;
      resizeHandleTypeRef.current = state.resizeHandleType;
      resizeAnchorRef.current = state.resizeAnchor;
      rotateHandleTypeRef.current = state.rotateHandleType;
      enableFineGridRef.current = state.enableFineGrid;
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    wallMapOnFoundation.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallMapOnFoundation.current.set(e.id, e as WallModel);
      }
    }
  }, [updateWallMapOnFoundation]);

  useEffect(() => {
    if (deletedWallID) {
      wallMapOnFoundation.current.delete(deletedWallID);
      isSettingWallStartPointRef.current = false;
      isSettingWallEndPointRef.current = false;
      setAddedWallID(null);
      setCommonStore((state) => {
        state.addedWallId = null;
        state.deletedWallId = null;
      });
      useStoreRef.getState().setEnableOrbitController(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedWallID]);

  useEffect(() => {
    if (foundationModel && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(foundationModel.id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      } else {
        setHeatmapTexture(null);
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue, solarRadiationHeatmapReflectionOnly]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const fetchRepeatDividers = (textureType: FoundationTexture) => {
    switch (textureType) {
      case FoundationTexture.Texture01:
        return { x: 1, y: 1 };
      case FoundationTexture.Texture02:
        return { x: 2, y: 2 };
      case FoundationTexture.Texture03:
        return { x: 0.4, y: 0.4 };
      case FoundationTexture.Texture04:
        return { x: 0.25, y: 0.25 };
      case FoundationTexture.Texture05:
        return { x: 5, y: 5 };
      case FoundationTexture.Texture06:
        return { x: 1, y: 1 };
      case FoundationTexture.Texture07:
        return { x: 1, y: 1 };
      default:
        return { x: 1, y: 1 };
    }
  };

  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);

  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case FoundationTexture.Texture01:
        textureImg = FoundationTexture01;
        break;
      case FoundationTexture.Texture02:
        textureImg = FoundationTexture02;
        break;
      case FoundationTexture.Texture03:
        textureImg = FoundationTexture03;
        break;
      case FoundationTexture.Texture04:
        textureImg = FoundationTexture04;
        break;
      case FoundationTexture.Texture05:
        textureImg = FoundationTexture05;
        break;
      case FoundationTexture.Texture06:
        textureImg = FoundationTexture06;
        break;
      case FoundationTexture.Texture07:
        textureImg = FoundationTexture07;
        break;
      default:
        textureImg = FoundationTexture00;
    }
    return new TextureLoader().load(textureImg, (t) => {
      t.wrapS = t.wrapT = RepeatWrapping;
      const param = fetchRepeatDividers(textureType);
      t.repeat.set(lx / param.x, ly / param.y);
      setTexture(t);
    });
  }, [textureType, lx, ly]);
  const [texture, setTexture] = useState(textureLoader);

  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (useStore.getState().duringCameraInteraction) return;
      if (e.intersections.length > 0) {
        // QUICK FIX: For some reason, the top one can sometimes be the ground, so we also go to the second one
        const intersected =
          e.intersections[0].object === e.eventObject ||
          (e.intersections.length > 1 && e.intersections[1].object === e.eventObject);
        if (intersected) {
          setCommonStore((state) => {
            state.hoveredHandle = handle;
          });
          if (Util.isMoveHandle(handle)) {
            domElement.style.cursor = 'move';
          } else if (handle === RotateHandleType.Lower || handle === RotateHandleType.Upper) {
            domElement.style.cursor = 'grab';
          } else {
            domElement.style.cursor = useStore.getState().addedFoundationId ? 'crosshair' : 'pointer';
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  const noHoverHandle = useCallback(() => {
    setCommonStore((state) => {
      state.hoveredHandle = null;
    });
    domElement.style.cursor = useStore.getState().addedFoundationId ? 'crosshair' : 'default';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // only these elements are allowed to be on the foundation
  const legalOnFoundation = (type: ObjectType) => {
    switch (type) {
      case ObjectType.Human:
      case ObjectType.Tree:
      case ObjectType.Polygon:
      case ObjectType.Sensor:
      case ObjectType.SolarPanel:
      case ObjectType.ParabolicDish:
      case ObjectType.ParabolicTrough:
      case ObjectType.FresnelReflector:
      case ObjectType.Heliostat:
      case ObjectType.Wall:
        return true;
      default:
        return false;
    }
  };

  const findMagnetPoint = (pointer: Vector3, minDist: number) => {
    let min = minDist;
    let targetPoint: Vector3 | null = null;
    let targetID: string | null = null;
    let targetSide: WallSide | null = null;
    for (const [id, wall] of wallMapOnFoundation.current) {
      if (id === addedWallID || (grabRef.current && id === grabRef.current.id)) continue;
      const leftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1], wall.leftPoint[2]);
      const rightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1], wall.rightPoint[2]);
      const distStart = leftPoint?.distanceTo(pointer) ?? Number.MAX_VALUE;
      const distEnd = rightPoint?.distanceTo(pointer) ?? Number.MAX_VALUE;
      const flag = distStart <= distEnd;
      const dist = flag ? distStart : distEnd;
      const point = flag ? leftPoint : rightPoint;
      if (dist < min) {
        min = dist;
        targetPoint = point;
        targetID = id;
        targetSide = flag ? WallSide.Left : WallSide.Right;
      }
    }
    return { targetID, targetPoint, targetSide };
  };

  const updatePointer = (p: Vector3, targetPoint?: Vector3 | null) => {
    if (!enableFineGridRef.current) {
      if (targetPoint) {
        p = targetPoint;
      } else {
        p = Util.snapToNormalGrid(p);
      }
    } else {
      p = Util.snapToFineGrid(p);
      targetPoint = null;
    }
    return p;
  };

  const flipWallLoop = (currentWallId: string) => {
    let wall = wallMapOnFoundation.current.get(currentWallId);
    while (wall && wall.leftJoints.length > 0) {
      const wallCopy = wallMapOnFoundation.current.get(wall.id) as WallModel;
      if (!wallCopy) {
        break;
      }

      setCommonStore((state) => {
        for (const e of state.elements) {
          if (e.id === wallCopy.id) {
            const w = e as WallModel;
            w.relativeAngle = (wallCopy.relativeAngle + Math.PI) % TWO_PI;
            w.leftPoint = [...wallCopy.rightPoint];
            w.rightPoint = [...wallCopy.leftPoint];
            w.leftJoints = [wallCopy.rightJoints[0]];
            w.rightJoints = [wallCopy.leftJoints[0]];
          }
        }
      });

      wall = wallMapOnFoundation.current.get(wall.leftJoints[0]);
      if (wall && wall!.id === currentWallId) {
        break;
      }
    }

    setCommonStore((state) => {
      state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
      state.resizeHandleType =
        resizeHandleTypeRef.current === ResizeHandleType.LowerLeft
          ? ResizeHandleType.LowerRight
          : ResizeHandleType.LowerLeft;
    });

    flippedWallSide.current =
      flippedWallSide.current === FlippedWallSide.null ? FlippedWallSide.loop : FlippedWallSide.null;
  };

  const flipWallsClockwise = (currWall: WallModel, targetWall?: WallModel) => {
    wallMapOnFoundation.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallMapOnFoundation.current.set(e.id, e as WallModel);
      }
    }

    const flipWallHead = currWall;
    let flipWall = currWall;

    while (flipWall) {
      const flipWallCopy = wallMapOnFoundation.current.get(flipWall.id) as WallModel;
      if (!flipWallCopy) {
        break;
      }

      setCommonStore((state) => {
        for (const e of state.elements) {
          if (flipWallCopy && e.id === flipWallCopy.id) {
            const wall = e as WallModel;
            wall.relativeAngle = (flipWallCopy.relativeAngle + Math.PI) % TWO_PI;
            wall.leftPoint = [...flipWallCopy.rightPoint];
            wall.rightPoint = [...flipWallCopy.leftPoint];
            wall.leftJoints = flipWallCopy.rightJoints.length > 0 ? [flipWallCopy.rightJoints[0]] : [];
            wall.rightJoints = flipWallCopy.leftJoints.length > 0 ? [flipWallCopy.leftJoints[0]] : [];
          }
        }
      });

      let nextWall: WallModel | undefined = undefined;
      if (flipWallCopy.leftJoints.length > 0) {
        nextWall = wallMapOnFoundation.current.get(flipWallCopy.leftJoints[0]);
      }
      if (nextWall && nextWall.id !== flipWallHead.id) {
        flipWall = nextWall;
      } else {
        break;
      }
    }
    setCommonStore((state) => {
      if (targetWall) {
        for (const e of state.elements) {
          if (e.id === flipWallHead.id) {
            (e as WallModel).leftJoints = [targetWall.id];
          }
          if (e.id === targetWall.id) {
            (e as WallModel).rightJoints = [flipWallHead.id];
          }
        }
      }
      state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
      state.resizeHandleType = ResizeHandleType.LowerLeft;
    });

    // side after flip
    flippedWallSide.current =
      flippedWallSide.current === FlippedWallSide.null ? FlippedWallSide.right : FlippedWallSide.null;
  };

  const flipWallsCounterClockwise = (currWall: WallModel, targetWall?: WallModel) => {
    wallMapOnFoundation.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallMapOnFoundation.current.set(e.id, e as WallModel);
      }
    }

    const flipWallHead = currWall;
    let flipWall = currWall;

    while (flipWall) {
      const flipWallCopy = wallMapOnFoundation.current.get(flipWall.id) as WallModel;
      if (!flipWallCopy) {
        break;
      }

      setCommonStore((state) => {
        for (const e of state.elements) {
          if (flipWallCopy && e.id === flipWallCopy.id) {
            const wall = e as WallModel;
            wall.relativeAngle = (flipWallCopy.relativeAngle + Math.PI) % TWO_PI;
            wall.leftPoint = [...flipWallCopy.rightPoint];
            wall.rightPoint = [...flipWallCopy.leftPoint];
            wall.leftJoints = flipWallCopy.rightJoints.length > 0 ? [flipWallCopy.rightJoints[0]] : [];
            wall.rightJoints = flipWallCopy.leftJoints.length > 0 ? [flipWallCopy.leftJoints[0]] : [];
          }
        }
      });

      let nextWall: WallModel | undefined = undefined;
      if (flipWallCopy.rightJoints.length > 0) {
        nextWall = wallMapOnFoundation.current.get(flipWallCopy.rightJoints[0]);
      }
      if (nextWall && nextWall.id !== flipWallHead.id) {
        flipWall = nextWall;
      } else {
        break;
      }
    }
    setCommonStore((state) => {
      if (targetWall) {
        for (const e of state.elements) {
          if (e.id === flipWallHead.id) {
            (e as WallModel).rightJoints = [targetWall.id];
          }
          if (e.id === targetWall.id) {
            (e as WallModel).leftJoints = [flipWallHead.id];
          }
        }
      }

      state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
      state.resizeHandleType = ResizeHandleType.LowerRight;
    });

    // side after flip
    flippedWallSide.current =
      flippedWallSide.current === FlippedWallSide.null ? FlippedWallSide.left : FlippedWallSide.null;
  };

  const checkWallLoop = (currentWallId: string) => {
    let wall: WallModel | undefined = undefined;

    wallMapOnFoundation.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.id === currentWallId) {
        wall = e as WallModel;
      }
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallMapOnFoundation.current.set(e.id, e as WallModel);
      }
    }

    // check is loop closed
    let isClosed = false;
    while (wall && wall.leftJoints.length > 0) {
      wall = wallMapOnFoundation.current.get(wall.leftJoints[0]);
      if (wall?.id === currentWallId) {
        isClosed = true;
        break;
      }
    }

    if (isClosed) {
      // get interior angle sum
      let totalAngle = 0;
      let totalNumber = 0;
      while (wall && wall.leftJoints.length > 0) {
        const targetWall = wallMapOnFoundation.current.get(wall.leftJoints[0]);
        const deltaAngle = (Math.PI * 3 - (wall.relativeAngle - targetWall!.relativeAngle)) % TWO_PI;
        totalAngle += deltaAngle;
        totalNumber += 1;
        wall = targetWall;
        if (wall!.id === currentWallId) {
          break;
        }
      }

      // check if it needs a flip
      if (totalAngle > (totalNumber - 2) * Math.PI + 0.1) {
        flipWallLoop(currentWallId);
      } else {
        if (flippedWallSide.current !== FlippedWallSide.null) {
          flippedWallSide.current = FlippedWallSide.loop;
        }
      }
    }

    return isClosed;
  };

  const handleUndoableAdd = (element: ElementModel) => {
    const undoableAdd = {
      name: 'Add',
      timestamp: Date.now(),
      addedElement: element,
      undo: () => {
        removeElementById(undoableAdd.addedElement.id, false);
      },
      redo: () => {
        setCommonStore((state) => {
          state.elements.push(undoableAdd.addedElement);
          state.selectedElement = undoableAdd.addedElement;
          state.updateDesignInfo();
        });
      },
    } as UndoableAdd;
    addUndoable(undoableAdd);
  };

  const handleUndoableAddWall = (element: WallModel) => {
    const undoableAdd = {
      name: 'Add',
      timestamp: Date.now(),
      addedElement: element,
      flippedWallSide: flippedWallSide.current,
      undo: () => {
        const wall = undoableAdd.addedElement as WallModel;
        removeElementById(wall.id, false);
        if (
          (undoableAdd.flippedWallSide === FlippedWallSide.right ||
            undoableAdd.flippedWallSide === FlippedWallSide.loop) &&
          wall.rightJoints.length > 0
        ) {
          const rightWall = getElementById(wall.rightJoints[0]);
          if (rightWall) {
            flipWallsCounterClockwise(rightWall as WallModel);
          }
        } else if (undoableAdd.flippedWallSide === FlippedWallSide.left && wall.leftJoints.length > 0) {
          const leftWall = getElementById(wall.leftJoints[0]);
          if (leftWall) {
            flipWallsClockwise(leftWall as WallModel);
          }
        }
      },
      redo: () => {
        const wall = undoableAdd.addedElement as WallModel;
        if (
          undoableAdd.flippedWallSide === FlippedWallSide.right ||
          (undoableAdd.flippedWallSide === FlippedWallSide.loop && wall.rightJoints.length > 0)
        ) {
          const rightWall = getElementById(wall.rightJoints[0]);
          if (rightWall) {
            flipWallsClockwise(rightWall as WallModel);
          }
        } else if (undoableAdd.flippedWallSide === FlippedWallSide.left && wall.leftJoints.length > 0) {
          const leftWall = getElementById(wall.leftJoints[0]);
          if (leftWall) {
            flipWallsCounterClockwise(leftWall as WallModel);
          }
        }
        if (wall.rightJoints.length > 0) {
          updateWallLeftJointsById(wall.rightJoints[0], [wall.id]);
        }
        if (wall.leftJoints.length > 0) {
          updateWallRightJointsById(wall.leftJoints[0], [wall.id]);
        }
        setCommonStore((state) => {
          state.elements.push(wall);
          state.selectedElement = wall;
          state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
        });
      },
    } as UndoableAddWall;
    addUndoable(undoableAdd);
  };

  const handleUndoableResizeWall = (element: WallModel) => {
    const undoableResize = {
      name: 'Resize',
      timestamp: Date.now(),
      resizedElementId: element.id,
      oldPosition: oldPositionRef.current.clone(),
      newPosition: newPositionRef.current.clone(),
      oldDimension: oldDimensionRef.current.clone(),
      newDimension: newDimensionRef.current.clone(),
      oldAngle: oldAzimuthRef.current,
      newAngle: newAzimuthRef.current,
      oldJoints: [...oldJointsRef.current],
      newJoints: [...newJointsRef.current],
      oldPoint: [...oldPointRef.current],
      newPoint: [...newPointRef.current],
      flippedWallSide: flippedWallSide.current,
      undo: () => {
        switch (undoableResize.flippedWallSide) {
          case FlippedWallSide.right:
            if (undoableResize.newJoints[1]) {
              const rightWall = getElementById(undoableResize.newJoints[1]);
              if (rightWall) {
                flipWallsCounterClockwise(rightWall as WallModel);
              }
            }
            break;
          case FlippedWallSide.left:
            if (undoableResize.newJoints[0]) {
              const leftWall = getElementById(undoableResize.newJoints[0]);
              if (leftWall) {
                flipWallsClockwise(leftWall as WallModel);
              }
            }
            break;
          case FlippedWallSide.loop:
            if (undoableResize.newJoints[0] && undoableResize.newJoints[1]) {
              flipWallLoop(undoableResize.resizedElementId);
            } else if (undoableResize.newJoints[1]) {
              const rightWall = getElementById(undoableResize.newJoints[1]);
              if (rightWall) {
                flipWallsCounterClockwise(rightWall as WallModel);
              }
            } else if (undoableResize.newJoints[0]) {
              const leftWall = getElementById(undoableResize.newJoints[0]);
              if (leftWall) {
                flipWallsClockwise(leftWall as WallModel);
              }
            }
            break;
        }
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.resizedElementId) {
              const w = e as WallModel;
              w.cx = undoableResize.oldPosition.x;
              w.cy = undoableResize.oldPosition.y;
              w.cz = undoableResize.oldPosition.z;
              w.lx = undoableResize.oldDimension.x;
              w.ly = undoableResize.oldDimension.y;
              w.lz = undoableResize.oldDimension.z;
              w.relativeAngle = undoableResize.oldAngle;
              w.leftJoints = undoableResize.oldJoints[0] ? [undoableResize.oldJoints[0]] : [];
              w.rightJoints = undoableResize.oldJoints[1] ? [undoableResize.oldJoints[1]] : [];
              w.leftPoint = undoableResize.oldPoint[0];
              w.rightPoint = undoableResize.oldPoint[1];

              switch (undoableResize.flippedWallSide) {
                case FlippedWallSide.loop: {
                  // old left
                  if (undoableResize.oldJoints[0] !== undoableResize.newJoints[1]) {
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[1]) {
                        (n as WallModel).rightJoints = [];
                      }
                      if (n.id === undoableResize.oldJoints[0]) {
                        (n as WallModel).rightJoints = [undoableResize.resizedElementId];
                      }
                    }
                  }
                  // old right
                  else if (undoableResize.oldJoints[1] !== undoableResize.newJoints[0]) {
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[0]) {
                        (n as WallModel).leftJoints = [];
                      }
                      if (n.id === undoableResize.oldJoints[1]) {
                        (n as WallModel).leftJoints = [undoableResize.resizedElementId];
                      }
                    }
                  }
                  break;
                }
                case FlippedWallSide.left:
                case FlippedWallSide.right: {
                  // old left attach, do: new right detach
                  if (!undoableResize.oldJoints[0] && undoableResize.newJoints[1]) {
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[1]) {
                        (n as WallModel).leftJoints = [];
                        break;
                      }
                    }
                  }
                  // old right attach, do: new left detach
                  else if (!undoableResize.oldJoints[1] && undoableResize.newJoints[0]) {
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[0]) {
                        (n as WallModel).rightJoints = [];
                        break;
                      }
                    }
                  }
                  // change old left attach side
                  else if (undoableResize.flippedWallSide === FlippedWallSide.left && undoableResize.oldJoints[0]) {
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[1]) {
                        (n as WallModel).leftJoints = [];
                      }
                      if (n.id === undoableResize.oldJoints[0]) {
                        (n as WallModel).rightJoints = [w.id];
                      }
                    }
                  }
                  // change old right attach side
                  else if (undoableResize.flippedWallSide === FlippedWallSide.right && undoableResize.oldJoints[1]) {
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[0]) {
                        (n as WallModel).rightJoints = [];
                      }
                      if (n.id === undoableResize.oldJoints[1]) {
                        (n as WallModel).leftJoints = [w.id];
                      }
                    }
                  }
                  break;
                }
                case FlippedWallSide.null: {
                  // left handle
                  if (undoableResize.oldJoints[0] !== undoableResize.newJoints[0]) {
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[0]) {
                        (n as WallModel).rightJoints = [];
                      }
                      if (n.id === undoableResize.oldJoints[0]) {
                        (n as WallModel).rightJoints = [w.id];
                      }
                    }
                  }
                  // right handle
                  if (undoableResize.oldJoints[1] !== undoableResize.newJoints[1]) {
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[1]) {
                        (n as WallModel).leftJoints = [];
                      }
                      if (n.id === undoableResize.oldJoints[1]) {
                        (n as WallModel).leftJoints = [w.id];
                      }
                    }
                  }
                  state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
                  break;
                }
              }
              break;
            }
          }
        });
        flippedWallSide.current = FlippedWallSide.null;
      },
      redo: () => {
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.resizedElementId) {
              const w = e as WallModel;
              w.cx = undoableResize.newPosition.x;
              w.cy = undoableResize.newPosition.y;
              w.cz = undoableResize.newPosition.z;
              w.lx = undoableResize.newDimension.x;
              w.ly = undoableResize.newDimension.y;
              w.lz = undoableResize.newDimension.z;

              switch (undoableResize.flippedWallSide) {
                case FlippedWallSide.left:
                  w.relativeAngle = (undoableResize.newAngle + Math.PI) % TWO_PI;
                  for (const n of state.elements) {
                    if (n.id === undoableResize.oldJoints[0]) {
                      (n as WallModel).rightJoints = [];
                      break;
                    }
                  }
                  break;
                case FlippedWallSide.right:
                  w.relativeAngle = (undoableResize.newAngle + Math.PI) % TWO_PI;
                  for (const n of state.elements) {
                    if (n.id === undoableResize.oldJoints[1]) {
                      (n as WallModel).leftJoints = [];
                      break;
                    }
                  }
                  break;
                case FlippedWallSide.loop:
                  w.relativeAngle = (undoableResize.newAngle + Math.PI) % TWO_PI;
                  w.leftJoints = undoableResize.newJoints[1] ? [undoableResize.newJoints[1]] : [];
                  w.rightJoints = undoableResize.newJoints[0] ? [undoableResize.newJoints[0]] : [];
                  w.leftPoint = undoableResize.newPoint[1];
                  w.rightPoint = undoableResize.newPoint[0];
                  for (const n of state.elements) {
                    if (n.id === undoableResize.newJoints[0]) {
                      (n as WallModel).leftJoints = [w.id];
                    }
                    if (n.id === undoableResize.newJoints[1]) {
                      (n as WallModel).rightJoints = [w.id];
                    }
                  }
                  break;
                case FlippedWallSide.null:
                  w.relativeAngle = undoableResize.newAngle;
                  w.leftJoints = undoableResize.newJoints[0] ? [undoableResize.newJoints[0]] : [];
                  w.rightJoints = undoableResize.newJoints[1] ? [undoableResize.newJoints[1]] : [];
                  w.leftPoint = undoableResize.newPoint[0];
                  w.rightPoint = undoableResize.newPoint[1];
                  // left handle
                  if (undoableResize.oldJoints[0] !== undoableResize.newJoints[0]) {
                    // left handle
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[0]) {
                        (n as WallModel).rightJoints = [w.id];
                      }
                      if (n.id === undoableResize.oldJoints[0]) {
                        (n as WallModel).rightJoints = [];
                      }
                    }
                  }
                  // right handle
                  if (undoableResize.oldJoints[1] !== undoableResize.newJoints[1]) {
                    for (const n of state.elements) {
                      if (n.id === undoableResize.newJoints[1]) {
                        (n as WallModel).leftJoints = [w.id];
                      }
                      if (n.id === undoableResize.oldJoints[1]) {
                        (n as WallModel).leftJoints = [];
                      }
                    }
                  }
                  state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
                  break;
              }
              break;
            }
          }
        });
        switch (undoableResize.flippedWallSide) {
          case FlippedWallSide.left: {
            const currWall = getElementById(undoableResize.resizedElementId) as WallModel;
            const targetWall = getElementById(undoableResize.newJoints[1]) as WallModel;
            flipWallsCounterClockwise(currWall, targetWall);
            break;
          }
          case FlippedWallSide.right: {
            const currWall = getElementById(undoableResize.resizedElementId) as WallModel;
            const targetWall = getElementById(undoableResize.newJoints[0]) as WallModel;
            flipWallsClockwise(currWall, targetWall);
            break;
          }
          case FlippedWallSide.loop:
            wallMapOnFoundation.current.clear();
            for (const e of useStore.getState().elements) {
              if (e.type === ObjectType.Wall && e.parentId === id) {
                wallMapOnFoundation.current.set(e.id, e as WallModel);
              }
            }
            flipWallLoop(undoableResize.resizedElementId);
            break;
        }
        flippedWallSide.current = FlippedWallSide.null;
      },
    } as UndoableResizeWall;
    addUndoable(undoableResize);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    setCommonStore((state) => {
      state.contextMenuObjectType = null;
    });
    if (objectTypeToAddRef.current !== ObjectType.Window && !isAddingElement()) {
      selectMe(id, e, ActionType.Select);
    }
    const selectedElement = getSelectedElement();
    let bypass = false;
    if (e.intersections[0].object.name === ObjectType.Polygon && objectTypeToAddRef.current !== ObjectType.None) {
      bypass = true;
    }
    // no child of this foundation is clicked
    if (selectedElement?.id === id || bypass) {
      if (legalOnFoundation(objectTypeToAddRef.current)) {
        if (foundationModel) {
          setShowGrid(true);
          const position = e.intersections[0].point;
          const addedElement = addElement(foundationModel, position);
          if (addedElement) {
            handleUndoableAdd(addedElement);
          }
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
          });
        }
      } else {
        useStoreRef.getState().selectNone();
        useStoreRef.setState((state) => {
          state.foundationRef = groupRef;
        });
      }
    }
    // a child of this foundation is clicked
    else {
      if (selectedElement && selectedElement.parentId === id) {
        if (legalOnFoundation(selectedElement.type)) {
          grabRef.current = selectedElement;
          if (selectedElement.type === ObjectType.Wall) {
            elementsStateBeforeResizingRef.current = [...useStore.getState().elements];
          }
          setShowGrid(true);
          oldPositionRef.current.set(selectedElement.cx, selectedElement.cy, selectedElement.cz);
          oldDimensionRef.current.set(selectedElement.lx, selectedElement.ly, selectedElement.lz);
          switch (selectedElement.type) {
            case ObjectType.SolarPanel:
            case ObjectType.ParabolicTrough:
            case ObjectType.FresnelReflector:
              oldAzimuthRef.current = (selectedElement as SolarCollector).relativeAzimuth;
              break;
            case ObjectType.Polygon:
              oldVerticesRef.current = (selectedElement as PolygonModel).vertices.map((v) => ({ ...v }));
              break;
            case ObjectType.Wall:
              const wall = selectedElement as WallModel;
              oldAzimuthRef.current = wall.relativeAngle;
              oldJointsRef.current = [wall.leftJoints[0], wall.rightJoints[0]];
              oldPointRef.current = [[...wall.leftPoint], [...wall.rightPoint]];
          }
        }
      }
    }

    if (isSettingWallStartPointRef.current && addedWallID && baseRef.current) {
      const intersects = ray.intersectObjects([baseRef.current]);
      let p = Util.wallRelativePosition(intersects[0].point, foundationModel);
      let targetID: string | null = null;
      let targetPoint: Vector3 | null = null;
      let targetSide: WallSide | null = null;
      if (!enableFineGridRef.current) {
        let target = findMagnetPoint(p, 1.5);
        targetID = target.targetID;
        targetPoint = target.targetPoint;
        targetSide = target.targetSide;
      }
      p = updatePointer(p, targetPoint);
      let resizeHandleType = ResizeHandleType.LowerRight;

      // attach to other wall
      if (targetID) {
        const targetWall = getElementById(targetID) as WallModel;

        // left to right
        if (targetSide === WallSide.Right) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === addedWallID) {
                const wall = e as WallModel;
                wall.cx = p.x;
                wall.cy = p.y;
                if (targetWall.rightJoints.length === 0) {
                  wall.leftJoints = [targetWall.id];
                }
              }
              if (e.id === targetID && targetWall.rightJoints.length === 0) {
                (e as WallModel).rightJoints = [addedWallID];
              }
            }
          });
        }
        // left to left
        else if (targetSide === WallSide.Left) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === addedWallID) {
                const wall = e as WallModel;
                wall.cx = p.x;
                wall.cy = p.y;
                if (targetWall.leftJoints.length === 0) {
                  wall.rightJoints = [targetWall.id];
                }
              }
              if (e.id === targetID && targetWall.leftJoints.length === 0) {
                (e as WallModel).leftJoints = [addedWallID];
              }
            }
          });
          resizeHandleType = ResizeHandleType.LowerLeft;
        }
      }
      // no attach to wall
      else {
        setElementPosition(addedWallID, p.x, p.y);
      }

      isSettingWallStartPointRef.current = false;
      isSettingWallEndPointRef.current = true;
      updateWallLeftPointById(addedWallID, [p.x, p.y, p.z]);
      setCommonStore((state) => {
        state.resizeHandleType = resizeHandleType;
        state.resizeAnchor = Util.wallAbsolutePosition(p, foundationModel);
      });
      useStoreRef.getState().setEnableOrbitController(false);
      grabRef.current = selectedElement;
    }
  };

  const handlePointerUp = () => {
    if (!grabRef.current || grabRef.current.parentId !== id) return;
    const elem = getElementById(grabRef.current.id);
    if (!elem) return;
    switch (elem.type) {
      case ObjectType.Wall: {
        const wall = elem as WallModel;
        if (isSettingWallEndPointRef.current && addedWallID && baseRef.current) {
          useStoreRef.getState().setEnableOrbitController(true);
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.addedWallId = null;
            if (wall.lx === 0) {
              state.elements.pop();
              wallMapOnFoundation.current.delete(addedWallID);
            } else {
              handleUndoableAddWall(wall as WallModel);
              wallMapOnFoundation.current.set(wall.id, wall);
            }
          });
          setAddedWallID(null);
          isSettingWallEndPointRef.current = false;
        } else {
          if (wall.lx > 0.01) {
            wallMapOnFoundation.current.set(wall.id, wall);
            newPositionRef.current.set(wall.cx, wall.cy, wall.cz);
            newDimensionRef.current.set(wall.lx, wall.ly, wall.lz);
            newAzimuthRef.current = wall.relativeAngle;
            newJointsRef.current = [wall.leftJoints[0], wall.rightJoints[0]];
            newPointRef.current = [[...wall.leftPoint], [...wall.rightPoint]];
            handleUndoableResizeWall(wall);
          } else {
            setCommonStore((state) => {
              if (elementsStateBeforeResizingRef.current) {
                state.elements = [...elementsStateBeforeResizingRef.current];
                elementsStateBeforeResizingRef.current = null;
              }
            });
          }
        }
        flippedWallSide.current = FlippedWallSide.null;
        setCommonStore((state) => {
          state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
        });
        break;
      }
      case ObjectType.Polygon: {
        if (moveHandleTypeRef.current || resizeHandleTypeRef.current) {
          newVerticesRef.current = (elem as PolygonModel).vertices.map((v) => ({ ...v }));
          const undoableEditPolygon = {
            name: moveHandleTypeRef.current ? 'Move Polygon' : 'Resize Polygon',
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
        break;
      }
      default: {
        if (resizeHandleTypeRef.current) {
          newPositionRef.current.set(elem.cx, elem.cy, elem.cz);
          newDimensionRef.current.set(elem.lx, elem.ly, elem.lz);
          if (
            newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE ||
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
        } else if (rotateHandleTypeRef.current) {
          // currently, solar collectors are the only type of child that can be rotated
          if (Util.isSolarCollector(grabRef.current)) {
            const collector = grabRef.current as SolarCollector;
            if (Math.abs(newAzimuthRef.current - oldAzimuthRef.current) > ZERO_TOLERANCE) {
              if (isSolarCollectorNewAzimuthOk(collector, newAzimuthRef.current)) {
                setCommonStore((state) => {
                  state.selectedElementAngle = newAzimuthRef.current;
                });
                const undoableRotate = {
                  name: 'Rotate',
                  timestamp: Date.now(),
                  oldValue: oldAzimuthRef.current,
                  newValue: newAzimuthRef.current,
                  changedElementId: collector.id,
                  undo: () => {
                    updateSolarCollectorRelativeAzimuthById(
                      undoableRotate.changedElementId,
                      undoableRotate.oldValue as number,
                    );
                  },
                  redo: () => {
                    updateSolarCollectorRelativeAzimuthById(
                      undoableRotate.changedElementId,
                      undoableRotate.newValue as number,
                    );
                  },
                } as UndoableChange;
                addUndoable(undoableRotate);
              } else {
                updateSolarCollectorRelativeAzimuthById(collector.id, oldAzimuthRef.current);
              }
            }
          }
        } else {
          // for moving sensors and solar collectors
          newPositionRef.current.set(elem.cx, elem.cy, elem.cz);
          if (newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE) {
            let accept = true;
            if (Util.isSolarCollector(elem)) {
              accept = isSolarCollectorNewPositionOk(elem as SolarCollector, elem.cx, elem.cy);
            }
            if (accept) {
              const undoableMove = {
                name: 'Move',
                timestamp: Date.now(),
                movedElementId: elem.id,
                oldCx: oldPositionRef.current.x,
                oldCy: oldPositionRef.current.y,
                oldCz: oldPositionRef.current.z,
                newCx: newPositionRef.current.x,
                newCy: newPositionRef.current.y,
                newCz: newPositionRef.current.z,
                undo: () => {
                  setElementPosition(
                    undoableMove.movedElementId,
                    undoableMove.oldCx,
                    undoableMove.oldCy,
                    undoableMove.oldCz,
                  );
                },
                redo: () => {
                  setElementPosition(
                    undoableMove.movedElementId,
                    undoableMove.newCx,
                    undoableMove.newCy,
                    undoableMove.newCz,
                  );
                },
              } as UndoableMove;
              addUndoable(undoableMove);
            } else {
              setElementPosition(elem.id, oldPositionRef.current.x, oldPositionRef.current.y, oldPositionRef.current.z);
            }
          }
        }
      }
    }
    setShowGrid(false);
    grabRef.current = null;
    setCommonStore((state) => {
      state.resizeHandleType = null;
    });
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!foundationModel) return;
    if (grabRef.current && Util.isSolarCollector(grabRef.current)) return;
    const objectTypeToAdd = objectTypeToAddRef.current;
    if (!grabRef.current && !addedWallID && objectTypeToAdd !== ObjectType.Wall) return;
    if (grabRef.current?.parentId !== id && objectTypeToAdd === ObjectType.None) return;
    const moveHandleType = moveHandleTypeRef.current;
    const resizeHandleType = resizeHandleTypeRef.current;
    const resizeAnchor = resizeAnchorRef.current;
    setRayCast(e);
    if (baseRef.current) {
      const intersects = ray.intersectObjects([baseRef.current]);
      if (intersects.length === 0) return;
      let p = intersects[0].point;
      if (grabRef.current && grabRef.current.type && !grabRef.current.locked && intersects.length > 0) {
        switch (grabRef.current.type) {
          case ObjectType.Sensor:
            p = Util.relativeCoordinates(p.x, p.y, p.z, foundationModel);
            setElementPosition(grabRef.current.id, p.x, p.y);
            break;
          case ObjectType.Polygon:
            const polygon = grabRef.current as PolygonModel;
            if (moveHandleType === MoveHandleType.Default) {
              // do not snap the centroid to the grid
              p = Util.relativeCoordinates(p.x, p.y, p.z, foundationModel);
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
            } else if (resizeHandleType === ResizeHandleType.Default) {
              // snap to the grid (do not call Util.relativeCoordinates because we have to snap in the middle)
              p.x -= foundationModel.cx;
              p.y -= foundationModel.cy;
              p.applyEuler(new Euler().fromArray(foundationModel.rotation.map((a) => -a)));
              p = enableFineGridRef.current ? Util.snapToFineGrid(p) : Util.snapToNormalGrid(p);
              p.x /= foundationModel.lx;
              p.y /= foundationModel.ly;
              updatePolygonVertexPositionById(polygon.id, polygon.selectedIndex, p.x, p.y);
            }
            break;
          case ObjectType.Wall:
            if (
              resizeHandleType &&
              (resizeHandleType === ResizeHandleType.LowerLeft || resizeHandleType === ResizeHandleType.LowerRight)
            ) {
              p = Util.wallRelativePosition(p, foundationModel);
              let targetID: string | null = null;
              let targetPoint: Vector3 | null = null;
              let targetSide: WallSide | null = null;
              if (!enableFineGridRef.current) {
                let target = findMagnetPoint(p, 1.5);
                targetID = target.targetID;
                targetPoint = target.targetPoint;
                targetSide = target.targetSide;
              }
              p = updatePointer(p, targetPoint);

              // update length
              const relativeResizeAnchor = Util.wallRelativePosition(resizeAnchor, foundationModel);
              const lx = p.distanceTo(relativeResizeAnchor);
              const relativeCenter = new Vector3().addVectors(p, relativeResizeAnchor).divideScalar(2);
              let angle =
                Math.atan2(p.y - relativeResizeAnchor.y, p.x - relativeResizeAnchor.x) -
                (resizeHandleType === ResizeHandleType.LowerLeft ? Math.PI : 0);
              angle = angle >= 0 ? angle : (TWO_PI + angle) % TWO_PI;
              const leftPoint = resizeHandleType === ResizeHandleType.LowerLeft ? p : relativeResizeAnchor;
              const rightPoint = resizeHandleType === ResizeHandleType.LowerLeft ? relativeResizeAnchor : p;
              setCommonStore((state) => {
                for (const e of state.elements) {
                  if (e.id === grabRef.current!.id) {
                    const wall = e as WallModel;
                    wall.cx = relativeCenter.x;
                    wall.cy = relativeCenter.y;
                    wall.lx = lx;
                    wall.relativeAngle = angle;
                    wall.leftPoint = [leftPoint.x, leftPoint.y, leftPoint.z];
                    wall.rightPoint = [rightPoint.x, rightPoint.y, rightPoint.z];
                    break;
                  }
                }
              });

              const currWall = getElementById(grabRef.current.id) as WallModel;
              if (currWall) {
                // attach to other wall
                if (targetID && targetPoint && targetSide) {
                  const targetWall = getElementById(targetID) as WallModel;
                  if (targetWall) {
                    // left to left
                    if (
                      resizeHandleType === ResizeHandleType.LowerLeft &&
                      targetWall.leftJoints.length === 0 &&
                      targetSide === WallSide.Left
                    ) {
                      flipWallsCounterClockwise(currWall, targetWall);
                    }
                    // right to right
                    else if (
                      resizeHandleType === ResizeHandleType.LowerRight &&
                      targetWall.rightJoints.length === 0 &&
                      targetSide === WallSide.Right
                    ) {
                      flipWallsClockwise(currWall, targetWall);
                    }
                    // right to left side
                    else if (
                      resizeHandleType === ResizeHandleType.LowerRight &&
                      targetSide === WallSide.Left &&
                      targetWall.leftJoints.length === 0 &&
                      targetWall.rightJoints[0] !== currWall.id
                    ) {
                      setCommonStore((state) => {
                        for (const e of state.elements) {
                          if (e.id === currWall.id) {
                            (e as WallModel).rightJoints = [targetWall.id];
                          }
                          if (e.id === targetWall.id) {
                            (e as WallModel).leftJoints = [currWall.id];
                          }
                        }
                      });
                    }
                    // left to right side
                    else if (
                      resizeHandleType === ResizeHandleType.LowerLeft &&
                      targetSide === WallSide.Right &&
                      targetWall.rightJoints.length === 0 &&
                      targetWall.leftJoints[0] !== currWall.id
                    ) {
                      setCommonStore((state) => {
                        for (const e of state.elements) {
                          if (e.id === currWall.id) {
                            (e as WallModel).leftJoints = [targetWall.id];
                          }
                          if (e.id === targetWall.id) {
                            (e as WallModel).rightJoints = [currWall.id];
                          }
                        }
                      });
                    }

                    checkWallLoop(currWall.id);
                  }
                }
                // detach
                else {
                  if (resizeHandleType === ResizeHandleType.LowerRight && currWall.rightJoints.length > 0) {
                    const targetWallId = currWall.rightJoints[0];
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === currWall.id) {
                          (e as WallModel).rightJoints = [];
                        }
                        if (e.id === targetWallId) {
                          (e as WallModel).leftJoints = [];
                        }
                      }
                    });
                  } else if (resizeHandleType === ResizeHandleType.LowerLeft && currWall.leftJoints.length > 0) {
                    const targetWallId = currWall.leftJoints[0];
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === currWall.id) {
                          (e as WallModel).leftJoints = [];
                        }
                        if (e.id === targetWallId) {
                          (e as WallModel).rightJoints = [];
                        }
                      }
                    });
                  }
                }
              }
            }
            break;
        }
      }
      if (objectTypeToAdd === ObjectType.Wall && !isSettingWallStartPointRef.current) {
        const addedWall = addElement(foundationModel, p) as WallModel;
        grabRef.current = addedWall;
        setAddedWallID(addedWall.id);
        isSettingWallStartPointRef.current = true;
        setShowGrid(true);
        useStoreRef.getState().setEnableOrbitController(false);
        setCommonStore((state) => {
          state.addedWallId = addedWall.id;
          state.objectTypeToAdd = ObjectType.None;
        });
      }
      if (addedWallID && isSettingWallStartPointRef.current) {
        p = Util.wallRelativePosition(intersects[0].point, foundationModel);
        const { targetPoint } = findMagnetPoint(p, 1.5);
        p = updatePointer(p, targetPoint);
        if (isSettingWallStartPointRef.current) {
          setElementPosition(addedWallID, p.x, p.y);
        }
      }
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
      state.clickObjectType = ObjectType.Foundation;
      if (e.intersections.length > 0) {
        const intersected = e.intersections[0].object === baseRef.current;
        if (intersected) {
          state.contextMenuObjectType = ObjectType.Foundation;
        }
      }
      state.pasteNormal = UNIT_VECTOR_POS_Z;
    });
  };

  const handlePointerOut = () => {
    setHovered(false);
    setShowGrid(false);
    if (grabRef.current) {
      if (isSettingWallStartPointRef.current) {
        removeElementById(grabRef.current.id, false);
        isSettingWallStartPointRef.current = false;
        setCommonStore((state) => {
          state.addedWallId = null;
          state.objectTypeToAdd = ObjectType.Wall;
        });
      }
    }
  };

  const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && Util.isTreeOrHuman(grabRef.current)) {
      const intersected = e.intersections[0].object === baseRef.current;
      if (intersected) {
        setShowGrid(true);
      }
    }
  };

  const isSolarCollectorNewPositionOk = (sc: SolarCollector, cx: number, cy: number) => {
    const clone = JSON.parse(JSON.stringify(sc)) as SolarCollector;
    clone.cx = cx;
    clone.cy = cy;
    if (overlapWithSibling(clone)) {
      showError(i18n.t('message.MoveCancelledBecauseOfOverlap', lang));
      return false;
    }
    if (!Util.isSolarCollectorWithinHorizontalSurface(clone, foundationModel)) {
      showError(i18n.t('message.MoveOutsideBoundaryCancelled', lang));
      return false;
    }
    return true;
  };

  const isSolarCollectorNewAzimuthOk = (sc: SolarCollector, az: number) => {
    const clone = JSON.parse(JSON.stringify(sc)) as SolarCollector;
    clone.relativeAzimuth = az;
    if (overlapWithSibling(clone)) {
      showError(i18n.t('message.RotationCancelledBecauseOfOverlap', lang));
      return false;
    }
    if (!Util.isSolarCollectorWithinHorizontalSurface(clone, foundationModel)) {
      showError(i18n.t('message.RotationOutsideBoundaryCancelled', lang));
      return false;
    }
    return true;
  };

  const isSolarCollectorNewSizeOk = (sc: SolarCollector, cx: number, cy: number, lx: number, ly: number) => {
    // check if the new length will cause the solar collector to intersect with the foundation
    if (
      sc.type === ObjectType.SolarPanel &&
      sc.tiltAngle !== 0 &&
      0.5 * ly * Math.abs(Math.sin(sc.tiltAngle)) > sc.poleHeight
    ) {
      // we only need to check solar panels, other collectors are guaranteed to not touch the ground
      return false;
    }
    // check if the new size will be within the foundation
    const clone = JSON.parse(JSON.stringify(sc)) as SolarCollector;
    clone.cx = cx;
    clone.cy = cy;
    clone.lx = lx;
    clone.ly = ly;
    return Util.isSolarCollectorWithinHorizontalSurface(clone, foundationModel);
  };

  const handleSolarCollectorPointerOut = () => {
    if (grabRef.current && Util.isSolarCollector(grabRef.current)) {
      // Have to get the latest from the store (we may change this to ref in the future)
      const sp = useStore.getState().getElementById(grabRef.current.id) as SolarCollector;
      if (moveHandleTypeRef.current && !isSolarCollectorNewPositionOk(sp, sp.cx, sp.cy)) {
        setElementPosition(sp.id, oldPositionRef.current.x, oldPositionRef.current.y, oldPositionRef.current.z);
      }
    }
  };

  const handleSolarCollectorPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!intersectPlaneRef.current) return;
    if (grabRef.current && foundationModel) {
      if (!Util.isSolarCollector(grabRef.current)) return;
      const collector = grabRef.current as SolarCollector;
      setRayCast(e);
      const intersects = ray.intersectObjects([intersectPlaneRef.current]);
      if (intersects.length > 0) {
        let p = intersects[0].point; // world coordinate
        const moveHandleType = moveHandleTypeRef.current;
        const rotateHandleType = rotateHandleTypeRef.current;
        const resizeHandleType = resizeHandleTypeRef.current;
        if (moveHandleType && foundationModel) {
          p = Util.relativeCoordinates(p.x, p.y, p.z, foundationModel);
          setElementPosition(collector.id, p.x, p.y);
        } else if (rotateHandleType) {
          // tilt of solar panels not handled here
          if (rotateHandleType === RotateHandleType.Upper || rotateHandleType === RotateHandleType.Lower) {
            const pr = foundationModel.rotation[2]; // parent rotation
            const pc = new Vector2(foundationModel.cx, foundationModel.cy); // world parent center
            const cc = new Vector2(foundationModel.lx * collector.cx, foundationModel.ly * collector.cy) //local current center
              .rotateAround(ORIGIN_VECTOR2, pr); // add parent rotation
            const wc = new Vector2().addVectors(cc, pc); // world current center
            const rotation =
              Math.atan2(-p.x + wc.x, p.y - wc.y) - pr + (rotateHandleType === RotateHandleType.Lower ? 0 : Math.PI);
            const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * TWO_PI : 0; // make sure angle is between -PI to PI
            const newAzimuth = rotation + offset;
            updateSolarCollectorRelativeAzimuthById(collector.id, newAzimuth);
            newAzimuthRef.current = newAzimuth;
          }
        } else if (resizeHandleType) {
          const resizeAnchor = resizeAnchorRef.current;
          const wp = new Vector2(p.x, p.y);
          const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
          const distance = wp.distanceTo(resizeAnchor2D);
          const angle = collector.relativeAzimuth + rotation[2]; // world panel azimuth
          const rp = new Vector2().subVectors(wp, resizeAnchor2D); // relative vector from anchor to pointer
          const wbc = new Vector2(cx, cy); // world foundation center
          if (collector.type === ObjectType.SolarPanel) {
            const solarPanel = collector as SolarPanelModel;
            const pvModel = getPvModule(solarPanel.pvModelName);
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
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, collector.lx, dyl)) {
                    updateElementLyById(collector.id, dyl);
                    setElementPosition(collector.id, newCx, newCy);
                    updateDesignInfo();
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
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, dxl, collector.ly)) {
                    updateElementLxById(collector.id, dxl);
                    setElementPosition(collector.id, newCx, newCy);
                    updateDesignInfo();
                  }
                }
                break;
            }
          } else if (collector.type === ObjectType.ParabolicTrough) {
            const parabolicTrough = collector as ParabolicTroughModel;
            switch (resizeHandleType) {
              case ResizeHandleType.Lower:
              case ResizeHandleType.Upper:
                // these two handles change the length, which is controlled by module length
                {
                  const sign = resizeHandleType === ResizeHandleType.Lower ? 1 : -1;
                  const theta = rp.angle() - angle + sign * HALF_PI;
                  let dyl = distance * Math.cos(theta);
                  const n = Math.max(
                    1,
                    Math.ceil((dyl - parabolicTrough.moduleLength / 2) / parabolicTrough.moduleLength),
                  );
                  dyl = n * parabolicTrough.moduleLength;
                  const wcx = resizeAnchor.x + (sign * (dyl * Math.sin(angle))) / 2;
                  const wcy = resizeAnchor.y - (sign * (dyl * Math.cos(angle))) / 2;
                  const wc = new Vector2(wcx, wcy); // world panel center
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, collector.lx, dyl)) {
                    updateElementLyById(collector.id, dyl);
                    setElementPosition(collector.id, newCx, newCy);
                    updateDesignInfo();
                  }
                }
                break;
              case ResizeHandleType.Left:
              case ResizeHandleType.Right:
                // these two handles change the width, which is not controlled by module length
                {
                  let sign = resizeHandleType === ResizeHandleType.Left ? -1 : 1;
                  const theta = rp.angle() - angle + (resizeHandleType === ResizeHandleType.Left ? Math.PI : 0);
                  let dxl = distance * Math.cos(theta);
                  const wcx = resizeAnchor.x + (sign * (dxl * Math.cos(angle))) / 2;
                  const wcy = resizeAnchor.y + (sign * (dxl * Math.sin(angle))) / 2;
                  const wc = new Vector2(wcx, wcy);
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, dxl, collector.ly)) {
                    updateElementLxById(collector.id, dxl);
                    setElementPosition(collector.id, newCx, newCy);
                    updateDesignInfo();
                  }
                }
                break;
            }
          } else if (collector.type === ObjectType.FresnelReflector) {
            const fresnelReflector = collector as FresnelReflectorModel;
            switch (resizeHandleType) {
              case ResizeHandleType.Lower:
              case ResizeHandleType.Upper:
                // these two handles change the length, which is controlled by module length
                {
                  const sign = resizeHandleType === ResizeHandleType.Lower ? 1 : -1;
                  const theta = rp.angle() - angle + sign * HALF_PI;
                  let dyl = distance * Math.cos(theta);
                  const n = Math.max(
                    1,
                    Math.ceil((dyl - fresnelReflector.moduleLength / 2) / fresnelReflector.moduleLength),
                  );
                  dyl = n * fresnelReflector.moduleLength;
                  const wcx = resizeAnchor.x + (sign * (dyl * Math.sin(angle))) / 2;
                  const wcy = resizeAnchor.y - (sign * (dyl * Math.cos(angle))) / 2;
                  const wc = new Vector2(wcx, wcy); // world panel center
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, collector.lx, dyl)) {
                    updateElementLyById(collector.id, dyl);
                    setElementPosition(collector.id, newCx, newCy);
                    updateDesignInfo();
                  }
                }
                break;
              case ResizeHandleType.Left:
              case ResizeHandleType.Right:
                // these two handles change the width, which is not controlled by module length
                {
                  let sign = resizeHandleType === ResizeHandleType.Left ? -1 : 1;
                  const theta = rp.angle() - angle + (resizeHandleType === ResizeHandleType.Left ? Math.PI : 0);
                  let dxl = distance * Math.cos(theta);
                  const wcx = resizeAnchor.x + (sign * (dxl * Math.cos(angle))) / 2;
                  const wcy = resizeAnchor.y + (sign * (dxl * Math.sin(angle))) / 2;
                  const wc = new Vector2(wcx, wcy);
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, dxl, collector.ly)) {
                    updateElementLxById(collector.id, dxl);
                    setElementPosition(collector.id, newCx, newCy);
                    updateDesignInfo();
                  }
                }
                break;
            }
          } else if (collector.type === ObjectType.ParabolicDish) {
            const parabolicDish = collector as ParabolicDishModel;
            switch (resizeHandleType) {
              case ResizeHandleType.Left:
              case ResizeHandleType.Right:
              case ResizeHandleType.Lower:
              case ResizeHandleType.Upper: // all handles change the diameter of the dish
                const diameter = Math.min(10, distance);
                if (isSolarCollectorNewSizeOk(collector, parabolicDish.cx, parabolicDish.cy, collector.lx, diameter)) {
                  updateElementLxById(collector.id, diameter);
                  updateElementLyById(collector.id, diameter);
                  updateDesignInfo();
                }
                break;
            }
          }
        }
      }
    }
  };

  const opacity = groundImage ? (orthographic ? 0.25 : 0.75) : 1;

  return (
    <group
      ref={groupRef}
      name={'Foundation Group ' + id}
      userData={{ aabb: true }}
      position={[cx, cy, hz]}
      rotation={[0, 0, rotation[2]]}
    >
      {/* draw rectangle */}
      <Box
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
        uuid={id}
        userData={{ simulation: true, stand: true }}
        ref={baseRef}
        name={'Foundation'}
        args={[lx, ly, lz]}
        onContextMenu={handleContextMenu}
        onPointerOver={handlePointerOver}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerEnter={handlePointerEnter}
      >
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
        {showSolarRadiationHeatmap && heatmapTexture ? (
          <meshBasicMaterial
            attachArray="material"
            color={'white'}
            map={heatmapTexture}
            transparent={groundImage}
            opacity={opacity}
          />
        ) : (
          <meshStandardMaterial
            attachArray="material"
            color={textureType === FoundationTexture.NoTexture ? color : 'white'}
            map={texture}
            transparent={groundImage}
            opacity={opacity}
          />
        )}
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
      </Box>

      {/* intersection plane */}
      {grabRef.current && Util.isSolarCollector(grabRef.current) && !grabRef.current.locked && (
        <Plane
          ref={intersectPlaneRef}
          name={'Foundation Intersection Plane'}
          position={intersectionPlanePosition}
          args={[lx, ly]}
          visible={false}
          onPointerMove={handleSolarCollectorPointerMove}
          onPointerOut={handleSolarCollectorPointerOut}
        />
      )}

      {showGrid && (
        <>
          {rotateHandleTypeRef.current && grabRef.current && Util.isSolarCollector(grabRef.current) && (
            <PolarGrid element={grabRef.current} height={(grabRef.current as SolarCollector).poleHeight + hz} />
          )}
          {(moveHandleTypeRef.current || resizeHandleTypeRef.current || addedWallID) && (
            <ElementGrid hx={hx} hy={hy} hz={hz} />
          )}
        </>
      )}

      {/* ruler */}
      {selected && <HorizontalRuler element={foundationModel} verticalLift={moveHandleSize} />}

      {/* wireFrame */}
      {!selected && <Wireframe hx={hx} hy={hy} hz={hz} lineColor={lineColor} lineWidth={lineWidth} />}

      {/* highlight with a thick wireframe when it is selected but locked */}
      {selected && locked && (
        <Wireframe hx={hx} hy={hy} hz={hz} lineColor={LOCKED_ELEMENT_SELECTION_COLOR} lineWidth={lineWidth * 5} />
      )}

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
            onPointerOut={noHoverHandle}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.LowerLeft ||
                resizeHandleTypeRef.current === ResizeHandleType.LowerLeft
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
            onPointerOut={noHoverHandle}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.UpperLeft ||
                resizeHandleTypeRef.current === ResizeHandleType.UpperLeft
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
            onPointerOut={noHoverHandle}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.LowerRight ||
                resizeHandleTypeRef.current === ResizeHandleType.LowerRight
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
            onPointerOut={noHoverHandle}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.UpperRight ||
                resizeHandleTypeRef.current === ResizeHandleType.UpperRight
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>

          {!addedFoundationID && (
            <>
              {/* move handles */}
              <Sphere
                ref={moveHandleLowerRef}
                args={[moveHandleSize, 6, 6, 0, Math.PI]}
                position={[0, -hy, 0]}
                name={MoveHandleType.Lower}
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
                    hoveredHandle === MoveHandleType.Lower || moveHandleTypeRef.current === MoveHandleType.Lower
                      ? HIGHLIGHT_HANDLE_COLOR
                      : MOVE_HANDLE_COLOR_2
                  }
                />
              </Sphere>
              <Sphere
                ref={moveHandleUpperRef}
                args={[moveHandleSize, 6, 6, 0, Math.PI]}
                position={[0, hy, 0]}
                name={MoveHandleType.Upper}
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
                    hoveredHandle === MoveHandleType.Upper || moveHandleTypeRef.current === MoveHandleType.Upper
                      ? HIGHLIGHT_HANDLE_COLOR
                      : MOVE_HANDLE_COLOR_2
                  }
                />
              </Sphere>
              <Sphere
                ref={moveHandleLeftRef}
                args={[moveHandleSize, 6, 6, 0, Math.PI]}
                position={[-hx, MOVE_HANDLE_RADIUS, 0]}
                name={MoveHandleType.Left}
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
                    hoveredHandle === MoveHandleType.Left || moveHandleTypeRef.current === MoveHandleType.Left
                      ? HIGHLIGHT_HANDLE_COLOR
                      : MOVE_HANDLE_COLOR_1
                  }
                />
              </Sphere>
              <Sphere
                ref={moveHandleRightRef}
                args={[moveHandleSize, 6, 6, 0, Math.PI]}
                position={[hx, 0, 0]}
                name={MoveHandleType.Right}
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
                    hoveredHandle === MoveHandleType.Right || moveHandleTypeRef.current === MoveHandleType.Right
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
                  hoveredHandle === RotateHandleType.Lower || rotateHandleTypeRef.current === RotateHandleType.Lower
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
                  hoveredHandle === RotateHandleType.Upper || rotateHandleTypeRef.current === RotateHandleType.Upper
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
        </>
      )}

      {/* text */}
      {!addedFoundationID && (
        <>
          {hovered && !selected && (
            <textSprite
              userData={{ unintersectable: true }}
              name={'Label'}
              text={
                i18n.t('shared.FoundationElement', lang) +
                (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '')
              }
              fontSize={20}
              fontFace={'Times Roman'}
              textHeight={0.2}
              position={[0, 0, hz + 0.2]}
            />
          )}
          {!locked && hoveredHandle === ResizeHandleType.LowerLeft && (
            <textSprite
              userData={{ unintersectable: true }}
              name={'Label-LL'}
              text={'LL'}
              fontSize={20}
              fontFace={'Times Roman'}
              textHeight={0.2}
              position={[-hx, -hy, hz + 0.2]}
            />
          )}
          {!locked && hoveredHandle === ResizeHandleType.UpperLeft && (
            <textSprite
              userData={{ unintersectable: true }}
              name={'Label-UL'}
              text={'UL'}
              fontSize={20}
              fontFace={'Times Roman'}
              textHeight={0.2}
              position={[-hx, hy, hz + 0.2]}
            />
          )}
          {!locked && hoveredHandle === ResizeHandleType.LowerRight && (
            <textSprite
              userData={{ unintersectable: true }}
              name={'Label-LR'}
              text={'LR'}
              fontSize={20}
              fontFace={'Times Roman'}
              textHeight={0.2}
              position={[hx, -hy, hz + 0.2]}
            />
          )}
          {!locked && hoveredHandle === ResizeHandleType.UpperRight && (
            <textSprite
              userData={{ unintersectable: true }}
              name={'Label-UR'}
              text={'UR'}
              fontSize={20}
              fontFace={'Times Roman'}
              textHeight={0.2}
              position={[hx, hy, hz + 0.2]}
            />
          )}
          {solarStructure === SolarStructure.FocusPipe && (
            <group>
              <Cylinder
                userData={{ unintersectable: true }}
                name={'Receiver Vertical Pipe 1'}
                castShadow={false}
                receiveShadow={false}
                args={[solarReceiverApertureWidth / 4, solarReceiverApertureWidth / 4, solarReceiverHeight, 6, 2]}
                position={[0, (-solarReceiverPipeRelativeLength * ly) / 2, solarReceiverHeight / 2 + lz / 2]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" color={'white'} />
              </Cylinder>
              <Cylinder
                userData={{ unintersectable: true }}
                name={'Receiver Vertical Pipe 2'}
                castShadow={false}
                receiveShadow={false}
                args={[solarReceiverApertureWidth / 4, solarReceiverApertureWidth / 4, solarReceiverHeight, 6, 2]}
                position={[0, (solarReceiverPipeRelativeLength * ly) / 2, solarReceiverHeight / 2 + lz / 2]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" color={'white'} />
              </Cylinder>
              <Cylinder
                userData={{ unintersectable: true }}
                name={'Receiver Horizontal Pipe'}
                castShadow={false}
                receiveShadow={false}
                args={[
                  solarReceiverApertureWidth / 2,
                  solarReceiverApertureWidth / 2,
                  solarReceiverPipeRelativeLength * ly + solarReceiverApertureWidth / 2,
                  6,
                  2,
                  false,
                  3 * HALF_PI,
                  Math.PI,
                ]}
                position={[0, 0, solarReceiverHeight + lz / 2 - solarReceiverApertureWidth / 4]}
                rotation={[0, 0, 0]}
              >
                <meshStandardMaterial attach="material" color={'white'} side={DoubleSide} />
              </Cylinder>
              {/* draw poles */}
              {solarReceiverPipePoles &&
                solarReceiverPipePoles.map((p, i) => {
                  return (
                    <Cylinder
                      userData={{ unintersectable: true }}
                      key={i}
                      name={'Solar Receiver Pole ' + i}
                      castShadow={false}
                      receiveShadow={false}
                      args={[solarReceiverApertureWidth / 8, solarReceiverApertureWidth / 8, solarReceiverHeight, 4, 2]}
                      position={p}
                      rotation={[HALF_PI, 0, 0]}
                    >
                      <meshStandardMaterial attach="material" color={'white'} />
                    </Cylinder>
                  );
                })}
            </group>
          )}
          {solarStructure === SolarStructure.FocusTower && (
            <group>
              <Cylinder
                userData={{ unintersectable: true }}
                name={'Focus Tower'}
                castShadow={false}
                receiveShadow={false}
                args={[solarTowerRadius, solarTowerRadius, solarReceiverHeight, 6, 2]}
                position={[0, 0, solarReceiverHeight / 2 + lz / 2]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" color={'white'} />
              </Cylinder>
              <Cylinder
                userData={{ unintersectable: true }}
                name={'Center Receiver'}
                castShadow={false}
                receiveShadow={false}
                args={[
                  solarTowerCentralReceiverRadius,
                  solarTowerCentralReceiverRadius,
                  solarTowerCentralReceiverHeight,
                  10,
                  2,
                ]}
                position={[0, 0, solarReceiverHeight + lz / 2]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" color={'white'} />
              </Cylinder>
              {/* simple glow effect to create a halo */}
              {sunDirection.z > 0 && (
                <mesh position={[0, 0, solarReceiverHeight + lz / 2]}>
                  <sprite scale={[haloSize, haloSize, haloSize]}>
                    <spriteMaterial
                      map={glowTexture}
                      transparent={false}
                      color={0xffffff}
                      blending={AdditiveBlending}
                      depthWrite={false} // this must be set to hide the rectangle of the texture image
                    />
                  </sprite>
                </mesh>
              )}
            </group>
          )}
          {solarStructure === SolarStructure.UpdraftTower && (
            <group>
              <Cylinder
                userData={{ unintersectable: true }}
                name={'Updraft Tower Chimney'}
                castShadow={true}
                receiveShadow={false}
                args={[
                  solarUpdraftTowerChimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly)),
                  solarUpdraftTowerChimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly)),
                  solarUpdraftTowerChimneyHeight ?? Math.max(lx, ly),
                  16,
                  2,
                  true,
                ]}
                position={[0, 0, (solarUpdraftTowerChimneyHeight ?? Math.max(lx, ly)) / 2 + lz]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" color={'white'} />
              </Cylinder>
              <Cylinder
                userData={{ unintersectable: true }}
                name={'Greenhouse Wall'}
                castShadow={false}
                receiveShadow={false}
                args={[
                  solarUpdraftTowerCollectorRadius ?? Math.min(lx, ly) / 2,
                  solarUpdraftTowerCollectorRadius ?? Math.min(lx, ly) / 2,
                  solarUpdraftTowerCollectorHeight ?? Math.max(3, 10 * lz),
                  25,
                  2,
                  true,
                ]}
                position={[0, 0, (solarUpdraftTowerCollectorHeight ?? Math.max(1.5, 5 * lz)) + lz]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" color={'white'} />
              </Cylinder>
              <Circle
                userData={{ unintersectable: true }}
                name={'Greenhouse Ceiling'}
                castShadow={false}
                receiveShadow={false}
                args={[solarUpdraftTowerCollectorRadius ?? Math.min(lx, ly) / 2, 25, 0, TWO_PI]}
                position={[0, 0, lz + (solarUpdraftTowerCollectorHeight ?? 5 * lz)]}
              >
                <meshPhongMaterial
                  attach="material"
                  specular={new Color('white')}
                  shininess={50}
                  side={FrontSide}
                  color={'lightskyblue'}
                  transparent={true}
                  opacity={0.5}
                />
              </Circle>
            </group>
          )}
        </>
      )}
    </group>
  );
};

export default React.memo(Foundation);
