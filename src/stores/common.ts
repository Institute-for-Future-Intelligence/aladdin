/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import produce, { enableMapSet } from 'immer';
import { WorldModel } from '../models/WorldModel';
import { ElementModel } from '../models/ElementModel';
import { WeatherModel } from '../models/WeatherModel';
import weather from '../resources/weather.csv';
import pvmodules from '../resources/pvmodules.csv';
import Papa from 'papaparse';
import queryString from 'querystring';
import { Util } from '../Util';
import {
  ActionType,
  CuboidTexture,
  DatumEntry,
  FoundationTexture,
  HumanName,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  Scope,
  TrackerType,
  TreeType,
  User,
  WallTexture,
} from '../types';
import { DefaultWorldModel } from './DefaultWorldModel';
import { Box3, Vector2, Vector3 } from 'three';
import { ElementModelCloner } from '../models/ElementModelCloner';
import { DefaultViewState } from './DefaultViewState';
import { ViewState } from '../views/ViewState';
import short from 'short-uuid';
import { ElementModelFactory } from '../models/ElementModelFactory';
import { GroundModel } from '../models/GroundModel';
import { PvModel } from '../models/PvModel';
import { ThreeEvent } from '@react-three/fiber';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { WallModel } from '../models/WallModel';
import { Locale } from 'antd/lib/locale-provider';
import enUS from 'antd/lib/locale/en_US';
import { Undoable } from '../undo/Undoable';
// @ts-ignore
import UndoManager from 'undo-manager';
import { TreeModel } from '../models/TreeModel';
import { HumanModel } from '../models/HumanModel';
import { FoundationModel } from '../models/FoundationModel';
import { CuboidModel } from '../models/CuboidModel';

enableMapSet();

export interface CommonStoreState {
  set: (fn: (state: CommonStoreState) => void) => void;

  // only the following properties are persisted (see the whitelist at the end)
  world: WorldModel;
  elements: ElementModel[];
  viewState: ViewState;
  notes: string[];
  user: User;
  language: string;
  cloudFile: string | undefined;

  exportContent: () => {};
  clearContent: () => void;
  undoManager: UndoManager;
  addUndoable: (undoable: Undoable) => void;

  weatherData: { [key: string]: WeatherModel };
  getWeather: (location: string) => WeatherModel;
  loadWeatherData: () => void;
  getClosestCity: (lat: number, lng: number) => string | null;

  pvModules: { [key: string]: PvModel };
  getPvModule: (name: string) => PvModel;
  loadPvModules: () => void;

  grid: boolean; // this should only show up when editing
  aabb: Box3; // axis-aligned bounding box of elements
  animateSun: boolean;
  enableOrbitController: boolean;
  clickObjectType: ObjectType | null;
  contextMenuObjectType: ObjectType | null;
  moveHandleType: MoveHandleType | null;
  resizeHandleType: ResizeHandleType | null;
  rotateHandleType: RotateHandleType | null;
  resizeAnchor: Vector3;
  showCloudFilePanel: boolean;
  showAccountSettingsPanel: boolean;
  selectedElement: ElementModel | null;
  getSelectedElement: () => ElementModel | null;
  selectedSideIndex: number;
  getResizeHandlePosition: (e: ElementModel, type: ResizeHandleType) => Vector3;
  getElementById: (id: string) => ElementModel | null;
  selectMe: (id: string, e: ThreeEvent<MouseEvent>, action?: ActionType) => void;
  selectNone: () => void;
  setElementPosition: (id: string, x: number, y: number, z?: number) => void;
  setElementNormal: (id: string, x: number, y: number, z: number) => void;
  setElementSize: (id: string, lx: number, ly: number, lz?: number) => void;

  // for all types of elements
  updateElementLockById: (id: string, locked: boolean) => void;

  updateElementLabelById: (id: string, label: string) => void;
  updateElementShowLabelById: (id: string, showLabel: boolean) => void;

  updateElementColorById: (id: string, color: string) => void;
  updateElementColorForAll: (type: ObjectType, color: string) => void;

  updateElementRotationById: (id: string, x: number, y: number, z: number) => void;
  updateElementRotationForAll: (type: ObjectType, x: number, y: number, z: number) => void;

  updateElementCxById: (id: string, cx: number) => void;
  updateElementCyById: (id: string, cy: number) => void;
  updateElementCzById: (id: string, cz: number) => void;
  updateElementCzForAll: (type: ObjectType, cz: number) => void;

  updateElementLxById: (id: string, lx: number) => void;
  updateElementLxOnSurface: (type: ObjectType, parentId: string, normal: number[] | undefined, lx: number) => void;
  updateElementLxAboveFoundation: (type: ObjectType, foundationId: string, lx: number) => void;
  updateElementLxForAll: (type: ObjectType, lx: number) => void;

  updateElementLyById: (id: string, ly: number) => void;
  updateElementLyOnSurface: (type: ObjectType, parentId: string, normal: number[] | undefined, ly: number) => void;
  updateElementLyAboveFoundation: (type: ObjectType, foundationId: string, ly: number) => void;
  updateElementLyForAll: (type: ObjectType, ly: number) => void;

  updateElementLzById: (id: string, lz: number) => void;
  updateElementLzOnSurface: (type: ObjectType, parentId: string, normal: number[] | undefined, lz: number) => void;
  updateElementLzAboveFoundation: (type: ObjectType, foundationId: string, lz: number) => void;
  updateElementLzForAll: (type: ObjectType, lz: number) => void;

  // for foundations
  foundationActionScope: Scope;
  setFoundationActionScope: (scope: Scope) => void;
  updateFoundationTextureById: (id: string, texture: FoundationTexture) => void;
  updateFoundationTextureForAll: (texture: FoundationTexture) => void;

  // for cuboids
  cuboidActionScope: Scope;
  setCuboidActionScope: (scope: Scope) => void;
  updateCuboidColorBySide: (side: number, id: string, color: string) => void;
  updateCuboidColorById: (id: string, color: string) => void;
  updateCuboidColorForAll: (color: string) => void;
  updateCuboidTextureBySide: (side: number, id: string, texture: CuboidTexture) => void;
  updateCuboidFacadeTextureById: (id: string, texture: CuboidTexture) => void;
  updateCuboidFacadeTextureForAll: (texture: CuboidTexture) => void;

  // for solar panels
  solarPanelActionScope: Scope;
  setSolarPanelActionScope: (scope: Scope) => void;

  updateSolarPanelModelById: (id: string, pvModelName: string) => void;
  updateSolarPanelModelOnSurface: (parentId: string, normal: number[] | undefined, pvModelName: string) => void;
  updateSolarPanelModelAboveFoundation: (foundationId: string, pvModelName: string) => void;
  updateSolarPanelModelForAll: (pvModelName: string) => void;

  updateSolarPanelLxById: (id: string, lx: number) => void;
  updateSolarPanelLxOnSurface: (parentId: string, normal: number[] | undefined, lx: number) => void;
  updateSolarPanelLxAboveFoundation: (foundationId: string, lx: number) => void;
  updateSolarPanelLxForAll: (lx: number) => void;

