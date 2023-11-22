/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { create } from 'zustand';
import short from 'short-uuid';
import dayjs from 'dayjs';
import Papa from 'papaparse';
import i18n from '../i18n/i18n';
import enUS from 'antd/lib/locale/en_US';
import weather from '../resources/weather.csv';
import solar_radiation_horizontal from '../resources/solar_radiation_horizontal.csv';
import solar_radiation_vertical from '../resources/solar_radiation_vertical.csv';
import pvmodules from '../resources/pvmodules.csv';
import produce, { enableMapSet } from 'immer';
import {
  ActionInfo,
  ActionType,
  DataColoring,
  DatumEntry,
  Design,
  DesignProblem,
  ElementState,
  EvolutionMethod,
  ModelSite,
  ModelType,
  MoveHandleType,
  ObjectType,
  Orientation,
  ProjectInfo,
  Range,
  ResizeHandleType,
  RoofHandleType,
  RotateHandleType,
  Scope,
  SolarStructure,
  User,
} from '../types';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { WorldModel } from '../models/WorldModel';
import { ElementModel } from '../models/ElementModel';
import { WeatherModel } from '../models/WeatherModel';
import { Util } from '../Util';
import { DefaultWorldModel } from './DefaultWorldModel';
import { Box3, Euler, Raycaster, Vector2, Vector3 } from 'three';
import { ElementModelCloner } from '../models/ElementModelCloner';
import { DefaultViewState } from './DefaultViewState';
import { ViewState } from './ViewState';
import { ElementModelFactory } from '../models/ElementModelFactory';
import { GroundModel } from '../models/GroundModel';
import { PvModel } from '../models/PvModel';
import { ThreeEvent } from '@react-three/fiber';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { WallModel } from '../models/WallModel';
import { Locale } from 'antd/lib/locale-provider';
import { Undoable } from '../undo/Undoable';
import { UndoManager } from '../undo/UndoManager';
import { HumanModel } from '../models/HumanModel';
import { FoundationModel } from '../models/FoundationModel';
import {
  DEFAULT_ADDRESS,
  DEFAULT_MODEL_MAP_ZOOM,
  FLOATING_WINDOW_OPACITY,
  GROUND_ID,
  HALF_PI,
  ORIGIN_VECTOR2,
  UNIT_VECTOR_POS_Z_ARRAY,
  VERSION,
} from '../constants';
import { PolygonModel } from '../models/PolygonModel';
import { Point2 } from '../models/Point2';
import { useRefStore } from './commonRef';
import { showError } from '../helpers';
import { SolarPanelArrayLayoutParams } from './SolarPanelArrayLayoutParams';
import { DefaultSolarPanelArrayLayoutParams } from './DefaultSolarPanelArrayLayoutParams';
import { SolarCollector } from '../models/SolarCollector';
import { ConcentratedSolarPowerCollector } from '../models/ConcentratedSolarPowerCollector';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import { ElementCounter } from './ElementCounter';
import { ParabolicCollector } from '../models/ParabolicCollector';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { HeliostatModel } from '../models/HeliostatModel';
import { SolarRadiationData } from '../models/SolarRadiationData';
import { EvolutionaryAlgorithmState } from './EvolutionaryAlgorithmState';
import { DefaultEvolutionaryAlgorithmState } from './DefaultEvolutionaryAlgorithmState';
import { RoofModel, RoofStructure } from 'src/models/RoofModel';
import { SolarPanelArrayLayoutConstraints } from './SolarPanelArrayLayoutConstraints';
import { DefaultSolarPanelArrayLayoutConstraints } from './DefaultSolarPanelArrayLayoutConstraints';
import { EconomicsParams } from './EconomicsParams';
import { DefaultEconomicsParams } from './DefaultEconomicsParams';
import { RoofUtil } from 'src/views/roof/RoofUtil';
import { ActionState } from './ActionState';
import { DefaultActionState } from './DefaultActionState';
import { LightModel } from '../models/LightModel';
import { usePrimitiveStore } from './commonPrimitive';
import { useDataStore } from './commonData';
import { GraphState } from './GraphState';
import { DefaultGraphState } from './DefaultGraphState';
import { isStackableModel } from 'src/models/Stackable';
import { WindowModel } from 'src/models/WindowModel';
import { ProjectUtil } from '../panels/ProjectUtil';
import { StoreUtil } from './StoreUtil';
import { isGroupable } from 'src/models/Groupable';
import { loadCloudFile } from 'src/cloudFileUtil';

enableMapSet();

export interface CommonStoreState {
  set: (fn: (state: CommonStoreState) => void) => void;

  // only the following properties are persisted (see the whitelist at the end)
  version: string | undefined;
  world: WorldModel;
  elements: ElementModel[];
  viewState: ViewState;
  actionState: ActionState;
  graphState: GraphState;
  modelType: ModelType;
  modelAuthor: string | null;
  modelLabel: string | null;
  modelDescription: string | null;
  projectView: boolean;
  projectInfo: ProjectInfo;
  projectImages: Map<string, HTMLImageElement>;
  designProjectType: DesignProblem | null; // this belongs to a design of a project
  notes: string[];
  user: User;
  language: string;
  floatingWindowOpacity: number;
  selectedFloatingWindow: string | null;
  cloudFile: string | undefined;
  latestModelSite?: ModelSite;
  modelSites: Map<string, Map<string, ModelSite>>; // primary key: 'lat, lng', secondary key: 'title, userid'
  peopleModels: Map<string, Map<string, ModelSite>>; // primary key: author, secondary key: 'title, userid'
  modelsMapLatitude: number;
  modelsMapLongitude: number;
  modelsMapAddress: string;
  modelsMapZoom: number;
  modelsMapType: string;
  modelsMapTilt: number;

  minimumNavigationMoveSpeed: number;
  minimumNavigationTurnSpeed: number;

  ray: Raycaster;
  mouse: Vector2;

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
  horizontalSolarRadiationData: { [key: string]: SolarRadiationData };
  getHorizontalSolarRadiation: (location: string) => SolarRadiationData;
  loadHorizontalSolarRadiationData: () => void;
  verticalSolarRadiationData: { [key: string]: SolarRadiationData };
  getVerticalSolarRadiation: (location: string) => SolarRadiationData;
  loadVerticalSolarRadiationData: () => void;
  getClosestCity: (lat: number, lng: number) => string | null;

  pvModules: { [key: string]: PvModel };
  getPvModule: (name: string) => PvModel;
  loadPvModules: () => void;

  aabb: Box3; // axis-aligned bounding box of elements
  animate24Hours: boolean;
  evolutionMethod: EvolutionMethod;
  clickObjectType: ObjectType | null;
  contextMenuObjectType: ObjectType | null;
  hoveredHandle: MoveHandleType | ResizeHandleType | RotateHandleType | RoofHandleType | null;
  moveHandleType: MoveHandleType | null;
  resizeHandleType: ResizeHandleType | null;
  rotateHandleType: RotateHandleType | null;
  resizeAnchor: Vector3;
  selectedElement: ElementModel | null;
  getSelectedElement: () => ElementModel | null;
  findNearestSibling: (id: string) => string | null;
  overlapWithSibling: (me: ElementModel, threshold?: number) => boolean;
  selectedSideIndex: number;
  getResizeHandlePosition: (e: ElementModel, type: ResizeHandleType) => Vector3;
  getElementById: (id: string) => ElementModel | null;
  getParent: (child: ElementModel) => ElementModel | null;
  getFoundation: (elem: ElementModel) => FoundationModel | null;
  selectMe: (id: string, e: ThreeEvent<MouseEvent>, action?: ActionType, select?: boolean) => void;
  selectNone: () => void;
  setElementPosition: (id: string, x: number, y: number, z?: number) => void;
  setElementNormal: (id: string, x: number, y: number, z: number) => void;
  setElementSize: (id: string, lx: number, ly: number, lz?: number) => void;

  selectedElementIdSet: Set<string>;
  multiSelectionsMode: boolean;

  // for all types of elements
  updateAllElementLocks: (locked: boolean) => void;
  updateElementLockByFoundationId: (foundationId: string, locked: boolean) => void;
  updateElementLockByParentId: (parentId: string, type: ObjectType, locked: boolean) => void;
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

  // for all types of solar collectors
  updateSolarCollectorDrawSunBeamById: (id: string, draw: boolean) => void;
  updateSolarCollectorDrawSunBeamAboveFoundation: (type: ObjectType, foundationId: string, draw: boolean) => void;
  updateSolarCollectorDrawSunBeamForAll: (type: ObjectType, draw: boolean) => void;
  updateSolarCollectorRelativeAzimuthById: (id: string, relativeAzimuth: number) => void;
  updateSolarCollectorRelativeAzimuthOnSurface: (
    type: ObjectType,
    parentId: string,
    normal: number[] | undefined,
    relativeAzimuth: number,
  ) => void;
  updateSolarCollectorRelativeAzimuthAboveFoundation: (
    type: ObjectType,
    foundationId: string,
    relativeAzimuth: number,
  ) => void;
  updateSolarCollectorRelativeAzimuthForAll: (type: ObjectType, relativeAzimuth: number) => void;
  updateSolarCollectorPoleHeightById: (id: string, poleHeight: number) => void;
  updateSolarCollectorPoleHeightOnSurface: (
    type: ObjectType,
    parentId: string,
    normal: number[] | undefined,
    poleHeight: number,
  ) => void;
  updateSolarCollectorPoleHeightAboveFoundation: (type: ObjectType, foundationId: string, poleHeight: number) => void;
  updateSolarCollectorPoleHeightForAll: (type: ObjectType, poleHeight: number) => void;

  updateSolarCollectorPoleRadiusById: (id: string, poleRadius: number) => void;
  updateSolarCollectorPoleRadiusOnSurface: (
    type: ObjectType,
    parentId: string,
    normal: number[] | undefined,
    poleRadius: number,
  ) => void;
  updateSolarCollectorPoleRadiusAboveFoundation: (type: ObjectType, foundationId: string, poleRadius: number) => void;
  updateSolarCollectorPoleRadiusForAll: (type: ObjectType, poleRadius: number) => void;

  clearAllSolarCollectorYields: () => void;
  updateSolarCollectorDailyYieldById: (id: string, dailyYield: number) => void;
  updateSolarCollectorYearlyYieldById: (id: string, yearlyYield: number) => void;

  // for all types of concentrated solar power collectors
  updateCspReflectanceById: (id: string, reflectance: number) => void;
  updateCspReflectanceAboveFoundation: (type: ObjectType, foundationId: string, reflectance: number) => void;
  updateCspReflectanceForAll: (type: ObjectType, reflectance: number) => void;

  // for all types of parabolic solar collectors (that are standalone units)
  updateParabolicCollectorAbsorptanceById: (id: string, absorptance: number) => void;
  updateParabolicCollectorAbsorptanceAboveFoundation: (
    type: ObjectType,
    foundationId: string,
    absorptance: number,
  ) => void;
  updateParabolicCollectorAbsorptanceForAll: (type: ObjectType, absorptance: number) => void;
  updateParabolicCollectorOpticalEfficiencyById: (id: string, opticalEfficiency: number) => void;
  updateParabolicCollectorOpticalEfficiencyAboveFoundation: (
    type: ObjectType,
    foundationId: string,
    opticalEfficiency: number,
  ) => void;
  updateParabolicCollectorOpticalEfficiencyForAll: (type: ObjectType, opticalEfficiency: number) => void;
  updateParabolicCollectorThermalEfficiencyById: (id: string, thermalEfficiency: number) => void;
  updateParabolicCollectorThermalEfficiencyAboveFoundation: (
    type: ObjectType,
    foundationId: string,
    thermalEfficiency: number,
  ) => void;
  updateParabolicCollectorThermalEfficiencyForAll: (type: ObjectType, thermalEfficiency: number) => void;

  // for foundations
  foundationActionScope: Scope;
  setFoundationActionScope: (scope: Scope) => void;

  // for cuboids
  cuboidActionScope: Scope;
  setCuboidActionScope: (scope: Scope) => void;

  // for polygons
  polygonActionScope: Scope;
  setPolygonActionScope: (scope: Scope) => void;
  updatePolygonVertexPositionById: (id: string, index: number, x: number, y: number) => void;
  updatePolygonVerticesById: (id: string, vertices: Point2[]) => void;

  // for solar panels
  solarPanelActionScope: Scope;
  setSolarPanelActionScope: (scope: Scope) => void;
  updateSolarPanelTiltAngleById: (id: string, tiltAngle: number) => void;
  setSolarPanelOrientation: (sp: SolarPanelModel, pvModel: PvModel, orientation: Orientation) => void;

  // for parabolic troughs
  parabolicTroughActionScope: Scope;
  setParabolicTroughActionScope: (scope: Scope) => void;

  // for Fresnel reflectors
  fresnelReflectorActionScope: Scope;
  setFresnelReflectorActionScope: (scope: Scope) => void;

  // for heliostats
  heliostatActionScope: Scope;
  setHeliostatActionScope: (scope: Scope) => void;

  // for Fresnel reflectors and heliostats
  updateSolarReceiverById: (id: string, receiverId: string) => void;
  updateSolarReceiverAboveFoundation: (type: ObjectType, foundationId: string, receiverId: string) => void;
  updateSolarReceiverForAll: (type: ObjectType, receiverId: string) => void;

  // for parabolic dishes
  parabolicDishActionScope: Scope;
  setParabolicDishActionScope: (scope: Scope) => void;

  // for parabolic troughs and Fresnel reflectors
  updateModuleLengthById: (id: string, moduleLength: number) => void;
  updateModuleLengthAboveFoundation: (type: ObjectType, foundationId: string, moduleLength: number) => void;
  updateModuleLengthForAll: (type: ObjectType, moduleLength: number) => void;

  // for parabolic troughs and dishes
  updateParabolaLatusRectumById: (id: string, latusRectum: number) => void;
  updateParabolaLatusRectumAboveFoundation: (type: ObjectType, foundationId: string, latusRectum: number) => void;
  updateParabolaLatusRectumForAll: (type: ObjectType, latusRectum: number) => void;

  // for wind turbines
  windTurbineActionScope: Scope;
  setWindTurbineActionScope: (scope: Scope) => void;

  // for walls
  wallActionScope: Scope;
  setWallActionScope: (scope: Scope) => void;

  // for roofs
  roofActionScope: Scope;
  setRoofActionScope: (scope: Scope) => void;

  // for windows
  windowActionScope: Scope;
  setWindowActionScope: (scope: Scope) => void;

  // for doors
  doorActionScope: Scope;
  setDoorActionScope: (scope: Scope) => void;

