/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import produce, { enableMapSet } from 'immer';
import { WorldModel } from '../models/WorldModel';
import { ElementModel } from '../models/ElementModel';
import { WeatherModel } from '../models/WeatherModel';
import weather from '../resources/weather.csv';
import solar_radiation_horizontal from '../resources/solar_radiation_horizontal.csv';
import solar_radiation_vertical from '../resources/solar_radiation_vertical.csv';
import pvmodules from '../resources/pvmodules.csv';
import Papa from 'papaparse';
import { Util } from '../Util';
import {
  ActionInfo,
  ActionType,
  CuboidTexture,
  DatumEntry,
  ElementState,
  EvolutionMethod,
  FlowerType,
  FoundationTexture,
  HumanName,
  LineStyle,
  MoveHandleType,
  ObjectType,
  OldRooftopElementData,
  Orientation,
  ParabolicDishStructureType,
  PolygonTexture,
  ResizeHandleType,
  RoofHandleType,
  RotateHandleType,
  Scope,
  SolarStructure,
  TrackerType,
  TreeType,
  User,
  WallTexture,
} from '../types';
import { DefaultWorldModel } from './DefaultWorldModel';
import { Box3, Euler, Raycaster, Vector2, Vector3 } from 'three';
import { ElementModelCloner } from '../models/ElementModelCloner';
import { DefaultViewState } from './DefaultViewState';
import { ViewState } from './ViewState';
import short from 'short-uuid';
import { ElementModelFactory } from '../models/ElementModelFactory';
import { GroundModel } from '../models/GroundModel';
import { PvModel } from '../models/PvModel';
import { ThreeEvent } from '@react-three/fiber';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { WallModel, WallStructure } from '../models/WallModel';
import { Locale } from 'antd/lib/locale-provider';
import enUS from 'antd/lib/locale/en_US';
import { Undoable } from '../undo/Undoable';
import { UndoManager } from '../undo/UndoManager';
import { TreeModel } from '../models/TreeModel';
import { HumanModel } from '../models/HumanModel';
import { FoundationModel } from '../models/FoundationModel';
import { CuboidModel } from '../models/CuboidModel';
import { FLOATING_WINDOW_OPACITY, GROUND_ID, HALF_PI, ORIGIN_VECTOR2, UNIT_VECTOR_POS_Z_ARRAY } from '../constants';
import { PolygonModel } from '../models/PolygonModel';
import { Point2 } from '../models/Point2';
import { useStoreRef } from './commonRef';
import { showError } from '../helpers';
import i18n from '../i18n/i18n';
import { HumanData } from '../HumanData';
import { SolarPanelArrayLayoutParams } from './SolarPanelArrayLayoutParams';
import { DefaultSolarPanelArrayLayoutParams } from './DefaultSolarPanelArrayLayoutParams';
import { Vantage } from '../analysis/Vantage';
import { SolarCollector } from '../models/SolarCollector';
import { ConcentratedSolarPowerCollector } from '../models/ConcentratedSolarPowerCollector';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import { ElementCounter } from './ElementCounter';
import { ParabolicCollector } from '../models/ParabolicCollector';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { HeliostatModel } from '../models/HeliostatModel';
import { SolarRadiationData } from '../models/SolarRadiationData';
import { SolarUpdraftTowerModel } from '../models/SolarUpdraftTowerModel';
import { SolarAbsorberPipeModel } from '../models/SolarAbsorberPipeModel';
import { SolarPowerTowerModel } from '../models/SolarPowerTowerModel';
import { EvolutionaryAlgorithmState } from './EvolutionaryAlgorithmState';
import { DefaultEvolutionaryAlgorithmState } from './DefaultEvolutionaryAlgorithmState';
import { RoofModel, RoofStructure } from 'src/models/RoofModel';
import { SolarPanelArrayLayoutConstraints } from './SolarPanelArrayLayoutConstraints';
import { DefaultSolarPanelArrayLayoutConstraints } from './DefaultSolarPanelArrayLayoutConstraints';
import { EconomicsParams } from './EconomicsParams';
import { DefaultEconomicsParams } from './DefaultEconomicsParams';
import dayjs from 'dayjs';
import { RoofUtil } from 'src/views/roof/RoofUtil';
import { FlowerModel } from '../models/FlowerModel';
import { FlowerData } from '../FlowerData';
import { WindowModel, WindowType } from '../models/WindowModel';
import { ActionState } from './ActionState';
import { DefaultActionState } from './DefaultActionState';
import { LightModel } from '../models/LightModel';
import { HvacSystem } from '../models/HvacSystem';
import { usePrimitiveStore } from './commonPrimitive';

enableMapSet();

export interface CommonStoreState {
  set: (fn: (state: CommonStoreState) => void) => void;

  // only the following properties are persisted (see the whitelist at the end)
  world: WorldModel;
  elements: ElementModel[];
  viewState: ViewState;
  actionState: ActionState;
  notes: string[];
  user: User;
  userCount: number;
  language: string;
  floatingWindowOpacity: number;
  cloudFile: string | undefined;

  // store the calculated heat map on the surface of an element
  heatmaps: Map<string, number[][]>;
  setHeatmap: (id: string, data: number[][]) => void;
  getHeatmap: (id: string) => number[][] | undefined;
  clearHeatmaps: () => void;

  roofSegmentVerticesMap: Map<string, Vector3[][]>; // key: roofId, val: [segmentIndex][vertex]
  getRoofSegmentVertices: (id: string) => Vector3[][] | undefined;
  roofSegmentVerticesWithoutOverhangMap: Map<string, Vector3[][]>;
  setRoofSegmentVerticesWithoutOverhang: (id: string, data: Vector3[][]) => void;
  getRoofSegmentVerticesWithoutOverhang: (id: string) => Vector3[][] | undefined;

  ray: Raycaster;
  mouse: Vector2;

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
  animateSun: boolean;
  animate24Hours: boolean;
  runDailyThermalSimulation: boolean;
  pauseDailyThermalSimulation: boolean;
  runYearlyThermalSimulation: boolean;
  pauseYearlyThermalSimulation: boolean;
  runDynamicSimulation: boolean;
  runStaticSimulation: boolean;
  pauseSimulation: boolean;
  runEvolution: boolean;
  pauseEvolution: boolean;
  evolutionMethod: EvolutionMethod;
  objectiveEvaluationIndex: number; // index for evaluating objective function in genetic algorithms
  clickObjectType: ObjectType | null;
  contextMenuObjectType: ObjectType | null;
  hoveredHandle: MoveHandleType | ResizeHandleType | RotateHandleType | RoofHandleType | null;
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
  getParent: (child: ElementModel) => ElementModel | null;
  getFoundation: (elem: ElementModel) => FoundationModel | null;
  selectMe: (id: string, e: ThreeEvent<MouseEvent>, action?: ActionType) => void;
  selectNone: () => void;
  setElementPosition: (id: string, x: number, y: number, z?: number) => void;
  setElementNormal: (id: string, x: number, y: number, z: number) => void;
  setElementSize: (id: string, lx: number, ly: number, lz?: number) => void;

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
  updateFoundationTextureById: (id: string, texture: FoundationTexture) => void;
  updateFoundationTextureForAll: (texture: FoundationTexture) => void;
  updateFoundationSolarStructureById: (id: string, receiver: SolarStructure | undefined) => void;
  updateFoundationThermostatSetpointById: (id: string, value: number) => void;
  updateFoundationTemperatureThresholdById: (id: string, value: number) => void;

  // for solar absorber pipes
  updateSolarAbsorberPipeRelativeLengthById: (id: string, relativeLength: number) => void;
  updateSolarAbsorberPipeApertureWidthById: (id: string, apertureWidth: number) => void;
  updateSolarAbsorberPipeApertureWidthForAll: (apertureWidth: number) => void;
  updateSolarAbsorberPipePoleNumberById: (id: string, poleNumber: number) => void;
  updateSolarAbsorberPipePoleNumberForAll: (poleNumber: number) => void;
  updateSolarAbsorberPipeHeightById: (id: string, height: number) => void;
  updateSolarAbsorberPipeHeightForAll: (height: number) => void;
  updateSolarAbsorberPipeAbsorptanceById: (id: string, absorptance: number) => void;
  updateSolarAbsorberPipeAbsorptanceForAll: (absorptance: number) => void;
  updateSolarAbsorberPipeOpticalEfficiencyById: (id: string, efficiency: number) => void;
  updateSolarAbsorberPipeOpticalEfficiencyForAll: (efficiency: number) => void;
  updateSolarAbsorberPipeThermalEfficiencyById: (id: string, efficiency: number) => void;
  updateSolarAbsorberPipeThermalEfficiencyForAll: (efficiency: number) => void;