  updateSolarPanelLyById: (id: string, ly: number) => void;
  updateSolarPanelLyOnSurface: (parentId: string, normal: number[] | undefined, ly: number) => void;
  updateSolarPanelLyAboveFoundation: (foundationId: string, ly: number) => void;
  updateSolarPanelLyForAll: (ly: number) => void;

  updateSolarPanelTiltAngleById: (id: string, tiltAngle: number) => void;
  updateSolarPanelTiltAngleOnSurface: (parentId: string, normal: number[] | undefined, tiltAngle: number) => void;
  updateSolarPanelTiltAngleAboveFoundation: (foundationId: string, tiltAngle: number) => void;
  updateSolarPanelTiltAngleForAll: (tiltAngle: number) => void;

  updateSolarPanelRelativeAzimuthById: (id: string, relativeAzimuth: number) => void;
  updateSolarPanelRelativeAzimuthOnSurface: (
    parentId: string,
    normal: number[] | undefined,
    relativeAzimuth: number,
  ) => void;
  updateSolarPanelRelativeAzimuthAboveFoundation: (foundationId: string, relativeAzimuth: number) => void;
  updateSolarPanelRelativeAzimuthForAll: (relativeAzimuth: number) => void;

  updateSolarPanelOrientationById: (id: string, orientation: Orientation) => void;
  updateSolarPanelOrientationOnSurface: (
    parentId: string,
    normal: number[] | undefined,
    orientation: Orientation,
  ) => void;
  updateSolarPanelOrientationAboveFoundation: (foundationId: string, orientation: Orientation) => void;
  updateSolarPanelOrientationForAll: (orientation: Orientation) => void;

  updateSolarPanelTrackerTypeById: (id: string, trackerType: TrackerType) => void;
  updateSolarPanelTrackerTypeOnSurface: (
    parentId: string,
    normal: number[] | undefined,
    trackerType: TrackerType,
  ) => void;
  updateSolarPanelTrackerTypeAboveFoundation: (foundationId: string, trackerType: TrackerType) => void;
  updateSolarPanelTrackerTypeForAll: (trackerType: TrackerType) => void;

  updateSolarPanelPoleHeightById: (id: string, poleHeight: number) => void;
  updateSolarPanelPoleHeightOnSurface: (parentId: string, normal: number[] | undefined, poleHeight: number) => void;
  updateSolarPanelPoleHeightAboveFoundation: (foundationId: string, poleHeight: number) => void;
  updateSolarPanelPoleHeightForAll: (poleHeight: number) => void;

  updateSolarPanelPoleSpacingById: (id: string, poleSpacing: number) => void;
  updateSolarPanelPoleSpacingOnSurface: (parentId: string, normal: number[] | undefined, poleSpacing: number) => void;
  updateSolarPanelPoleSpacingAboveFoundation: (foundationId: string, poleSpacing: number) => void;
  updateSolarPanelPoleSpacingForAll: (poleSpacing: number) => void;

  updateSolarPanelDrawSunBeamById: (id: string, drawSunBeam: boolean) => void;

  // for walls
  wallActionScope: Scope;
  setWallActionScope: (scope: Scope) => void;

  updateWallRelativeAngleById: (id: string, angle: number) => void;
  updateWallLeftOffsetById: (id: string, offset: number) => void;
  updateWallRightOffsetById: (id: string, offset: number) => void;
  updateWallLeftJointsById: (id: string, joints: string[]) => void;
  updateWallRightJointsById: (id: string, joints: string[]) => void;
  updateWallLeftPointById: (id: string, point: number[]) => void;
  updateWallRightPointById: (id: string, point: number[]) => void;

  updateWallTextureById: (id: string, texture: WallTexture) => void;
  updateWallTextureAboveFoundation: (foundationId: string, texture: WallTexture) => void;
  updateWallTextureForAll: (texture: WallTexture) => void;

  updateWallColorById: (id: string, color: string) => void;
  updateWallColorAboveFoundation: (foundationId: string, color: string) => void;
  updateWallColorForAll: (color: string) => void;

  updateWallHeightById: (id: string, height: number) => void;
  updateWallHeightAboveFoundation: (foundationId: string, height: number) => void;
  updateWallHeightForAll: (height: number) => void;

  updateWallThicknessById: (id: string, thickness: number) => void;
  updateWallThicknessAboveFoundation: (foundationId: string, thickness: number) => void;
  updateWallThicknessForAll: (thickness: number) => void;

  updateTreeTypeById: (id: string, type: TreeType) => void;
  updateTreeShowModelById: (id: string, showModel: boolean) => void;

  updateHumanNameById: (id: string, name: HumanName) => void;

  objectTypeToAdd: ObjectType;
  addElement: (parent: ElementModel | GroundModel, position: Vector3, normal?: Vector3) => ElementModel | null;

  pastePoint: Vector3;
  pasteNormal: Vector3 | undefined;
  elementsToPaste: ElementModel[];
  copyElementById: (id: string) => void;
  removeElementById: (id: string, cut: boolean) => void; // set cut to false for deletion
  pasteElementsToPoint: () => ElementModel[];
  pasteElementsByKey: () => ElementModel[];
  countElementsByType: (type: ObjectType) => number;
  removeElementsByType: (type: ObjectType) => void;
  countAllChildElementsByType: (parentId: string, type: ObjectType) => number;
  countAllChildSolarPanels: (parentId: string) => number; // special case as a rack may have many solar panels
  removeAllChildElementsByType: (parentId: string, type: ObjectType) => void;

  dailyLightSensorData: DatumEntry[];
  dailyLightSensorFlag: boolean;
  setDailyLightSensorData: (data: DatumEntry[]) => void;
  yearlyLightSensorData: DatumEntry[];
  yearlyLightSensorFlag: boolean;
  setYearlyLightSensorData: (data: DatumEntry[]) => void;
  sensorLabels: string[];
  setSensorLabels: (labels: string[]) => void;

  dailyPvYield: DatumEntry[];
  dailyPvFlag: boolean;
  dailyPvIndividualOutputs: boolean;
  setDailyPvYield: (data: DatumEntry[]) => void;
  yearlyPvYield: DatumEntry[];
  yearlyPvFlag: boolean;
  yearlyPvIndividualOutputs: boolean;
  setYearlyPvYield: (data: DatumEntry[]) => void;
  solarPanelLabels: string[];
  setSolarPanelLabels: (labels: string[]) => void;

  sunlightDirection: Vector3;
  setSunlightDirection: (vector: Vector3) => void;

  cameraDirection: Vector3;
  getCameraDirection: () => Vector3;

  updateSceneRadiusFlag: boolean;
  sceneRadius: number;
  setSceneRadius: (radius: number) => void;

  selectedElementAngle: number;
  selectedElementHeight: number;

  buildingWallID: string | null;
  deletedWallID: string | null;
  updateWallPointOnFoundation: boolean;
  getAllWallsIdOnFoundation: (parentID: string) => string[];