  updateWallRelativeAngleById: (id: string, angle: number) => void;
  updateWallLeftJointsById: (id: string, joints: string[]) => void;
  updateWallRightJointsById: (id: string, joints: string[]) => void;
  updateWallLeftPointById: (id: string, point: number[]) => void;
  updateWallRightPointById: (id: string, point: number[]) => void;

  // for roofs
  updateRoofRiseById: (id: string, rise: number, topZ?: number) => void;
  updateRoofStructureById: (id: string, structure: RoofStructure) => void;

  // for lights
  updateInsideLightById: (id: string, inside: boolean) => void;
  updateInsideLightsByParentId: (parentId: string, inside: boolean) => void;

  actionModeLock: boolean;
  objectTypeToAdd: ObjectType;
  addElement: (parent: ElementModel | GroundModel, position: Vector3, normal?: Vector3) => ElementModel | null;

  pastePoint: Vector3;
  pasteNormal: Vector3 | undefined;
  elementsToPaste: ElementModel[]; // this is for undoing cut and pasting
  deletedElements: ElementModel[]; // this is for undoing deletion
  clearDeletedElements: () => void;
  copyElementById: (id: string) => void;
  removeSelectedElements: () => ElementModel[];
  removeElementById: (id: string, cut: boolean, selectNone?: boolean, auto?: boolean) => ElementModel[]; // set cut to false for deletion
  copyCutElements: () => ElementModel[];
  pasteElementsToPoint: () => ElementModel[];
  pasteElementsByKey: () => ElementModel[];
  countElementsByType: (type: ObjectType, excludeLocked?: boolean) => number;
  countSolarStructuresByType: (type: SolarStructure, excludeLocked?: boolean) => number;
  countObservers: () => number;
  removeElementsByType: (type: ObjectType) => void;
  countElementsByReferenceId: (id: string) => number;
  removeElementsByReferenceId: (id: string, cache: boolean) => void;
  getChildren: (id: string) => ElementModel[];
  getChildrenOfType: (type: ObjectType, id: string) => ElementModel[];
  // the following goes faster than counting individual types of children through multiple loops
  countAllElements: (excludeLocked?: boolean) => number;
  countAllElementsByType: (excludeLocked?: boolean) => ElementCounter;
  countAllOffspringsByTypeAtOnce: (ancestorId: string, includingLocked: boolean) => ElementCounter;
  countSolarPanelsOnRack: (id: string) => number;
  removeAllChildElementsByType: (parentId: string, type: ObjectType) => void;
  removeAllElementsOnFoundationByType: (foundationId: string, type: ObjectType) => void;

  // genetic algorithms and particle swarm optimization
  fittestIndividualResults: DatumEntry[];
  setFittestIndividualResults: (data: DatumEntry[]) => void;
  variableLabels: (string | undefined)[];
  setVariableLabels: (labels: (string | undefined)[]) => void;

  sunlightDirection: Vector3;
  setSunlightDirection: (vector: Vector3) => void;

  cameraDirection: Vector3;
  getCameraDirection: () => Vector3;

  updateSceneRadiusFlag: boolean;
  updateSceneRadius: () => void;
  sceneRadius: number;
  setSceneRadius: (radius: number) => void;

  selectedElementAngle: number;
  selectedElementHeight: number;
  selectedElementX: number;
  selectedElementY: number;

  isAddingElement: () => boolean;
  addedFoundationId: string | null;
  deletedFoundationId: string | null;

  addedCuboidId: string | null;
  deletedCuboidId: string | null;

  addedWallId: string | null;
  deletedWallId: string | null;
  updateWallMapOnFoundationFlag: boolean;
  updateWallMapOnFoundation: () => void;

  updateElementOnRoofFlag: boolean;
  setUpdateElementOnRoofFlag: (b: boolean) => void;
  updateElementOnRoofFn: () => void;

  addedWindowId: string | null;

  addedDoorId: string | null;

  deletedRoofId: string | null;
  deletedRoofIdSet: Set<string>;
  addedRoofIdSet: Set<string>; // new roof or undo multiple deleted roof, to notify roof to update walls.
  deleteAddedRoofId: (id: string) => void;

  autoDeletedRoofs: RoofModel[] | null;
  autoDeletedRoofIdSet: Set<string>;
  autoDeletedChild: ElementModel[] | null; // [] means checked but no element, null means haven't check yet.
  getAutoDeletedElements: () => ElementModel[] | null;

  groupActionMode: boolean;
  setGroupActionMode: (b: boolean) => void;
  groupActionUpdateFlag: boolean;

  locale: Locale;
  localFileName: string;
  createNewFileFlag: boolean;
  setCreateNewFileFlag: (b: boolean) => void;
  openLocalFileFlag: boolean;
  setOpenLocalFileFlag: (b: boolean) => void;
  enableFineGrid: boolean;
  setEnableFineGrid: (b: boolean) => void;

  loggable: boolean;
  actionInfo: ActionInfo | undefined;
  currentUndoable: Undoable | undefined;
  showCloudFileTitleDialog: boolean;
  // we have to use the sure flip of an additional flag to ensure it triggers useEffect hook
  showCloudFileTitleDialogFlag: boolean;
  localContentToImportAfterCloudFileUpdate: any;

  solarPanelArrayLayoutParams: SolarPanelArrayLayoutParams;
  solarPanelArrayLayoutConstraints: SolarPanelArrayLayoutConstraints;
  evolutionaryAlgorithmState: EvolutionaryAlgorithmState;
  economicsParams: EconomicsParams;

  geneticAlgorithmWizardSelectedTab: string;
  particleSwarmOptimizationWizardSelectedTab: string;

  // the following is to fix the bug that when ctrl+o is pressed, the file dialog gets fired up multiple times
  localFileDialogRequested: boolean;

  tempHumanPlant: ElementModel[];
}