  // for solar power towers
  updateSolarPowerTowerHeightById: (id: string, height: number) => void;
  updateSolarPowerTowerHeightForAll: (height: number) => void;
  updateSolarPowerTowerRadiusById: (id: string, radius: number) => void;
  updateSolarPowerTowerRadiusForAll: (radius: number) => void;
  updateSolarPowerTowerReceiverAbsorptanceById: (id: string, absorptance: number) => void;
  updateSolarPowerTowerReceiverAbsorptanceForAll: (absorptance: number) => void;
  updateSolarPowerTowerReceiverOpticalEfficiencyById: (id: string, efficiency: number) => void;
  updateSolarPowerTowerReceiverOpticalEfficiencyForAll: (efficiency: number) => void;
  updateSolarPowerTowerReceiverThermalEfficiencyById: (id: string, efficiency: number) => void;
  updateSolarPowerTowerReceiverThermalEfficiencyForAll: (efficiency: number) => void;

  // for solar updraft towers
  updateSolarUpdraftTowerChimneyHeightById: (id: string, height: number) => void;
  updateSolarUpdraftTowerChimneyHeightForAll: (height: number) => void;
  updateSolarUpdraftTowerChimneyRadiusById: (id: string, radius: number) => void;
  updateSolarUpdraftTowerChimneyRadiusForAll: (radius: number) => void;
  updateSolarUpdraftTowerCollectorHeightById: (id: string, height: number) => void;
  updateSolarUpdraftTowerCollectorHeightForAll: (height: number) => void;
  updateSolarUpdraftTowerCollectorRadiusById: (id: string, radius: number) => void;
  updateSolarUpdraftTowerCollectorRadiusForAll: (radius: number) => void;
  updateSolarUpdraftTowerCollectorTransmissivityById: (id: string, transmissivity: number) => void;
  updateSolarUpdraftTowerCollectorTransmissivityForAll: (transmissivity: number) => void;
  updateSolarUpdraftTowerCollectorEmissivityById: (id: string, emissivity: number) => void;
  updateSolarUpdraftTowerCollectorEmissivityForAll: (emissivity: number) => void;
  updateSolarUpdraftTowerDischargeCoefficientById: (id: string, coefficient: number) => void;
  updateSolarUpdraftTowerDischargeCoefficientForAll: (coefficient: number) => void;
  updateSolarUpdraftTowerTurbineEfficiencyById: (id: string, efficiency: number) => void;
  updateSolarUpdraftTowerTurbineEfficiencyForAll: (efficiency: number) => void;

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
  updatePolygonLineStyleOnSurface: (parentId: string, normal: number[] | undefined, style: LineStyle) => void;
  updatePolygonLineStyleAboveFoundation: (foundationId: string, style: LineStyle) => void;
  updatePolygonLineStyleForAll: (style: LineStyle) => void;
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

  updateSolarPanelFrameColorById: (id: string, frameColor: string) => void;
  updateSolarPanelFrameColorOnSurface: (parentId: string, normal: number[] | undefined, frameColor: string) => void;
  updateSolarPanelFrameColorAboveFoundation: (foundationId: string, frameColor: string) => void;
  updateSolarPanelFrameColorForAll: (frameColor: string) => void;

  updateSolarPanelTiltAngleById: (id: string, tiltAngle: number) => void;
  updateSolarPanelTiltAngleOnSurface: (parentId: string, normal: number[] | undefined, tiltAngle: number) => void;
  updateSolarPanelTiltAngleAboveFoundation: (foundationId: string, tiltAngle: number, isReverse?: boolean) => void;
  updateSolarPanelTiltAngleForAll: (tiltAngle: number, isReverse?: boolean) => void;

  setSolarPanelOrientation: (sp: SolarPanelModel, pvModel: PvModel, orientation: Orientation) => void;
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

  updateSolarPanelPoleSpacingById: (id: string, poleSpacing: number) => void;
  updateSolarPanelPoleSpacingOnSurface: (parentId: string, normal: number[] | undefined, poleSpacing: number) => void;
  updateSolarPanelPoleSpacingAboveFoundation: (foundationId: string, poleSpacing: number) => void;
  updateSolarPanelPoleSpacingForAll: (poleSpacing: number) => void;

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
  updateParabolicDishStructureTypeById: (id: string, structureType: ParabolicDishStructureType) => void;
  updateParabolicDishStructureTypeAboveFoundation: (
    foundationId: string,
    structureType: ParabolicDishStructureType,
  ) => void;
  updateParabolicDishStructureTypeForAll: (structureType: ParabolicDishStructureType) => void;

  // for parabolic troughs and Fresnel reflectors
  updateModuleLengthById: (id: string, moduleLength: number) => void;
  updateModuleLengthAboveFoundation: (type: ObjectType, foundationId: string, moduleLength: number) => void;
  updateModuleLengthForAll: (type: ObjectType, moduleLength: number) => void;

  // for parabolic troughs and dishes
  updateParabolaLatusRectumById: (id: string, latusRectum: number) => void;
  updateParabolaLatusRectumAboveFoundation: (type: ObjectType, foundationId: string, latusRectum: number) => void;
  updateParabolaLatusRectumForAll: (type: ObjectType, latusRectum: number) => void;

  // for walls
  wallActionScope: Scope;
  setWallActionScope: (scope: Scope) => void;

  // for roofs
  roofActionScope: Scope;
  setRoofActionScope: (scope: Scope) => void;

  // for windows
  windowActionScope: Scope;
  setWindowActionScope: (scope: Scope) => void;
  updateWindowMullionById: (id: string, mullion: boolean) => void;
  updateWindowTypeById: (id: string, type: WindowType) => void;

  // for doors
  doorActionScope: Scope;
  setDoorActionScope: (scope: Scope) => void;

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

  updateWallStructureById: (id: string, structure: WallStructure) => void;

  // for roofs
  updateRoofRiseById: (id: string, rise: number) => void;
  updateRoofStructureById: (id: string, structure: RoofStructure) => void;

  // for plants
  updateTreeTypeById: (id: string, type: TreeType) => void;
  updateTreeShowModelById: (id: string, showModel: boolean) => void;
  updateTreeFlipById: (id: string, flip: boolean) => void;
  updateFlowerTypeById: (id: string, type: FlowerType) => void;
  updateFlowerFlipById: (id: string, flip: boolean) => void;

  // for humans
  updateHumanNameById: (id: string, name: HumanName) => void;
  updateHumanFlipById: (id: string, yes: boolean) => void;
  updateHumanObserverById: (id: string, yes: boolean) => void;

  // for lights
  updateLightColorById: (id: string, color: string) => void;
  updateLightIntensityById: (id: string, intensity: number) => void;
  updateLightDistanceById: (id: string, distance: number) => void;
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
  removeElementById: (id: string, cut: boolean) => void; // set cut to false for deletion
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
  countAllOffspringsByTypeAtOnce: (ancestorId: string, includingLocked: boolean) => ElementCounter;
  countSolarPanelsOnRack: (id: string) => number;
  clearAllSolarPanelYields: () => void;
  removeAllChildElementsByType: (parentId: string, type: ObjectType) => void;
  removeAllElementsOnFoundationByType: (foundationId: string, type: ObjectType) => void;

  runDailyLightSensor: boolean;
  pauseDailyLightSensor: boolean;
  runYearlyLightSensor: boolean;
  pauseYearlyLightSensor: boolean;
  dailyLightSensorData: DatumEntry[];
  setDailyLightSensorData: (data: DatumEntry[]) => void;
  yearlyLightSensorData: DatumEntry[];
  setYearlyLightSensorData: (data: DatumEntry[]) => void;
  sensorLabels: string[];
  setSensorLabels: (labels: string[]) => void;

  runSolarPanelVisibilityAnalysis: boolean;
  solarPanelVisibilityResults: Map<Vantage, Map<string, number>>;
  runDailySimulationForSolarPanels: boolean;
  runDailySimulationForSolarPanelsLastStep: boolean;
  pauseDailySimulationForSolarPanels: boolean;
  runYearlySimulationForSolarPanels: boolean;
  runYearlySimulationForSolarPanelsLastStep: boolean;
  pauseYearlySimulationForSolarPanels: boolean;
  dailyPvYield: DatumEntry[];
  dailyPvIndividualOutputs: boolean;
  setDailyPvYield: (data: DatumEntry[]) => void;
  sumDailyPvYield: () => number;
  getDailyPvProfit: () => number;
  yearlyPvYield: DatumEntry[];
  yearlyPvIndividualOutputs: boolean;
  setYearlyPvYield: (data: DatumEntry[]) => void;
  sumYearlyPvYield: () => number;
  getYearlyPvProfit: () => number;
  solarPanelLabels: string[];
  setSolarPanelLabels: (labels: string[]) => void;