  orthographicChanged: boolean;
  simulationInProgress: boolean;
  locale: Locale;
  localFileName: string;
  openLocalFileFlag: boolean;
  saveLocalFileFlag: boolean;
  saveLocalFileDialogVisible: boolean;
  updateCloudFileFlag: boolean;
  savedCameraPosition: Vector3;
  savedPanCenter: Vector3;
  enableFineGrid: boolean;
  setEnableFineGrid: (b: boolean) => void;

  // the following is to fix the bug that when ctrl+o is pressed, the file dialog gets fired up multiple times
  localFileDialogRequested: boolean;
}

export const useStore = create<CommonStoreState>(
  devtools(
    persist(
      (set, get) => {
        const immerSet: CommonStoreState['set'] = (fn) => set(produce(fn));
        const defaultWorldModel = new DefaultWorldModel();
        const defaultElements = defaultWorldModel.getElements();
        const defaultViewState = new DefaultViewState();

        return {
          set: (fn) => {
            try {
              immerSet(fn);
            } catch (e) {
              console.log(e);
            }
          },
          world: defaultWorldModel,
          elements: defaultElements,
          viewState: defaultViewState,
          notes: [],
          user: {} as User,
          language: 'en',
          cloudFile: undefined,
          exportContent() {
            const state = get();
            return {
              docid: short.generate(),
              timestamp: new Date().getTime(),
              owner: state.user.displayName,
              email: state.user.email,
              world: state.world,
              elements: state.elements,
              view: state.viewState,
              notes: state.notes,
            };
          },
          clearContent() {
            immerSet((state: CommonStoreState) => {
              state.elements = [];
            });
          },
          undoManager: new UndoManager(),
          addUndoable(undable: Undoable) {
            immerSet((state: CommonStoreState) => {
              state.undoManager.add(undable);
            });
          },

          yearlyLightSensorData: [],
          yearlyLightSensorFlag: false,
          setYearlyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyLightSensorData = [...data];
            });
          },
          dailyLightSensorData: [],
          dailyLightSensorFlag: false,
          setDailyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyLightSensorData = [...data];
            });
          },
          sensorLabels: [],
          setSensorLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.sensorLabels = [...labels];
            });
          },

          yearlyPvYield: [],
          yearlyPvFlag: false,
          yearlyPvIndividualOutputs: false,
          setYearlyPvYield(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyPvYield = [...data];
            });
          },
          dailyPvYield: [],
          dailyPvFlag: false,
          dailyPvIndividualOutputs: false,
          setDailyPvYield(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyPvYield = [...data];
            });
          },
          solarPanelLabels: [],
          setSolarPanelLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.solarPanelLabels = [...labels];
            });
          },

          grid: false,
          aabb: new Box3(),
          animateSun: false,
          enableOrbitController: true,
          clickObjectType: null,
          contextMenuObjectType: null,
          moveHandleType: null,
          resizeHandleType: null,
          rotateHandleType: null,
          resizeAnchor: new Vector3(),
          showCloudFilePanel: false,
          showAccountSettingsPanel: false,

          selectedElement: null,
          getSelectedElement() {
            const elements = get().elements;
            for (const e of elements) {
              if (e.selected) {
                return e;
              }
            }
            return null;
          },

          selectedSideIndex: -1,

          getResizeHandlePosition(e: ElementModel, handleType: ResizeHandleType) {
            const { cx, cy, cz, lx, ly, lz, rotation, type, parentId } = e;
            let p = new Vector3();
            const v = new Vector2();
            switch (type) {
              case ObjectType.Cuboid:
                switch (handleType) {
                  case ResizeHandleType.LowerLeftTop:
                    v.set(-lx / 2, -ly / 2);
                    break;
                  case ResizeHandleType.LowerRightTop:
                    v.set(lx / 2, -ly / 2);
                    break;
                  case ResizeHandleType.UpperLeftTop:
                    v.set(-lx / 2, ly / 2);
                    break;
                  case ResizeHandleType.UpperRightTop:
                    v.set(lx / 2, ly / 2);
                    break;
                }
                v.rotateAround(new Vector2(0, 0), rotation[2]);
                p.set(cx + v.x, cy + v.y, cz);
                break;
              case ObjectType.Wall:
                const elements = get().elements;
                let parent: ElementModel | null = null;
                const wall = e as WallModel;
                for (const e of elements) {
                  if (e.id === parentId) {
                    parent = e;
                  }
                }
                if (parent) {
                  const parentPosition = new Vector3(parent.cx, parent.cy, parent.cz);
                  switch (handleType) {
                    case ResizeHandleType.UpperLeft: {
                      const handleRelativePos = new Vector3(wall.leftPoint[0], wall.leftPoint[1], wall.leftPoint[2]);
                      const haneldAbsPosition = new Vector3().addVectors(parentPosition, handleRelativePos);
                      p = haneldAbsPosition;
                      break;
                    }
                    case ResizeHandleType.UpperRight: {
                      const handleRelativePos = new Vector3(wall.rightPoint[0], wall.rightPoint[1], wall.rightPoint[2]);
                      const haneldAbsPosition = new Vector3().addVectors(parentPosition, handleRelativePos);
                      p = haneldAbsPosition;
                      break;
                    }
                  }
                }
            }
            return p;
          },
          getElementById(id: string) {
            const elements = get().elements;
            for (const e of elements) {
              if (e.id === id) {
                return e;
              }
            }
            return null;
          },
          selectNone() {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                e.selected = false;
              }
              state.selectedElement = null;
            });
          },
          selectMe(id, e, action) {
            if (e.intersections.length > 0) {
              if (e.intersections[0].object === e.eventObject) {
                immerSet((state) => {
                  for (const elem of state.elements) {
                    if (elem.id === id) {
                      elem.selected = true;
                      state.selectedElementHeight = elem.lz;
                    } else {
                      elem.selected = false;
                    }
                  }
                  if (action) {
                    state.moveHandleType = null;
                    state.resizeHandleType = null;
                    state.rotateHandleType = null;
                    state.enableOrbitController = false;
                    switch (action) {
                      case ActionType.Move:
                        state.moveHandleType = e.eventObject.name as MoveHandleType;
                        break;
                      case ActionType.Resize:
                        state.resizeHandleType = e.eventObject.name as ResizeHandleType;
                        break;
                      case ActionType.Rotate:
                        state.rotateHandleType = e.eventObject.name as RotateHandleType;
                        break;
                      case ActionType.Select:
                        state.selectedElementAngle = e.object.parent?.rotation.z ?? 0;
                        state.enableOrbitController = true;
                        break;
                      default:
                        state.enableOrbitController = true;
                    }
                  }
                });
              }
            }
          },

          // for all types of elements
          updateElementLockById(id, locked) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.locked = locked;
                  break;
                }
              }
            });
          },

          updateElementLabelById(id, label) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.label = label;
                  break;
                }
              }
            });
          },
          updateElementShowLabelById(id, showLabel) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.showLabel = showLabel;
                  break;
                }
              }
            });
          },

          // color
          updateElementColorById(id, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.color = color;
                  break;
                }
              }
            });
          },
          updateElementColorForAll(type, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  e.color = color;
                }
              }
            });
          },

          updateElementCxById(id, cx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.cx = cx;
                  break;
                }
              }
            });
          },
          updateElementCyById(id, cy) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.cy = cy;
                  break;
                }
              }
            });
          },
          updateElementCzById(id, cz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.cz = cz;
                  break;
                }
              }
            });
          },
          updateElementCzForAll(type, cz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  e.cz = cz;
                }
              }
            });
          },

          // lx
          updateElementLxById(id, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.lx = lx;
                  break;
                }
              }
            });
          },
          updateElementLxAboveFoundation(type, foundationId, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId) {
                  e.lx = lx;
                }
              }
            });
          },
          updateElementLxOnSurface(type, parentId, normal, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    e.lx = lx;
                  }
                }
              }
            });
          },
          updateElementLxForAll(type, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  e.lx = lx;
                }
              }
            });
          },

          // ly
          updateElementLyById(id, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.ly = ly;
                  break;
                }
              }
            });
          },
          updateElementLyAboveFoundation(type, foundationId, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId) {
                  e.ly = ly;
                }
              }
            });
          },
          updateElementLyOnSurface(type, parentId, normal, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    e.ly = ly;
                  }
                }
              }
            });
          },
          updateElementLyForAll(type, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  e.ly = ly;
                }
              }
            });
          },

          // lz
          updateElementLzById(id, lz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.lz = lz;
                  break;
                }
              }
            });
          },
          updateElementLzAboveFoundation(type, foundationId, lz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId) {
                  e.lz = lz;
                }
              }
            });
          },
          updateElementLzOnSurface(type, parentId, normal, lz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    e.lz = lz;
                  }
                }
              }
            });
          },
          updateElementLzForAll(type, lz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  e.lz = lz;
                }
              }
            });
          },

          updateElementRotationById(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
              for (const [i, e] of state.elements.entries()) {
                if (e.id === id || e.parentId === id) {
                  const elem = state.elements[i];
                  elem.rotation[0] = x;
                  elem.rotation[1] = y;
                  elem.rotation[2] = z;
                }
              }
              state.selectedElementAngle = z;
            });
          },
          updateElementRotationForAll(type, x, y, z) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  e.rotation[0] = x;
                  e.rotation[1] = y;
                  e.rotation[2] = z;
                }
              }
            });
          },

          // for foundations
          foundationActionScope: Scope.OnlyThisObject,
          setFoundationActionScope(scope: Scope) {
            immerSet((state: CommonStoreState) => {
              state.foundationActionScope = scope;
            });
          },

          updateFoundationTextureById(id, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id) {
                  (e as FoundationModel).textureType = texture;
                  break;
                }
              }
            });
          },
          updateFoundationTextureForAll(texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation) {
                  (e as FoundationModel).textureType = texture;
                }
              }
            });
          },

          // for cuboids
          cuboidActionScope: Scope.OnlyThisSide,
          setCuboidActionScope(scope: Scope) {
            immerSet((state: CommonStoreState) => {
              state.cuboidActionScope = scope;
            });
          },
          updateCuboidColorBySide(side: number, id, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Cuboid && e.id === id) {
                  const cuboid = e as CuboidModel;
                  if (!cuboid.faceColors) {
                    cuboid.faceColors = new Array<string>(6);
                    cuboid.faceColors.fill(cuboid.color ?? color);
                  }
                  cuboid.faceColors[side] = color;
                  break;
                }
              }
            });
          },
          updateCuboidColorById(id, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Cuboid && e.id === id) {
                  e.color = color;
                  const cuboid = e as CuboidModel;
                  if (!cuboid.faceColors) cuboid.faceColors = new Array<string>(6);
                  for (let i = 0; i < 4; i++) {
                    cuboid.faceColors[i] = color;
                  }
                  break;
                }
              }
            });
          },
          updateCuboidColorForAll(color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Cuboid) {
                  e.color = color;
                  const cuboid = e as CuboidModel;
                  if (!cuboid.faceColors) cuboid.faceColors = new Array<string>(6);
                  for (let i = 0; i < 4; i++) {
                    cuboid.faceColors[i] = color;
                  }
                }
              }
            });
          },

          updateCuboidTextureBySide(side: number, id, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Cuboid && e.id === id) {
                  const cuboid = e as CuboidModel;
                  if (!cuboid.textureTypes) {
                    cuboid.textureTypes = new Array<CuboidTexture>(6);
                    cuboid.textureTypes.fill(CuboidTexture.NoTexture);
                  }
                  cuboid.textureTypes[side] = texture;
                  break;
                }
              }
            });
          },
          updateCuboidFacadeTextureById(id, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Cuboid && e.id === id) {
                  const cuboid = e as CuboidModel;
                  if (!cuboid.textureTypes) {
                    cuboid.textureTypes = new Array<CuboidTexture>(6);
                    cuboid.textureTypes.fill(CuboidTexture.NoTexture);
                  }
                  for (let i = 0; i < 4; i++) {
                    cuboid.textureTypes[i] = texture;
                  }
                  break;
                }
              }
            });
          },
          updateCuboidFacadeTextureForAll(texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Cuboid) {
                  const cuboid = e as CuboidModel;
                  if (!cuboid.textureTypes) {
                    cuboid.textureTypes = new Array<CuboidTexture>(6);
                    cuboid.textureTypes.fill(CuboidTexture.NoTexture);
                  }
                  for (let i = 0; i < 4; i++) {
                    cuboid.textureTypes[i] = texture;
                  }
                }
              }
            });
          },

          // for solar panels
          solarPanelActionScope: Scope.OnlyThisObject,
          setSolarPanelActionScope(scope: Scope) {
            immerSet((state: CommonStoreState) => {
              state.solarPanelActionScope = scope;
            });
          },

          updateSolarPanelModelById(id, pvModelName) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  const sp = e as SolarPanelModel;
                  sp.pvModelName = pvModelName;
                  const pvModel = state.pvModules[pvModelName];
                  if (sp.orientation === Orientation.portrait) {
                    // calculate the current x-y layout
                    const nx = Math.max(1, Math.round(sp.lx / pvModel.width));
                    const ny = Math.max(1, Math.round(sp.ly / pvModel.length));
                    sp.lx = nx * pvModel.width;
                    sp.ly = ny * pvModel.length;
                  } else {
                    // calculate the current x-y layout
                    const nx = Math.max(1, Math.round(sp.lx / pvModel.length));
                    const ny = Math.max(1, Math.round(sp.ly / pvModel.width));
                    sp.lx = nx * pvModel.length;
                    sp.ly = ny * pvModel.width;
                  }
                  break;
                }
              }
            });
          },
          updateSolarPanelModelAboveFoundation(foundationId, pvModelName) {
            immerSet((state: CommonStoreState) => {
              const pvModel = state.pvModules[pvModelName];
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId) {
                  const sp = e as SolarPanelModel;
                  sp.pvModelName = pvModelName;
                  if (sp.orientation === Orientation.portrait) {
                    // calculate the current x-y layout
                    const nx = Math.max(1, Math.round(sp.lx / pvModel.width));
                    const ny = Math.max(1, Math.round(sp.ly / pvModel.length));
                    sp.lx = nx * pvModel.width;
                    sp.ly = ny * pvModel.length;
                  } else {
                    // calculate the current x-y layout
                    const nx = Math.max(1, Math.round(sp.lx / pvModel.length));
                    const ny = Math.max(1, Math.round(sp.ly / pvModel.width));
                    sp.lx = nx * pvModel.length;
                    sp.ly = ny * pvModel.width;
                  }
                }
              }
            });
          },
          updateSolarPanelModelOnSurface(parentId, normal, pvModelName) {
            immerSet((state: CommonStoreState) => {
              const pvModel = state.pvModules[pvModelName];
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    const sp = e as SolarPanelModel;
                    sp.pvModelName = pvModelName;
                    if (sp.orientation === Orientation.portrait) {
                      // calculate the current x-y layout
                      const nx = Math.max(1, Math.round(sp.lx / pvModel.width));
                      const ny = Math.max(1, Math.round(sp.ly / pvModel.length));
                      sp.lx = nx * pvModel.width;
                      sp.ly = ny * pvModel.length;
                    } else {
                      // calculate the current x-y layout
                      const nx = Math.max(1, Math.round(sp.lx / pvModel.length));
                      const ny = Math.max(1, Math.round(sp.ly / pvModel.width));
                      sp.lx = nx * pvModel.length;
                      sp.ly = ny * pvModel.width;
                    }
                  }
                }
              }
            });
          },
          updateSolarPanelModelForAll(pvModelName) {
            immerSet((state: CommonStoreState) => {
              const pvModel = state.pvModules[pvModelName];
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  const sp = e as SolarPanelModel;
                  sp.pvModelName = pvModelName;
                  if (sp.orientation === Orientation.portrait) {
                    // calculate the current x-y layout
                    const nx = Math.max(1, Math.round(sp.lx / pvModel.width));
                    const ny = Math.max(1, Math.round(sp.ly / pvModel.length));
                    sp.lx = nx * pvModel.width;
                    sp.ly = ny * pvModel.length;
                  } else {
                    // calculate the current x-y layout
                    const nx = Math.max(1, Math.round(sp.lx / pvModel.length));
                    const ny = Math.max(1, Math.round(sp.ly / pvModel.width));
                    sp.lx = nx * pvModel.length;
                    sp.ly = ny * pvModel.width;
                  }
                }
              }
            });
          },

          updateSolarPanelLxById(id, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  const sp = e as SolarPanelModel;
                  const pv = state.getPvModule(sp.pvModelName);
                  e.lx = Util.panelizeLx(sp, pv, lx);
                  break;
                }
              }
            });
          },
          updateSolarPanelLxAboveFoundation(foundationId, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId) {
                  const sp = e as SolarPanelModel;
                  const pv = state.getPvModule(sp.pvModelName);
                  e.lx = Util.panelizeLx(sp, pv, lx);
                }
              }
            });
          },
          updateSolarPanelLxOnSurface(parentId, normal, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    const sp = e as SolarPanelModel;
                    const pv = state.getPvModule(sp.pvModelName);
                    e.lx = Util.panelizeLx(sp, pv, lx);
                  }
                }
              }
            });
          },
          updateSolarPanelLxForAll(lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  const sp = e as SolarPanelModel;
                  const pv = state.getPvModule(sp.pvModelName);
                  e.lx = Util.panelizeLx(sp, pv, lx);
                }
              }
            });
          },

          updateSolarPanelLyById(id, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  const sp = e as SolarPanelModel;
                  const pv = state.getPvModule(sp.pvModelName);
                  e.ly = Util.panelizeLy(sp, pv, ly);
                  break;
                }
              }
            });
          },
          updateSolarPanelLyAboveFoundation(foundationId, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId) {
                  const sp = e as SolarPanelModel;
                  const pv = state.getPvModule(sp.pvModelName);
                  e.ly = Util.panelizeLy(sp, pv, ly);
                }
              }
            });
          },
          updateSolarPanelLyOnSurface(parentId, normal, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    const sp = e as SolarPanelModel;
                    const pv = state.getPvModule(sp.pvModelName);
                    e.ly = Util.panelizeLy(sp, pv, ly);
                  }
                }
              }
            });
          },
          updateSolarPanelLyForAll(ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  const sp = e as SolarPanelModel;
                  const pv = state.getPvModule(sp.pvModelName);
                  e.ly = Util.panelizeLy(sp, pv, ly);
                }
              }
            });
          },

          updateSolarPanelTiltAngleById(id, tiltAngle) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  const sp = e as SolarPanelModel;
                  sp.tiltAngle = tiltAngle;
                  break;
                }
              }
            });
          },
          updateSolarPanelTiltAngleAboveFoundation(foundationId, tiltAngle) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId) {
                  const sp = e as SolarPanelModel;
                  sp.tiltAngle = tiltAngle;
                }
              }
            });
          },
          updateSolarPanelTiltAngleOnSurface(parentId, normal, tiltAngle) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    const sp = e as SolarPanelModel;
                    sp.tiltAngle = tiltAngle;
                  }
                }
              }
            });
          },
          updateSolarPanelTiltAngleForAll(tiltAngle) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  const sp = e as SolarPanelModel;
                  sp.tiltAngle = tiltAngle;
                }
              }
            });
          },

          updateSolarPanelRelativeAzimuthById(id, relativeAzimuth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  const sp = e as SolarPanelModel;
                  sp.relativeAzimuth = relativeAzimuth;
                  break;
                }
              }
            });
          },
          updateSolarPanelRelativeAzimuthAboveFoundation(foundationId, relativeAzimuth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId) {
                  const sp = e as SolarPanelModel;
                  sp.relativeAzimuth = relativeAzimuth;
                }
              }
            });
          },
          updateSolarPanelRelativeAzimuthOnSurface(parentId, normal, relativeAzimuth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    const sp = e as SolarPanelModel;
                    sp.relativeAzimuth = relativeAzimuth;
                  }
                }
              }
            });
          },
          updateSolarPanelRelativeAzimuthForAll(relativeAzimuth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  const sp = e as SolarPanelModel;
                  sp.relativeAzimuth = relativeAzimuth;
                }
              }
            });
          },

          updateSolarPanelOrientationById(id, orientation) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  (e as SolarPanelModel).orientation = orientation;
                  break;
                }
              }
            });
          },
          updateSolarPanelOrientationAboveFoundation(foundationId, orientation) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId) {
                  (e as SolarPanelModel).orientation = orientation;
                }
              }
            });
          },
          updateSolarPanelOrientationOnSurface(parentId, normal, orientation) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    (e as SolarPanelModel).orientation = orientation;
                  }
                }
              }
            });
          },
          updateSolarPanelOrientationForAll(orientation) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  (e as SolarPanelModel).orientation = orientation;
                }
              }
            });
          },

          updateSolarPanelTrackerTypeById(id, trackerType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  (e as SolarPanelModel).trackerType = trackerType;
                  break;
                }
              }
            });
          },
          updateSolarPanelTrackerTypeAboveFoundation(foundationId, trackerType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId) {
                  (e as SolarPanelModel).trackerType = trackerType;
                }
              }
            });
          },
          updateSolarPanelTrackerTypeOnSurface(parentId, normal, trackerType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    (e as SolarPanelModel).trackerType = trackerType;
                  }
                }
              }
            });
          },
          updateSolarPanelTrackerTypeForAll(trackerType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  (e as SolarPanelModel).trackerType = trackerType;
                }
              }
            });
          },

          updateSolarPanelPoleHeightById(id, poleHeight) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  const sp = e as SolarPanelModel;
                  sp.poleHeight = poleHeight;
                  break;
                }
              }
            });
          },
          updateSolarPanelPoleHeightAboveFoundation(foundationId, poleHeight) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId) {
                  const sp = e as SolarPanelModel;
                  sp.poleHeight = poleHeight;
                }
              }
            });
          },
          updateSolarPanelPoleHeightOnSurface(parentId, normal, poleHeight) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    const sp = e as SolarPanelModel;
                    sp.poleHeight = poleHeight;
                  }
                }
              }
            });
          },
          updateSolarPanelPoleHeightForAll(poleHeight) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  const sp = e as SolarPanelModel;
                  sp.poleHeight = poleHeight;
                }
              }
            });
          },

          updateSolarPanelPoleSpacingById(id, poleSpacing) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  const sp = e as SolarPanelModel;
                  sp.poleSpacing = poleSpacing;
                  break;
                }
              }
            });
          },
          updateSolarPanelPoleSpacingAboveFoundation(foundationId, poleSpacing) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId) {
                  const sp = e as SolarPanelModel;
                  sp.poleSpacing = poleSpacing;
                }
              }
            });
          },
          updateSolarPanelPoleSpacingOnSurface(parentId, normal, poleSpacing) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    const sp = e as SolarPanelModel;
                    sp.poleSpacing = poleSpacing;
                  }
                }
              }
            });
          },
          updateSolarPanelPoleSpacingForAll(poleSpacing) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  const sp = e as SolarPanelModel;
                  sp.poleSpacing = poleSpacing;
                }
              }
            });
          },

          updateSolarPanelDrawSunBeamById(id, drawSunBeam) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id) {
                  (e as SolarPanelModel).drawSunBeam = drawSunBeam;
                  break;
                }
              }
            });
          },

          // for walls
          wallActionScope: Scope.OnlyThisObject,
          setWallActionScope(scope: Scope) {
            immerSet((state: CommonStoreState) => {
              state.wallActionScope = scope;
            });
          },

          updateWallRelativeAngleById(id, angle) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  (e as WallModel).relativeAngle = angle;
                  break;
                }
              }
            });
          },
          updateWallLeftOffsetById(id, offset) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  (e as WallModel).leftOffset = offset;
                  break;
                }
              }
            });
          },
          updateWallRightOffsetById(id, offset) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  (e as WallModel).rightOffset = offset;
                  break;
                }
              }
            });
          },
          updateWallLeftJointsById(id, joints) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  (e as WallModel).leftJoints = joints;
                  break;
                }
              }
            });
          },
          updateWallRightJointsById(id, joints) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  (e as WallModel).rightJoints = joints;
                  break;
                }
              }
            });
          },
          updateWallLeftPointById(id, point) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  (e as WallModel).leftPoint = point;
                  break;
                }
              }
            });
          },
          updateWallRightPointById(id, point) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  (e as WallModel).rightPoint = point;
                  break;
                }
              }
            });
          },

          updateWallTextureById(id, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  (e as WallModel).textureType = texture;
                  break;
                }
              }
            });
          },
          updateWallTextureAboveFoundation(foundationId, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.foundationId === foundationId) {
                  (e as WallModel).textureType = texture;
                }
              }
            });
          },
          updateWallTextureForAll(texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall) {
                  (e as WallModel).textureType = texture;
                }
              }
            });
          },

          updateWallColorById(id, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  e.color = color;
                  break;
                }
              }
            });
          },
          updateWallColorAboveFoundation(foundationId, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.foundationId === foundationId) {
                  e.color = color;
                }
              }
            });
          },
          updateWallColorForAll(color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall) {
                  e.color = color;
                }
              }
            });
          },

          updateWallHeightById(id, height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  e.lz = height;
                  break;
                }
              }
            });
          },
          updateWallHeightAboveFoundation(foundationId, height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.foundationId === foundationId) {
                  e.lz = height;
                }
              }
            });
          },
          updateWallHeightForAll(height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall) {
                  e.lz = height;
                }
              }
            });
          },

          updateWallThicknessById(id, thickness) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  (e as WallModel).ly = thickness;
                  break;
                }
              }
            });
          },
          updateWallThicknessAboveFoundation(foundationId, thickness) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.foundationId === foundationId) {
                  (e as WallModel).ly = thickness;
                }
              }
            });
          },
          updateWallThicknessForAll(thickness) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall) {
                  (e as WallModel).ly = thickness;
                }
              }
            });
          },

          updateTreeTypeById(id, name) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Tree && e.id === id) {
                  const tree = e as TreeModel;
                  tree.name = name;
                  tree.evergreen = name === TreeType.Pine;
                  break;
                }
              }
            });
          },
          updateTreeShowModelById(id, showModel) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Tree && e.id === id) {
                  (e as TreeModel).showModel = showModel;
                  break;
                }
              }
            });
          },

          updateHumanNameById(id, name) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Human && e.id === id) {
                  (e as HumanModel).name = name;
                  break;
                }
              }
            });
          },

          setElementPosition(id, x, y, z?) {
            immerSet((state: CommonStoreState) => {
              for (let [i, e] of state.elements.entries()) {
                if (e.id === id) {
                  state.elements[i].cx = x;
                  state.elements[i].cy = y;
                  if (z) {
                    state.elements[i].cz = z;
                  }
                  break;
                }
              }
            });
          },
          setElementNormal(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
              for (let [i, e] of state.elements.entries()) {
                if (e.id === id || e.parentId === id) {
                  const elem = state.elements[i];
                  elem.normal[0] = x;
                  elem.normal[1] = y;
                  elem.normal[2] = z;
                }
              }
            });
          },
          setElementSize(id, lx, ly, lz?) {
            immerSet((state: CommonStoreState) => {
              for (let [i, e] of state.elements.entries()) {
                if (e.id === id) {
                  state.elements[i].lx = lx;
                  state.elements[i].ly = ly;
                  if (lz) {
                    state.elements[i].lz = lz;
                    state.selectedElementHeight = lz;
                  }
                  break;
                }
              }
            });
          },

          objectTypeToAdd: ObjectType.None,
          addElement(parent: ElementModel | GroundModel, position, normal) {
            let model: ElementModel | null = null;
            immerSet((state: CommonStoreState) => {
              const m = position;
              switch (state.objectTypeToAdd) {
                case ObjectType.Human:
                  const human = ElementModelFactory.makeHuman(m.x, m.y, m.z);
                  model = human;
                  state.elements.push(human);
                  break;
                case ObjectType.Tree:
                  const tree = ElementModelFactory.makeTree(m.x, m.y, m.z);
                  model = tree;
                  state.elements.push(tree);
                  break;
                case ObjectType.Sensor:
                  const sensorParentModel = parent as ElementModel;
                  const sensorRelativeCoordinates = Util.relativeCoordinates(m.x, m.y, m.z, sensorParentModel);
                  const sensor = ElementModelFactory.makeSensor(
                    sensorParentModel,
                    sensorRelativeCoordinates.x,
                    sensorRelativeCoordinates.y,
                    sensorRelativeCoordinates.z,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                  );
                  model = sensor;
                  state.elements.push(sensor);
                  break;
                case ObjectType.SolarPanel:
                  const solarPanelParentModel = parent as ElementModel;
                  const solarPanelRelativeCoordinates = Util.relativeCoordinates(m.x, m.y, m.z, solarPanelParentModel);
                  const solarPanel = ElementModelFactory.makeSolarPanel(
                    solarPanelParentModel,
                    state.getPvModule('SPR-X21-335-BLK'),
                    solarPanelRelativeCoordinates.x,
                    solarPanelRelativeCoordinates.y,
                    solarPanelRelativeCoordinates.z,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                  );
                  model = solarPanel;
                  state.elements.push(solarPanel);
                  break;
                case ObjectType.Foundation:
                  const foundation = ElementModelFactory.makeFoundation(m.x, m.y);
                  model = foundation;
                  state.elements.push(foundation);
                  break;
                case ObjectType.Cuboid:
                  const cuboid = ElementModelFactory.makeCuboid(m.x, m.y);
                  model = cuboid;
                  state.elements.push(cuboid);
                  break;
                case ObjectType.Wall:
                  const wallParentModel = parent as ElementModel;
                  const relativePos = Util.wallRelativePosition(new Vector3(m.x, m.y), wallParentModel);
                  const wall = ElementModelFactory.makeWall(
                    wallParentModel,
                    relativePos.x,
                    relativePos.y,
                    relativePos.z,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                  );
                  state.elements.push(wall);
                  model = wall;
                  break;
              }
            });
            return model;
          },

          elementsToPaste: [],
          pastePoint: new Vector3(),
          pasteNormal: undefined,
          copyElementById(id) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  state.elementsToPaste = [e];
                  break;
                }
              }
            });
          },
          removeElementById(id: string, cut: boolean) {
            immerSet((state: CommonStoreState) => {
              for (const elem of state.elements) {
                if (elem.id === id) {
                  if (cut) {
                    state.elementsToPaste = [elem];
                  }
                  elem.selected = false;
                  if (elem.type === ObjectType.Wall) {
                    const currentWall = elem as WallModel;
                    let leftWallId = '';
                    let rightWallId = '';
                    if (currentWall.leftJoints.length > 0) {
                      leftWallId = state.getElementById(currentWall.leftJoints[0])?.id ?? '';
                    }
                    if (currentWall.rightJoints.length > 0) {
                      rightWallId = state.getElementById(currentWall.rightJoints[0])?.id ?? '';
                    }
                    for (const w of state.elements) {
                      if (w.id === leftWallId) {
                        (w as WallModel).rightOffset = 0;
                        (w as WallModel).rightJoints = [];
                      } else if (w.id === rightWallId) {
                        (w as WallModel).leftOffset = 0;
                        (w as WallModel).leftJoints = [];
                      }
                    }
                    state.deletedWallID = elem.id;
                  }
                  break;
                }
              }
              if (cut) {
                for (const e of state.elements) {
                  if (e.parentId === id) {
                    state.elementsToPaste.push(e);
                  }
                }
              }
              state.elements = state.elements.filter((e) => {
                return !(e.id === id || e.parentId === id);
              });
              state.selectedElement = null;
            });
          },
          removeElementsByType(type: ObjectType) {
            immerSet((state: CommonStoreState) => {
              if (type === ObjectType.Foundation) {
                state.elements = state.elements.filter((x) => {
                  return x.type !== ObjectType.Foundation && !x.foundationId;
                });
              } else {
                state.elements = state.elements.filter((x) => x.type !== type);
              }
            });
          },
          countElementsByType(type: ObjectType) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  count++;
                }
              }
            });
            return count;
          },

          removeAllChildElementsByType(parentId: string, type: ObjectType) {
            immerSet((state: CommonStoreState) => {
              state.elements = state.elements.filter((x) => x.type !== type || x.parentId !== parentId);
            });
          },
          countAllChildElementsByType(parentId: string, type: ObjectType) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.parentId === parentId) {
                  count++;
                }
              }
            });
            return count;
          },
          countAllChildSolarPanels(parentId: string) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.parentId === parentId) {
                  const sp = e as SolarPanelModel;
                  const pvModel = state.getPvModule(sp.pvModelName);
                  let nx, ny;
                  if (sp.orientation === Orientation.portrait) {
                    nx = Math.max(1, Math.round(sp.lx / pvModel.width));
                    ny = Math.max(1, Math.round(sp.ly / pvModel.length));
                  } else {
                    nx = Math.max(1, Math.round(sp.lx / pvModel.length));
                    ny = Math.max(1, Math.round(sp.ly / pvModel.width));
                  }
                  count += nx * ny;
                }
              }
            });
            return count;
          },

          pasteElementsToPoint() {
            const pastedElements: ElementModel[] = [];
            immerSet((state: CommonStoreState) => {
              if (state.elementsToPaste.length > 0) {
                let m = state.pastePoint;
                const newParent = state.getSelectedElement();
                const oldParent = state.getElementById(state.elementsToPaste[0].parentId);
                if (newParent) {
                  // if parent is ground, it has no type definition but we use it to check its type
                  if (oldParent && oldParent.type) {
                    state.elementsToPaste[0].parentId = newParent.id;
                    m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                  }
                }
                const e = ElementModelCloner.clone(newParent, state.elementsToPaste[0], m.x, m.y, m.z);
                if (e) {
                  if (state.pasteNormal) {
                    e.normal = state.pasteNormal.toArray();
                  }
                  state.elements.push(e);
                  pastedElements.push(e);
                }
                if (state.elementsToPaste.length > 1) {
                  // paste children, too
                  for (let i = 1; i < state.elementsToPaste.length; i++) {
                    // TODO
                  }
                }
              }
            });
            return pastedElements;
          },

          pasteElementsByKey() {
            const pastedElements: ElementModel[] = [];
            immerSet((state: CommonStoreState) => {
              if (state.elementsToPaste.length > 0) {
                const elem = state.elementsToPaste[0];
                const parent = state.getElementById(elem.parentId);
                const e = ElementModelCloner.clone(parent, elem, elem.cx, elem.cy, elem.cz);
                if (e) {
                  switch (e.type) {
                    case ObjectType.Human:
                      e.cx += 1;
                      state.elements.push(e);
                      state.elementsToPaste = [e];
                      break;
                    case ObjectType.Tree:
                      e.cx += e.lx;
                      state.elements.push(e);
                      state.elementsToPaste = [e];
                      break;
                    case ObjectType.SolarPanel:
                      if (e.parentId) {
                        const parent = state.getElementById(e.parentId);
                        if (parent) {
                          e.cx += e.lx / parent.lx;
                        }
                        if (e.cx < 0.5) {
                          state.elements.push(e);
                          state.elementsToPaste = [e];
                        }
                      }
                      break;
                    case ObjectType.Sensor:
                      if (e.parentId) {
                        const parent = state.getElementById(e.parentId);
                        if (parent) {
                          e.cx += e.lx / parent.lx;
                        }
                        if (e.cx < 0.5) {
                          state.elements.push(e);
                          state.elementsToPaste = [e];
                        }
                      }
                      break;
                  }
                  pastedElements.push(e);
                }
                if (state.elementsToPaste.length > 1) {
                  // paste children, too
                  for (let i = 1; i < state.elementsToPaste.length; i++) {
                    // TODO
                  }
                }
              }
            });
            return pastedElements;
          },

          pvModules: {},
          loadPvModules() {
            const pvModels: PvModel[] = [];
            Papa.parse(pvmodules, {
              download: true,
              complete: function (results) {
                for (const row of results.data) {
                  if (Array.isArray(row) && row.length > 1) {
                    const pv = {
                      name: row[0].trim(),
                      brand: row[1].trim(),
                      cellType: row[2].trim(),
                      efficiency: parseFloat(row[3].trim()),
                      length: parseFloat(row[4].trim()),
                      nominalLength: parseFloat(row[5].trim()),
                      width: parseFloat(row[6].trim()),
                      nominalWidth: parseFloat(row[7].trim()),
                      thickness: parseFloat(row[8].trim()),
                      m: parseFloat(row[9].trim()),
                      n: parseFloat(row[10].trim()),
                      pmax: parseFloat(row[11].trim()),
                      vmpp: parseFloat(row[12].trim()),
                      impp: parseFloat(row[13].trim()),
                      voc: parseFloat(row[14].trim()),
                      isc: parseFloat(row[15].trim()),
                      pmaxTC: parseFloat(row[16].trim()),
                      noct: parseFloat(row[17].trim()),
                      weight: parseFloat(row[18].trim()),
                      color: row[19].trim(),
                      shadeTolerance: row[20].trim(),
                      price: parseFloat(row[21].trim()),
                    } as PvModel;
                    pvModels.push(pv);
                  }
                }
                immerSet((state: CommonStoreState) => {
                  for (const model of pvModels) {
                    state.pvModules[model.name] = model;
                  }
                });
              },
            });
          },
          getPvModule(name: string) {
            return get().pvModules[name];
          },

          weatherData: {},
          loadWeatherData() {
            const data: WeatherModel[] = [];
            Papa.parse(weather, {
              download: true,
              complete: function (results) {
                for (const row of results.data) {
                  if (Array.isArray(row) && row.length > 1) {
                    const lows: number[] = [];
                    const highs: number[] = [];
                    const sun: number[] = [];
                    for (let i = 5; i < 29; i++) {
                      if ((i - 5) % 2 === 0) {
                        lows.push(parseFloat(row[i].trim()));
                      } else {
                        highs.push(parseFloat(row[i].trim()));
                      }
                    }
                    for (let i = 29; i < 41; i++) {
                      sun.push(parseFloat(row[i].trim()));
                    }
                    const wm = {
                      city: row[0].trim(),
                      country: row[1].trim(),
                      longitude: parseFloat(row[2].trim()),
                      latitude: parseFloat(row[3].trim()),
                      elevation: parseFloat(row[4].trim()),
                      lowestTemperatures: lows,
                      highestTemperatures: highs,
                      sunshineHours: sun,
                    } as WeatherModel;
                    data.push(wm);
                  }
                }
                immerSet((state: CommonStoreState) => {
                  for (const row of data) {
                    state.weatherData[row.city + ', ' + row.country] = row;
                  }
                });
              },
            });
          },
          getWeather(location: string) {
            return get().weatherData[location];
          },
          getClosestCity(lat: number, lng: number) {
            let min: number = Number.MAX_VALUE;
            let city = null;
            let distance: number;
            const wd = get().weatherData;
            for (const name in wd) {
              if (wd.hasOwnProperty(name)) {
                distance = Util.getDistance(lng, lat, wd[name].longitude, wd[name].latitude);
                if (distance < min) {
                  min = distance;
                  city = name;
                }
              }
            }
            return city;
          },

          sunlightDirection: new Vector3(0, 2, 2),
          setSunlightDirection(vector: Vector3) {
            immerSet((state: CommonStoreState) => {
              state.sunlightDirection = vector.clone();
            });
          },

          cameraDirection: new Vector3(),
          getCameraDirection() {
            return get().cameraDirection;
          },

          updateSceneRadiusFlag: false,
          sceneRadius: 10,
          setSceneRadius(radius: number) {
            immerSet((state: CommonStoreState) => {
              state.sceneRadius = radius;
            });
          },

          selectedElementAngle: 0,
          selectedElementHeight: 0,

          buildingWallID: null,
          deletedWallID: null,
          updateWallPointOnFoundation: false,
          getAllWallsIdOnFoundation(parentID: string) {
            const state = get();
            const wallsID: string[] = [];
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall && e.parentId === parentID) {
                wallsID.push(e.id);
              }
            }
            return wallsID;
          },

          orthographicChanged: false,
          simulationInProgress: false,
          locale: enUS,
          localFileName: 'aladdin.ala',
          openLocalFileFlag: false,
          saveLocalFileFlag: false,
          saveLocalFileDialogVisible: false,
          updateCloudFileFlag: false,
          localFileDialogRequested: false,
          pvModelDialogVisible: false,
          savedCameraPosition: new Vector3(0, -5, 0),
          savedPanCenter: new Vector3(),

          enableFineGrid: false,
          setEnableFineGrid(b: boolean) {
            immerSet((state: CommonStoreState) => {
              state.enableFineGrid = b;
            });
          },
        };
      },
      {
        name: 'aladdin-storage',
        getStorage: () => {
          const query = queryString.parse(window.location.search);
          const viewOnly = query.viewonly === 'true';
          return viewOnly ? sessionStorage : localStorage;
        },
        whitelist: [
          'language',
          'cloudFile',
          'world',
          'elements',
          'viewState',
          'notes',
          'user',
          'weatherData',
          'sensorLabels',
          'solarPanelLabels',
          'dailyLightSensorData',
          'yearlyLightSensorData',
        ],
      },
    ),
  ),
);