export const useStore = create<CommonStoreState>()(
  devtools(
    persist(
      (set, get) => {
        const isOpenFromURL = Util.isOpenFromURL();
        const defaultWorldModel = new DefaultWorldModel();
        const defaultElements = isOpenFromURL ? [] : defaultWorldModel.getElements();

        const immerSet: CommonStoreState['set'] = (fn) => set(produce(fn));

        return {
          set: (fn) => {
            try {
              immerSet(fn);
            } catch (e) {
              console.log(e);
            }
          },
          version: VERSION,
          world: defaultWorldModel,
          elements: defaultElements,
          user: {} as User,
          viewState: new DefaultViewState(),
          actionState: new DefaultActionState(),
          graphState: new DefaultGraphState(),
          solarPanelArrayLayoutParams: new DefaultSolarPanelArrayLayoutParams(),
          solarPanelArrayLayoutConstraints: new DefaultSolarPanelArrayLayoutConstraints(),
          evolutionaryAlgorithmState: new DefaultEvolutionaryAlgorithmState(),
          economicsParams: new DefaultEconomicsParams(),
          geneticAlgorithmWizardSelectedTab: '1',
          particleSwarmOptimizationWizardSelectedTab: '1',
          modelType: ModelType.UNKNOWN,
          modelAuthor: null,
          modelLabel: null,
          modelDescription: null,
          projectView: false,
          projectInfo: {
            owner: null,
            title: null,
            description: null,
            type: DesignProblem.SOLAR_PANEL_ARRAY,
            designs: new Array<Design>(),
            ranges: new Array<Range>(),
            hiddenParameters: ProjectUtil.getDefaultHiddenParameters(DesignProblem.SOLAR_PANEL_ARRAY),
            counter: 0,
            dataColoring: DataColoring.ALL,
            selectedProperty: null,
            sortDescending: false,
            xAxisNameScatteredPlot: null,
            yAxisNameScatteredPlot: null,
            dotSizeScatteredPlot: 5,
            thumbnailWidth: 200,
          } as ProjectInfo,
          projectImages: new Map<string, HTMLImageElement>(),
          designProjectType: null,
          notes: [],
          language: 'en',
          floatingWindowOpacity: FLOATING_WINDOW_OPACITY,
          selectedFloatingWindow: null,
          cloudFile: undefined,
          latestModelSite: undefined,
          modelSites: new Map<string, Map<string, ModelSite>>(),
          peopleModels: new Map<string, Map<string, ModelSite>>(),
          modelsMapLatitude: 42.2844063,
          modelsMapLongitude: -71.3488548,
          modelsMapAddress: DEFAULT_ADDRESS,
          modelsMapZoom: DEFAULT_MODEL_MAP_ZOOM,
          modelsMapType: 'roadmap',
          modelsMapTilt: 0,

          minimumNavigationMoveSpeed: 3,
          minimumNavigationTurnSpeed: 3,

          tempHumanPlant: [],

          ray: new Raycaster(),
          mouse: new Vector2(),

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
              state.version = content.version;
              state.world = content.world;
              state.viewState = content.view;
              state.graphState = content.graphState ?? new DefaultGraphState();
              state.elements = content.elements;
              state.notes = content.notes ?? [];
              state.animate24Hours = !!content.animate24Hours;
              state.modelType = content.modelType ?? ModelType.UNKNOWN;
              state.modelAuthor = content.modelAuthor ?? null;
              state.modelLabel = content.modelLabel ?? null;
              state.modelDescription = content.modelDescription ?? null;
              state.designProjectType = content.designProjectType ?? null;
              state.cloudFile = title;
              state.currentUndoable = undefined;
              state.actionInfo = undefined;
              state.sceneRadius = content.sceneRadius ?? 100;
              state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
              state.localContentToImportAfterCloudFileUpdate = undefined;
              state.fileChanged = !state.fileChanged;
              state.evolutionMethod = content.evolutionMethod ?? EvolutionMethod.GENETIC_ALGORITHM;
              state.solarPanelArrayLayoutParams =
                content.solarPanelArrayLayoutParams ?? new DefaultSolarPanelArrayLayoutParams();
              state.solarPanelArrayLayoutConstraints =
                content.solarPanelArrayLayoutConstraints ?? new DefaultSolarPanelArrayLayoutConstraints();
              state.evolutionaryAlgorithmState =
                content.evolutionaryAlgorithmState ?? new DefaultEvolutionaryAlgorithmState();
              state.economicsParams = content.economicsParams ?? new DefaultEconomicsParams();
              state.minimumNavigationMoveSpeed = content.minimumNavigationMoveSpeed ?? 3;
              state.minimumNavigationTurnSpeed = content.minimumNavigationTurnSpeed ?? 3;
              // clear existing data, if any
              state.fittestIndividualResults.length = 0;
              state.undoManager.clear();
              state.deletedRoofId = null;
              state.autoDeletedRoofs = null;
              state.autoDeletedRoofIdSet.clear();
              state.autoDeletedChild = null;
              state.deletedRoofIdSet.clear();
              state.addedRoofIdSet.clear();
              state.actionState = new DefaultActionState();
              state.multiSelectionsMode = false;
              state.selectedElementIdSet.clear();
              state.groupActionMode = false;
              state.selectedFloatingWindow = null;
            });
            StoreUtil.updateOldFileData();
            usePrimitiveStore.getState().set((state) => {
              state.changed = false;
              state.skipChange = true;
              state.animateSun = false;
              state.showSolarRadiationHeatmap = false;
              state.showHeatFluxes = false;
              state.simulationInProgress = false;
              state.simulationPaused = false;
              state.clearDailySimulationResultsFlag = !state.clearDailySimulationResultsFlag;
              state.clearYearlySimulationResultsFlag = !state.clearYearlySimulationResultsFlag;
              state.navigationMoveSpeed = content.minimumNavigationMoveSpeed ?? 3;
              state.navigationTurnSpeed = content.minimumNavigationTurnSpeed ?? 3;
            });
            useDataStore.getState().clearDataStore();
            useDataStore.getState().clearRoofVerticesMap();
          },
          exportContent() {
            const state = get();
            const date = new Date();
            const elements = JSON.parse(JSON.stringify(state.elements));
            Util.fixElements(elements);
            return {
              docid: short.generate(),
              time: dayjs(date).format('MM/DD/YYYY hh:mm A'),
              timestamp: date.getTime(),
              userid: state.user.uid,
              owner: state.user.signFile ? state.user.displayName : null,
              email: state.user.signFile ? state.user.email : null,
              version: VERSION,
              world: JSON.parse(JSON.stringify(state.world)),
              elements: elements,
              sceneRadius: state.sceneRadius,
              view: JSON.parse(JSON.stringify(state.viewState)),
              animate24Hours: state.animate24Hours,
              graphState: JSON.parse(JSON.stringify(state.graphState)),
              evolutionMethod: state.evolutionMethod,
              solarPanelArrayLayoutParams: JSON.parse(JSON.stringify(state.solarPanelArrayLayoutParams)),
              solarPanelArrayLayoutConstraints: JSON.parse(JSON.stringify(state.solarPanelArrayLayoutConstraints)),
              evolutionaryAlgorithmState: JSON.parse(JSON.stringify(state.evolutionaryAlgorithmState)),
              economicsParams: JSON.parse(JSON.stringify(state.economicsParams)),
              modelType: state.modelType,
              modelAuthor: state.modelAuthor,
              modelLabel: state.modelLabel,
              modelDescription: state.modelDescription,
              designProjectType: state.designProjectType,
              notes: state.notes,
              minimumNavigationMoveSpeed: state.minimumNavigationMoveSpeed,
              minimumNavigationTurnSpeed: state.minimumNavigationTurnSpeed,
            };
          },
          clearContent() {
            immerSet((state: CommonStoreState) => {
              state.elements = [];
              state.sceneRadius = 100;
            });
            useDataStore.getState().clearDataStore();
            useDataStore.getState().clearRoofVerticesMap();
          },
          createEmptyFile() {
            immerSet((state: CommonStoreState) => {
              DefaultWorldModel.resetWorldModel(state.world);
              DefaultViewState.resetViewState(state.viewState);
              // don't create a new instance like this (otherwise some UI elements may not update):
              // state.world = new DefaultWorldModel()
              state.version = VERSION;
              state.elements = [];
              state.sceneRadius = 100;
              state.cloudFile = undefined;
              state.localContentToImportAfterCloudFileUpdate = undefined;
              state.notes = [];
              state.fileChanged = !state.fileChanged;
              state.currentUndoable = undefined;
              state.actionInfo = undefined;
              state.undoManager.clear();
              state.modelType = ModelType.UNKNOWN;
              state.modelLabel = null;
              state.modelDescription = null;
              state.designProjectType = null;
              state.minimumNavigationMoveSpeed = 3;
              state.minimumNavigationTurnSpeed = 3;
              state.multiSelectionsMode = false;
              state.selectedElementIdSet.clear();
              state.groupActionMode = false;
              state.selectedFloatingWindow = null;
              state.deletedRoofId = null;
              state.autoDeletedRoofs = null;
              state.autoDeletedRoofIdSet.clear();
              state.autoDeletedChild = null;
              state.deletedRoofIdSet.clear();
              state.addedRoofIdSet.clear();
            });
            usePrimitiveStore.getState().set((state) => {
              state.changed = false;
              state.skipChange = true;
              state.animateSun = false;
              state.showSolarRadiationHeatmap = false;
              state.showHeatFluxes = false;
            });
            useDataStore.getState().clearDataStore();
            useDataStore.getState().clearRoofVerticesMap();
          },
          undoManager: new UndoManager(),
          addUndoable(undoable: Undoable) {
            immerSet((state: CommonStoreState) => {
              if (state.loggable) {
                state.currentUndoable = undoable;
              }
              state.undoManager.add(undoable);
            });
          },

          // genetic algorithms
          fittestIndividualResults: [],
          setFittestIndividualResults(data) {
            immerSet((state: CommonStoreState) => {
              state.fittestIndividualResults = [...data];
            });
          },
          variableLabels: [],
          setVariableLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.variableLabels = [...labels];
            });
          },

          // aabb must be initialized with defined vectors, or it may cause problems as it may be used to
          // determine the scopes of the axes.
          aabb: new Box3(new Vector3(-10, -10, -10), new Vector3(10, 10, 10)),
          animate24Hours: false,
          evolutionMethod: EvolutionMethod.GENETIC_ALGORITHM,
          clickObjectType: null,
          contextMenuObjectType: null,
          hoveredHandle: null,
          moveHandleType: null,
          resizeHandleType: null,
          rotateHandleType: null,
          resizeAnchor: new Vector3(),

          selectedElement: null,
          getSelectedElement() {
            if (get().selectedElementIdSet.size === 0) return null;
            const selectedElement = get().selectedElement;
            if (!selectedElement) return null;
            return get().elements.find((e) => e.id === selectedElement.id) ?? null;
          },

          selectedElementIdSet: new Set(),
          multiSelectionsMode: false,

          // a sibling is defined as an element of the same type of the same parent
          findNearestSibling(id) {
            let foundId: string | null = null;
            const me = get().getElementById(id);
            if (me) {
              let distanceSquare = Number.MAX_VALUE;
              for (const e of get().elements) {
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
            return foundId;
          },
          overlapWithSibling(me, threshold) {
            let overlap = false;
            if (threshold === undefined) {
              // when threshold is not set, check overlap of bounding boxes
              const parent = get().getParent(me);
              if (parent) {
                for (const e of get().elements) {
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
              const parent = get().getParent(me);
              for (const e of get().elements) {
                if (e.type === me.type && e.parentId === me.parentId && e.id !== me.id) {
                  const dx = (me.cx - e.cx) * (parent ? parent.lx : 1);
                  const dy = (me.cy - e.cy) * (parent ? parent.ly : 1);
                  const dz = (me.cz - e.cz) * (parent ? parent.lz : 1);
                  const sq = dx * dx + dy * dy + dz * dz;
                  if (sq < thresholdSquared) {
                    overlap = true;
                    break;
                  }
                }
              }
            }
            return overlap;
          },

          selectedSideIndex: -1,

          getResizeHandlePosition(el, handleType) {
            const { cx, cy, lx, ly, lz, type, parentId } = el;
            const p = new Vector3(cx, cy, 0);
            switch (type) {
              case ObjectType.Cuboid: {
                const v = new Vector2();
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
                const { pos, rot } = Util.getWorldDataById(el.id);
                v.rotateAround(ORIGIN_VECTOR2, rot);
                p.set(pos.x + v.x, pos.y + v.y, pos.z - lz / 2);
                break;
              }
              case ObjectType.Wall: {
                const wall = el as WallModel;
                const parent = get().elements.find((e) => e.id === parentId);
                if (parent) {
                  const parentPosition = new Vector3(parent.cx, parent.cy, parent.lz);
                  const parentRotation = new Euler(0, 0, parent.rotation[2]);
                  const handlePosition = new Vector3();
                  switch (handleType) {
                    case ResizeHandleType.UpperLeft: {
                      handlePosition.fromArray(wall.leftPoint).setZ(0);
                      break;
                    }
                    case ResizeHandleType.UpperRight: {
                      handlePosition.fromArray(wall.rightPoint).setZ(0);
                      break;
                    }
                  }
                  p.copy(handlePosition.applyEuler(parentRotation).add(parentPosition));
                }
                break;
              }
              case ObjectType.Roof: {
                const parent = get().elements.find((e) => e.id === parentId);
                if (parent) {
                  const parentPosition = new Vector3(parent.cx, parent.cy, parent.lz);
                  const parentRotation = new Euler(0, 0, parent.rotation[2]);
                  const handlePosition = new Vector3(get().selectedElementX, get().selectedElementY)
                    .applyEuler(parentRotation)
                    .add(parentPosition);
                  p.set(handlePosition.x, handlePosition.y, parent.lz);
                }
                break;
              }
              case ObjectType.Tree: {
                const parent = get().elements.find((e) => e.id === parentId);
                if (parent) {
                  const parentPosition = new Vector3(parent.cx, parent.cy, parent.cz + parent.lz / 2);
                  const parentRotation = new Euler(0, 0, parent.rotation[2]);
                  p.copy(new Vector3(el.cx, el.cy, parent.lz).applyEuler(parentRotation).add(parentPosition));
                }
                break;
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
          getParent(child) {
            const elements = get().elements;
            for (const e of elements) {
              if (e.id === child.parentId) {
                return e;
              }
            }
            return null;
          },
          getFoundation(elem) {
            const elements = get().elements;
            for (const e of elements) {
              if (e.id === elem.foundationId && e.type === ObjectType.Foundation) {
                return e as FoundationModel;
              }
            }
            return null;
          },
          selectNone() {
            immerSet((state: CommonStoreState) => {
              state.selectedElementIdSet.clear();
              for (const e of state.elements) {
                e.selected = false;
              }
              state.selectedElement = null;
            });
            useRefStore.getState().selectNone();
          },
          selectMe(id, e, action, select) {
            const setEnableOrbitController = useRefStore.getState().setEnableOrbitController;
            if (e.intersections.length > 0) {
              const intersectableObjects = e.intersections.filter(
                (obj) => !obj.eventObject.name.startsWith('Wall Intersection Plane'),
              );
              if (intersectableObjects[0].object === e.eventObject || select) {
                immerSet((state) => {
                  for (const elem of state.elements) {
                    if (elem.id === id) {
                      elem.selected = true;
                      state.selectedElement = elem;
                      // TODO: lz is now zero for roof. So this may need to be set from elsewhere for roofs.
                      state.selectedElementHeight = elem.lz;

                      if (state.groupActionMode) {
                        let fId = elem.foundationId ?? null;
                        if (!fId && isGroupable(elem)) {
                          fId = Util.getBaseId(elem.id);
                        }
                        if (fId) {
                          if (!state.multiSelectionsMode) {
                            state.selectedElementIdSet.clear();
                          }
                          if (state.selectedElementIdSet.has(fId)) {
                            state.selectedElementIdSet.delete(fId);
                          } else {
                            state.selectedElementIdSet.add(fId);
                          }
                        }
                      } else {
                        if (action === ActionType.ContextMenu) {
                          // right click on selected element
                          if (state.selectedElementIdSet.has(id)) {
                            // de-select other type of elements
                            for (const elem of state.elements) {
                              if (state.selectedElementIdSet.has(elem.id) && elem.type !== state.selectedElement.type) {
                                state.selectedElementIdSet.delete(elem.id);
                              }
                            }
                          }
                          // right click on new element
                          else {
                            if (state.multiSelectionsMode) {
                              state.selectedElementIdSet.add(id);
                              for (const elem of state.elements) {
                                if (
                                  state.selectedElementIdSet.has(elem.id) &&
                                  elem.type !== state.selectedElement.type
                                ) {
                                  state.selectedElementIdSet.delete(elem.id);
                                }
                              }
                            } else {
                              state.selectedElementIdSet.clear();
                              state.selectedElementIdSet.add(id);
                            }
                          }
                        } else {
                          if (state.multiSelectionsMode) {
                            if (state.selectedElementIdSet.has(id)) {
                              state.selectedElementIdSet.delete(id);
                            } else {
                              state.selectedElementIdSet.add(id);
                            }
                          } else {
                            state.selectedElementIdSet.clear();
                            state.selectedElementIdSet.add(id);
                          }
                        }
                      }
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
          updateAllElementLocks(locked) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                e.locked = locked;
              }
            });
          },
          updateElementLockByFoundationId(foundationId, locked) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.foundationId === foundationId || e.parentId === foundationId || e.id === foundationId) {
                  e.locked = locked;
                }
              }
            });
          },
          updateElementLockByParentId(parentId, type: ObjectType, locked) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.parentId === parentId && type === e.type) {
                  e.locked = locked;
                }
              }
            });
          },
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
                  if (e.type === ObjectType.SolarPanel && (e as SolarPanelModel).parentType === ObjectType.Roof) {
                    state.updateElementOnRoofFlag = true;
                  }
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
                  if (e.type === ObjectType.SolarPanel && (e as SolarPanelModel).parentType === ObjectType.Roof) {
                    state.updateElementOnRoofFlag = true;
                  }
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
                } else if (e.parentId === id && !isStackableModel(e)) {
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
                  // FIXME: I don't understand the logic below
                  const parent = state.getParent(e);
                  if (parent && !parent.locked && parent.type === type) {
                    e.rotation[0] = x;
                    e.rotation[1] = y;
                    e.rotation[2] = z;
                  }
                }
              }
            });
          },

          // for solar collectors
          updateSolarCollectorDrawSunBeamById(id, draw) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  if (Util.isSolarCollector(e)) {
                    (e as SolarCollector).drawSunBeam = draw;
                    break;
                  }
                }
              }
            });
          },
          updateSolarCollectorDrawSunBeamAboveFoundation(type, foundationId, draw) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.foundationId === foundationId && !e.locked) {
                  if (e.type === type) {
                    (e as SolarCollector).drawSunBeam = draw;
                  }
                }
              }
            });
          },
          updateSolarCollectorDrawSunBeamForAll(type, draw) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (!e.locked) {
                  if (e.type === type) {
                    (e as SolarCollector).drawSunBeam = draw;
                  }
                }
              }
            });
          },
          updateSolarCollectorRelativeAzimuthById(id, relativeAzimuth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked && Util.isSolarCollector(e)) {
                  (e as SolarCollector).relativeAzimuth = relativeAzimuth;
                  state.selectedElementAngle = relativeAzimuth;
                  break;
                }
              }
            });
          },
          updateSolarCollectorRelativeAzimuthAboveFoundation(type, foundationId, relativeAzimuth) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (
                  e.type === type &&
                  e.foundationId === foundationId &&
                  !e.locked &&
                  (e as SolarPanelModel).parentType !== ObjectType.Wall
                ) {
                  (e as SolarCollector).relativeAzimuth = relativeAzimuth;
                }
              }
            });
          },
          updateSolarCollectorRelativeAzimuthOnSurface(type, parentId, normal, relativeAzimuth) {
            if (!Util.isSolarCollectorType(type)) return;
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
                    (e as SolarCollector).relativeAzimuth = relativeAzimuth;
                  }
                }
              }
            });
          },
          updateSolarCollectorRelativeAzimuthForAll(type, relativeAzimuth) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked && (e as SolarPanelModel).parentType !== ObjectType.Wall) {
                  (e as SolarCollector).relativeAzimuth = relativeAzimuth;
                }
              }
            });
          },

          updateSolarCollectorPoleHeightById(id, poleHeight) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked && Util.isSolarCollector(e)) {
                  (e as SolarCollector).poleHeight = poleHeight;
                  break;
                }
              }
            });
          },
          updateSolarCollectorPoleHeightAboveFoundation(type, foundationId, poleHeight) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.foundationId === foundationId && !e.locked && e.type === type) {
                  (e as SolarCollector).poleHeight = poleHeight;
                }
              }
            });
          },
          updateSolarCollectorPoleHeightOnSurface(type, parentId, normal, poleHeight) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (!e.locked && e.type === type) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    (e as SolarCollector).poleHeight = poleHeight;
                  }
                }
              }
            });
          },
          updateSolarCollectorPoleHeightForAll(type, poleHeight) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked) {
                  (e as SolarCollector).poleHeight = poleHeight;
                }
              }
            });
          },

          updateSolarCollectorPoleRadiusById(id, poleRadius) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked && Util.isSolarCollector(e)) {
                  (e as SolarCollector).poleRadius = poleRadius;
                  break;
                }
              }
            });
          },
          updateSolarCollectorPoleRadiusAboveFoundation(type, foundationId, poleRadius) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.foundationId === foundationId && !e.locked && e.type === type) {
                  (e as SolarCollector).poleRadius = poleRadius;
                }
              }
            });
          },
          updateSolarCollectorPoleRadiusOnSurface(type, parentId, normal, poleRadius) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (!e.locked && e.type === type) {
                  let found;
                  if (normal) {
                    found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
                  } else {
                    found = e.parentId === parentId;
                  }
                  if (found) {
                    (e as SolarCollector).poleRadius = poleRadius;
                  }
                }
              }
            });
          },
          updateSolarCollectorPoleRadiusForAll(type, poleRadius) {
            if (!Util.isSolarCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && !e.locked) {
                  (e as SolarCollector).poleRadius = poleRadius;
                }
              }
            });
          },

          // this should be called if any of the solar collectors changes
          clearAllSolarCollectorYields() {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (Util.isSolarCollector(e)) {
                  const sc = e as SolarCollector;
                  sc.dailyYield = 0;
                  sc.yearlyYield = 0;
                }
              }
            });
          },
          updateSolarCollectorDailyYieldById(id, dailyYield) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && Util.isSolarCollector(e)) {
                  (e as SolarCollector).dailyYield = dailyYield;
                  break;
                }
              }
            });
          },
          updateSolarCollectorYearlyYieldById(id, yearlyYield) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && Util.isSolarCollector(e)) {
                  (e as SolarCollector).yearlyYield = yearlyYield;
                  break;
                }
              }
            });
          },

          // for concentrated solar power collectors
          updateCspReflectanceById(id, reflectance) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && Util.isCspCollector(e)) {
                  (e as ConcentratedSolarPowerCollector).reflectance = reflectance;
                  break;
                }
              }
            });
          },
          updateCspReflectanceAboveFoundation(type, foundationId, reflectance) {
            if (!Util.isCspCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId) {
                  (e as ConcentratedSolarPowerCollector).reflectance = reflectance;
                }
              }
            });
          },
          updateCspReflectanceForAll(type, reflectance) {
            if (!Util.isCspCollectorType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  (e as ConcentratedSolarPowerCollector).reflectance = reflectance;
                }
              }
            });
          },

          updateParabolicCollectorAbsorptanceById(id, absorptance) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && Util.isParabolicCollector(e)) {
                  (e as ParabolicCollector).absorptance = absorptance;
                  break;
                }
              }
            });
          },
          updateParabolicCollectorAbsorptanceAboveFoundation(type, foundationId, absorptance) {
            if (!Util.isParabolaType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId) {
                  (e as ParabolicCollector).absorptance = absorptance;
                }
              }
            });
          },
          updateParabolicCollectorAbsorptanceForAll(type, absorptance) {
            if (!Util.isParabolaType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  (e as ParabolicCollector).absorptance = absorptance;
                }
              }
            });
          },

          updateParabolicCollectorOpticalEfficiencyById(id, opticalEfficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && Util.isParabolicCollector(e)) {
                  (e as ParabolicCollector).opticalEfficiency = opticalEfficiency;
                  break;
                }
              }
            });
          },
          updateParabolicCollectorOpticalEfficiencyAboveFoundation(type, foundationId, opticalEfficiency) {
            if (!Util.isParabolaType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId) {
                  (e as ParabolicCollector).opticalEfficiency = opticalEfficiency;
                }
              }
            });
          },
          updateParabolicCollectorOpticalEfficiencyForAll(type, opticalEfficiency) {
            if (!Util.isParabolaType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  (e as ParabolicCollector).opticalEfficiency = opticalEfficiency;
                }
              }
            });
          },

          updateParabolicCollectorThermalEfficiencyById(id, thermalEfficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && Util.isParabolicCollector(e)) {
                  (e as ParabolicCollector).thermalEfficiency = thermalEfficiency;
                  break;
                }
              }
            });
          },
          updateParabolicCollectorThermalEfficiencyAboveFoundation(type, foundationId, thermalEfficiency) {
            if (!Util.isParabolaType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.foundationId === foundationId) {
                  (e as ParabolicCollector).thermalEfficiency = thermalEfficiency;
                }
              }
            });
          },
          updateParabolicCollectorThermalEfficiencyForAll(type, thermalEfficiency) {
            if (!Util.isParabolaType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  (e as ParabolicCollector).thermalEfficiency = thermalEfficiency;
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

          // for cuboids
          cuboidActionScope: Scope.OnlyThisSide,
          setCuboidActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.cuboidActionScope = scope;
            });
          },

          // for polygons
          polygonActionScope: Scope.OnlyThisObject,
          setPolygonActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.polygonActionScope = scope;
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

          // for solar panels
          solarPanelActionScope: Scope.OnlyThisObject,
          setSolarPanelActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.solarPanelActionScope = scope;
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
          setSolarPanelOrientation(sp, pvModel, orientation) {
            sp.orientation = orientation;
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
          },

          // for parabolic troughs
          parabolicTroughActionScope: Scope.OnlyThisObject,
          setParabolicTroughActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.parabolicTroughActionScope = scope;
            });
          },

          // for Fresnel reflector
          fresnelReflectorActionScope: Scope.OnlyThisObject,
          setFresnelReflectorActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.fresnelReflectorActionScope = scope;
            });
          },

          // for heliostat
          heliostatActionScope: Scope.OnlyThisObject,
          setHeliostatActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.heliostatActionScope = scope;
            });
          },
          updateSolarReceiverById(id, receiverId) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  if (e.type === ObjectType.Heliostat) {
                    (e as HeliostatModel).towerId = receiverId;
                    break;
                  } else if (e.type === ObjectType.FresnelReflector) {
                    (e as FresnelReflectorModel).receiverId = receiverId;
                    break;
                  }
                }
              }
            });
          },
          updateSolarReceiverAboveFoundation(type: ObjectType, foundationId, receiverId) {
            if (!Util.isHeliostatOrFresnelReflector(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.foundationId === foundationId && !e.locked) {
                  if (e.type === ObjectType.Heliostat) {
                    (e as HeliostatModel).towerId = receiverId;
                  } else if (e.type === ObjectType.FresnelReflector) {
                    (e as FresnelReflectorModel).receiverId = receiverId;
                  }
                }
              }
            });
          },
          updateSolarReceiverForAll(type, receiverId) {
            if (!Util.isHeliostatOrFresnelReflector(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (!e.locked) {
                  if (e.type === ObjectType.Heliostat) {
                    (e as HeliostatModel).towerId = receiverId;
                  } else if (e.type === ObjectType.FresnelReflector) {
                    (e as FresnelReflectorModel).receiverId = receiverId;
                  }
                }
              }
            });
          },

          // for parabolic dishes
          parabolicDishActionScope: Scope.OnlyThisObject,
          setParabolicDishActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.parabolicDishActionScope = scope;
            });
          },

          // for parabolic troughs and Fresnel reflectors
          updateModuleLengthById(id, moduleLength) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  if (e.type === ObjectType.ParabolicTrough) {
                    (e as ParabolicTroughModel).moduleLength = moduleLength;
                    break;
                  } else if (e.type === ObjectType.FresnelReflector) {
                    (e as FresnelReflectorModel).moduleLength = moduleLength;
                    break;
                  }
                }
              }
            });
          },
          updateModuleLengthAboveFoundation(type, foundationId, moduleLength) {
            if (!Util.isParabolicTroughOrFresnelReflector(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.foundationId === foundationId && !e.locked) {
                  if (e.type === ObjectType.ParabolicTrough) {
                    (e as ParabolicTroughModel).moduleLength = moduleLength;
                  } else if (e.type === ObjectType.FresnelReflector) {
                    (e as FresnelReflectorModel).moduleLength = moduleLength;
                  }
                }
              }
            });
          },
          updateModuleLengthForAll(type, moduleLength) {
            if (!Util.isParabolicTroughOrFresnelReflector(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (!e.locked) {
                  if (e.type === ObjectType.ParabolicTrough) {
                    (e as ParabolicTroughModel).moduleLength = moduleLength;
                  } else if (e.type === ObjectType.FresnelReflector) {
                    (e as FresnelReflectorModel).moduleLength = moduleLength;
                  }
                }
              }
            });
          },

          // for parabolic troughs and dishes
          updateParabolaLatusRectumById(id, latusRectum) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  if (e.type === ObjectType.ParabolicTrough) {
                    (e as ParabolicTroughModel).latusRectum = latusRectum;
                  } else if (e.type === ObjectType.ParabolicDish) {
                    (e as ParabolicDishModel).latusRectum = latusRectum;
                  }
                  break;
                }
              }
            });
          },
          updateParabolaLatusRectumAboveFoundation(type, foundationId, latusRectum) {
            if (!Util.isParabolaType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.foundationId === foundationId && !e.locked) {
                  if (e.type === ObjectType.ParabolicTrough) {
                    (e as ParabolicTroughModel).latusRectum = latusRectum;
                  } else if (e.type === ObjectType.ParabolicDish) {
                    (e as ParabolicDishModel).latusRectum = latusRectum;
                  }
                }
              }
            });
          },
          updateParabolaLatusRectumForAll(type, latusRectum) {
            if (!Util.isParabolaType(type)) return;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (!e.locked) {
                  if (e.type === ObjectType.ParabolicTrough) {
                    (e as ParabolicTroughModel).latusRectum = latusRectum;
                  } else if (e.type === ObjectType.ParabolicDish) {
                    (e as ParabolicDishModel).latusRectum = latusRectum;
                  }
                }
              }
            });
          },

          // for wind turbines
          windTurbineActionScope: Scope.OnlyThisObject,
          setWindTurbineActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.windTurbineActionScope = scope;
            });
          },

          // for walls
          wallActionScope: Scope.OnlyThisObject,
          setWallActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.wallActionScope = scope;
            });
          },
          // for roofs
          roofActionScope: Scope.OnlyThisObject,
          setRoofActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.roofActionScope = scope;
            });
          },
          // for windows
          windowActionScope: Scope.OnlyThisObject,
          setWindowActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.windowActionScope = scope;
            });
          },

          // for doors
          doorActionScope: Scope.OnlyThisObject,
          setDoorActionScope(scope) {
            immerSet((state: CommonStoreState) => {
              state.doorActionScope = scope;
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
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  (e as WallModel).leftPoint = [...point];
                  break;
                }
              }
            });
          },
          updateWallRightPointById(id, point) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
                  (e as WallModel).rightPoint = [...point];
                  break;
                }
              }
            });
          },

          updateRoofRiseById(id, rise, topZ) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && e.type === ObjectType.Roof) {
                  (e as RoofModel).rise = rise;
                  state.actionState.roofRise = rise;
                  if (topZ !== undefined) {
                    state.selectedElementHeight = topZ;
                  }
                  break;
                }
              }
            });
          },
          updateRoofStructureById(id, structure) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && e.type === ObjectType.Roof) {
                  const roofModel = e as RoofModel;
                  roofModel.roofStructure = structure;
                  break;
                }
              }
            });
          },

          updateInsideLightById(id, inside) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Light && e.id === id) {
                  (e as LightModel).inside = inside;
                  break;
                }
              }
            });
          },
          updateInsideLightsByParentId(parentId, inside) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.parentId === parentId && e.type === ObjectType.Light) {
                  (e as LightModel).inside = inside;
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

          actionModeLock: false,
          objectTypeToAdd: ObjectType.None,
          addElement(parent, p, normal) {
            let model: ElementModel | null = null;
            const parentId = 'id' in parent ? parent.id : GROUND_ID;
            immerSet((state: CommonStoreState) => {
              switch (state.objectTypeToAdd) {
                case ObjectType.Human: {
                  const position = new Vector3().copy(p);
                  if (parentId !== GROUND_ID) {
                    const { rot: parentWorldRotation, pos: parentWorldPosition } = Util.getWorldDataById(parentId);
                    position
                      .sub(new Vector3(parentWorldPosition.x, parentWorldPosition.y, parentWorldPosition.z))
                      .applyEuler(new Euler(0, 0, -parentWorldRotation));
                  }
                  const human = ElementModelFactory.makeHuman(
                    state.actionState.humanName,
                    parentId,
                    position.x,
                    position.y,
                    position.z,
                  );
                  model = human;
                  state.elements.push(human);
                  break;
                }
                case ObjectType.Tree: {
                  const position = new Vector3().copy(p);
                  if (parentId !== GROUND_ID) {
                    const { rot: parentWorldRotation, pos: parentWorldPosition } = Util.getWorldDataById(parentId);
                    position
                      .sub(new Vector3(parentWorldPosition.x, parentWorldPosition.y, parentWorldPosition.z))
                      .applyEuler(new Euler(0, 0, -parentWorldRotation));
                  }
                  const tree = ElementModelFactory.makeTree(
                    state.actionState.treeType,
                    state.actionState.treeSpread,
                    state.actionState.treeHeight,
                    parentId,
                    position.x,
                    position.y,
                    position.z,
                  );
                  model = tree;
                  state.elements.push(tree);
                  break;
                }
                case ObjectType.Flower: {
                  const position = new Vector3().copy(p);
                  if (parentId !== GROUND_ID) {
                    const { rot: parentWorldRotation, pos: parentWorldPosition } = Util.getWorldDataById(parentId);
                    position
                      .sub(new Vector3(parentWorldPosition.x, parentWorldPosition.y, parentWorldPosition.z))
                      .applyEuler(new Euler(0, 0, -parentWorldRotation));
                  }
                  const flower = ElementModelFactory.makeFlower(
                    state.actionState.flowerType,
                    parentId,
                    position.x,
                    position.y,
                    position.z,
                  );
                  model = flower;
                  state.elements.push(flower);
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
                    polygonParentModel.type,
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
                case ObjectType.Light:
                  const lightParentModel = parent as ElementModel;
                  const lightRelativeCoordinates = Util.relativeCoordinates(p.x, p.y, p.z, lightParentModel);
                  const light = ElementModelFactory.makeLight(
                    lightParentModel,
                    2,
                    state.actionState.lightDistance,
                    state.actionState.lightIntensity,
                    state.actionState.lightColor,
                    lightRelativeCoordinates.x,
                    lightRelativeCoordinates.y,
                    lightRelativeCoordinates.z,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                  );
                  model = light;
                  state.elements.push(light);
                  break;
                case ObjectType.SolarPanel:
                  const solarPanelParentModel = parent as ElementModel;
                  const solarPanelRelativeCoordinates = Util.relativeCoordinates(p.x, p.y, p.z, solarPanelParentModel);
                  const solarPanel = ElementModelFactory.makeSolarPanel(
                    solarPanelParentModel,
                    state.getPvModule(state.actionState.solarPanelModelName ?? 'SPR-X21-335-BLK'),
                    solarPanelRelativeCoordinates.x,
                    solarPanelRelativeCoordinates.y,
                    solarPanelRelativeCoordinates.z,
                    state.actionState.solarPanelOrientation ?? Orientation.landscape,
                    state.actionState.solarPanelPoleHeight ?? 1,
                    state.actionState.solarPanelPoleSpacing ?? 3,
                    state.actionState.solarPanelTiltAngle ?? 0,
                    state.actionState.solarPanelRelativeAzimuth ?? 0,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                    state.actionState.solarPanelFrameColor ?? 'white',
                  );
                  model = solarPanel;
                  state.elements.push(solarPanel);
                  break;
                case ObjectType.ParabolicTrough:
                  const parabolicTroughParentModel = parent as ElementModel;
                  const parabolicTroughRelativeCoordinates = Util.relativeCoordinates(
                    p.x,
                    p.y,
                    p.z,
                    parabolicTroughParentModel,
                  );
                  const parabolicTrough = ElementModelFactory.makeParabolicTrough(
                    parabolicTroughParentModel,
                    state.actionState.parabolicTroughReflectance,
                    state.actionState.parabolicTroughAbsorptance,
                    state.actionState.parabolicTroughOpticalEfficiency,
                    state.actionState.parabolicTroughThermalEfficiency,
                    state.actionState.parabolicTroughLatusRectum,
                    state.actionState.parabolicTroughPoleHeight,
                    state.actionState.parabolicTroughModuleLength,
                    parabolicTroughRelativeCoordinates.x,
                    parabolicTroughRelativeCoordinates.y,
                    parabolicTroughRelativeCoordinates.z,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                    state.actionState.parabolicTroughWidth,
                  );
                  model = parabolicTrough;
                  state.elements.push(parabolicTrough);
                  break;
                case ObjectType.ParabolicDish:
                  const parabolicDishParentModel = parent as ElementModel;
                  const parabolicDishRelativeCoordinates = Util.relativeCoordinates(
                    p.x,
                    p.y,
                    p.z,
                    parabolicDishParentModel,
                  );
                  const parabolicDish = ElementModelFactory.makeParabolicDish(
                    parabolicDishParentModel,
                    state.actionState.parabolicDishReflectance,
                    state.actionState.parabolicDishAbsorptance,
                    state.actionState.parabolicDishOpticalEfficiency,
                    state.actionState.parabolicDishThermalEfficiency,
                    state.actionState.parabolicDishLatusRectum,
                    state.actionState.parabolicDishPoleHeight,
                    state.actionState.parabolicDishReceiverStructure,
                    parabolicDishRelativeCoordinates.x,
                    parabolicDishRelativeCoordinates.y,
                    parabolicDishRelativeCoordinates.z,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                    state.actionState.parabolicDishRimDiameter,
                    state.actionState.parabolicDishRimDiameter,
                  );
                  model = parabolicDish;
                  state.elements.push(parabolicDish);
                  break;
                case ObjectType.FresnelReflector:
                  const fresnelReflectorParentModel = parent as ElementModel;
                  const fresnelReflectorRelativeCoordinates = Util.relativeCoordinates(
                    p.x,
                    p.y,
                    p.z,
                    fresnelReflectorParentModel,
                  );
                  const fresnelReflector = ElementModelFactory.makeFresnelReflector(
                    fresnelReflectorParentModel,
                    state.actionState.fresnelReflectorReceiver,
                    state.actionState.fresnelReflectorReflectance,
                    state.actionState.fresnelReflectorPoleHeight,
                    state.actionState.fresnelReflectorModuleLength,
                    fresnelReflectorRelativeCoordinates.x,
                    fresnelReflectorRelativeCoordinates.y,
                    fresnelReflectorRelativeCoordinates.z,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                    state.actionState.fresnelReflectorWidth,
                  );
                  model = fresnelReflector;
                  state.elements.push(fresnelReflector);
                  break;
                case ObjectType.Heliostat:
                  const heliostatParentModel = parent as ElementModel;
                  const heliostatRelativeCoordinates = Util.relativeCoordinates(p.x, p.y, p.z, heliostatParentModel);
                  const heliostat = ElementModelFactory.makeHeliostat(
                    heliostatParentModel,
                    state.actionState.heliostatTower,
                    state.actionState.heliostatReflectance,
                    state.actionState.heliostatPoleHeight,
                    heliostatRelativeCoordinates.x,
                    heliostatRelativeCoordinates.y,
                    heliostatRelativeCoordinates.z,
                    normal,
                    'rotation' in parent ? parent.rotation : undefined,
                    state.actionState.heliostatLength,
                    state.actionState.heliostatWidth,
                  );
                  model = heliostat;
                  state.elements.push(heliostat);
                  break;
                case ObjectType.WindTurbine:
                  const windTurbineParentModel = parent as ElementModel;
                  const windTurbineRelativeCoordinates = Util.relativeCoordinates(p.x, p.y, 0, windTurbineParentModel);
                  const windTurbine = ElementModelFactory.makeWindTurbine(
                    windTurbineParentModel,
                    windTurbineRelativeCoordinates.x,
                    windTurbineRelativeCoordinates.y,
                    0,
                  );
                  model = windTurbine;
                  state.elements.push(windTurbine);
                  break;
                case ObjectType.Foundation:
                  const foundation = ElementModelFactory.makeFoundation(
                    p.x,
                    p.y,
                    state.actionState.foundationHeight,
                    state.actionState.foundationColor,
                    state.actionState.foundationTexture,
                  );
                  model = foundation;
                  state.elements.push(foundation);
                  break;
                case ObjectType.Cuboid:
                  const cuboid = ElementModelFactory.makeCuboid(
                    p.x,
                    p.y,
                    state.actionState.cuboidHeight,
                    state.actionState.cuboidFaceColors,
                    state.actionState.cuboidFaceTextures,
                  );
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
                  );
                  state.elements.push(wall);
                  state.selectedElement = wall;
                  model = wall;
                  break;
              }
              if (model) {
                state.selectedElementIdSet.clear();
                state.selectedElementIdSet.add(model.id);
              }
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
              state.elementsToPaste = [];
              // make sure that the first element to paste is the current one when it may be a parent
              for (const e of state.elements) {
                if (e.id === id) {
                  if (e.type === ObjectType.Polygon) {
                    // set cx and cy for polygon for pasting (otherwise, they may be unset)
                    const centroid = Util.calculatePolygonCentroid((e as PolygonModel).vertices);
                    e.cx = centroid.x;
                    e.cy = centroid.y;
                    state.elementsToPaste.push(e);
                  } else if (e.type === ObjectType.Window && (e as WindowModel).parentType === ObjectType.Wall) {
                    const parentWall = state.elements.find(
                      (el) => el.id === e.parentId && el.type === ObjectType.Wall,
                    ) as WallModel | undefined;
                    if (parentWall) {
                      const copiedWindow = { ...e };
                      copiedWindow.lx = e.lx * parentWall.lx;
                      copiedWindow.lz = e.lz * parentWall.lz;
                      state.elementsToPaste.push(copiedWindow);
                    }
                  } else {
                    state.elementsToPaste.push(e);
                  }
                  break;
                }
              }
              for (const e of state.elements) {
                if (Util.isChild(id, e.id)) {
                  if (e.type === ObjectType.Polygon) {
                    // set cx and cy for polygon for pasting (otherwise, they may be unset)
                    const centroid = Util.calculatePolygonCentroid((e as PolygonModel).vertices);
                    e.cx = centroid.x;
                    e.cy = centroid.y;
                  }
                  state.elementsToPaste.push(e);
                }
              }
            });
          },
          removeSelectedElements() {
            const selectedIdSet = get().selectedElementIdSet;
            if (selectedIdSet.size === 0) return [];

            const selectedIds = Array.from(selectedIdSet);
            const deletedElementSet = new Set<ElementModel>();
            const deletedElementIdSet = new Set<string>();
            for (const e of get().elements) {
              if (selectedIdSet.has(e.id)) {
                deletedElementSet.add(e);
                deletedElementIdSet.add(e.id);
              } else {
                for (const id of selectedIds) {
                  if (Util.isChild(id, e.id)) {
                    deletedElementSet.add(e);
                    deletedElementIdSet.add(e.id);
                  }
                }
              }
            }

            immerSet((state) => {
              state.autoDeletedRoofs = [];
              state.deletedElements = Array.from(deletedElementSet);
              state.elements = state.elements.filter((e) => {
                if (deletedElementIdSet.has(e.id)) {
                  switch (e.type) {
                    case ObjectType.Wall: {
                      const currentWall = e as WallModel;
                      let leftWallId = '';
                      let rightWallId = '';
                      if (currentWall.leftJoints.length > 0) {
                        leftWallId = state.getElementById(currentWall.leftJoints[0])?.id ?? '';
                      }
                      if (currentWall.rightJoints.length > 0) {
                        rightWallId = state.getElementById(currentWall.rightJoints[0])?.id ?? '';
                      }
                      for (const el of state.elements) {
                        if (el.id === leftWallId) {
                          (el as WallModel).rightJoints = [];
                        } else if (el.id === rightWallId) {
                          (el as WallModel).leftJoints = [];
                        }
                      }
                      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                      break;
                    }
                    case ObjectType.Roof: {
                      state.deletedRoofIdSet.add(e.id);
                      useDataStore.getState().deleteRoofSegmentVertices(e.id);
                      useDataStore.getState().deleteRoofSegmentVerticesWithoutOverhang(e.id);
                      break;
                    }
                  }
                  return false;
                } else {
                  return true;
                }
              });
            });

            return Array.from(deletedElementSet);
          },
          removeElementById(id, cut, selectNone = true, autoDeleted) {
            const removed = get().elements.filter((e) => e.id === id || Util.isChild(id, e.id));
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
                      state.elementsToPaste = [elem];
                    } else if (
                      elem.type === ObjectType.Window &&
                      (elem as WindowModel).parentType === ObjectType.Wall
                    ) {
                      const parentWall = state.elements.find(
                        (el) => el.id === elem.parentId && el.type === ObjectType.Wall,
                      ) as WallModel | undefined;
                      if (parentWall) {
                        const copiedWindow = { ...elem };
                        copiedWindow.lx = elem.lx * parentWall.lx;
                        copiedWindow.lz = elem.lz * parentWall.lz;
                        state.elementsToPaste = [copiedWindow];
                      }
                    } else {
                      state.elementsToPaste = [elem];
                    }
                  } else if (!autoDeleted) {
                    state.deletedElements = [elem];
                  }
                  elem.selected = false;
                  switch (elem.type) {
                    case ObjectType.Roof: {
                      const roof = elem as RoofModel;
                      state.deletedRoofId = elem.id;
                      state.deletedRoofIdSet.add(elem.id);
                      useDataStore.getState().deleteRoofSegmentVertices(id);
                      useDataStore.getState().deleteRoofSegmentVerticesWithoutOverhang(id);
                      if (autoDeleted) {
                        if (state.autoDeletedRoofs) {
                          state.autoDeletedRoofs.push(roof);
                        } else {
                          state.autoDeletedRoofs = [roof];
                        }
                        state.autoDeletedRoofIdSet.add(roof.id);
                      }
                      break;
                    }
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
                      for (const e of state.elements) {
                        if (e.id === leftWallId) {
                          (e as WallModel).rightJoints = [];
                        } else if (e.id === rightWallId) {
                          (e as WallModel).leftJoints = [];
                        }
                      }
                      state.elements = state.elements.filter(
                        (e) => !(e.type === ObjectType.Roof && (e as RoofModel).wallsId.length === 0),
                      );
                      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                      state.deletedWallId = elem.id;
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
              if (autoDeleted) {
                for (const child of state.elements) {
                  if (Util.isChild(id, child.id)) {
                    if (state.autoDeletedChild) {
                      state.autoDeletedChild.push(child);
                    } else {
                      state.autoDeletedChild = [child];
                    }
                  }
                }
              } else {
                if (cut) {
                  for (const child of state.elements) {
                    if (Util.isChild(id, child.id)) {
                      state.elementsToPaste.push(child);
                    }
                  }
                } else {
                  for (const child of state.elements) {
                    if (Util.isChild(id, child.id)) {
                      state.deletedElements.push(child);
                    }
                  }
                }
              }
              state.elements = state.elements.filter((e) => {
                if (e.id === id || e.parentId === id || e.foundationId === id || Util.isChild(id, e.id)) {
                  if (e.type === ObjectType.Roof) {
                    useDataStore.getState().deleteRoofSegmentVertices(id);
                    useDataStore.getState().deleteRoofSegmentVerticesWithoutOverhang(id);
                  }
                  return false;
                } else {
                  return true;
                }
              });
              state.selectedElementIdSet.delete(id);
              if (selectNone) {
                state.selectedElement = null;
                state.selectedElementIdSet.clear();
              }
            });
            return removed;
          },
          removeElementsByType(type) {
            immerSet((state: CommonStoreState) => {
              if (type === ObjectType.Foundation) {
                state.elements = state.elements.filter((x) => {
                  if (x.locked || (x.type !== ObjectType.Foundation && !x.foundationId)) {
                    return true;
                  } else {
                    if (x.type === ObjectType.Roof) {
                      useDataStore.getState().deleteRoofSegmentVertices(x.id);
                      useDataStore.getState().deleteRoofSegmentVerticesWithoutOverhang(x.id);
                    }
                    return false;
                  }
                });
              } else {
                state.elements = state.elements.filter((x) => {
                  if (x.locked || x.type !== type) {
                    return true;
                  } else {
                    if (x.type === ObjectType.Roof) {
                      useDataStore.getState().deleteRoofSegmentVertices(x.id);
                      useDataStore.getState().deleteRoofSegmentVerticesWithoutOverhang(x.id);
                    }
                    return false;
                  }
                });
              }
            });
          },
          countElementsByType(type, excludeLocked) {
            let count = 0;
            if (excludeLocked) {
              for (const e of get().elements) {
                if (e.type === type && !e.locked) {
                  count++;
                }
              }
            } else {
              for (const e of get().elements) {
                if (e.type === type) {
                  count++;
                }
              }
            }
            return count;
          },
          countSolarStructuresByType(type, excludeLocked) {
            let count = 0;
            if (excludeLocked) {
              for (const e of get().elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  if ((e as FoundationModel).solarStructure === type) {
                    count++;
                  }
                }
              }
            } else {
              for (const e of get().elements) {
                if (e.type === ObjectType.Foundation) {
                  if ((e as FoundationModel).solarStructure === type) {
                    count++;
                  }
                }
              }
            }
            return count;
          },
          countObservers() {
            let count = 0;
            for (const e of get().elements) {
              if (e.type === ObjectType.Human && (e as HumanModel).observer) {
                count++;
              }
            }
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
            });
          },
          countElementsByReferenceId(id) {
            let count = 0;
            for (const e of get().elements) {
              if (e.referenceId === id) {
                count++;
              }
            }
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
          getChildrenOfType(type: ObjectType, id) {
            const children: ElementModel[] = [];
            for (const e of get().elements) {
              if (e.type === type && e.parentId === id) {
                children.push(e);
              }
            }
            return children;
          },
          removeAllChildElementsByType(parentId, type) {
            immerSet((state: CommonStoreState) => {
              state.elements = state.elements.filter((x) => x.locked || x.type !== type || x.parentId !== parentId);
              if (type === ObjectType.Wall) {
                state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
              }
            });
          },
          removeAllElementsOnFoundationByType(foundationId, type) {
            immerSet((state: CommonStoreState) => {
              state.elements = state.elements.filter(
                (x) => x.locked || x.type !== type || x.foundationId !== foundationId,
              );
              if (type === ObjectType.Wall) {
                state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
              }
            });
          },
          countAllElements(excludeLocked) {
            let count = 0;
            if (excludeLocked) {
              for (const e of get().elements) {
                if (!e.locked) {
                  count++;
                }
              }
            } else {
              count = get().elements.length;
            }
            return count;
          },
          countAllElementsByType(excludeLocked) {
            const counter = new ElementCounter();
            for (const e of get().elements) {
              if (e.locked) {
                counter.lockedCount++;
              } else {
                counter.unlockedCount++;
              }
              if (excludeLocked && e.locked) continue;
              switch (e.type) {
                case ObjectType.Foundation:
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    counter.solarUpdraftTowerCount++;
                  }
                  counter.foundationCount++;
                  break;
                case ObjectType.Cuboid:
                  counter.cuboidCount++;
                  break;
                case ObjectType.Wall:
                  counter.wallCount++;
                  break;
                case ObjectType.Window:
                  counter.windowCount++;
                  break;
                case ObjectType.Door:
                  counter.doorCount++;
                  break;
                case ObjectType.Human:
                  counter.humanCount++;
                  break;
                case ObjectType.Tree:
                  counter.treeCount++;
                  break;
                case ObjectType.Flower:
                  counter.flowerCount++;
                  break;
                case ObjectType.Polygon:
                  counter.polygonCount++;
                  break;
                case ObjectType.Sensor:
                  counter.sensorCount++;
                  break;
                case ObjectType.Light:
                  if ((e as LightModel).inside) {
                    counter.insideLightCount++;
                  } else {
                    counter.outsideLightCount++;
                  }
                  break;
                case ObjectType.SolarPanel:
                  counter.solarPanelCount++;
                  const sp = e as SolarPanelModel;
                  const pvModel = get().getPvModule(sp.pvModelName);
                  if (pvModel) {
                    counter.solarPanelModuleCount += Util.countSolarPanelsOnRack(sp, pvModel);
                  }
                  break;
                case ObjectType.ParabolicDish:
                  counter.parabolicDishCount++;
                  break;
                case ObjectType.ParabolicTrough:
                  counter.parabolicTroughCount++;
                  break;
                case ObjectType.FresnelReflector:
                  counter.fresnelReflectorCount++;
                  break;
                case ObjectType.Heliostat:
                  counter.heliostatCount++;
                  break;
                case ObjectType.WindTurbine:
                  counter.windTurbineCount++;
                  break;
              }
            }
            return counter;
          },
          countAllOffspringsByTypeAtOnce(ancestorId, includingLocked) {
            const counter = new ElementCounter();
            for (const e of get().elements) {
              // foundationId applies to both foundations and cuboids, should have been named ancestorId
              const idOk = e.parentId === ancestorId || e.foundationId === ancestorId;
              if (idOk) {
                if (e.locked) {
                  counter.lockedCount++;
                } else {
                  counter.unlockedCount++;
                }
              }
              if (includingLocked ? idOk : !e.locked && idOk) {
                switch (e.type) {
                  case ObjectType.Foundation:
                    const f = e as FoundationModel;
                    if (f.solarStructure === SolarStructure.UpdraftTower) {
                      counter.solarUpdraftTowerCount++;
                    }
                    counter.foundationCount++;
                    break;
                  case ObjectType.Cuboid:
                    counter.cuboidCount++;
                    break;
                  case ObjectType.Wall:
                    counter.wallCount++;
                    break;
                  case ObjectType.Window:
                    counter.windowCount++;
                    if (e.locked) counter.lockedWindowCount++;
                    break;
                  case ObjectType.Door:
                    counter.doorCount++;
                    break;
                  case ObjectType.Human:
                    counter.humanCount++;
                    break;
                  case ObjectType.Tree:
                    counter.treeCount++;
                    break;
                  case ObjectType.Flower:
                    counter.flowerCount++;
                    break;
                  case ObjectType.Polygon:
                    counter.polygonCount++;
                    if (e.locked) counter.lockedPolygonCount++;
                    break;
                  case ObjectType.Sensor:
                    counter.sensorCount++;
                    if (e.locked) counter.lockedSensorCount++;
                    break;
                  case ObjectType.Light:
                    if ((e as LightModel).inside) {
                      counter.insideLightCount++;
                    } else {
                      counter.outsideLightCount++;
                    }
                    break;
                  case ObjectType.SolarPanel:
                    counter.solarPanelCount++;
                    if (e.locked) counter.lockedSolarPanelCount++;
                    const sp = e as SolarPanelModel;
                    const pvModel = get().getPvModule(sp.pvModelName);
                    if (pvModel) {
                      counter.solarPanelModuleCount += Util.countSolarPanelsOnRack(sp, pvModel);
                    }
                    break;
                  case ObjectType.ParabolicDish:
                    counter.parabolicDishCount++;
                    break;
                  case ObjectType.ParabolicTrough:
                    counter.parabolicTroughCount++;
                    break;
                  case ObjectType.FresnelReflector:
                    counter.fresnelReflectorCount++;
                    break;
                  case ObjectType.Heliostat:
                    counter.heliostatCount++;
                    break;
                  case ObjectType.WindTurbine:
                    counter.windTurbineCount++;
                    if (e.locked) counter.lockedWindTurbineCount++;
                    break;
                }
              }
            }
            return counter;
          },
          countSolarPanelsOnRack(id) {
            let count = 0;
            for (const e of get().elements) {
              if (e.id === id && e.type === ObjectType.SolarPanel) {
                const sp = e as SolarPanelModel;
                const pvModel = get().getPvModule(sp.pvModelName);
                if (pvModel) {
                  count = Util.countSolarPanelsOnRack(sp, pvModel);
                  break;
                }
              }
            }
            return count;
          },

          // must copy the elements because they may be pasted multiple times.
          // so we must treat them as newly added elements each time.
          // note that the case of deletion is treated differently because the deleted elements cannot be pasted.
          copyCutElements() {
            const copiedElements: ElementModel[] = [];
            const map = new Map<string, ElementModel>(); // oldId => newElement
            const elementsMapOldToNew = new Map<string, string>();
            const elementsMapNewToOld = new Map<string, string>();
            for (let i = 0; i < get().elementsToPaste.length; i++) {
              const oldElem = get().elementsToPaste[i];
              let newElem: ElementModel | null = null;
              if (i === 0) {
                // the first element is the parent
                if (get().getElementById(oldElem.id)) {
                  // make a clone with a new ID if the old ID is in the elements
                  newElem = ElementModelCloner.clone(
                    get().getParent(oldElem),
                    oldElem,
                    oldElem.cx,
                    oldElem.cy,
                    oldElem.cz,
                  );
                } else {
                  // preserve the ID if it is not in the elements
                  newElem = JSON.parse(JSON.stringify(oldElem));
                }
                if (newElem?.type === ObjectType.Wall) {
                  const w = newElem as WallModel;
                  w.roofId = undefined;
                  w.leftRoofHeight = undefined;
                  w.rightRoofHeight = undefined;
                  w.centerLeftRoofHeight = undefined;
                  w.centerRightRoofHeight = undefined;
                  w.centerRoofHeight = undefined;
                }
              } else {
                const oldParent = get().elementsToPaste.find((el) => el.id === oldElem.parentId);
                if (oldParent) {
                  const newParent = map.get(oldParent.id);
                  if (newParent) {
                    if (get().getElementById(oldElem.id)) {
                      // make a clone with a new ID if the old ID is in the elements
                      newElem = ElementModelCloner.clone(
                        newParent,
                        oldElem,
                        oldElem.cx,
                        oldElem.cy,
                        oldElem.cz,
                        oldElem.type === ObjectType.Polygon,
                      );
                      if (
                        newElem?.type === ObjectType.Window &&
                        (newElem as WindowModel).parentType === ObjectType.Wall
                      ) {
                        newElem.lx *= newParent.lx;
                        newElem.lz *= newParent.lz;
                      }
                    } else {
                      // preserve the ID if it is not in the elements
                      newElem = JSON.parse(JSON.stringify(oldElem));
                    }
                  }
                }
              }
              if (newElem) {
                map.set(oldElem.id, newElem);
                elementsMapOldToNew.set(oldElem.id, newElem.id);
                elementsMapNewToOld.set(newElem.id, oldElem.id);
                copiedElements.push(newElem);
              }
            }
            for (const e of copiedElements) {
              // search new roof
              if (e.type === ObjectType.Roof) {
                const oldRoofId = elementsMapNewToOld.get(e.id);
                if (oldRoofId) {
                  for (const o of get().elementsToPaste) {
                    if (o.id === oldRoofId) {
                      (e as RoofModel).wallsId = (o as RoofModel).wallsId.map(
                        (v) => elementsMapOldToNew.get(v) as string,
                      );
                    }
                  }
                }
              }
              // search new wall
              if (e.type === ObjectType.Wall) {
                const oldWallId = elementsMapNewToOld.get(e.id);
                if (oldWallId) {
                  for (const o of get().elementsToPaste) {
                    if (o.id === oldWallId && o.type === ObjectType.Wall) {
                      const w = o as WallModel;
                      const left = elementsMapOldToNew.get(w.leftJoints[0]);
                      if (left) {
                        (e as WallModel).leftJoints = [left];
                      }
                      const right = elementsMapOldToNew.get(w.rightJoints[0]);
                      if (right) {
                        (e as WallModel).rightJoints = [right];
                      }
                      if (w.roofId) {
                        const roofId = elementsMapOldToNew.get(w.roofId as string);
                        if (roofId) {
                          (e as WallModel).roofId = roofId;
                        }
                      }
                      break;
                    }
                  }
                }
              }
            }

            return copiedElements;
          },

          pasteElementsToPoint() {
            const pastedElements: ElementModel[] = [];
            immerSet((state: CommonStoreState) => {
              if (state.elementsToPaste.length === 1) {
                // only the parent element is included in elementsToPaste when copied,
                // so we have to copy its children and grandchildren from existing elements
                let m = state.pastePoint;
                const elemToPaste = state.elementsToPaste[0];
                let newParent = state.selectedElement;
                const oldParent = state.getParent(elemToPaste);
                if (newParent) {
                  if (newParent.type === ObjectType.Polygon) {
                    // paste action of polygon is passed to its parent
                    const q = state.getParent(newParent);
                    if (q) {
                      newParent = q;
                      elemToPaste.parentId = newParent.id;
                      if (Util.isPositionRelative(elemToPaste.type)) {
                        m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                      }
                    }
                  } else if (newParent.type === ObjectType.Roof) {
                    if (newParent.parentId) {
                      const foundation = state.getElementById(newParent.parentId);
                      if (foundation) {
                        m.sub(new Vector3(foundation.cx, foundation.cy, foundation.lz)).applyEuler(
                          new Euler(0, 0, -foundation.rotation[2]),
                        );
                        if (elemToPaste.type !== ObjectType.Window) {
                          m.setX(m.x / foundation.lx);
                          m.setY(m.y / foundation.ly);
                        }
                      }
                    }
                  } else if (newParent.type === ObjectType.Cuboid) {
                    if (elemToPaste.type === ObjectType.Cuboid) {
                      const { pos } = Util.getWorldDataById(newParent.id);
                      m.sub(pos);
                    } else if (Util.isPositionRelative(elemToPaste.type)) {
                      m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                    }
                    elemToPaste.parentId = newParent.id;
                  } else if (newParent.type === ObjectType.Wall) {
                    m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                  } else {
                    // if the old parent is ground, it has no type definition, but we use it to check its type
                    if (oldParent && oldParent.type) {
                      if (elemToPaste.type !== ObjectType.Foundation) {
                        elemToPaste.parentId = newParent.id;
                        if (Util.isPositionRelative(elemToPaste.type)) {
                          m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                        }
                      }
                    }
                  }
                  if (elemToPaste.type === ObjectType.Wall) {
                    m.set(m.x * newParent.lx, m.y * newParent.ly, 0);
                  }
                }
                const e = ElementModelCloner.clone(
                  newParent,
                  elemToPaste,
                  m.x,
                  m.y,
                  m.z,
                  false,
                  state.pasteNormal,
                  oldParent,
                );
                if (e) {
                  if (state.pasteNormal) {
                    e.normal = state.pasteNormal.toArray();
                  }
                  const lang = { lng: state.language };
                  let approved = false;
                  switch (e.type) {
                    case ObjectType.Cuboid: {
                      const getAllChildren = (el: ElementModel) => {
                        const res: ElementModel[] = [];
                        for (const e of get().elements) {
                          if (e.parentId === el.id) {
                            res.push(e);
                            switch (e.type) {
                              case ObjectType.Cuboid:
                              case ObjectType.Foundation:
                              case ObjectType.Wall:
                              case ObjectType.Roof:
                                res.push(...getAllChildren(e));
                            }
                          }
                        }
                        return res;
                      };
                      const child = getAllChildren(elemToPaste);
                      const elementMap = new Map<string, ElementModel>(); // oldId -> newModel
                      pastedElements.push(e);
                      elementMap.set(elemToPaste.id, e);

                      for (const c of child) {
                        const parent = elementMap.get(c.parentId);
                        if (parent) {
                          const newChild = ElementModelCloner.clone(
                            parent,
                            c,
                            c.cx,
                            c.cy,
                            c.cz,
                            c.type === ObjectType.Polygon,
                          );
                          if (newChild) {
                            if (e.normal) {
                              newChild.normal = [...c.normal];
                            }
                            pastedElements.push(newChild);
                            elementMap.set(c.id, newChild);
                          }
                        }
                      }
                      state.elements.push(...pastedElements);
                      state.elementsToPaste = [e];
                      approved = false;

                      break;
                    }
                    case ObjectType.Foundation: {
                      const elementsMapNewToOld = new Map<string, string>();
                      const elementsMapOldToNew = new Map<string, string>();
                      for (const child of state.elements) {
                        if (child.parentId === elemToPaste.id) {
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
                              elementsMapNewToOld.set(newChild.id, child.id);
                              elementsMapOldToNew.set(child.id, newChild.id);
                              for (const grandChild of state.elements) {
                                if (grandChild.parentId === child.id) {
                                  const newGrandChild = ElementModelCloner.clone(
                                    newChild,
                                    grandChild,
                                    grandChild.cx,
                                    grandChild.cy,
                                    grandChild.cz,
                                  );
                                  if (newGrandChild) {
                                    if (child.normal) {
                                      newGrandChild.normal = [...grandChild.normal];
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
                        // search new roof
                        if (e.type === ObjectType.Roof) {
                          const oldRoofId = elementsMapNewToOld.get(e.id);
                          if (oldRoofId) {
                            const oldRoof = get().getElementById(oldRoofId) as RoofModel;
                            if (oldRoof) {
                              (e as RoofModel).wallsId = oldRoof.wallsId.map(
                                (v) => elementsMapOldToNew.get(v) as string,
                              );
                            }
                          }
                        }
                        // search new wall
                        if (e.type === ObjectType.Wall) {
                          const oldWallId = elementsMapNewToOld.get(e.id);
                          if (oldWallId) {
                            for (const o of state.elements) {
                              if (o.id === oldWallId && o.type === ObjectType.Wall) {
                                const w = o as WallModel;
                                const left = elementsMapOldToNew.get(w.leftJoints[0]);
                                if (left) {
                                  (e as WallModel).leftJoints = [left];
                                }
                                const right = elementsMapOldToNew.get(w.rightJoints[0]);
                                if (right) {
                                  (e as WallModel).rightJoints = [right];
                                }
                                if (w.roofId) {
                                  const roofId = elementsMapOldToNew.get(w.roofId as string);
                                  if (roofId) {
                                    (e as WallModel).roofId = roofId;
                                  }
                                }
                                break;
                              }
                            }
                          }
                        }
                      }
                      break;
                    }
                    case ObjectType.SolarPanel:
                    case ObjectType.Sensor:
                    case ObjectType.Light:
                    case ObjectType.WindTurbine:
                    case ObjectType.ParabolicDish:
                    case ObjectType.Heliostat:
                    case ObjectType.FresnelReflector:
                    case ObjectType.ParabolicTrough: {
                      if (newParent?.type === ObjectType.Wall) {
                        if (newParent) {
                          switch (Util.checkElementOnWallState(e, newParent)) {
                            case ElementState.Valid:
                              const angle = (newParent as WallModel).relativeAngle - HALF_PI;
                              e.normal = [Math.cos(angle), Math.sin(angle), 0];
                              approved = true;
                              break;
                            case ElementState.OverLap:
                              showError(i18n.t('message.CannotPasteBecauseOfOverlap', lang));
                              break;
                            case ElementState.OutsideBoundary:
                              showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                              break;
                          }
                        }
                        break;
                      }
                      if (newParent && newParent.type === ObjectType.Roof) {
                        if (e.foundationId) {
                          const foundation = state.getElementById(e.foundationId);
                          if (foundation) {
                            const solarPanelVertices = RoofUtil.getSolarPanelVerticesOnRoof(
                              e as SolarPanelModel,
                              foundation,
                            );
                            const boundaryVertices = RoofUtil.getRoofBoundaryVertices(newParent as RoofModel);

                            if (!RoofUtil.rooftopElementBoundaryCheck(solarPanelVertices, boundaryVertices)) {
                              showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                              break;
                            }
                            if (
                              !RoofUtil.rooftopSPCollisionCheck(e as SolarPanelModel, foundation, solarPanelVertices)
                            ) {
                              showError(i18n.t('message.CannotPasteBecauseOfOverlap', lang));
                              break;
                            }
                            approved = true;
                            state.updateElementOnRoofFlag = true;
                          }
                        }
                        break;
                      }
                      if (state.overlapWithSibling(e)) {
                        // overlap, do not approve
                        showError(i18n.t('message.CannotPasteBecauseOfOverlap', lang));
                      } else {
                        if (newParent) {
                          if (
                            newParent.type === ObjectType.Foundation ||
                            (newParent.type === ObjectType.Cuboid &&
                              Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY))
                          ) {
                            if (Util.isSolarCollector(e)) {
                              approved = Util.isSolarCollectorWithinHorizontalSurface(e as SolarCollector, newParent);
                              if (!approved) {
                                showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                              }
                            } else {
                              // if it is a wind turbine, we don't check out-of-boundary issues
                              approved = true;
                            }
                          } else {
                            // TODO: other surfaces
                            approved = true;
                          }
                        } else {
                          approved = true;
                        }
                      }
                      break;
                    }
                    case ObjectType.Wall: {
                      const center = new Vector3(e.cx, e.cy, 0);
                      const vrx = new Vector3(e.lx / 2, 0, 0);
                      const vlx = new Vector3(-e.lx / 2, 0, 0);
                      const w = e as WallModel;
                      const euler = new Euler(0, 0, w.relativeAngle);
                      w.leftPoint = center.clone().add(vlx.applyEuler(euler)).toArray();
                      w.rightPoint = center.clone().add(vrx.applyEuler(euler)).toArray();
                      w.roofId = undefined;
                      w.leftRoofHeight = undefined;
                      w.rightRoofHeight = undefined;
                      w.centerLeftRoofHeight = undefined;
                      w.centerRightRoofHeight = undefined;
                      w.centerRoofHeight = undefined;
                      for (const child of state.elements) {
                        if (child.parentId === elemToPaste.id) {
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
                          }
                        }
                      }
                      state.elements.push(...pastedElements);
                      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                      approved = true;
                      break;
                    }
                    case ObjectType.Door:
                    case ObjectType.Window: {
                      if (newParent?.type === ObjectType.Wall) {
                        switch (Util.checkElementOnWallState(e, newParent)) {
                          case ElementState.Valid:
                            approved = true;
                            break;
                          case ElementState.OverLap:
                            showError(i18n.t('message.CannotPasteBecauseOfOverlap', lang));
                            break;
                          case ElementState.OutsideBoundary:
                            showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                            break;
                        }
                      } else if (newParent?.type === ObjectType.Roof) {
                        const rotation = RoofUtil.getRotationOnRoof(newParent.id, m);
                        if (rotation) {
                          e.rotation = [...rotation];
                        }
                        const windowVertices = RoofUtil.getWindowVerticesOnRoof(e as WindowModel);
                        const boundaryVertices = RoofUtil.getRoofSegmentBoundary(newParent.id, m);
                        if (!boundaryVertices) break;
                        if (!RoofUtil.rooftopElementBoundaryCheck(windowVertices, boundaryVertices)) {
                          showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                          break;
                        }
                        if (!RoofUtil.rooftopWindowCollisionCheck(e.id, windowVertices, newParent.id)) {
                          showError(i18n.t('message.CannotPasteBecauseOfOverlap', lang));
                          break;
                        }
                        approved = true;
                      }
                      break;
                    }
                    default: {
                      approved = true;
                      if (Util.isPlantOrHuman(e)) {
                        if (newParent) {
                          // paste on a parent
                          const parent = state.getParent(e);
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
                let m = state.pastePoint;
                const cutElements = state.copyCutElements();
                if (cutElements.length > 0) {
                  if (cutElements[0].type === ObjectType.Cuboid) {
                    const newParent = state.selectedElement;
                    if (newParent && newParent.type === ObjectType.Cuboid) {
                      const { pos } = Util.getWorldDataById(newParent.id);
                      m.sub(pos);
                      cutElements[0].parentId = newParent.id;
                    }
                  } else if (cutElements[0].type === ObjectType.Wall) {
                    const newParent = state.selectedElement;
                    if (newParent && newParent.type === ObjectType.Foundation) {
                      m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                      m.set(m.x * newParent.lx, m.y * newParent.ly, 0);
                      cutElements[0].parentId = newParent.id;
                      cutElements[0].foundationId = newParent.id;
                    }
                  }
                  cutElements[0].cx = m.x;
                  cutElements[0].cy = m.y;
                  cutElements[0].cz = m.z;
                  if (cutElements[0].type === ObjectType.Foundation) {
                    cutElements[0].cz += cutElements[0].lz / 2;
                  } else if (cutElements[0].type === ObjectType.Cuboid) {
                    cutElements[0].cz = cutElements[0].lz / 2;
                  }
                  state.elements.push(...cutElements);
                  pastedElements.push(...cutElements);
                }
              }
              if (pastedElements.length > 0) {
                state.selectedElementIdSet.clear();
                state.selectedElementIdSet.add(pastedElements[0].id);
                state.selectedElement = pastedElements[0];
              }
            });
            return pastedElements;
          },

          pasteElementsByKey() {
            const pastedElements: ElementModel[] = [];
            immerSet((state: CommonStoreState) => {
              if (state.elementsToPaste.length > 0) {
                const elem = state.elementsToPaste[0];
                const parent = state.getParent(elem);
                const e = ElementModelCloner.clone(parent, elem, elem.cx, elem.cy, elem.cz);
                if (e) {
                  let approved = false;
                  switch (e.type) {
                    case ObjectType.Door:
                    case ObjectType.Window:
                      if (parent) {
                        const hx = e.lx / 2;
                        e.cx += hx * 3;
                        // searching +x direction
                        if (parent.type === ObjectType.Wall) {
                          while (e.cx + hx < 0.5) {
                            if (Util.checkElementOnWallState(e, parent) === ElementState.Valid) {
                              state.elements.push(e);
                              // state.elementsToPaste = [e];
                              approved = true;
                              break;
                            } else {
                              e.cx += hx;
                            }
                          }
                        } else if (parent.type === ObjectType.Roof) {
                          const rot = RoofUtil.getRotationOnRoof(parent.id, new Vector3(e.cx, e.cy));
                          if (rot) {
                            e.rotation = [...rot];
                          }
                          let windowVertices = RoofUtil.getWindowVerticesOnRoof(e as WindowModel);
                          let segmentVertices = RoofUtil.getRoofSegmentBoundary(parent.id, new Vector3(e.cx, e.cy));
                          const roofVertices = RoofUtil.getRoofBoundaryVertices(parent as RoofModel);
                          while (RoofUtil.rooftopElementBoundaryCheck(windowVertices, roofVertices)) {
                            if (
                              segmentVertices &&
                              RoofUtil.rooftopElementBoundaryCheck(windowVertices, segmentVertices) &&
                              RoofUtil.rooftopWindowCollisionCheck(e.id, windowVertices, parent.id)
                            ) {
                              state.elements.push(e);
                              approved = true;
                              break;
                            } else {
                              e.cx += hx / 2;
                              const rot = RoofUtil.getRotationOnRoof(parent.id, new Vector3(e.cx, e.cy));
                              if (rot) {
                                e.rotation = [...rot];
                              }
                              windowVertices = RoofUtil.getWindowVerticesOnRoof(e as WindowModel);
                              segmentVertices = RoofUtil.getRoofSegmentBoundary(parent.id, new Vector3(e.cx, e.cy));
                            }
                          }
                        }

                        // searching -x direction
                        if (!approved) {
                          e.cx = elem.cx - hx * 3;
                          const rot = RoofUtil.getRotationOnRoof(parent.id, new Vector3(e.cx, e.cy));
                          if (rot) {
                            e.rotation = [...rot];
                          }
                          if (parent.type === ObjectType.Wall) {
                            while (e.cx - hx > -0.5) {
                              if (parent.type === ObjectType.Wall) {
                                if (Util.checkElementOnWallState(e, parent) === ElementState.Valid) {
                                  state.elements.push(e);
                                  // state.elementsToPaste = [e];
                                  approved = true;
                                  break;
                                } else {
                                  e.cx -= hx;
                                }
                              }
                            }
                          } else if (parent.type === ObjectType.Roof) {
                            let windowVertices = RoofUtil.getWindowVerticesOnRoof(e as WindowModel);
                            let segmentVertices = RoofUtil.getRoofSegmentBoundary(parent.id, new Vector3(e.cx, e.cy));
                            const roofVertices = RoofUtil.getRoofBoundaryVertices(parent as RoofModel);
                            while (RoofUtil.rooftopElementBoundaryCheck(windowVertices, roofVertices)) {
                              if (
                                segmentVertices &&
                                RoofUtil.rooftopElementBoundaryCheck(windowVertices, segmentVertices) &&
                                RoofUtil.rooftopWindowCollisionCheck(e.id, windowVertices, parent.id)
                              ) {
                                state.elements.push(e);
                                approved = true;
                                break;
                              } else {
                                e.cx -= hx;
                                const rot = RoofUtil.getRotationOnRoof(parent.id, new Vector3(e.cx, e.cy));
                                if (rot) {
                                  e.rotation = [...rot];
                                }
                                windowVertices = RoofUtil.getWindowVerticesOnRoof(e as WindowModel);
                                segmentVertices = RoofUtil.getRoofSegmentBoundary(parent.id, new Vector3(e.cx, e.cy));
                              }
                            }
                          }
                        }
                        if (!approved) {
                          const lang = { lng: state.language };
                          showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                        }
                        if (parent.type === ObjectType.Roof && approved) {
                          state.updateElementOnRoofFlag = true;
                        }
                      }
                      break;
                    case ObjectType.Human:
                      e.cx += 1;
                      state.elements.push(e);
                      state.elementsToPaste = [e];
                      approved = true;
                      break;
                    case ObjectType.Tree:
                    case ObjectType.Flower:
                      e.cx += e.lx;
                      state.elements.push(e);
                      state.elementsToPaste = [e];
                      approved = true;
                      break;
                    case ObjectType.SolarPanel:
                    case ObjectType.FresnelReflector:
                    case ObjectType.Heliostat:
                    case ObjectType.ParabolicDish:
                    case ObjectType.ParabolicTrough:
                      if (e.parentId) {
                        const parent = state.getParent(e);
                        if (parent) {
                          if (parent.type === ObjectType.Wall) {
                            const hx = e.lx / parent.lx / 2;
                            e.cx += hx * 3;
                            // searching +x direction
                            while (e.cx + hx < 0.5) {
                              if (Util.checkElementOnWallState(e, parent) === ElementState.Valid) {
                                state.elements.push(e);
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
                                if (Util.checkElementOnWallState(e, parent) === ElementState.Valid) {
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
                          } else if (parent.type === ObjectType.Roof) {
                            if (elem.foundationId) {
                              const foundation = state.getElementById(elem.foundationId);
                              if (foundation) {
                                const boundaryVertices = RoofUtil.getRoofBoundaryVertices(parent as RoofModel);

                                const hx = e.lx / foundation.lx / 2;
                                e.cx += hx * 1.25;

                                while (e.cx + hx < 0.5) {
                                  const solarPanelVertices = RoofUtil.getSolarPanelVerticesOnRoof(
                                    e as SolarPanelModel,
                                    foundation,
                                  );
                                  if (
                                    RoofUtil.rooftopElementBoundaryCheck(solarPanelVertices, boundaryVertices) &&
                                    RoofUtil.rooftopSPCollisionCheck(
                                      e as SolarPanelModel,
                                      foundation,
                                      solarPanelVertices,
                                    )
                                  ) {
                                    state.elements.push(e);
                                    approved = true;
                                    break;
                                  } else {
                                    e.cx += hx * 1.25;
                                  }
                                }
                                if (!approved) {
                                  e.cx = elem.cx - hx * 1.25;
                                  while (e.cx - hx > -0.5) {
                                    const solarPanelVertices = RoofUtil.getSolarPanelVerticesOnRoof(
                                      e as SolarPanelModel,
                                      foundation,
                                    );
                                    if (
                                      RoofUtil.rooftopElementBoundaryCheck(solarPanelVertices, boundaryVertices) &&
                                      RoofUtil.rooftopSPCollisionCheck(
                                        e as SolarPanelModel,
                                        foundation,
                                        solarPanelVertices,
                                      )
                                    ) {
                                      state.elements.push(e);
                                      approved = true;
                                      break;
                                    } else {
                                      e.cx -= hx * 1.25;
                                    }
                                  }
                                }
                                if (!approved) {
                                  const lang = { lng: state.language };
                                  showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
                                } else {
                                  state.updateElementOnRoofFlag = true;
                                }
                              }
                            }
                            break;
                          }
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
                              if (state.overlapWithSibling(e)) {
                                // try the opposite direction first before giving up
                                e.cx = elem.cx - dx;
                                e.cy = elem.cy - dy;
                                e.cz = elem.cz - dz;
                                if (state.overlapWithSibling(e)) {
                                  // we may need to hop twice in the opposite direction
                                  e.cx = elem.cx - 2 * dx;
                                  e.cy = elem.cy - 2 * dy;
                                  e.cz = elem.cz - 2 * dz;
                                  if (state.overlapWithSibling(e)) {
                                    e.cx = oldX - dx;
                                    e.cy = oldY - dy;
                                    e.cz = oldZ - dz;
                                  }
                                }
                              }
                            } else {
                              e.cx += (0.01 + e.lx) / parent.lx;
                            }
                          } else {
                            // a loner
                            e.cx += (0.01 + e.lx) / parent.lx; // give a small offset to ensure no overlap
                          }
                          const lang = { lng: state.language };
                          if (!state.overlapWithSibling(e)) {
                            if (
                              parent.type === ObjectType.Foundation ||
                              (parent.type === ObjectType.Cuboid && Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY))
                            ) {
                              if (Util.isSolarCollectorWithinHorizontalSurface(e as SolarCollector, parent)) {
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
                    case ObjectType.Light:
                    case ObjectType.WindTurbine:
                      if (e.parentId) {
                        const parent = state.getParent(e);
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
                    case ObjectType.Cuboid:
                      e.cx += e.lx;
                      if (state.elementsToPaste.length === 1) {
                        const getAllChildren = (el: ElementModel) => {
                          const res: ElementModel[] = [];
                          for (const e of get().elements) {
                            if (e.parentId === el.id) {
                              res.push(e);
                              switch (e.type) {
                                case ObjectType.Cuboid:
                                case ObjectType.Foundation:
                                case ObjectType.Wall:
                                case ObjectType.Roof:
                                  res.push(...getAllChildren(e));
                              }
                            }
                          }
                          return res;
                        };
                        const child = getAllChildren(elem);
                        const elementMap = new Map<string, ElementModel>(); // oldId -> newModel
                        pastedElements.push(e);
                        elementMap.set(elem.id, e);

                        for (const c of child) {
                          const parent = elementMap.get(c.parentId);
                          if (parent) {
                            const newChild = ElementModelCloner.clone(
                              parent,
                              c,
                              c.cx,
                              c.cy,
                              c.cz,
                              c.type === ObjectType.Polygon,
                            );
                            if (newChild) {
                              if (e.normal) {
                                newChild.normal = [...c.normal];
                              }
                              pastedElements.push(newChild);
                              elementMap.set(c.id, newChild);
                            }
                          }
                        }
                        state.elements.push(...pastedElements);
                        state.elementsToPaste = [e];
                        state.selectedElementIdSet.clear();
                        state.selectedElementIdSet.add(e.id);
                        state.selectedElement = e;
                      } else if (state.elementsToPaste.length > 1) {
                        const cutElements = state.copyCutElements();
                        if (cutElements.length > 0) {
                          cutElements[0].cx += cutElements[0].lx;
                          state.elements.push(...cutElements);
                          state.elementsToPaste = [...cutElements];
                          pastedElements.push(...cutElements);
                          state.selectedElementIdSet.clear();
                          state.selectedElementIdSet.add(cutElements[0].id);
                          state.selectedElement = cutElements[0];
                        }
                      }
                      approved = false;
                      break;
                    case ObjectType.Foundation:
                      e.cx += e.lx;
                      if (state.elementsToPaste.length === 1) {
                        // When copying from an existing container, elementsToPaste stores only the container.
                        // So we have to copy its children and grandchildren as well. This differs from the
                        // situation of cutting, in which case all the children and grandchildren must be
                        // stored in elementsToPaste.
                        const elementsMapNewToOld = new Map<string, string>();
                        const elementsMapOldToNew = new Map<string, string>();
                        for (const child of state.elements) {
                          // technically, parentId must not be the same as ID, but just to be sure...
                          if (child.parentId === elem.id && child.parentId !== child.id) {
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
                                elementsMapNewToOld.set(newChild.id, child.id);
                                elementsMapOldToNew.set(child.id, newChild.id);
                                for (const grandChild of state.elements) {
                                  if (grandChild.parentId === child.id) {
                                    const newGrandChild = ElementModelCloner.clone(
                                      newChild,
                                      grandChild,
                                      grandChild.cx,
                                      grandChild.cy,
                                      grandChild.cz,
                                    );
                                    if (newGrandChild) {
                                      if (child.normal) {
                                        newGrandChild.normal = [...grandChild.normal];
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
                          // search new roof
                          if (e.type === ObjectType.Roof) {
                            const oldRoofId = elementsMapNewToOld.get(e.id);
                            if (oldRoofId) {
                              const oldRoof = get().getElementById(oldRoofId) as RoofModel;
                              if (oldRoof) {
                                (e as RoofModel).wallsId = oldRoof.wallsId.map(
                                  (v) => elementsMapOldToNew.get(v) as string,
                                );
                              }
                            }
                          }
                          // search new wall
                          if (e.type === ObjectType.Wall) {
                            const oldWallId = elementsMapNewToOld.get(e.id);
                            if (oldWallId) {
                              for (const o of state.elements) {
                                if (o.id === oldWallId && o.type === ObjectType.Wall) {
                                  const w = o as WallModel;
                                  const left = elementsMapOldToNew.get(w.leftJoints[0]);
                                  if (left) {
                                    (e as WallModel).leftJoints = [left];
                                  }
                                  const right = elementsMapOldToNew.get(w.rightJoints[0]);
                                  if (right) {
                                    (e as WallModel).rightJoints = [right];
                                  }
                                  if (w.roofId) {
                                    const roofId = elementsMapOldToNew.get(w.roofId as string);
                                    if (roofId) {
                                      (e as WallModel).roofId = roofId;
                                    }
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
                          state.selectedElementIdSet.clear();
                          state.selectedElementIdSet.add(cutElements[0].id);
                          state.selectedElement = cutElements[0];
                        }
                      }
                      approved = true;
                      break;
                    case ObjectType.Wall:
                      const w = e as WallModel;
                      const step = new Vector3(1, -1, 0).applyEuler(new Euler(0, 0, w.relativeAngle));
                      e.cx += step.x;
                      e.cy += step.y;
                      if (state.elementsToPaste.length === 1) {
                        const center = new Vector3(e.cx, e.cy, 0);
                        const vrx = new Vector3(e.lx / 2, 0, 0);
                        const vlx = new Vector3(-e.lx / 2, 0, 0);
                        const euler = new Euler(0, 0, w.relativeAngle);
                        w.leftPoint = center.clone().add(vlx.applyEuler(euler)).toArray();
                        w.rightPoint = center.clone().add(vrx.applyEuler(euler)).toArray();
                        w.roofId = undefined;
                        w.leftRoofHeight = undefined;
                        w.rightRoofHeight = undefined;
                        w.centerLeftRoofHeight = undefined;
                        w.centerRightRoofHeight = undefined;
                        w.centerRoofHeight = undefined;
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
                            }
                          }
                        }
                        state.elements.push(...pastedElements);
                        state.elements.push(e);
                        state.elementsToPaste = [e];
                      } else if (state.elementsToPaste.length > 1) {
                        const cutElements = state.copyCutElements();
                        if (cutElements.length > 0) {
                          cutElements[0].cx += step.x;
                          cutElements[0].cy -= step.y;
                          state.elements.push(...cutElements);
                          pastedElements.push(...cutElements);
                          state.elementsToPaste = cutElements;
                          state.selectedElementIdSet.clear();
                          state.selectedElementIdSet.add(cutElements[0].id);
                          state.selectedElement = cutElements[0];
                        }
                      }
                      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                      approved = true;
                      break;
                  }
                  if (state.elementsToPaste.length === 1 && approved) {
                    pastedElements.push(e);
                    state.selectedElementIdSet.clear();
                    state.selectedElementIdSet.add(e.id);
                    state.selectedElement = e;
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
                      bifacialityFactor: parseFloat(row[21].trim()),
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
          horizontalSolarRadiationData: {},
          loadHorizontalSolarRadiationData() {
            const radiationData: SolarRadiationData[] = [];
            Papa.parse(solar_radiation_horizontal, {
              download: true,
              complete: function (results) {
                for (const row of results.data) {
                  if (Array.isArray(row) && row.length > 1) {
                    const data: number[] = [];
                    for (let i = 2; i < 14; i++) {
                      data.push(parseFloat(row[i].trim()));
                    }
                    const sr = {
                      city: row[0].trim(),
                      country: row[1].trim(),
                      data: data,
                    } as SolarRadiationData;
                    radiationData.push(sr);
                  }
                }
                immerSet((state: CommonStoreState) => {
                  for (const x of radiationData) {
                    state.horizontalSolarRadiationData[x.city + ', ' + x.country] = x;
                  }
                });
              },
            });
          },
          getHorizontalSolarRadiation(location) {
            return get().horizontalSolarRadiationData[location];
          },
          verticalSolarRadiationData: {},
          loadVerticalSolarRadiationData() {
            const radiationData: SolarRadiationData[] = [];
            Papa.parse(solar_radiation_vertical, {
              download: true,
              complete: function (results) {
                for (const row of results.data) {
                  if (Array.isArray(row) && row.length > 1) {
                    const data: number[] = [];
                    for (let i = 2; i < 14; i++) {
                      data.push(parseFloat(row[i].trim()));
                    }
                    const sr = {
                      city: row[0].trim(),
                      country: row[1].trim(),
                      data: data,
                    } as SolarRadiationData;
                    radiationData.push(sr);
                  }
                }
                immerSet((state: CommonStoreState) => {
                  for (const x of radiationData) {
                    state.verticalSolarRadiationData[x.city + ', ' + x.country] = x;
                  }
                });
              },
            });
          },
          getVerticalSolarRadiation(location) {
            return get().verticalSolarRadiationData[location];
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
          updateSceneRadius() {
            immerSet((state: CommonStoreState) => {
              state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
            });
          },
          sceneRadius: 100,
          setSceneRadius(radius) {
            immerSet((state: CommonStoreState) => {
              state.sceneRadius = radius;
            });
          },

          selectedElementAngle: 0,
          selectedElementHeight: 0,
          selectedElementX: 0,
          selectedElementY: 0,

          isAddingElement() {
            return !!(
              get().addedCuboidId ||
              get().addedFoundationId ||
              get().addedWallId ||
              get().addedWindowId ||
              get().addedDoorId
            );
          },

          addedFoundationId: null,
          deletedFoundationId: null,

          addedCuboidId: null,
          deletedCuboidId: null,

          addedWallId: null,
          deletedWallId: null,
          updateWallMapOnFoundationFlag: false,
          updateWallMapOnFoundation() {
            immerSet((state: CommonStoreState) => {
              state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
            });
          },

          updateElementOnRoofFlag: false,
          setUpdateElementOnRoofFlag(b) {
            immerSet((state: CommonStoreState) => {
              state.updateElementOnRoofFlag = b;
            });
          },
          updateElementOnRoofFn() {
            immerSet((state: CommonStoreState) => {
              state.updateElementOnRoofFlag = true;
            });
          },

          addedWindowId: null,

          addedDoorId: null,

          addedRoofIdSet: new Set(),
          deletedRoofId: null,
          deletedRoofIdSet: new Set(),
          autoDeletedRoofs: null,
          autoDeletedRoofIdSet: new Set(),
          autoDeletedChild: null,
          getAutoDeletedElements() {
            const autoDeletedRoofs = get().autoDeletedRoofs;
            const autoDeletedChild = get().autoDeletedChild;

            if (!autoDeletedRoofs || !autoDeletedChild) return null;

            const arr = [...autoDeletedRoofs, ...autoDeletedChild];
            return arr;
          },
          deleteAddedRoofId(id: string) {
            immerSet((state) => {
              state.addedRoofIdSet.delete(id);
            });
          },

          groupActionMode: false,
          setGroupActionMode(b: boolean) {
            immerSet((state) => {
              state.groupActionMode = b;
            });
          },
          groupActionUpdateFlag: false,

          locale: enUS,
          localFileName: 'aladdin.ala',
          createNewFileFlag: false,
          setCreateNewFileFlag(b) {
            immerSet((state) => {
              state.createNewFileFlag = b;
            });
          },
          openLocalFileFlag: false,
          setOpenLocalFileFlag(b) {
            immerSet((state) => {
              state.openLocalFileFlag = b;
            });
          },
          localFileDialogRequested: false,
          loggable: false,
          actionInfo: undefined,
          currentUndoable: undefined,
          showCloudFileTitleDialog: false,
          showCloudFileTitleDialogFlag: false,
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
        storage: createJSONStorage(() => {
          const params = new URLSearchParams(window.location.search);
          const viewOnly = params.get('viewonly') === 'true';
          return viewOnly ? sessionStorage : localStorage;
        }),
        skipHydration: Util.isOpenFromURL(),
        partialize: (state) => ({
          language: state.language,
          animate24Hours: state.animate24Hours,
          floatingWindowOpacity: state.floatingWindowOpacity,
          selectedFloatingWindow: state.selectedFloatingWindow,
          locale: state.locale,
          cloudFile: state.cloudFile,
          latestModelSite: state.latestModelSite,
          modelSites: state.modelSites,
          modelsMapLatitude: state.modelsMapLatitude,
          modelsMapLongitude: state.modelsMapLongitude,
          modelsMapAddress: state.modelsMapAddress,
          modelsMapZoom: state.modelsMapZoom,
          modelsMapType: state.modelsMapType,
          modelsMapTilt: state.modelsMapTilt,
          world: state.world,
          elements: state.elements,
          viewState: state.viewState,
          graphState: state.graphState,
          actionState: state.actionState,
          modelType: state.modelType,
          modelAuthor: state.modelAuthor,
          modelLabel: state.modelLabel,
          modelDescription: state.modelDescription,
          projectView: state.projectView,
          projectInfo: state.projectInfo,
          designProjectType: state.designProjectType,
          notes: state.notes,
          user: state.user,
          sceneRadius: state.sceneRadius,
          weatherData: state.weatherData,
          solarPanelArrayLayoutParams: state.solarPanelArrayLayoutParams,
          solarPanelArrayLayoutConstraints: state.solarPanelArrayLayoutConstraints,
          economicsParams: state.economicsParams,
          evolutionMethod: state.evolutionMethod,
          evolutionaryAlgorithmState: state.evolutionaryAlgorithmState,
          geneticAlgorithmWizardSelectedTab: state.geneticAlgorithmWizardSelectedTab,
          particleSwarmOptimizationWizardSelectedTab: state.particleSwarmOptimizationWizardSelectedTab,
          minimumNavigationMoveSpeed: state.minimumNavigationMoveSpeed,
          minimumNavigationTurnSpeed: state.minimumNavigationTurnSpeed,
        }),
      },
    ),
  ),
);