  runDailySimulationForParabolicTroughs: boolean;
  runYearlySimulationForParabolicTroughs: boolean;
  pauseDailySimulationForParabolicTroughs: boolean;
  pauseYearlySimulationForParabolicTroughs: boolean;
  dailyParabolicTroughYield: DatumEntry[];
  dailyParabolicTroughIndividualOutputs: boolean;
  setDailyParabolicTroughYield: (data: DatumEntry[]) => void;
  sumDailyParabolicTroughYield: () => number;
  yearlyParabolicTroughYield: DatumEntry[];
  yearlyParabolicTroughIndividualOutputs: boolean;
  setYearlyParabolicTroughYield: (data: DatumEntry[]) => void;
  sumYearlyParabolicTroughYield: () => number;
  parabolicTroughLabels: string[];
  setParabolicTroughLabels: (labels: string[]) => void;

  runDailySimulationForParabolicDishes: boolean;
  runYearlySimulationForParabolicDishes: boolean;
  pauseDailySimulationForParabolicDishes: boolean;
  pauseYearlySimulationForParabolicDishes: boolean;
  dailyParabolicDishYield: DatumEntry[];
  dailyParabolicDishIndividualOutputs: boolean;
  setDailyParabolicDishYield: (data: DatumEntry[]) => void;
  sumDailyParabolicDishYield: () => number;
  yearlyParabolicDishYield: DatumEntry[];
  yearlyParabolicDishIndividualOutputs: boolean;
  setYearlyParabolicDishYield: (data: DatumEntry[]) => void;
  sumYearlyParabolicDishYield: () => number;
  parabolicDishLabels: string[];
  setParabolicDishLabels: (labels: string[]) => void;

  runDailySimulationForFresnelReflectors: boolean;
  runYearlySimulationForFresnelReflectors: boolean;
  pauseDailySimulationForFresnelReflectors: boolean;
  pauseYearlySimulationForFresnelReflectors: boolean;
  dailyFresnelReflectorYield: DatumEntry[];
  dailyFresnelReflectorIndividualOutputs: boolean;
  setDailyFresnelReflectorYield: (data: DatumEntry[]) => void;
  sumDailyFresnelReflectorYield: () => number;
  yearlyFresnelReflectorYield: DatumEntry[];
  yearlyFresnelReflectorIndividualOutputs: boolean;
  setYearlyFresnelReflectorYield: (data: DatumEntry[]) => void;
  sumYearlyFresnelReflectorYield: () => number;
  fresnelReflectorLabels: string[];
  setFresnelReflectorLabels: (labels: string[]) => void;

  runDailySimulationForHeliostats: boolean;
  runYearlySimulationForHeliostats: boolean;
  pauseDailySimulationForHeliostats: boolean;
  pauseYearlySimulationForHeliostats: boolean;
  dailyHeliostatYield: DatumEntry[];
  dailyHeliostatIndividualOutputs: boolean;
  setDailyHeliostatYield: (data: DatumEntry[]) => void;
  sumDailyHeliostatYield: () => number;
  yearlyHeliostatYield: DatumEntry[];
  yearlyHeliostatIndividualOutputs: boolean;
  setYearlyHeliostatYield: (data: DatumEntry[]) => void;
  sumYearlyHeliostatYield: () => number;
  heliostatLabels: string[];
  setHeliostatLabels: (labels: string[]) => void;

  runDailySimulationForUpdraftTower: boolean;
  runYearlySimulationForUpdraftTower: boolean;
  pauseDailySimulationForUpdraftTower: boolean;
  pauseYearlySimulationForUpdraftTower: boolean;
  dailyUpdraftTowerIndividualOutputs: boolean;
  dailyUpdraftTowerResults: DatumEntry[];
  dailyUpdraftTowerYield: DatumEntry[];
  setDailyUpdraftTowerResults: (data: DatumEntry[]) => void;
  setDailyUpdraftTowerYield: (data: DatumEntry[]) => void;
  sumDailyUpdraftTowerYield: () => number;
  yearlyUpdraftTowerYield: DatumEntry[];
  yearlyUpdraftTowerIndividualOutputs: boolean;
  setYearlyUpdraftTowerYield: (data: DatumEntry[]) => void;
  sumYearlyUpdraftTowerYield: () => number;
  updraftTowerLabels: string[];
  setUpdraftTowerLabels: (labels: string[]) => void;

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
  updateElementOnRoofFn: () => void;

  updateRoofFlag: boolean;

  addedWindowId: string | null;
  deletedWindowAndParentId: string[] | null;

  addedDoorId: string | null;
  deletedDoorAndParentId: string[] | null;

  addedRoofId: string | null;
  deletedRoofId: string | null;
  setAddedRoofId: (id: string | null) => void;

  // used for undo/redo for elements on roof
  OldRooftopElementData: OldRooftopElementData | null;
  setOldRooftopElementData: (data: OldRooftopElementData | null) => void;

  groupActionMode: boolean;
  setGroupActionMode: (b: boolean) => void;
  elementGroupId: string | null;
  setElementGroupId: (id: string | null) => void;
  groupActionUpdateFlag: boolean;

  loadingFile: boolean;
  simulationInProgress: boolean;
  simulationPaused: boolean;
  evolutionInProgress: boolean;
  evolutionPaused: boolean;
  showSolarRadiationHeatmap: boolean;
  locale: Locale;
  localFileName: string;
  createNewFileFlag: boolean;
  openLocalFileFlag: boolean;
  saveLocalFileFlag: boolean;
  saveLocalFileDialogVisible: boolean;
  enableFineGrid: boolean;
  setEnableFineGrid: (b: boolean) => void;

  loggable: boolean;
  actionInfo: ActionInfo | undefined;
  currentUndoable: Undoable | undefined;
  showCloudFileTitleDialog: boolean;
  // we have to use the sure flip of an additional flag to ensure it triggers useEffect hook
  showCloudFileTitleDialogFlag: boolean;
  saveCloudFileFlag: boolean;
  listCloudFilesFlag: boolean;
  localContentToImportAfterCloudFileUpdate: any;

  solarPanelArrayLayoutParams: SolarPanelArrayLayoutParams;
  solarPanelArrayLayoutConstraints: SolarPanelArrayLayoutConstraints;
  evolutionaryAlgorithmState: EvolutionaryAlgorithmState;
  economicsParams: EconomicsParams;

  geneticAlgorithmWizardSelectedTab: string;
  particleSwarmOptimizationWizardSelectedTab: string;

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
          viewState: new DefaultViewState(),
          actionState: new DefaultActionState(),
          solarPanelArrayLayoutParams: new DefaultSolarPanelArrayLayoutParams(),
          solarPanelArrayLayoutConstraints: new DefaultSolarPanelArrayLayoutConstraints(),
          evolutionaryAlgorithmState: new DefaultEvolutionaryAlgorithmState(),
          economicsParams: new DefaultEconomicsParams(),
          geneticAlgorithmWizardSelectedTab: '1',
          particleSwarmOptimizationWizardSelectedTab: '1',
          notes: [],
          user: {} as User,
          userCount: 0,
          language: 'en',
          floatingWindowOpacity: FLOATING_WINDOW_OPACITY,
          cloudFile: undefined,

          heatmaps: new Map<string, number[][]>(),
          setHeatmap(id, data) {
            immerSet((state: CommonStoreState) => {
              state.heatmaps.set(id, data);
            });
          },
          getHeatmap(id) {
            // not sure why this cannot be handled with immer
            return get().heatmaps.get(id);
          },
          clearHeatmaps() {
            immerSet((state: CommonStoreState) => {
              state.heatmaps.clear();
            });
          },

          roofSegmentVerticesMap: new Map<string, Vector3[][]>(),
          getRoofSegmentVertices(id) {
            return get().roofSegmentVerticesMap.get(id);
          },
          roofSegmentVerticesWithoutOverhangMap: new Map<string, Vector3[][]>(),
          setRoofSegmentVerticesWithoutOverhang(id, data) {
            immerSet((state: CommonStoreState) => {
              state.roofSegmentVerticesWithoutOverhangMap.set(id, data);
            });
          },
          getRoofSegmentVerticesWithoutOverhang(id) {
            return get().roofSegmentVerticesWithoutOverhangMap.get(id);
          },

