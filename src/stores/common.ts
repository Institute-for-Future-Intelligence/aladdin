/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
import { Util } from '../Util';
import {
  ActionType,
  CuboidTexture,
  DatumEntry,
  FoundationTexture,
  HumanName,
  LineStyle,
  MoveHandleType,
  ObjectType,
  Orientation,
  PolygonTexture,
  ResizeHandleType,
  RotateHandleType,
  Scope,
  TrackerType,
  TreeType,
  User,
  WallTexture,
  WindowState,
} from '../types';
import { DefaultWorldModel } from './DefaultWorldModel';
import { Box3, Euler, Vector2, Vector3 } from 'three';
import { ElementModelCloner } from '../models/ElementModelCloner';
import { DefaultViewState } from './DefaultViewState';
import { ViewState } from './ViewState';
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
import { GROUND_ID, ORIGIN_VECTOR2, UNIT_VECTOR_POS_Z_ARRAY } from '../constants';
import { PolygonModel } from '../models/PolygonModel';
import { Point2 } from '../models/Point2';
import { useStoreRef } from './commonRef';
import { showError } from '../helpers';
import i18n from '../i18n/i18n';
import { HumanData } from '../HumanData';
import { SolarPanelArrayLayoutParams } from './SolarPanelArrayLayoutParams';
import { DefaultSolarPanelArrayLayoutParams } from './DefaultSolarPanelArrayLayoutParams';

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

  changed: boolean;
  setChanged: (b: boolean) => void;
  skipChange: boolean;
  setSkipChange: (b: boolean) => void;
  fileChanged: boolean;
  applyCount: number;
  setApplyCount: (count: number) => void;
  revertApply: () => void;

  importContent: (input: any, title?: string) => void;
  exportContent: () => {};
  clearContent: () => void;
  createEmptyFile: () => void;
  undoManager: UndoManager;
  addUndoable: (undoable: Undoable) => void;

  weatherData: { [key: string]: WeatherModel };
  getWeather: (location: string) => WeatherModel;
  loadWeatherData: () => void;
  getClosestCity: (lat: number, lng: number) => string | null;

  pvModules: { [key: string]: PvModel };
  getPvModule: (name: string) => PvModel;
  loadPvModules: () => void;

  aabb: Box3; // axis-aligned bounding box of elements
  animateSun: boolean;
  clickObjectType: ObjectType | null;
  contextMenuObjectType: ObjectType | null;
  duringCameraInteraction: boolean;
  hoveredHandle: MoveHandleType | ResizeHandleType | RotateHandleType | null;
  moveHandleType: MoveHandleType | null;
  resizeHandleType: ResizeHandleType | null;
  rotateHandleType: RotateHandleType | null;
  resizeAnchor: Vector3;
  showCloudFilePanel: boolean;
  showAccountSettingsPanel: boolean;
  selectedElement: ElementModel | null;
  getSelectedElement: () => ElementModel | null;
  findNearestSibling: (id: string) => string | null;
  overlapWithSibling: (me: ElementModel, threshold?: number) => boolean;
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
  updateElementReferenceById: (id: string, referenceId: string) => void;
  updateElementLabelById: (id: string, label: string) => void;
  updateElementShowLabelById: (id: string, showLabel: boolean) => void;

  updateElementColorById: (id: string, color: string) => void;
  updateElementColorOnSurface: (
    type: ObjectType,
    parentId: string,
    normal: number[] | undefined,
    color: string,
  ) => void;
  updateElementColorAboveFoundation: (type: ObjectType, foundationId: string, color: string) => void;
  updateElementColorForAll: (type: ObjectType, color: string) => void;

  updateElementLineColorById: (id: string, color: string) => void;
  updateElementLineColorOnSurface: (
    type: ObjectType,
    parentId: string,
    normal: number[] | undefined,
    color: string,
  ) => void;
  updateElementLineColorAboveFoundation: (type: ObjectType, foundationId: string, color: string) => void;
  updateElementLineColorForAll: (type: ObjectType, color: string) => void;

  updateElementLineWidthById: (id: string, width: number) => void;
  updateElementLineWidthOnSurface: (
    type: ObjectType,
    parentId: string,
    normal: number[] | undefined,
    width: number,
  ) => void;
  updateElementLineWidthAboveFoundation: (type: ObjectType, foundationId: string, width: number) => void;
  updateElementLineWidthForAll: (type: ObjectType, width: number) => void;

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

  // for polygons
  polygonActionScope: Scope;
  setPolygonActionScope: (scope: Scope) => void;
  deletePolygonVertexByIndex: (id: string, index: number) => void;
  insertPolygonVertexBeforeIndex: (id: string, index: number) => void;
  insertPolygonVertexAfterIndex: (id: string, index: number) => void;
  updatePolygonSelectedIndexById: (id: string, index: number) => void;
  updatePolygonFilledById: (id: string, filled: boolean) => void;
  updatePolygonLineStyleById: (id: string, style: LineStyle) => void;
  updatePolygonVertexPositionById: (id: string, index: number, x: number, y: number) => void;
  updatePolygonVerticesById: (id: string, vertices: Point2[]) => void;
  updatePolygonTextureById: (id: string, texture: PolygonTexture) => void;
  updatePolygonTextureOnSurface: (parentId: string, normal: number[] | undefined, texture: PolygonTexture) => void;
  updatePolygonTextureAboveFoundation: (foundationId: string, texture: PolygonTexture) => void;
  updatePolygonTextureForAll: (texture: PolygonTexture) => void;

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
  elementsToPaste: ElementModel[]; // this is for undoing cut and pasting
  deletedElements: ElementModel[]; // this is for undoing deletion
  clearDeletedElements: () => void;
  copyElementById: (id: string) => void;
  removeElementById: (id: string, cut: boolean) => void; // set cut to false for deletion
  copyCutElements: () => ElementModel[];
  pasteElementsToPoint: () => ElementModel[];
  pasteElementsByKey: () => ElementModel[];
  countElementsByType: (type: ObjectType) => number;
  removeElementsByType: (type: ObjectType) => void;
  countElementsByReferenceId: (id: string) => number;
  removeElementsByReferenceId: (id: string, cache: boolean) => void;
  getChildren: (id: string) => ElementModel[];
  countAllChildElementsByType: (parentId: string, type: ObjectType) => number;
  countAllChildSolarPanels: (parentId: string) => number; // special case as a rack may have many solar panels
  countAllSolarPanels: () => number;
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

  isAddingElement: () => boolean;
  addedFoundationId: string | null;
  deletedFoundationId: string | null;

  addedCuboidId: string | null;
  deletedCuboidId: string | null;

  addedWallId: string | null;
  deletedWallId: string | null;
  updateWallMapOnFoundation: boolean;

  addedWindowId: string | null;
  deletedWindowAndParentId: string[] | null;

  simulationInProgress: boolean;
  updateDesignInfoFlag: boolean;
  locale: Locale;
  localFileName: string;
  createNewFileFlag: boolean;
  openLocalFileFlag: boolean;
  saveLocalFileFlag: boolean;
  saveLocalFileDialogVisible: boolean;
  enableFineGrid: boolean;
  setEnableFineGrid: (b: boolean) => void;

  showCloudFileTitleDialog: boolean;
  saveCloudFileFlag: boolean;
  listCloudFilesFlag: boolean;
  localContentToImportAfterCloudFileUpdate: any;

  solarPanelArrayLayoutParams: SolarPanelArrayLayoutParams;

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
          solarPanelArrayLayoutParams: new DefaultSolarPanelArrayLayoutParams(),
          notes: [],
          user: {} as User,
          language: 'en',
          cloudFile: undefined,
          changed: false,
          setChanged(b) {
            immerSet((state: CommonStoreState) => {
              state.changed = b;
            });
          },
          skipChange: true,
          setSkipChange(b) {
            immerSet((state: CommonStoreState) => {
              state.skipChange = b;
            });
          },
          fileChanged: false,

          applyCount: 0,
          setApplyCount(count) {
            immerSet((state: CommonStoreState) => {
              state.applyCount = count;
            });
          },
          // Not sure why we cannot do this within immerSet
          revertApply() {
            if (get().applyCount) {
              for (let i = 0; i < get().applyCount; i++) {
                get().undoManager.undo();
              }
              get().setApplyCount(0);
            }
          },

          importContent(content, title) {
            immerSet((state: CommonStoreState) => {
              state.world = content.world;
              state.viewState = content.view;
              state.elements = content.elements;
              state.notes = content.notes ?? [];
              state.cloudFile = title;
              state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
              state.changed = false;
              state.skipChange = true;
              state.localContentToImportAfterCloudFileUpdate = undefined;
              state.fileChanged = !state.fileChanged;
              // 1/6/2022: Humans previously did not have dimension data (which probably was a mistake).
              // We do this for backward compatibility. Otherwise, humans cannot be moved in old files.
              for (const e of state.elements) {
                if (e.type === ObjectType.Human) {
                  const human = e as HumanModel;
                  e.lx = HumanData.fetchWidth(human.name);
                  e.ly = e.lx;
                  e.lz = HumanData.fetchHeight(human.name);
                }
              }
            });
          },
          exportContent() {
            const state = get();
            return {
              docid: short.generate(),
              timestamp: new Date().getTime(),
              userid: state.user.uid,
              owner: state.user.signFile ? state.user.displayName : null,
              email: state.user.signFile ? state.user.email : null,
              world: JSON.parse(JSON.stringify(state.world)),
              elements: JSON.parse(JSON.stringify(state.elements)),
              view: JSON.parse(JSON.stringify(state.viewState)),
              notes: state.notes,
            };
          },
          clearContent() {
            immerSet((state: CommonStoreState) => {
              state.elements = [];
            });
          },
          createEmptyFile() {
            immerSet((state: CommonStoreState) => {
              DefaultViewState.resetViewState(state.viewState);
              state.world = new DefaultWorldModel();
              state.elements = [];
              state.cloudFile = undefined;
              state.changed = false;
              state.skipChange = true;
              state.localContentToImportAfterCloudFileUpdate = undefined;
              state.notes = [];
              state.fileChanged = !state.fileChanged;
            });
          },
          undoManager: new UndoManager(),
          addUndoable(undoable: Undoable) {
            immerSet((state: CommonStoreState) => {
              state.undoManager.add(undoable);
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

          aabb: new Box3(),
          animateSun: false,
          clickObjectType: null,
          contextMenuObjectType: null,
          duringCameraInteraction: false,
          hoveredHandle: null,
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

          // a sibling is defined as an element of the same type of the same parent
          findNearestSibling(id) {
            let foundId: string | null = null;
            immerSet((state: CommonStoreState) => {
              const me = state.getElementById(id);
              if (me) {
                let distanceSquare = Number.MAX_VALUE;
                for (const e of state.elements) {
                  if (e.type === me.type && e.parentId === me.parentId && e.id !== id) {
                    const dx = me.cx - e.cx;
                    const dy = me.cy - e.cy;
                    const dz = me.cz - e.cz;
                    const sq = dx * dx + dy * dy + dz * dz;
                    if (distanceSquare > sq) {
                      distanceSquare = sq;
                      foundId = e.id;
                    }
                  }
                }
              }
            });
            return foundId;
          },
          overlapWithSibling(me, threshold) {
            let overlap = false;
            immerSet((state: CommonStoreState) => {
              if (threshold === undefined) {
                // when threshold is not set, check overlap of bounding boxes
                const parent = state.getElementById(me.parentId);
                if (parent) {
                  for (const e of state.elements) {
                    if (e.type === me.type && e.parentId === me.parentId && e.id !== me.id) {
                      if (me.type === ObjectType.SolarPanel) {
                        if (Util.doSolarPanelsOverlap(me as SolarPanelModel, e as SolarPanelModel, parent)) {
                          overlap = true;
                          break;
                        }
                      } else {
                        if (
                          Math.abs(me.cx - e.cx) * parent.lx < 0.5 * (me.lx + e.lx) &&
                          Math.abs(me.cy - e.cy) * parent.ly < 0.5 * (me.ly + e.ly) &&
                          Math.abs(me.cz - e.cz) * parent.lz < 0.5 * (me.lz + e.lz)
                        ) {
                          overlap = true;
                          break;
                        }
                      }
                    }
                  }
                }
              } else {
                // when threshold is set, use the distance between centers to detect overlap using it
                const thresholdSquared = threshold * threshold;
                for (const e of state.elements) {
                  if (e.type === me.type && e.parentId === me.parentId && e.id !== me.id) {
                    const dx = me.cx - e.cx;
                    const dy = me.cy - e.cy;
                    const dz = me.cz - e.cz;
                    const sq = dx * dx + dy * dy + dz * dz;
                    if (sq < thresholdSquared) {
                      overlap = true;
                      break;
                    }
                  }
                }
              }
            });
            return overlap;
          },

          selectedSideIndex: -1,

          getResizeHandlePosition(e, handleType) {
            const { cx, cy, lx, ly, lz, rotation, type, parentId } = e;
            let p = new Vector3(cx, cy, 0);
            // FIXME: It seems the x, y components above are absolute, but the z component is relative.
            const v = new Vector2();
            switch (type) {
              case ObjectType.Cuboid:
                switch (handleType) {
                  case ResizeHandleType.LowerLeftTop:
                    v.set(-lx / 2, -ly / 2);
                    p.z = lz / 2;
                    break;
                  case ResizeHandleType.LowerRightTop:
                    v.set(lx / 2, -ly / 2);
                    p.z = lz / 2;
                    break;
                  case ResizeHandleType.UpperLeftTop:
                    v.set(-lx / 2, ly / 2);
                    p.z = lz / 2;
                    break;
                  case ResizeHandleType.UpperRightTop:
                    v.set(lx / 2, ly / 2);
                    p.z = lz / 2;
                    break;
                  case ResizeHandleType.LowerLeft:
                    v.set(-lx / 2, -ly / 2);
                    p.z = -lz / 2;
                    break;
                  case ResizeHandleType.LowerRight:
                    v.set(lx / 2, -ly / 2);
                    p.z = -lz / 2;
                    break;
                  case ResizeHandleType.UpperLeft:
                    v.set(-lx / 2, ly / 2);
                    p.z = -lz / 2;
                    break;
                  case ResizeHandleType.UpperRight:
                    v.set(lx / 2, ly / 2);
                    p.z = -lz / 2;
                    break;
                }
                v.rotateAround(ORIGIN_VECTOR2, rotation[2]);
                p.x += v.x;
                p.y += v.y;
                break;
              case ObjectType.Wall:
                const elements = get().elements;
                let parent: ElementModel | null = null;
                const wall = e as WallModel;
                for (const e of elements) {
                  if (e.id === parentId) {
                    parent = e;
                    break;
                  }
                }
                if (parent) {
                  const parentPosition = new Vector3(parent.cx, parent.cy, parent.cz);
                  switch (handleType) {
                    case ResizeHandleType.UpperLeft: {
                      const handleRelativePos = new Vector3(wall.leftPoint[0], wall.leftPoint[1], wall.leftPoint[2]);
                      p.addVectors(parentPosition, handleRelativePos);
                      break;
                    }
                    case ResizeHandleType.UpperRight: {
                      const handleRelativePos = new Vector3(wall.rightPoint[0], wall.rightPoint[1], wall.rightPoint[2]);
                      p.addVectors(parentPosition, handleRelativePos);
                      break;
                    }
                  }
                }
            }
            return p;
          },
          getElementById(id) {
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
            useStoreRef.getState().selectNone();
          },
          selectMe(id, e, action) {
            const setEnableOrbitController = useStoreRef.getState().setEnableOrbitController;
            if (e.intersections.length > 0) {
              if (e.intersections[0].object === e.eventObject) {
                immerSet((state) => {
                  for (const elem of state.elements) {
                    if (elem.id === id) {
                      elem.selected = true;
                      state.selectedElement = elem;
                      state.selectedElementHeight = elem.lz;
                    } else {
                      elem.selected = false;
                    }
                  }
                  state.moveHandleType = null;
                  state.resizeHandleType = null;
                  state.rotateHandleType = null;
                  if (action) {
                    switch (action) {
                      case ActionType.Move:
                        if (
                          state.selectedElement?.type === ObjectType.Tree ||
                          state.selectedElement?.type === ObjectType.Human
                        ) {
                          // selecting the above two types of object automatically sets them to the moving state
                          state.moveHandleType = MoveHandleType.Default;
                        } else {
                          state.moveHandleType = e.eventObject.name as MoveHandleType;
                        }
                        setEnableOrbitController(false);
                        break;
                      case ActionType.Resize:
                        state.resizeHandleType = e.eventObject.name as ResizeHandleType;
                        setEnableOrbitController(false);
                        break;
                      case ActionType.Rotate:
                        state.rotateHandleType = e.eventObject.name as RotateHandleType;
                        setEnableOrbitController(false);
                        break;
                      case ActionType.Select:
                        state.selectedElementAngle = e.object.parent?.rotation.z ?? 0;
                        setEnableOrbitController(true);
                        break;
                      default:
                        setEnableOrbitController(true);
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
          updateElementReferenceById(id, referenceId) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.referenceId = referenceId;
                  break;
                }
              }
            });
          },

          updateElementLabelById(id, label) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  e.label = label;
                  break;
                }
              }
            });
          },
          updateElementShowLabelById(id, showLabel) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
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
                if (e.id === id && !e.locked) {
                  e.color = color;
                  break;
                }
              }
            });
          },
          updateElementColorOnSurface(type, parentId, normal, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.parentId === parentId && Util.isIdentical(e.normal, normal) && !e.locked) {
                  e.color = color;
                }
              }
            });
          },
          updateElementColorAboveFoundation(type, foundationId, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId && !e.locked) {
                  e.color = color;
                }
              }
            });
          },
          updateElementColorForAll(type, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked) {
                  e.color = color;
                }
              }
            });
          },
          updateElementLineColorById(id, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  e.lineColor = color;
                  break;
                }
              }
            });
          },
          updateElementLineColorOnSurface(type, parentId, normal, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.parentId === parentId && Util.isIdentical(e.normal, normal) && !e.locked) {
                  e.lineColor = color;
                }
              }
            });
          },
          updateElementLineColorAboveFoundation(type, foundationId, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId && !e.locked) {
                  e.lineColor = color;
                }
              }
            });
          },
          updateElementLineColorForAll(type, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked) {
                  e.lineColor = color;
                }
              }
            });
          },

          updateElementLineWidthById(id, width) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.lineWidth = width;
                  break;
                }
              }
            });
          },
          updateElementLineWidthOnSurface(type, parentId, normal, width) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.parentId === parentId && Util.isIdentical(e.normal, normal) && !e.locked) {
                  e.lineWidth = width;
                }
              }
            });
          },
          updateElementLineWidthAboveFoundation(type, foundationId, width) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId && !e.locked) {
                  e.lineWidth = width;
                }
              }
            });
          },
          updateElementLineWidthForAll(type, width) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked) {
                  e.lineWidth = width;
                }
              }
            });
          },

          updateElementCxById(id, cx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  e.cx = cx;
                  break;
                }
              }
            });
          },
          updateElementCyById(id, cy) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  e.cy = cy;
                  break;
                }
              }
            });
          },
          updateElementCzById(id, cz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  e.cz = cz;
                  break;
                }
              }
            });
          },
          updateElementCzForAll(type, cz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked) {
                  e.cz = cz;
                }
              }
            });
          },

          // lx
          updateElementLxById(id, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  e.lx = lx;
                  break;
                }
              }
            });
          },
          updateElementLxAboveFoundation(type, foundationId, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId && !e.locked) {
                  e.lx = lx;
                }
              }
            });
          },
          updateElementLxOnSurface(type, parentId, normal, lx) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked) {
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
                if (e.type === type && !e.locked) {
                  e.lx = lx;
                }
              }
            });
          },

          // ly
          updateElementLyById(id, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  e.ly = ly;
                  break;
                }
              }
            });
          },
          updateElementLyAboveFoundation(type, foundationId, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId && !e.locked) {
                  e.ly = ly;
                }
              }
            });
          },
          updateElementLyOnSurface(type, parentId, normal, ly) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked) {
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
                if (e.type === type && !e.locked) {
                  e.ly = ly;
                }
              }
            });
          },

          // lz
          updateElementLzById(id, lz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  e.lz = lz;
                  break;
                }
              }
            });
          },
          updateElementLzAboveFoundation(type, foundationId, lz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId && !e.locked) {
                  e.lz = lz;
                }
              }
            });
          },
          updateElementLzOnSurface(type, parentId, normal, lz) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked) {
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
                if (e.type === type && !e.locked) {
                  e.lz = lz;
                }
              }
            });
          },

          updateElementRotationById(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  e.rotation[0] = x;
                  e.rotation[1] = y;
                  e.rotation[2] = z;
                } else if (e.parentId === id) {
                  e.rotation[0] = x;
                  e.rotation[1] = y;
                  e.rotation[2] = z;
                }
              }
              state.selectedElementAngle = z;
            });
          },
          updateElementRotationForAll(type, x, y, z) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  if (!e.locked) {
                    e.rotation[0] = x;
                    e.rotation[1] = y;
                    e.rotation[2] = z;
                  }
                } else {
                  const parent = state.getElementById(e.parentId);
                  if (parent && !parent.locked && parent.type === type) {
                    e.rotation[0] = x;
                    e.rotation[1] = y;
                    e.rotation[2] = z;
                  }
                }
              }
            });
          },

          // for foundations
          foundationActionScope: Scope.OnlyThisObject,
          setFoundationActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.foundationActionScope = scope;
            });
          },

          updateFoundationTextureById(id, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  (e as FoundationModel).textureType = texture;
                  break;
                }
              }
            });
          },
          updateFoundationTextureForAll(texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  (e as FoundationModel).textureType = texture;
                }
              }
            });
          },

          // for cuboids
          cuboidActionScope: Scope.OnlyThisSide,
          setCuboidActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.cuboidActionScope = scope;
            });
          },
          updateCuboidColorBySide(side, id, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Cuboid && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.Cuboid && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.Cuboid && !e.locked) {
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

          updateCuboidTextureBySide(side, id, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Cuboid && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.Cuboid && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.Cuboid && !e.locked) {
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

          // for polygons
          polygonActionScope: Scope.OnlyThisObject,
          setPolygonActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.polygonActionScope = scope;
            });
          },
          deletePolygonVertexByIndex(id, index) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.id === id) {
                  const p = e as PolygonModel;
                  p.vertices.splice(index, 1);
                  break;
                }
              }
            });
          },
          insertPolygonVertexBeforeIndex(id, index) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.id === id) {
                  const p = e as PolygonModel;
                  const n = p.vertices.length;
                  if (index > 0 && index < n) {
                    const newX = 0.5 * (p.vertices[index].x + p.vertices[index - 1].x);
                    const newY = 0.5 * (p.vertices[index].y + p.vertices[index - 1].y);
                    p.vertices.splice(index, 0, { x: newX, y: newY } as Point2);
                  } else if (index === 0) {
                    const newX = 0.5 * (p.vertices[index].x + p.vertices[n - 1].x);
                    const newY = 0.5 * (p.vertices[index].y + p.vertices[n - 1].y);
                    p.vertices.splice(n, 0, { x: newX, y: newY } as Point2);
                  }
                  break;
                }
              }
            });
          },
          insertPolygonVertexAfterIndex(id, index) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.id === id) {
                  const p = e as PolygonModel;
                  const n = p.vertices.length;
                  if (index >= 0 && index < n - 1) {
                    const newX = 0.5 * (p.vertices[index].x + p.vertices[index + 1].x);
                    const newY = 0.5 * (p.vertices[index].y + p.vertices[index + 1].y);
                    p.vertices.splice(index + 1, 0, { x: newX, y: newY } as Point2);
                  } else if (index === n - 1) {
                    const newX = 0.5 * (p.vertices[index].x + p.vertices[0].x);
                    const newY = 0.5 * (p.vertices[index].y + p.vertices[0].y);
                    p.vertices.splice(n, 0, { x: newX, y: newY } as Point2);
                  }
                  break;
                }
              }
            });
          },
          updatePolygonSelectedIndexById(id, index) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.id === id) {
                  (e as PolygonModel).selectedIndex = index;
                  break;
                }
              }
            });
          },
          updatePolygonFilledById(id, filled) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.id === id) {
                  (e as PolygonModel).filled = filled;
                  break;
                }
              }
            });
          },
          updatePolygonLineStyleById(id, style) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.id === id) {
                  (e as PolygonModel).lineStyle = style;
                  break;
                }
              }
            });
          },
          updatePolygonVertexPositionById(id, index, x, y) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.id === id) {
                  const p = e as PolygonModel;
                  if (index >= 0 && index < p.vertices.length) {
                    p.vertices[index].x = x;
                    p.vertices[index].y = y;
                  }
                  break;
                }
              }
            });
          },
          // must feed a deep copy of the vertices
          updatePolygonVerticesById(id, vertices) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.id === id) {
                  const p = e as PolygonModel;
                  p.vertices = vertices;
                  break;
                }
              }
            });
          },
          updatePolygonTextureById(id, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && e.type === ObjectType.Polygon && !e.locked) {
                  (e as PolygonModel).textureType = texture;
                  break;
                }
              }
            });
          },
          updatePolygonTextureOnSurface(parentId, normal, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (
                  e.type === ObjectType.Polygon &&
                  e.parentId === parentId &&
                  Util.isIdentical(e.normal, normal) &&
                  !e.locked
                ) {
                  (e as PolygonModel).textureType = texture;
                }
              }
            });
          },
          updatePolygonTextureAboveFoundation(foundationId, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.foundationId === foundationId && !e.locked) {
                  (e as PolygonModel).textureType = texture;
                }
              }
            });
          },
          updatePolygonTextureForAll(texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && !e.locked) {
                  (e as PolygonModel).textureType = texture;
                }
              }
            });
          },

          // for solar panels
          solarPanelActionScope: Scope.OnlyThisObject,
          setSolarPanelActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.solarPanelActionScope = scope;
            });
          },

          updateSolarPanelModelById(id, pvModelName) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
                  const sp = e as SolarPanelModel;
                  sp.tiltAngle = tiltAngle;
                }
              }
            });
          },
          updateSolarPanelTiltAngleOnSurface(parentId, normal, tiltAngle) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
                  const sp = e as SolarPanelModel;
                  sp.tiltAngle = tiltAngle;
                }
              }
            });
          },

          updateSolarPanelRelativeAzimuthById(id, relativeAzimuth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
                  const sp = e as SolarPanelModel;
                  sp.relativeAzimuth = relativeAzimuth;
                  state.selectedElementAngle = relativeAzimuth;
                  break;
                }
              }
            });
          },
          updateSolarPanelRelativeAzimuthAboveFoundation(foundationId, relativeAzimuth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
                  const sp = e as SolarPanelModel;
                  sp.relativeAzimuth = relativeAzimuth;
                }
              }
            });
          },
          updateSolarPanelRelativeAzimuthOnSurface(parentId, normal, relativeAzimuth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
                  const sp = e as SolarPanelModel;
                  sp.relativeAzimuth = relativeAzimuth;
                }
              }
            });
          },

          updateSolarPanelOrientationById(id, orientation) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
                  (e as SolarPanelModel).orientation = orientation;
                  break;
                }
              }
            });
          },
          updateSolarPanelOrientationAboveFoundation(foundationId, orientation) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
                  (e as SolarPanelModel).orientation = orientation;
                }
              }
            });
          },
          updateSolarPanelOrientationOnSurface(parentId, normal, orientation) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
                  (e as SolarPanelModel).orientation = orientation;
                }
              }
            });
          },

          updateSolarPanelTrackerTypeById(id, trackerType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
                  (e as SolarPanelModel).trackerType = trackerType;
                  break;
                }
              }
            });
          },
          updateSolarPanelTrackerTypeAboveFoundation(foundationId, trackerType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
                  (e as SolarPanelModel).trackerType = trackerType;
                }
              }
            });
          },
          updateSolarPanelTrackerTypeOnSurface(parentId, normal, trackerType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
                  (e as SolarPanelModel).trackerType = trackerType;
                }
              }
            });
          },

          updateSolarPanelPoleHeightById(id, poleHeight) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
                  const sp = e as SolarPanelModel;
                  sp.poleHeight = poleHeight;
                }
              }
            });
          },
          updateSolarPanelPoleHeightOnSurface(parentId, normal, poleHeight) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
                  const sp = e as SolarPanelModel;
                  sp.poleHeight = poleHeight;
                }
              }
            });
          },

          updateSolarPanelPoleSpacingById(id, poleSpacing) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
                  const sp = e as SolarPanelModel;
                  sp.poleSpacing = poleSpacing;
                }
              }
            });
          },
          updateSolarPanelPoleSpacingOnSurface(parentId, normal, poleSpacing) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
                if (e.type === ObjectType.SolarPanel && !e.locked) {
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
          setWallActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.wallActionScope = scope;
            });
          },

          updateWallRelativeAngleById(id, angle) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  (e as WallModel).relativeAngle = angle;
                  break;
                }
              }
            });
          },
          updateWallLeftJointsById(id, joints) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  (e as WallModel).leftJoints = joints;
                  break;
                }
              }
            });
          },
          updateWallRightJointsById(id, joints) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  (e as WallModel).rightJoints = joints;
                  break;
                }
              }
            });
          },
          updateWallLeftPointById(id, point) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  (e as WallModel).leftPoint = point;
                  break;
                }
              }
            });
          },
          updateWallRightPointById(id, point) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  (e as WallModel).rightPoint = point;
                  break;
                }
              }
            });
          },

          updateWallTextureById(id, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  (e as WallModel).textureType = texture;
                  break;
                }
              }
            });
          },
          updateWallTextureAboveFoundation(foundationId, texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.foundationId === foundationId && !e.locked) {
                  (e as WallModel).textureType = texture;
                }
              }
            });
          },
          updateWallTextureForAll(texture) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && !e.locked) {
                  (e as WallModel).textureType = texture;
                }
              }
            });
          },

          updateWallColorById(id, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  e.color = color;
                  break;
                }
              }
            });
          },
          updateWallColorAboveFoundation(foundationId, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.foundationId === foundationId && !e.locked) {
                  e.color = color;
                }
              }
            });
          },
          updateWallColorForAll(color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && !e.locked) {
                  e.color = color;
                }
              }
            });
          },

          updateWallHeightById(id, height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  e.lz = height;
                  break;
                }
              }
            });
          },
          updateWallHeightAboveFoundation(foundationId, height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.foundationId === foundationId && !e.locked) {
                  e.lz = height;
                }
              }
            });
          },
          updateWallHeightForAll(height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && !e.locked) {
                  e.lz = height;
                }
              }
            });
          },

          updateWallThicknessById(id, thickness) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  (e as WallModel).ly = thickness;
                  break;
                }
              }
            });
          },
          updateWallThicknessAboveFoundation(foundationId, thickness) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.foundationId === foundationId && !e.locked) {
                  (e as WallModel).ly = thickness;
                }
              }
            });
          },
          updateWallThicknessForAll(thickness) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && !e.locked) {
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
                  const human = e as HumanModel;
                  human.name = name;
                  human.lx = HumanData.fetchWidth(name);
                  human.lz = HumanData.fetchHeight(name);
                  break;
                }
              }
            });
          },

          setElementPosition(id, x, y, z?) {
            immerSet((state: CommonStoreState) => {
              for (const [i, e] of state.elements.entries()) {
                if (e.id === id) {
                  state.elements[i].cx = x;
                  state.elements[i].cy = y;
                  if (z !== undefined) {
                    state.elements[i].cz = z;
                  }
                  break;
                }
              }
            });
          },
          setElementNormal(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
              for (const [i, e] of state.elements.entries()) {
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
              for (const [i, e] of state.elements.entries()) {
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
          addElement(parent, p, normal) {
            let model: ElementModel | null = null;
            const parentId = 'id' in parent ? parent.id : GROUND_ID;
            immerSet((state: CommonStoreState) => {
              switch (state.objectTypeToAdd) {
                case ObjectType.Human: {
                  const position = new Vector3().copy(p);
                  if (parentId !== GROUND_ID) {
                    const parentModel = parent as ElementModel;
                    position
                      .sub(new Vector3(parentModel.cx, parentModel.cy, parentModel.cz))
                      .applyEuler(new Euler(0, 0, -parentModel.rotation[2]));
                  }
                  const human = ElementModelFactory.makeHuman(parentId, position.x, position.y, position.z);
                  model = human;
                  state.elements.push(human);
                  break;
                }
                case ObjectType.Tree: {
                  const position = new Vector3().copy(p);
                  if (parentId !== GROUND_ID) {
                    const parentModel = parent as ElementModel;
                    position
                      .sub(new Vector3(parentModel.cx, parentModel.cy, parentModel.cz))
                      .applyEuler(new Euler(0, 0, -parentModel.rotation[2]));
                  }
                  const tree = ElementModelFactory.makeTree(parentId, position.x, position.y, position.z);
                  model = tree;
                  state.elements.push(tree);
                  break;
                }
                case ObjectType.Polygon:
                  const polygonParentModel = parent as ElementModel;
                  const polygonRelativeCoordinates = Util.relativeCoordinates(p.x, p.y, p.z, polygonParentModel);
                  const polygon = ElementModelFactory.makePolygon(
                    polygonParentModel,
                    polygonRelativeCoordinates.x,
                    polygonRelativeCoordinates.y,
                    polygonRelativeCoordinates.z,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                  );
                  model = polygon;
                  state.elements.push(polygon);
                  break;
                case ObjectType.Sensor:
                  const sensorParentModel = parent as ElementModel;
                  const sensorRelativeCoordinates = Util.relativeCoordinates(p.x, p.y, p.z, sensorParentModel);
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
                  const solarPanelRelativeCoordinates = Util.relativeCoordinates(p.x, p.y, p.z, solarPanelParentModel);
                  const solarPanel = ElementModelFactory.makeSolarPanel(
                    solarPanelParentModel,
                    state.getPvModule('SPR-X21-335-BLK'),
                    solarPanelRelativeCoordinates.x,
                    solarPanelRelativeCoordinates.y,
                    solarPanelRelativeCoordinates.z,
                    Orientation.landscape,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                  );
                  model = solarPanel;
                  state.elements.push(solarPanel);
                  break;
                case ObjectType.Foundation:
                  const foundation = ElementModelFactory.makeFoundation(p.x, p.y);
                  model = foundation;
                  state.elements.push(foundation);
                  break;
                case ObjectType.Cuboid:
                  const cuboid = ElementModelFactory.makeCuboid(p.x, p.y);
                  model = cuboid;
                  state.elements.push(cuboid);
                  break;
                case ObjectType.Wall:
                  const wallParentModel = parent as ElementModel;
                  const relativePos = Util.wallRelativePosition(new Vector3(p.x, p.y), wallParentModel);
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
              state.updateDesignInfoFlag = !state.updateDesignInfoFlag;
            });
            return model;
          },

          elementsToPaste: [],
          deletedElements: [],
          clearDeletedElements() {
            immerSet((state: CommonStoreState) => {
              state.deletedElements = [];
            });
          },
          pastePoint: new Vector3(),
          pasteNormal: undefined,
          copyElementById(id) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  if (e.type === ObjectType.Polygon) {
                    // set cx and cy for polygon for pasting (otherwise, they may be unset)
                    const centroid = Util.calculatePolygonCentroid((e as PolygonModel).vertices);
                    e.cx = centroid.x;
                    e.cy = centroid.y;
                  }
                  state.elementsToPaste = [e];
                  break;
                }
              }
            });
          },
          removeElementById(id, cut) {
            immerSet((state: CommonStoreState) => {
              for (const elem of state.elements) {
                if (elem.id === id) {
                  // the first element must be the parent if there are children needed to be removed as well
                  if (cut) {
                    if (elem.type === ObjectType.Polygon) {
                      // set cx and cy for polygon for pasting (otherwise, they may be unset)
                      const centroid = Util.calculatePolygonCentroid((elem as PolygonModel).vertices);
                      elem.cx = centroid.x;
                      elem.cy = centroid.y;
                    }
                    state.elementsToPaste = [elem];
                  } else {
                    state.deletedElements = [elem];
                  }
                  elem.selected = false;
                  switch (elem.type) {
                    case ObjectType.Wall: {
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
                        const wall = w as WallModel;
                        if (w.id === leftWallId) {
                          wall.rightJoints = [];
                        } else if (w.id === rightWallId) {
                          wall.leftJoints = [];
                        }
                      }
                      state.deletedWallId = elem.id;
                      break;
                    }
                    case ObjectType.Window: {
                      state.deletedWindowAndParentId = [elem.id, elem.parentId];
                      break;
                    }
                    case ObjectType.Foundation: {
                      state.deletedFoundationId = elem.id;
                      break;
                    }
                    case ObjectType.Cuboid: {
                      state.deletedCuboidId = elem.id;
                      break;
                    }
                  }
                  break;
                }
              }
              if (cut) {
                for (const child of state.elements) {
                  if (child.parentId === id) {
                    state.elementsToPaste.push(child);
                    for (const grandchild of state.elements) {
                      if (grandchild.parentId === child.id) {
                        state.elementsToPaste.push(grandchild);
                      }
                    }
                  }
                }
              } else {
                for (const child of state.elements) {
                  if (child.parentId === id) {
                    state.deletedElements.push(child);
                    for (const grandchild of state.elements) {
                      if (grandchild.parentId === child.id) {
                        state.deletedElements.push(grandchild);
                      }
                    }
                  }
                }
              }
              state.elements = state.elements.filter((e) => {
                return !(e.id === id || e.parentId === id || e.foundationId === id);
              });
              state.selectedElement = null;
              state.updateDesignInfoFlag = !state.updateDesignInfoFlag;
            });
          },
          removeElementsByType(type) {
            immerSet((state: CommonStoreState) => {
              if (type === ObjectType.Foundation) {
                state.elements = state.elements.filter((x) => {
                  return x.type !== ObjectType.Foundation && !x.foundationId;
                });
              } else {
                state.elements = state.elements.filter((x) => x.type !== type);
              }
              state.updateDesignInfoFlag = !state.updateDesignInfoFlag;
            });
          },
          countElementsByType(type) {
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
          removeElementsByReferenceId(id, cache) {
            immerSet((state: CommonStoreState) => {
              if (cache) {
                state.deletedElements = [];
                for (const e of state.elements) {
                  if (e.referenceId === id) {
                    state.deletedElements.push(e);
                  }
                }
              }
              state.elements = state.elements.filter((e) => {
                return e.referenceId !== id;
              });
              state.updateDesignInfoFlag = !state.updateDesignInfoFlag;
            });
          },
          countElementsByReferenceId(id) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.referenceId === id) {
                  count++;
                }
              }
            });
            return count;
          },

          getChildren(id) {
            const children: ElementModel[] = [];
            for (const e of get().elements) {
              if (e.parentId === id) {
                children.push(e);
              }
            }
            return children;
          },
          removeAllChildElementsByType(parentId, type) {
            immerSet((state: CommonStoreState) => {
              state.elements = state.elements.filter((x) => x.type !== type || x.parentId !== parentId);
              if (type === ObjectType.Wall) {
                state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
              }
              state.updateDesignInfoFlag = !state.updateDesignInfoFlag;
            });
          },
          countAllChildElementsByType(parentId, type) {
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
          countAllChildSolarPanels(parentId) {
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
          countAllSolarPanels() {
            let count = 0;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  const sp = e as SolarPanelModel;
                  const pvModel = state.getPvModule(sp.pvModelName);
                  if (pvModel) {
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
              }
            });
            return count;
          },

          // must copy the elements because they may be pasted multiple times.
          // so we must treat them as newly added elements each time.
          // note that the case of deletion is treated differently because the deleted elements cannot be pasted.
          copyCutElements() {
            const copiedElements: ElementModel[] = [];
            immerSet((state: CommonStoreState) => {
              const map = new Map<ElementModel, ElementModel>();
              const wallMapOldToNew = new Map<string, string>();
              const wallMapNewToOld = new Map<string, string>();
              for (let i = 0; i < state.elementsToPaste.length; i++) {
                const oldElem = state.elementsToPaste[i];
                let e: ElementModel | null = null;
                if (i === 0) {
                  // the first element is the parent
                  e = ElementModelCloner.clone(
                    state.getElementById(oldElem.parentId),
                    oldElem,
                    oldElem.cx,
                    oldElem.cy,
                    oldElem.cz,
                  );
                } else {
                  let oldParent = null;
                  for (const c of state.elementsToPaste) {
                    if (oldElem.parentId === c.id) {
                      oldParent = c;
                      break;
                    }
                  }
                  if (oldParent) {
                    const newParent = map.get(oldParent);
                    if (newParent) {
                      e = ElementModelCloner.clone(
                        newParent,
                        oldElem,
                        oldElem.cx,
                        oldElem.cy,
                        oldElem.cz,
                        oldElem.type === ObjectType.Polygon,
                      );
                    }
                  }
                }
                if (e) {
                  map.set(oldElem, e);
                  wallMapOldToNew.set(oldElem.id, e.id);
                  wallMapNewToOld.set(e.id, oldElem.id);
                  copiedElements.push(e);
                }
              }
              for (const e of copiedElements) {
                // search new wall
                if (e.type === ObjectType.Wall) {
                  const oldWallId = wallMapNewToOld.get(e.id);
                  if (oldWallId) {
                    for (const o of state.elementsToPaste) {
                      if (o.id === oldWallId) {
                        const left = wallMapOldToNew.get((o as WallModel).leftJoints[0]);
                        if (left) {
                          (e as WallModel).leftJoints = [left];
                        }
                        const right = wallMapOldToNew.get((o as WallModel).rightJoints[0]);
                        if (right) {
                          (e as WallModel).rightJoints = [right];
                        }
                        break;
                      }
                    }
                  }
                }
              }
            });
            return copiedElements;
          },

          pasteElementsToPoint() {
            const pastedElements: ElementModel[] = [];
            immerSet((state: CommonStoreState) => {
              if (state.elementsToPaste.length === 1) {
                // only the parent element is included in elementsToPaste when copied,
                // so we have to copy its children and grandchildren from existing elements
                let m = state.pastePoint;
                const elem = state.elementsToPaste[0];
                let newParent = state.getSelectedElement();
                const oldParent = state.getElementById(elem.parentId);
                if (newParent) {
                  if (newParent.type === ObjectType.Polygon) {
                    // paste action of polygon is passed to its parent
                    const q = state.getElementById(newParent.parentId);
                    if (q) {
                      newParent = q;
                      elem.parentId = newParent.id;
                      if (Util.isPositionRelative(elem.type)) {
                        m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                      }
                    }
                  } else {
                    // if the old parent is ground, it has no type definition, but we use it to check its type
                    if (oldParent && oldParent.type) {
                      elem.parentId = newParent.id;
                      if (Util.isPositionRelative(elem.type)) {
                        m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                      }
                    }
                  }
                }
                const e = ElementModelCloner.clone(newParent, elem, m.x, m.y, m.z, false, state.pasteNormal);
                if (e) {
                  if (state.pasteNormal) {
                    e.normal = state.pasteNormal.toArray();
                  }
                  const lang = { lng: state.language };
                  let approved = false;
                  switch (e.type) {
                    case ObjectType.Foundation:
                    case ObjectType.Cuboid: {
                      const wallMapNewToOld = new Map<string, string>();
                      const wallMapOldToNew = new Map<string, string>();
                      for (const child of state.elements) {
                        if (child.parentId === elem.id) {
                          const newChild = ElementModelCloner.clone(
                            e,
                            child,
                            child.cx,
                            child.cy,
                            child.cz,
                            child.type === ObjectType.Polygon,
                          );
                          if (newChild) {
                            if (e.normal) {
                              newChild.normal = [...child.normal];
                            }
                            pastedElements.push(newChild);
                            if (newChild?.type === ObjectType.Wall || newChild?.type === ObjectType.Roof) {
                              wallMapNewToOld.set(newChild.id, child.id);
                              wallMapOldToNew.set(child.id, newChild.id);
                              for (const grandchild of state.elements) {
                                if (grandchild.parentId === child.id) {
                                  const newGrandChild = ElementModelCloner.clone(
                                    newChild,
                                    grandchild,
                                    grandchild.cx,
                                    grandchild.cy,
                                    grandchild.cz,
                                  );
                                  if (newGrandChild) {
                                    if (child.normal) {
                                      grandchild.normal = [...child.normal];
                                    }
                                    pastedElements.push(newGrandChild);
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                      state.elements.push(...pastedElements);
                      approved = true;
                      for (const e of state.elements) {
                        // search new wall
                        if (e.type === ObjectType.Wall) {
                          const oldWallId = wallMapNewToOld.get(e.id);
                          if (oldWallId) {
                            for (const o of state.elements) {
                              if (o.id === oldWallId) {
                                const left = wallMapOldToNew.get((o as WallModel).leftJoints[0]);
                                if (left) {
                                  (e as WallModel).leftJoints = [left];
                                }
                                const right = wallMapOldToNew.get((o as WallModel).rightJoints[0]);
                                if (right) {
                                  (e as WallModel).rightJoints = [right];
                                }
                                break;
                              }
                            }
                          }
                        }
                      }
                      break;
                    }
                    case ObjectType.SolarPanel: {
                      if (state.overlapWithSibling(e)) {
                        // overlap, do not approve
                        showError(i18n.t('message.CannotPasteBecauseOfOverlap', lang));
                      } else {
                        if (newParent) {
                          approved = Util.isSolarPanelWithinHorizontalSurface(e as SolarPanelModel, newParent);
                          if (!approved) {
                            showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                          }
                        } else {
                          approved = true;
                        }
                      }
                      break;
                    }
                    case ObjectType.Window: {
                      switch (Util.checkWindowState(e)) {
                        case WindowState.Valid:
                          approved = true;
                          break;
                        case WindowState.OverLap:
                          showError(i18n.t('message.CannotPasteBecauseOfOverlap', lang));
                          break;
                        case WindowState.OutsideBoundary:
                          showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                          break;
                      }
                      break;
                    }
                    default: {
                      approved = true;
                      if (e.type === ObjectType.Human || e.type === ObjectType.Tree) {
                        if (newParent) {
                          // paste on a parent
                          const parent = state.getElementById(e.parentId);
                          if (parent) {
                            const p = Util.relativePoint(state.pastePoint, parent);
                            e.cx = p.x;
                            e.cy = p.y;
                            e.cz = p.z;
                          }
                        } else {
                          // paste on the ground
                          e.parentId = GROUND_ID;
                        }
                      }
                    }
                  }
                  if (approved) {
                    state.elements.push(e);
                    pastedElements.push(e);
                  }
                }
              } else if (state.elementsToPaste.length > 1) {
                // when a parent with children is cut, the removed children are no longer in elements array,
                // so we have to restore them from elementsToPaste.
                const m = state.pastePoint;
                const cutElements = state.copyCutElements();
                if (cutElements.length > 0) {
                  cutElements[0].cx = m.x;
                  cutElements[0].cy = m.y;
                  cutElements[0].cz = m.z;
                  if (cutElements[0].type === ObjectType.Cuboid || cutElements[0].type === ObjectType.Foundation) {
                    cutElements[0].cz += cutElements[0].lz / 2;
                  }
                  state.elements.push(...cutElements);
                  pastedElements.push(...cutElements);
                }
              }
              state.updateDesignInfoFlag = !state.updateDesignInfoFlag;
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
                  let approved = false;
                  switch (e.type) {
                    case ObjectType.Window:
                      const hx = e.lx / 2;
                      e.cx += hx * 3;
                      // searching +x direction
                      while (e.cx + hx < 0.5) {
                        if (Util.checkWindowState(e) === WindowState.Valid) {
                          state.elements.push(e);
                          // state.elementsToPaste = [e];
                          approved = true;
                          break;
                        } else {
                          e.cx += hx;
                        }
                      }
                      // searching -x direction
                      if (!approved) {
                        e.cx = elem.cx - hx * 3;
                        while (e.cx - hx > -0.5) {
                          if (Util.checkWindowState(e) === WindowState.Valid) {
                            state.elements.push(e);
                            state.elementsToPaste = [e];
                            approved = true;
                            break;
                          } else {
                            e.cx -= hx;
                          }
                        }
                      }
                      if (!approved) {
                        const lang = { lng: state.language };
                        showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                      }
                      break;
                    case ObjectType.Human:
                      e.cx += 1;
                      state.elements.push(e);
                      state.elementsToPaste = [e];
                      approved = true;
                      break;
                    case ObjectType.Tree:
                      e.cx += e.lx;
                      state.elements.push(e);
                      state.elementsToPaste = [e];
                      approved = true;
                      break;
                    case ObjectType.SolarPanel:
                      if (e.parentId) {
                        const parent = state.getElementById(e.parentId);
                        if (parent) {
                          const nearestNeighborId = state.findNearestSibling(elem.id);
                          if (nearestNeighborId) {
                            const nearestNeighbor = state.getElementById(nearestNeighborId);
                            if (nearestNeighbor) {
                              const oldX = e.cx;
                              const oldY = e.cy;
                              const oldZ = e.cz;
                              const dx = nearestNeighbor.cx - elem.cx;
                              const dy = nearestNeighbor.cy - elem.cy;
                              const dz = nearestNeighbor.cz - elem.cz;
                              e.cx = nearestNeighbor.cx + dx;
                              e.cy = nearestNeighbor.cy + dy;
                              e.cz = nearestNeighbor.cz + dz;
                              if (state.overlapWithSibling(e, 0.001)) {
                                e.cx = oldX - dx;
                                e.cy = oldY - dy;
                                e.cz = oldZ - dz;
                              }
                            } else {
                              e.cx += e.lx / parent.lx;
                            }
                          } else {
                            // a loner
                            e.cx += e.lx / parent.lx;
                          }
                          const lang = { lng: state.language };
                          if (!state.overlapWithSibling(e, 0.01)) {
                            if (
                              parent.type === ObjectType.Foundation ||
                              (parent.type === ObjectType.Cuboid && Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY))
                            ) {
                              if (Util.isSolarPanelWithinHorizontalSurface(e as SolarPanelModel, parent)) {
                                state.elements.push(e);
                                state.elementsToPaste = [e];
                                approved = true;
                              } else {
                                showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                              }
                            } else {
                              // TODO: For other surfaces, handle out-of-bounds errors here
                              state.elements.push(e);
                              state.elementsToPaste = [e];
                              approved = true;
                            }
                          } else {
                            showError(i18n.t('message.CannotPasteBecauseOfOverlap', lang));
                          }
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
                          approved = true;
                        }
                      }
                      break;
                    case ObjectType.Polygon:
                      const polygon = e as PolygonModel;
                      for (const v of polygon.vertices) {
                        v.x += 0.1;
                      }
                      polygon.cx += 0.1;
                      state.elements.push(polygon);
                      state.elementsToPaste = [polygon];
                      approved = true;
                      break;
                    case ObjectType.Foundation:
                    case ObjectType.Cuboid:
                      e.cx += e.lx;
                      if (state.elementsToPaste.length === 1) {
                        // When copying from an existing container, elementsToPaste stores only the container.
                        // So we have to copy its children and grandchildren as well. This differs from the
                        // situation of cutting, in which case all the children and grandchildren must be
                        // stored in elementsToPaste.
                        const wallMapNewToOld = new Map<string, string>();
                        const wallMapOldToNew = new Map<string, string>();
                        for (const child of state.elements) {
                          if (child.parentId === elem.id) {
                            const newChild = ElementModelCloner.clone(
                              e,
                              child,
                              child.cx,
                              child.cy,
                              child.cz,
                              child.type === ObjectType.Polygon,
                            );
                            if (newChild) {
                              if (e.normal) {
                                newChild.normal = [...child.normal];
                              }
                              pastedElements.push(newChild);
                              if (newChild?.type === ObjectType.Wall || newChild?.type === ObjectType.Roof) {
                                wallMapNewToOld.set(newChild.id, child.id);
                                wallMapOldToNew.set(child.id, newChild.id);
                                for (const grandchild of state.elements) {
                                  if (grandchild.parentId === child.id) {
                                    const newGrandChild = ElementModelCloner.clone(
                                      newChild,
                                      grandchild,
                                      grandchild.cx,
                                      grandchild.cy,
                                      grandchild.cz,
                                    );
                                    if (newGrandChild) {
                                      if (child.normal) {
                                        grandchild.normal = [...child.normal];
                                      }
                                      pastedElements.push(newGrandChild);
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                        state.elements.push(...pastedElements);
                        state.elements.push(e);
                        state.elementsToPaste = [e];
                        for (const e of state.elements) {
                          // search new wall
                          if (e.type === ObjectType.Wall) {
                            const oldWallId = wallMapNewToOld.get(e.id);
                            if (oldWallId) {
                              for (const o of state.elements) {
                                if (o.id === oldWallId) {
                                  const left = wallMapOldToNew.get((o as WallModel).leftJoints[0]);
                                  if (left) {
                                    (e as WallModel).leftJoints = [left];
                                  }
                                  const right = wallMapOldToNew.get((o as WallModel).rightJoints[0]);
                                  if (right) {
                                    (e as WallModel).rightJoints = [right];
                                  }
                                  break;
                                }
                              }
                            }
                          }
                        }
                      } else if (state.elementsToPaste.length > 1) {
                        // when a parent with children is cut, the removed children are no longer in elements array,
                        // so we have to restore them from elementsToPaste.
                        const cutElements = state.copyCutElements();
                        if (cutElements.length > 0) {
                          cutElements[0].cx += cutElements[0].lx;
                          state.elements.push(...cutElements);
                          pastedElements.push(...cutElements);
                          state.elementsToPaste = cutElements;
                        }
                      }
                      approved = true;
                      break;
                  }
                  if (state.elementsToPaste.length === 1 && approved) pastedElements.push(e);
                }
              }
              state.updateDesignInfoFlag = !state.updateDesignInfoFlag;
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
          getWeather(location) {
            return get().weatherData[location];
          },
          getClosestCity(lat, lng) {
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
          setSunlightDirection(vector) {
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
          setSceneRadius(radius) {
            immerSet((state: CommonStoreState) => {
              state.sceneRadius = radius;
            });
          },

          selectedElementAngle: 0,
          selectedElementHeight: 0,

          isAddingElement() {
            if (get().addedCuboidId || get().addedFoundationId || get().addedWallId || get().addedWindowId) {
              return true;
            }
            return false;
          },

          addedFoundationId: null,
          deletedFoundationId: null,

          addedCuboidId: null,
          deletedCuboidId: null,

          addedWallId: null,
          deletedWallId: null,
          updateWallMapOnFoundation: false,

          addedWindowId: null,
          deletedWindowAndParentId: null,

          simulationInProgress: false,
          updateDesignInfoFlag: false,
          locale: enUS,
          localFileName: 'aladdin.ala',
          createNewFileFlag: false,
          openLocalFileFlag: false,
          saveLocalFileFlag: false,
          saveLocalFileDialogVisible: false,
          localFileDialogRequested: false,
          pvModelDialogVisible: false,
          showCloudFileTitleDialog: false,
          saveCloudFileFlag: false,
          listCloudFilesFlag: false,
          localContentToImportAfterCloudFileUpdate: undefined,

          enableFineGrid: false,
          setEnableFineGrid(b) {
            immerSet((state: CommonStoreState) => {
              state.enableFineGrid = b;
            });
          },
        };
      },
      {
        name: 'aladdin-storage',
        getStorage: () => {
          const params = new URLSearchParams(window.location.search);
          const viewOnly = params.get('viewonly') === 'true';
          return viewOnly ? sessionStorage : localStorage;
        },
        whitelist: [
          'language',
          'locale',
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
          'solarPanelArrayLayoutParams',
        ],
      },
    ),
  ),
);