          ray: new Raycaster(),
          mouse: new Vector2(),

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
              state.undoManager.clear();
              state.heatmaps.clear();
              usePrimitiveStore.setState((state) => {
                state.hourlyHeatExchangeArrayMap = new Map<string, number[]>();
                state.hourlySolarHeatGainArrayMap = new Map<string, number[]>();
                state.hourlySolarPanelOutputArrayMap = new Map<string, number[]>();
              });
              state.world = content.world;
              state.viewState = content.view;
              state.elements = content.elements;
              state.notes = content.notes ?? [];
              state.cloudFile = title;
              state.currentUndoable = undefined;
              state.actionInfo = undefined;
              state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
              state.changed = false;
              state.skipChange = true;
              state.localContentToImportAfterCloudFileUpdate = undefined;
              state.fileChanged = !state.fileChanged;
              state.showSolarRadiationHeatmap = false;
              state.evolutionMethod = content.evolutionMethod ?? EvolutionMethod.GENETIC_ALGORITHM;
              state.solarPanelArrayLayoutParams =
                content.solarPanelArrayLayoutParams ?? new DefaultSolarPanelArrayLayoutParams();
              state.solarPanelArrayLayoutConstraints =
                content.solarPanelArrayLayoutConstraints ?? new DefaultSolarPanelArrayLayoutConstraints();
              state.evolutionaryAlgorithmState =
                content.evolutionaryAlgorithmState ?? new DefaultEvolutionaryAlgorithmState();
              state.economicsParams = content.economicsParams ?? new DefaultEconomicsParams();
              // clear existing data, if any
              state.dailyLightSensorData.length = 0;
              state.yearlyLightSensorData.length = 0;
              state.dailyPvYield.length = 0;
              state.yearlyPvYield.length = 0;
              state.dailyParabolicDishYield.length = 0;
              state.yearlyParabolicDishYield.length = 0;
              state.dailyParabolicTroughYield.length = 0;
              state.yearlyParabolicTroughYield.length = 0;
              state.dailyFresnelReflectorYield.length = 0;
              state.yearlyFresnelReflectorYield.length = 0;
              state.dailyHeliostatYield.length = 0;
              state.yearlyHeliostatYield.length = 0;
              state.dailyUpdraftTowerYield.length = 0;
              state.dailyUpdraftTowerResults.length = 0;
              state.yearlyUpdraftTowerYield.length = 0;
              state.fittestIndividualResults.length = 0;
              state.roofSegmentVerticesMap = new Map<string, Vector3[][]>();
              state.roofSegmentVerticesWithoutOverhangMap = new Map<string, Vector3[][]>();
            });
            // 1/6/2022: Humans previously did not have dimension data (which probably was a mistake).
            // We do this for backward compatibility. Otherwise, humans cannot be moved in old files.
            const state = get();
            for (const e of state.elements) {
              switch (e.type) {
                case ObjectType.Human:
                  const human = e as HumanModel;
                  const width = HumanData.fetchWidth(human.name);
                  state.setElementSize(human.id, width, width, HumanData.fetchHeight(human.name));
                  break;
              }
            }
          },
          exportContent() {
            const state = get();
            const date = new Date();
            const elements = JSON.parse(JSON.stringify(state.elements));
            Util.fixElements(elements);
            return {
              docid: short.generate(),
              time: dayjs(date).format('MM/DD/YYYY hh:mm a'),
              timestamp: date.getTime(),
              userid: state.user.uid,
              owner: state.user.signFile ? state.user.displayName : null,
              email: state.user.signFile ? state.user.email : null,
              world: JSON.parse(JSON.stringify(state.world)),
              elements: elements,
              view: JSON.parse(JSON.stringify(state.viewState)),
              evolutionMethod: state.evolutionMethod,
              solarPanelArrayLayoutParams: JSON.parse(JSON.stringify(state.solarPanelArrayLayoutParams)),
              solarPanelArrayLayoutConstraints: JSON.parse(JSON.stringify(state.solarPanelArrayLayoutConstraints)),
              evolutionaryAlgorithmState: JSON.parse(JSON.stringify(state.evolutionaryAlgorithmState)),
              economicsParams: JSON.parse(JSON.stringify(state.economicsParams)),
              notes: state.notes,
            };
          },
          clearContent() {
            immerSet((state: CommonStoreState) => {
              state.elements = [];
              state.heatmaps.clear();
              state.roofSegmentVerticesMap.clear();
              state.roofSegmentVerticesWithoutOverhangMap.clear();
            });
          },
          createEmptyFile() {
            immerSet((state: CommonStoreState) => {
              DefaultWorldModel.resetWorldModel(state.world);
              DefaultViewState.resetViewState(state.viewState);
              // don't create a new instance like this (otherwise some UI elements may not update):
              // state.world = new DefaultWorldModel()
              state.elements = [];
              state.cloudFile = undefined;
              state.changed = true;
              state.skipChange = true;
              state.localContentToImportAfterCloudFileUpdate = undefined;
              state.notes = [];
              state.fileChanged = !state.fileChanged;
              state.showSolarRadiationHeatmap = false;
              state.currentUndoable = undefined;
              state.actionInfo = undefined;
              state.roofSegmentVerticesMap.clear();
              state.roofSegmentVerticesWithoutOverhangMap.clear();
              state.heatmaps.clear();
            });
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

          runDailyLightSensor: false,
          pauseDailyLightSensor: false,
          runYearlyLightSensor: false,
          pauseYearlyLightSensor: false,
          dailyLightSensorData: [],
          setDailyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyLightSensorData = [...data];
            });
          },
          yearlyLightSensorData: [],
          setYearlyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyLightSensorData = [...data];
            });
          },
          sensorLabels: [],
          setSensorLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.sensorLabels = [...labels];
            });
          },

          runSolarPanelVisibilityAnalysis: false,
          solarPanelVisibilityResults: new Map<Vantage, Map<string, number>>(),
          runDailySimulationForSolarPanels: false,
          runDailySimulationForSolarPanelsLastStep: false,
          pauseDailySimulationForSolarPanels: false,
          runYearlySimulationForSolarPanels: false,
          runYearlySimulationForSolarPanelsLastStep: false,
          pauseYearlySimulationForSolarPanels: false,
          dailyPvYield: [],
          dailyPvIndividualOutputs: false,
          setDailyPvYield(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyPvYield = [...data];
              // increment the index of objective evaluation to notify the genetic algorithm that
              // this simulation has completed and the result has been reported to the common store
              if (state.runEvolution) {
                state.objectiveEvaluationIndex++;
              }
            });
          },
          sumDailyPvYield() {
            let sum = 0;
            for (const datum of this.dailyPvYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Hour') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          getDailyPvProfit() {
            const dailyYield = this.sumDailyPvYield();
            const solarPanelNumber = Util.countAllSolarPanels();
            return (
              dailyYield * this.economicsParams.electricitySellingPrice -
              solarPanelNumber * this.economicsParams.operationalCostPerUnit
            );
          },
          yearlyPvYield: [],
          yearlyPvIndividualOutputs: false,
          setYearlyPvYield(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyPvYield = [...data];
              // increment the index of objective evaluation to notify the genetic algorithm that
              // this simulation has completed and the result has been reported to the common store
              if (state.runEvolution) {
                state.objectiveEvaluationIndex++;
              }
            });
          },
          sumYearlyPvYield() {
            let sum = 0;
            for (const datum of this.yearlyPvYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Month') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            const yearScaleFactor = 12 / (this.world?.daysPerYear ?? 6);
            return sum * yearScaleFactor;
          },
          getYearlyPvProfit() {
            const solarPanelNumber = Util.countAllSolarPanels();
            const yearlyYield = this.sumYearlyPvYield();
            return (
              yearlyYield * this.economicsParams.electricitySellingPrice -
              solarPanelNumber * this.economicsParams.operationalCostPerUnit * 365
            );
          },
          solarPanelLabels: [],
          setSolarPanelLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.solarPanelLabels = [...labels];
            });
          },

          runDailySimulationForParabolicTroughs: false,
          runYearlySimulationForParabolicTroughs: false,
          pauseDailySimulationForParabolicTroughs: false,
          pauseYearlySimulationForParabolicTroughs: false,
          dailyParabolicTroughYield: [],
          dailyParabolicTroughIndividualOutputs: false,
          setDailyParabolicTroughYield(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyParabolicTroughYield = [...data];
            });
          },
          sumDailyParabolicTroughYield() {
            let sum = 0;
            for (const datum of this.dailyParabolicTroughYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Hour') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          yearlyParabolicTroughYield: [],
          yearlyParabolicTroughIndividualOutputs: false,
          setYearlyParabolicTroughYield(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyParabolicTroughYield = [...data];
            });
          },
          sumYearlyParabolicTroughYield() {
            let sum = 0;
            for (const datum of this.yearlyParabolicTroughYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Month') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          parabolicTroughLabels: [],
          setParabolicTroughLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.parabolicTroughLabels = [...labels];
            });
          },

          runDailySimulationForParabolicDishes: false,
          runYearlySimulationForParabolicDishes: false,
          pauseDailySimulationForParabolicDishes: false,
          pauseYearlySimulationForParabolicDishes: false,
          dailyParabolicDishYield: [],
          dailyParabolicDishIndividualOutputs: false,
          setDailyParabolicDishYield(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyParabolicDishYield = [...data];
            });
          },
          sumDailyParabolicDishYield() {
            let sum = 0;
            for (const datum of this.dailyParabolicDishYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Hour') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          yearlyParabolicDishYield: [],
          yearlyParabolicDishIndividualOutputs: false,
          setYearlyParabolicDishYield(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyParabolicDishYield = [...data];
            });
          },
          sumYearlyParabolicDishYield() {
            let sum = 0;
            for (const datum of this.yearlyParabolicDishYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Month') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          parabolicDishLabels: [],
          setParabolicDishLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.parabolicDishLabels = [...labels];
            });
          },

          runDailySimulationForFresnelReflectors: false,
          runYearlySimulationForFresnelReflectors: false,
          pauseDailySimulationForFresnelReflectors: false,
          pauseYearlySimulationForFresnelReflectors: false,
          dailyFresnelReflectorYield: [],
          dailyFresnelReflectorIndividualOutputs: false,
          setDailyFresnelReflectorYield(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyFresnelReflectorYield = [...data];
            });
          },
          sumDailyFresnelReflectorYield() {
            let sum = 0;
            for (const datum of this.dailyFresnelReflectorYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Hour') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          yearlyFresnelReflectorYield: [],
          yearlyFresnelReflectorIndividualOutputs: false,
          setYearlyFresnelReflectorYield(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyFresnelReflectorYield = [...data];
            });
          },
          sumYearlyFresnelReflectorYield() {
            let sum = 0;
            for (const datum of this.yearlyFresnelReflectorYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Month') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          fresnelReflectorLabels: [],
          setFresnelReflectorLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.fresnelReflectorLabels = [...labels];
            });
          },

          runDailySimulationForHeliostats: false,
          runYearlySimulationForHeliostats: false,
          pauseDailySimulationForHeliostats: false,
          pauseYearlySimulationForHeliostats: false,
          dailyHeliostatYield: [],
          dailyHeliostatIndividualOutputs: false,
          setDailyHeliostatYield(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyHeliostatYield = [...data];
            });
          },
          sumDailyHeliostatYield() {
            let sum = 0;
            for (const datum of this.dailyHeliostatYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Hour') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          yearlyHeliostatYield: [],
          yearlyHeliostatIndividualOutputs: false,
          setYearlyHeliostatYield(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyHeliostatYield = [...data];
            });
          },
          sumYearlyHeliostatYield() {
            let sum = 0;
            for (const datum of this.yearlyHeliostatYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Month') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          heliostatLabels: [],
          setHeliostatLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.heliostatLabels = [...labels];
            });
          },

          runDailySimulationForUpdraftTower: false,
          runYearlySimulationForUpdraftTower: false,
          pauseDailySimulationForUpdraftTower: false,
          pauseYearlySimulationForUpdraftTower: false,
          dailyUpdraftTowerIndividualOutputs: false,
          dailyUpdraftTowerResults: [],
          dailyUpdraftTowerYield: [],
          setDailyUpdraftTowerResults(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyUpdraftTowerResults = [...data];
            });
          },
          setDailyUpdraftTowerYield(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyUpdraftTowerYield = [...data];
            });
          },
          sumDailyUpdraftTowerYield() {
            let sum = 0;
            for (const datum of this.dailyUpdraftTowerYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Hour') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          yearlyUpdraftTowerYield: [],
          yearlyUpdraftTowerIndividualOutputs: false,
          setYearlyUpdraftTowerYield(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyUpdraftTowerYield = [...data];
            });
          },
          sumYearlyUpdraftTowerYield() {
            let sum = 0;
            for (const datum of this.yearlyUpdraftTowerYield) {
              for (const prop in datum) {
                if (datum.hasOwnProperty(prop)) {
                  if (prop !== 'Month') {
                    sum += datum[prop] as number;
                  }
                }
              }
            }
            return sum;
          },
          updraftTowerLabels: [],
          setUpdraftTowerLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.updraftTowerLabels = [...labels];
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

          // aabb must be initialized with defined vectors or it may cause problems as it may be used to
          // determine the scopes of the axes.
          aabb: new Box3(new Vector3(-10, -10, -10), new Vector3(10, 10, 10)),
          animateSun: false,
          animate24Hours: false,
          runDailyThermalSimulation: false,
          pauseDailyThermalSimulation: false,
          runYearlyThermalSimulation: false,
          pauseYearlyThermalSimulation: false,
          runDynamicSimulation: false,
          runStaticSimulation: false,
          pauseSimulation: false,
          runEvolution: false,
          pauseEvolution: false,
          evolutionMethod: EvolutionMethod.GENETIC_ALGORITHM,
          objectiveEvaluationIndex: 0,
          clickObjectType: null,
          contextMenuObjectType: null,
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
              for (const e of get().elements) {
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
              const intersectableObjects = e.intersections.filter(
                (obj) => !obj.eventObject.name.startsWith('Wall Intersection Plane'),
              );
              if (intersectableObjects[0].object === e.eventObject) {
                immerSet((state) => {
                  for (const elem of state.elements) {
                    if (elem.id === id) {
                      elem.selected = true;
                      state.selectedElement = elem;
                      // TODO: lz is now zero for roof. So this may need to be set from elsewhere for roofs.
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
                    state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
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
                    state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
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
          updateFoundationSolarStructureById(id, structure) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  (e as FoundationModel).solarStructure = structure;
                  break;
                }
              }
            });
          },
          updateFoundationThermostatSetpointById(id, value) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id) {
                  const foundation = e as FoundationModel;
                  if (foundation.hvacSystem) {
                    foundation.hvacSystem.thermostatSetpoint = value;
                  } else {
                    foundation.hvacSystem = { thermostatSetpoint: value, temperatureThreshold: 3 } as HvacSystem;
                  }
                  break;
                }
              }
            });
          },
          updateFoundationTemperatureThresholdById(id, value) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id) {
                  const foundation = e as FoundationModel;
                  if (foundation.hvacSystem) {
                    foundation.hvacSystem.temperatureThreshold = value;
                  } else {
                    foundation.hvacSystem = { thermostatSetpoint: 20, temperatureThreshold: value } as HvacSystem;
                  }
                  break;
                }
              }
            });
          },

          // solar absorber pipe for Fresnel reflectors
          updateSolarAbsorberPipeRelativeLengthById(id, relativeLength) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.relativeLength = relativeLength;
                  }
                  break;
                }
              }
            });
          },
          updateSolarAbsorberPipeApertureWidthById(id, apertureWidth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.apertureWidth = apertureWidth;
                  }
                  break;
                }
              }
            });
          },
          updateSolarAbsorberPipeApertureWidthForAll(apertureWidth) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.apertureWidth = apertureWidth;
                  }
                }
              }
            });
          },
          updateSolarAbsorberPipePoleNumberById(id, poleNumber) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.poleNumber = poleNumber;
                  }
                  break;
                }
              }
            });
          },
          updateSolarAbsorberPipePoleNumberForAll(poleNumber) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.poleNumber = poleNumber;
                  }
                }
              }
            });
          },
          updateSolarAbsorberPipeHeightById(id, height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.absorberHeight = height;
                  }
                  break;
                }
              }
            });
          },
          updateSolarAbsorberPipeHeightForAll(height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.absorberHeight = height;
                  }
                }
              }
            });
          },
          updateSolarAbsorberPipeAbsorptanceById(id, absorptance) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.absorberAbsorptance = absorptance;
                  }
                  break;
                }
              }
            });
          },
          updateSolarAbsorberPipeAbsorptanceForAll(absorptance) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.absorberAbsorptance = absorptance;
                  }
                }
              }
            });
          },
          updateSolarAbsorberPipeOpticalEfficiencyById(id, efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.absorberOpticalEfficiency = efficiency;
                  }
                  break;
                }
              }
            });
          },
          updateSolarAbsorberPipeOpticalEfficiencyForAll(efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.absorberOpticalEfficiency = efficiency;
                  }
                }
              }
            });
          },
          updateSolarAbsorberPipeThermalEfficiencyById(id, efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.absorberThermalEfficiency = efficiency;
                  }
                  break;
                }
              }
            });
          },
          updateSolarAbsorberPipeThermalEfficiencyForAll(efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusPipe) {
                    if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
                    f.solarAbsorberPipe.absorberThermalEfficiency = efficiency;
                  }
                }
              }
            });
          },

          // solar power tower for heliostats
          updateSolarPowerTowerHeightById(id, height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.towerHeight = height;
                  }
                  break;
                }
              }
            });
          },
          updateSolarPowerTowerHeightForAll(height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.towerHeight = height;
                  }
                }
              }
            });
          },

          updateSolarPowerTowerRadiusById(id, radius) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.towerRadius = radius;
                  }
                  break;
                }
              }
            });
          },
          updateSolarPowerTowerRadiusForAll(radius) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.towerRadius = radius;
                  }
                }
              }
            });
          },

          updateSolarPowerTowerReceiverAbsorptanceById(id, absorptance) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.receiverAbsorptance = absorptance;
                  }
                  break;
                }
              }
            });
          },
          updateSolarPowerTowerReceiverAbsorptanceForAll(absorptance) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.receiverAbsorptance = absorptance;
                  }
                }
              }
            });
          },
          updateSolarPowerTowerReceiverOpticalEfficiencyById(id, efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.receiverOpticalEfficiency = efficiency;
                  }
                  break;
                }
              }
            });
          },
          updateSolarPowerTowerReceiverOpticalEfficiencyForAll(efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.receiverOpticalEfficiency = efficiency;
                  }
                }
              }
            });
          },
          updateSolarPowerTowerReceiverThermalEfficiencyById(id, efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.receiverThermalEfficiency = efficiency;
                  }
                  break;
                }
              }
            });
          },
          updateSolarPowerTowerReceiverThermalEfficiencyForAll(efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.FocusTower) {
                    if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
                    f.solarPowerTower.receiverThermalEfficiency = efficiency;
                  }
                }
              }
            });
          },

          // solar updraft tower
          updateSolarUpdraftTowerChimneyHeightById(id, height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.chimneyHeight = height;
                  }
                  break;
                }
              }
            });
          },
          updateSolarUpdraftTowerChimneyHeightForAll(height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.chimneyHeight = height;
                  }
                }
              }
            });
          },
          updateSolarUpdraftTowerChimneyRadiusById(id, radius) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.chimneyRadius = radius;
                  }
                  break;
                }
              }
            });
          },
          updateSolarUpdraftTowerChimneyRadiusForAll(radius) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.chimneyRadius = radius;
                  }
                }
              }
            });
          },
          updateSolarUpdraftTowerCollectorHeightById(id, height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.collectorHeight = height;
                  }
                  break;
                }
              }
            });
          },
          updateSolarUpdraftTowerCollectorHeightForAll(height) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.collectorHeight = height;
                  }
                }
              }
            });
          },
          updateSolarUpdraftTowerCollectorRadiusById(id, radius) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.collectorRadius = radius;
                  }
                  break;
                }
              }
            });
          },
          updateSolarUpdraftTowerCollectorRadiusForAll(radius) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.collectorRadius = radius;
                  }
                }
              }
            });
          },
          updateSolarUpdraftTowerCollectorTransmissivityById(id, transmissivity) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.collectorTransmissivity = transmissivity;
                  }
                  break;
                }
              }
            });
          },
          updateSolarUpdraftTowerCollectorTransmissivityForAll(transmissivity) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.collectorTransmissivity = transmissivity;
                  }
                }
              }
            });
          },
          updateSolarUpdraftTowerCollectorEmissivityById(id, emissivity) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.collectorEmissivity = emissivity;
                  }
                  break;
                }
              }
            });
          },
          updateSolarUpdraftTowerCollectorEmissivityForAll(emissivity) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.collectorEmissivity = emissivity;
                  }
                }
              }
            });
          },
          updateSolarUpdraftTowerDischargeCoefficientById(id, coefficient) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.dischargeCoefficient = coefficient;
                  }
                  break;
                }
              }
            });
          },
          updateSolarUpdraftTowerDischargeCoefficientForAll(coefficient) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.dischargeCoefficient = coefficient;
                  }
                }
              }
            });
          },
          updateSolarUpdraftTowerTurbineEfficiencyById(id, efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.turbineEfficiency = efficiency;
                  }
                  break;
                }
              }
            });
          },
          updateSolarUpdraftTowerTurbineEfficiencyForAll(efficiency) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Foundation && !e.locked) {
                  const f = e as FoundationModel;
                  if (f.solarStructure === SolarStructure.UpdraftTower) {
                    if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
                    f.solarUpdraftTower.turbineEfficiency = efficiency;
                  }
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
          updatePolygonLineStyleOnSurface(parentId, normal, style) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (
                  e.type === ObjectType.Polygon &&
                  e.parentId === parentId &&
                  Util.isIdentical(e.normal, normal) &&
                  !e.locked
                ) {
                  (e as PolygonModel).lineStyle = style;
                }
              }
            });
          },
          updatePolygonLineStyleAboveFoundation(foundationId, style) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && e.foundationId === foundationId && !e.locked) {
                  (e as PolygonModel).lineStyle = style;
                }
              }
            });
          },
          updatePolygonLineStyleForAll(style) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Polygon && !e.locked) {
                  (e as PolygonModel).lineStyle = style;
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
                  if (sp.parentType === ObjectType.Wall) {
                  }
                  break;
                }
              }
            });
          },
          updateSolarPanelModelAboveFoundation(foundationId, pvModelName) {
            immerSet((state: CommonStoreState) => {
              const pvModel = state.pvModules[pvModelName];
              let updateWall = false;
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
                  if (sp.parentType === ObjectType.Wall) {
                    updateWall = true;
                  }
                }
              }
              if (updateWall) {
              }
            });
          },
          updateSolarPanelModelOnSurface(parentId, normal, pvModelName) {
            immerSet((state: CommonStoreState) => {
              const pvModel = state.pvModules[pvModelName];
              let updateWall = false;
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
                    if (sp.parentType === ObjectType.Wall) {
                      updateWall = true;
                    }
                  }
                }
              }
              if (updateWall) {
              }
            });
          },
          updateSolarPanelModelForAll(pvModelName) {
            immerSet((state: CommonStoreState) => {
              const pvModel = state.pvModules[pvModelName];
              let updateWall = false;
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
                  if (sp.parentType === ObjectType.Wall) {
                    updateWall = true;
                  }
                }
              }
              if (updateWall) {
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

          updateSolarPanelFrameColorById(id, frameColor) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
                  (e as SolarPanelModel).frameColor = frameColor;
                  break;
                }
              }
            });
          },
          updateSolarPanelFrameColorAboveFoundation(foundationId, frameColor) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
                  (e as SolarPanelModel).frameColor = frameColor;
                }
              }
            });
          },
          updateSolarPanelFrameColorOnSurface(parentId, normal, frameColor) {
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
                    (e as SolarPanelModel).frameColor = frameColor;
                  }
                }
              }
            });
          },
          updateSolarPanelFrameColorForAll(frameColor) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && !e.locked) {
                  (e as SolarPanelModel).frameColor = frameColor;
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
          updateSolarPanelTiltAngleAboveFoundation(foundationId, tiltAngle, isReverse) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
                  const sp = e as SolarPanelModel;
                  if (sp.parentType === ObjectType.Wall) {
                    sp.tiltAngle = Math.min(0, isReverse ? -tiltAngle : tiltAngle);
                  } else {
                    sp.tiltAngle = tiltAngle;
                  }
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
          updateSolarPanelTiltAngleForAll(tiltAngle, isReverse) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && !e.locked) {
                  const sp = e as SolarPanelModel;
                  if (sp.parentType === ObjectType.Wall) {
                    sp.tiltAngle = Math.min(0, isReverse ? -tiltAngle : tiltAngle);
                  } else {
                    sp.tiltAngle = tiltAngle;
                  }
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

          updateSolarPanelOrientationById(id, orientation) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
                  const sp = e as SolarPanelModel;
                  const pvModel = state.pvModules[sp.pvModelName];
                  state.setSolarPanelOrientation(sp, pvModel, orientation);
                  if (sp.parentType === ObjectType.Wall) {
                  }
                  break;
                }
              }
            });
          },
          updateSolarPanelOrientationAboveFoundation(foundationId, orientation) {
            immerSet((state: CommonStoreState) => {
              let updateWall = false;
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
                  const sp = e as SolarPanelModel;
                  const pvModel = state.pvModules[sp.pvModelName];
                  state.setSolarPanelOrientation(sp, pvModel, orientation);
                  if (sp.parentType === ObjectType.Wall) {
                    updateWall = true;
                  }
                }
              }
              if (updateWall) {
              }
            });
          },
          updateSolarPanelOrientationOnSurface(parentId, normal, orientation) {
            immerSet((state: CommonStoreState) => {
              let updateWall = false;

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
                    const pvModel = state.pvModules[sp.pvModelName];
                    state.setSolarPanelOrientation(sp, pvModel, orientation);
                    if (sp.parentType === ObjectType.Wall) {
                      updateWall = true;
                    }
                  }
                }
              }
              if (updateWall) {
              }
            });
          },
          updateSolarPanelOrientationForAll(orientation) {
            immerSet((state: CommonStoreState) => {
              let updateWall = false;
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && !e.locked) {
                  const sp = e as SolarPanelModel;
                  const pvModel = state.pvModules[sp.pvModelName];
                  state.setSolarPanelOrientation(sp, pvModel, orientation);
                  if (sp.parentType === ObjectType.Wall) {
                    updateWall = true;
                  }
                }
              }
              if (updateWall) {
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
          updateParabolicDishStructureTypeById(id, structureType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && !e.locked) {
                  if (e.type === ObjectType.ParabolicDish) {
                    (e as ParabolicDishModel).structureType = structureType;
                    break;
                  }
                }
              }
            });
          },
          updateParabolicDishStructureTypeAboveFoundation(foundationId, structureType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.foundationId === foundationId && !e.locked) {
                  if (e.type === ObjectType.ParabolicDish) {
                    (e as ParabolicDishModel).structureType = structureType;
                  }
                }
              }
            });
          },
          updateParabolicDishStructureTypeForAll(structureType) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (!e.locked) {
                  if (e.type === ObjectType.ParabolicDish) {
                    (e as ParabolicDishModel).structureType = structureType;
                  }
                }
              }
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
          updateWindowMullionById(id, mullion) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Window && e.id === id) {
                  (e as WindowModel).mullion = mullion;
                  state.selectedElement = e;
                  break;
                }
              }
            });
          },
          updateWindowTypeById(id, type) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Window && e.id === id) {
                  (e as WindowModel).windowType = type;
                  state.selectedElement = e;
                  break;
                }
              }
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
                if (e.id === id && !e.locked && e.type === ObjectType.Wall) {
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

          updateWallStructureById(id, structure) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && e.type === ObjectType.Wall) {
                  const wallModel = e as WallModel;
                  wallModel.wallStructure = structure;
                  if (structure === WallStructure.Stud || structure === WallStructure.Pillar) {
                    wallModel.opacity = 0;
                  }
                  break;
                }
              }
            });
          },

          updateRoofRiseById(id, rise) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id && e.type === ObjectType.Roof) {
                  (e as RoofModel).rise = rise;
                  state.actionState.roofRise = rise;
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

          updateTreeTypeById(id, name) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Tree && e.id === id) {
                  (e as TreeModel).name = name;
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
          updateTreeFlipById(id, flip) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Tree && e.id === id) {
                  (e as TreeModel).flip = flip;
                  break;
                }
              }
            });
          },
          updateFlowerTypeById(id, name) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Flower && e.id === id) {
                  const flower = e as FlowerModel;
                  flower.name = name;
                  flower.lx = FlowerData.fetchSpread(name);
                  flower.lz = FlowerData.fetchHeight(name);
                  break;
                }
              }
            });
          },
          updateFlowerFlipById(id, flip) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Flower && e.id === id) {
                  (e as FlowerModel).flip = flip;
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
          updateHumanFlipById(id, yes) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Human && e.id === id) {
                  const human = e as HumanModel;
                  human.flip = yes;
                  break;
                }
              }
            });
          },
          updateHumanObserverById(id, yes) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Human && e.id === id) {
                  (e as HumanModel).observer = yes;
                  break;
                }
              }
            });
          },

          updateLightColorById(id, color) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Light && e.id === id) {
                  (e as LightModel).color = color;
                  break;
                }
              }
            });
          },
          updateLightIntensityById(id, intensity) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Light && e.id === id) {
                  (e as LightModel).intensity = intensity;
                  break;
                }
              }
            });
          },
          updateLightDistanceById(id, distance) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Light && e.id === id) {
                  (e as LightModel).distance = distance;
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
                    const parentModel = parent as ElementModel;
                    position
                      .sub(new Vector3(parentModel.cx, parentModel.cy, parentModel.cz))
                      .applyEuler(new Euler(0, 0, -parentModel.rotation[2]));
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
                    const parentModel = parent as ElementModel;
                    position
                      .sub(new Vector3(parentModel.cx, parentModel.cy, parentModel.cz))
                      .applyEuler(new Euler(0, 0, -parentModel.rotation[2]));
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
                    const parentModel = parent as ElementModel;
                    position
                      .sub(new Vector3(parentModel.cx, parentModel.cy, parentModel.cz))
                      .applyEuler(new Euler(0, 0, -parentModel.rotation[2]));
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
                    state.actionState.wallHeight,
                    state.actionState.wallThickness,
                    state.actionState.wallRValue,
                    state.actionState.wallColor,
                    state.actionState.wallVolumetricHeatCapacity,
                    state.actionState.wallTexture,
                    state.actionState.wallStructure,
                    state.actionState.wallStructureSpacing,
                    state.actionState.wallStructureWidth,
                    state.actionState.wallStructureColor,
                    state.actionState.wallOpacity,
                    state.actionState.wallUnfilledHeight,
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
                    case ObjectType.Roof: {
                      state.deletedRoofId = elem.id;
                      state.roofSegmentVerticesMap.delete(id);
                      state.roofSegmentVerticesWithoutOverhangMap.delete(id);
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
                        } else if (e.id === currentWall.roofId) {
                          const rm = e as RoofModel;
                          rm.wallsId = rm.wallsId.filter((v) => v !== currentWall.id);
                          if (rm.wallsId.length === 0) {
                            state.deletedRoofId = e.id;
                          }
                        }
                      }
                      for (const e of state.elements) {
                        if (e.type === ObjectType.Roof && (e as RoofModel).wallsId.length === 0) {
                          state.elements = state.elements.filter((x) => x.id !== e.id);
                        }
                      }
                      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                      state.updateRoofFlag = !state.updateRoofFlag;
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
                    case ObjectType.Door: {
                      state.deletedDoorAndParentId = [elem.id, elem.parentId];
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
                if (e.id === id || e.parentId === id || e.foundationId === id) {
                  if (e.type === ObjectType.Roof) {
                    state.roofSegmentVerticesMap.delete(e.id);
                    state.roofSegmentVerticesWithoutOverhangMap.delete(e.id);
                  }
                  return false;
                } else {
                  return true;
                }
              });
              state.selectedElement = null;
            });
          },
          removeElementsByType(type) {
            immerSet((state: CommonStoreState) => {
              if (type === ObjectType.Foundation) {
                state.elements = state.elements.filter((x) => {
                  if (x.locked || (x.type !== ObjectType.Foundation && !x.foundationId)) {
                    return true;
                  } else {
                    if (x.type === ObjectType.Roof) {
                      state.roofSegmentVerticesMap.delete(x.id);
                      state.roofSegmentVerticesWithoutOverhangMap.delete(x.id);
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
                      state.roofSegmentVerticesMap.delete(x.id);
                      state.roofSegmentVerticesWithoutOverhangMap.delete(x.id);
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
          countAllOffspringsByTypeAtOnce(ancestorId, includingLocked) {
            const counter = new ElementCounter();
            for (const e of get().elements) {
              // foundationId applies to both foundations and cuboids, should have been named ancestorId
              const idOk = e.parentId === ancestorId || e.foundationId === ancestorId;
              if (includingLocked ? idOk : !e.locked && idOk) {
                switch (e.type) {
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
          // this should be called if any of the solar panels changes
          clearAllSolarPanelYields() {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel) {
                  const sp = e as SolarPanelModel;
                  sp.dailyYield = 0;
                  sp.yearlyYield = 0;
                }
              }
            });
          },

          // must copy the elements because they may be pasted multiple times.
          // so we must treat them as newly added elements each time.
          // note that the case of deletion is treated differently because the deleted elements cannot be pasted.
          copyCutElements() {
            const copiedElements: ElementModel[] = [];
            immerSet((state: CommonStoreState) => {
              const map = new Map<ElementModel, ElementModel>();
              const elementsMapOldToNew = new Map<string, string>();
              const elementsMapNewToOld = new Map<string, string>();
              for (let i = 0; i < state.elementsToPaste.length; i++) {
                const oldElem = state.elementsToPaste[i];
                let e: ElementModel | null = null;
                if (i === 0) {
                  // the first element is the parent
                  e = ElementModelCloner.clone(state.getParent(oldElem), oldElem, oldElem.cx, oldElem.cy, oldElem.cz);
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
                  elementsMapOldToNew.set(oldElem.id, e.id);
                  elementsMapNewToOld.set(e.id, oldElem.id);
                  copiedElements.push(e);
                }
              }
              for (const e of copiedElements) {
                // search new roof
                if (e.type === ObjectType.Roof) {
                  const oldRoofId = elementsMapNewToOld.get(e.id);
                  if (oldRoofId) {
                    for (const o of state.elementsToPaste) {
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
                    for (const o of state.elementsToPaste) {
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
                let newParent = state.selectedElement;
                const oldParent = state.getParent(elem);
                if (newParent) {
                  if (newParent.type === ObjectType.Polygon) {
                    // paste action of polygon is passed to its parent
                    const q = state.getParent(newParent);
                    if (q) {
                      newParent = q;
                      elem.parentId = newParent.id;
                      if (Util.isPositionRelative(elem.type)) {
                        m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                      }
                    }
                  } else if (newParent.type === ObjectType.Roof) {
                    if (newParent.parentId) {
                      const foundation = state.getElementById(newParent.parentId);
                      if (foundation) {
                        m.sub(new Vector3(foundation.cx, foundation.cy)).applyEuler(
                          new Euler(0, 0, -foundation.rotation[2]),
                        );
                        m.setX(m.x / foundation.lx);
                        m.setY(m.y / foundation.ly);
                        m.setZ(m.z - foundation.lz);
                      }
                    }
                  } else {
                    // if the old parent is ground, it has no type definition, but we use it to check its type
                    if (oldParent && oldParent.type) {
                      // TODO: At this point, a cuboid can only be a child of the ground. Note that we may make
                      // cuboids children of others in the future.
                      if (!Util.isFoundationOrCuboid(elem)) {
                        elem.parentId = newParent.id;
                      }
                      if (Util.isPositionRelative(elem.type)) {
                        m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                      }
                    }
                  }
                  if (elem.type === ObjectType.Wall) {
                    m.set(m.x * newParent.lx, m.y * newParent.ly, 0);
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
                      const elementsMapNewToOld = new Map<string, string>();
                      const elementsMapOldToNew = new Map<string, string>();
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
                      if (newParent?.type === ObjectType.Roof) {
                        if (newParent && e.foundationId) {
                          const foundation = state.getElementById(e.foundationId);
                          const wall = state.getElementById((newParent as RoofModel).wallsId[0]) as WallModel;
                          if (foundation && wall) {
                            const solarPanelVertices = RoofUtil.getSolarPanelVerticesOnRoof(
                              e as SolarPanelModel,
                              foundation,
                            );
                            const boundaryVertices = RoofUtil.getBoundaryVertices(
                              newParent.id,
                              wall,
                              (newParent as RoofModel).overhang,
                            );

                            if (!RoofUtil.rooftopSPBoundaryCheck(solarPanelVertices, boundaryVertices)) {
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
                            state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
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
                            approved = Util.isSolarCollectorWithinHorizontalSurface(e as SolarCollector, newParent);
                            if (!approved) {
                              showError(i18n.t('message.CannotPasteOutsideBoundary', lang));
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
                      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                      approved = true;
                      break;
                    }
                    case ObjectType.Door:
                    case ObjectType.Window: {
                      if (newParent) {
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
                        } else {
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
                            } else {
                            }
                            break;
                          }
                          if (parent.type === ObjectType.Roof) {
                            if (elem.foundationId) {
                              const foundation = state.getElementById(elem.foundationId);
                              const wall = state.getElementById((parent as RoofModel).wallsId[0]) as WallModel;
                              if (foundation && wall) {
                                const boundaryVertices = RoofUtil.getBoundaryVertices(
                                  parent.id,
                                  wall,
                                  (parent as RoofModel).overhang,
                                );

                                const hx = e.lx / foundation.lx / 2;
                                e.cx += hx * 1.25;

                                while (e.cx + hx < 0.5) {
                                  const solarPanelVertices = RoofUtil.getSolarPanelVerticesOnRoof(
                                    e as SolarPanelModel,
                                    foundation,
                                  );
                                  if (
                                    RoofUtil.rooftopSPBoundaryCheck(solarPanelVertices, boundaryVertices) &&
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
                                      RoofUtil.rooftopSPBoundaryCheck(solarPanelVertices, boundaryVertices) &&
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
                                  state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
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
                              if (state.overlapWithSibling(e, 0.001)) {
                                // try the opposite direction first before giving up
                                e.cx = elem.cx - dx;
                                e.cy = elem.cy - dy;
                                e.cz = elem.cz - dz;
                                if (state.overlapWithSibling(e, 0.001)) {
                                  // we may need to hop twice in the opposite direction
                                  e.cx = elem.cx - 2 * dx;
                                  e.cy = elem.cy - 2 * dy;
                                  e.cz = elem.cz - 2 * dz;
                                  if (state.overlapWithSibling(e, 0.001)) {
                                    e.cx = oldX - dx;
                                    e.cy = oldY - dy;
                                    e.cz = oldZ - dz;
                                  }
                                }
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
                    case ObjectType.Foundation:
                    case ObjectType.Cuboid:
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
                        }
                      }
                      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                      approved = true;
                      break;
                  }
                  if (state.elementsToPaste.length === 1 && approved) pastedElements.push(e);
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
            if (
              get().addedCuboidId ||
              get().addedFoundationId ||
              get().addedWallId ||
              get().addedWindowId ||
              get().addedDoorId
            ) {
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
          updateWallMapOnFoundationFlag: false,
          updateWallMapOnFoundation() {
            immerSet((state: CommonStoreState) => {
              state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
            });
          },

          updateElementOnRoofFlag: false,
          updateElementOnRoofFn() {
            immerSet((state: CommonStoreState) => {
              state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
            });
          },

          updateRoofFlag: false,

          addedWindowId: null,
          deletedWindowAndParentId: null,

          addedDoorId: null,
          deletedDoorAndParentId: null,

          addedRoofId: null,
          deletedRoofId: null,
          setAddedRoofId(id: string | null) {
            immerSet((state) => {
              state.addedRoofId = id;
            });
          },

          OldRooftopElementData: null,
          setOldRooftopElementData(data: OldRooftopElementData | null) {
            immerSet((state) => {
              state.OldRooftopElementData = data;
            });
          },

          groupActionMode: false,
          setGroupActionMode(b: boolean) {
            immerSet((state) => {
              state.groupActionMode = b;
            });
          },
          elementGroupId: null,
          setElementGroupId(id: string | null) {
            immerSet((state) => {
              state.elementGroupId = id;
              for (const e of state.elements) {
                e.selected = e.id === id;
              }
            });
          },
          groupActionUpdateFlag: false,

          loadingFile: false,
          simulationInProgress: false,
          simulationPaused: false,
          evolutionInProgress: false,
          evolutionPaused: false,
          showSolarRadiationHeatmap: false,
          locale: enUS,
          localFileName: 'aladdin.ala',
          createNewFileFlag: false,
          openLocalFileFlag: false,
          saveLocalFileFlag: false,
          saveLocalFileDialogVisible: false,
          localFileDialogRequested: false,
          pvModelDialogVisible: false,
          loggable: false,
          actionInfo: undefined,
          currentUndoable: undefined,
          showCloudFileTitleDialog: false,
          showCloudFileTitleDialogFlag: false,
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
          'animate24Hours',
          'floatingWindowOpacity',
          'locale',
          'cloudFile',
          'world',
          'elements',
          'viewState',
          'actionState',
          'notes',
          'user',
          'sceneRadius',
          'weatherData',
          'sensorLabels',
          'solarPanelLabels',
          'dailyLightSensorData',
          'yearlyLightSensorData',
          'solarPanelArrayLayoutParams',
          'solarPanelArrayLayoutConstraints',
          'economicsParams',
          'evolutionMethod',
          'evolutionaryAlgorithmState',
          'geneticAlgorithmWizardSelectedTab',
          'particleSwarmOptimizationWizardSelectedTab',
        ],
      },
    ),
  ),
);
