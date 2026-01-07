/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { extend, Object3DNode } from '@react-three/fiber';
import TextSprite from 'three-spritetext';
import { MyOrbitControls } from './js/MyOrbitControls';
import { ParabolicCylinderGeometry } from './js/ParabolicCylinderGeometry';
import { ParaboloidGeometry } from './js/ParaboloidGeometry';
import { ConvexGeometry } from './js/ConvexGeometry';
import { EulerOrder, Vector2 } from 'three';
import { TextGeometry } from 'three/examples/jsm/Addons';
import { SolarPanelModel } from './models/SolarPanelModel';
import { FresnelReflectorModel } from './models/FresnelReflectorModel';
import { HeliostatModel } from './models/HeliostatModel';
import { ParabolicDishModel } from './models/ParabolicDishModel';
import { ParabolicTroughModel } from './models/ParabolicTroughModel';
import { Filter } from './Filter';
import { SolarWaterHeaterModel } from './models/SolarWaterHeaterModel';
import { WindowModel } from './models/WindowModel';
import { DoorModel } from './models/DoorModel';
import { RoofModel } from './models/RoofModel';
import { WallModel } from './models/WallModel';

// Extend makes these JSX elements (with the first character lower-cased)
extend({ TextSprite });
extend({ MyOrbitControls });
extend({ ParabolicCylinderGeometry });
extend({ ParaboloidGeometry });
extend({ ConvexGeometry });
extend({ TextGeometry });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      textSprite: Object3DNode<TextSprite, typeof TextSprite>;
      myOrbitControls: Object3DNode<MyOrbitControls, typeof MyOrbitControls>;
      parabolicCylinderGeometry: Object3DNode<ParabolicCylinderGeometry, typeof ParabolicCylinderGeometry>;
      paraboloidGeometry: Object3DNode<ParaboloidGeometry, typeof ParaboloidGeometry>;
      convexGeometry: Object3DNode<ConvexGeometry, typeof ConvexGeometry>;
      textGeometry: Object3DNode<TextGeometry, typeof TextGeometry>;
    }
  }
}

export type XYZO = [number, number, number, (EulerOrder | undefined)?, ...any[]];
export interface User {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string | null;
  signFile: boolean;
  noLogging: boolean;
  schoolID: SchoolID;
  classID: ClassID;
  fileList?: CloudFileInfo[];
  likes?: string[];
  published?: string[];
  aliases?: string[];
  anonymous?: boolean;
}

export enum FirebaseName {
  FILES = 'Files',
  LOG_DATA = 'Log Data',
}

export interface ModelSite {
  userid: string;
  title: string;
  latitude: number;
  longitude: number;
  address?: string;
  countryCode?: string;
  type?: string;
  author?: string;
  label?: string;
  description?: string;
  likeCount?: number;
  clickCount?: number;
  timeCreated?: number;
  pinned?: boolean;
  thumbnailUrl?: string;
  hashtags?: string;
}

export interface Design {
  timestamp: number;
  title: string;
  thumbnail: string; // PNG Base64 data
  [key: string]: any;
}

export enum SchoolID {
  UNKNOWN = 'UNKNOWN SCHOOL',
  SCHOOL1 = 'SCHOOL 1',
  SCHOOL2 = 'SCHOOL 2',
  SCHOOL3 = 'SCHOOL 3',
  SCHOOL4 = 'SCHOOL 4',
  SCHOOL5 = 'SCHOOL 5',
  SCHOOL6 = 'SCHOOL 6',
  SCHOOL7 = 'SCHOOL 7',
  SCHOOL8 = 'SCHOOL 8',
  SCHOOL9 = 'SCHOOL 9',
}

export enum ClassID {
  UNKNOWN = 'UNKNOWN CLASS',
  CLASS1 = 'CLASS 1',
  CLASS2 = 'CLASS 2',
  CLASS3 = 'CLASS 3',
  CLASS4 = 'CLASS 4',
  CLASS5 = 'CLASS 5',
  CLASS6 = 'CLASS 6',
  CLASS7 = 'CLASS 7',
  CLASS8 = 'CLASS 8',
  CLASS9 = 'CLASS 9',
}

export interface CloudFileInfo {
  readonly timestamp: number;
  readonly title: string;
}

export enum DataColoring {
  ALL = 0,
  INDIVIDUALS = 1,
  GROUPS = 2,
}

export interface Range {
  variable: string;
  minimum: number;
  maximum: number;
}

// use null for undefined, as we need to persist this in Firebase
export interface ProjectState {
  owner: string | null;
  timestamp: number;
  title: string | null;
  description: string | null;
  type: DesignProblem;
  designs: Design[] | null;
  ranges: Range[] | null;
  filters: Filter[] | null;
  hiddenParameters: string[] | null;
  counter: number;
  dataColoring: DataColoring;
  selectedProperty: string | null;
  sortDescending: boolean | null;
  xAxisNameScatterPlot: string | null;
  yAxisNameScatterPlot: string | null;
  dotSizeScatterPlot: number | null;
  thumbnailWidth: number | null;
  reasoningEffort: string;
  aIModel: string;
  generateBuildingPrompt: string;
  generateSolarPowerTowerPrompt: string;
  generateUrbanDesignPrompt: string;
  independentPrompt: boolean;
}

export interface ActionInfo {
  readonly timestamp: number;
  readonly name: string;
  readonly elementId?: string;
  readonly elementType?: ObjectType;
  readonly result?: any;
  readonly details?: any;
  readonly steps?: number;
}

export enum ModelType {
  UNKNOWN = 'Unknown',
  UNDER_CONSTRUCTION = 'Under Construction',
  RESIDENTIAL_BUILDING = 'Residential Building',
  COMMERCIAL_BUILDING = 'Commercial Building',
  SCHOOL_BUILDING = 'School Building',
  TOURIST_ATTRACTION = 'Tourist Attraction',
  PHOTOVOLTAIC = 'Photovoltaic',
  PARABOLIC_DISH = 'Parabolic Dish',
  PARABOLIC_TROUGH = 'Parabolic Trough',
  FRESNEL_REFLECTOR = 'Fresnel Reflector',
  SOLAR_POWER_TOWER = 'Solar Power Tower',
  WIND_TURBINE = 'Wind Turbine',
  COLOCATION_PROJECTS = 'Colocation Projects',
}

export enum BuildingCompletionStatus {
  COMPLETE,
  ROOF_MISSING,
  WALL_DISJOINED,
  WALL_EMPTY,
}

export enum DesignProblem {
  SOLAR_PANEL_TILT_ANGLE = 'Solar Panel Tilt Angle',
  SOLAR_PANEL_ARRAY = 'Solar Panel Array',
  BUILDING_DESIGN = 'Building Design',
  SOLAR_POWER_TOWER_DESIGN = 'Solar Power Tower Design',
  URBAN_DESIGN = 'Urban Design',
}

export enum ObjectiveFunctionType {
  DAILY_TOTAL_OUTPUT = 1,
  YEARLY_TOTAL_OUTPUT = 2,
  DAILY_AVERAGE_OUTPUT = 3,
  YEARLY_AVERAGE_OUTPUT = 4,
  DAILY_PROFIT = 5,
  YEARLY_PROFIT = 6,
}

export enum EvolutionMethod {
  GENETIC_ALGORITHM = 1,
  PARTICLE_SWARM_OPTIMIZATION = 2,
}

export enum GeneticAlgorithmSelectionMethod {
  ROULETTE_WHEEL = 1,
  TOURNAMENT = 2,
}

export enum SearchMethod {
  GLOBAL_SEARCH_UNIFORM_SELECTION = 1,
  LOCAL_SEARCH_RANDOM_OPTIMIZATION = 2, // https://en.wikipedia.org/wiki/Random_optimization
  GLOBAL_SEARCH_FITNESS_SHARING = 3, // https://stackoverflow.com/questions/13775810/what-is-niching-scheme
}

export enum LineStyle {
  Solid = 1,
  Dashed = 2,
  Dotted = 3,
}

export enum LineWidth {
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
}

export interface DatumEntry {
  [key: string]: number | undefined | string | boolean;
}

export interface EnergyUsage {
  heater: number;
  ac: number;
  solarPanel: number;
  geothermal: number;
  label?: string;
}

export enum ChartType {
  Line = 1,
  Area = 2,
}

export enum GraphDataType {
  HourlyTemperatures = 1,
  MonthlyTemperatures = 2,
  SunshineHours = 3,
  DaylightData = 4,
  ClearnessData = 5,
  YearlyRadiationSensorData = 6,
  DailyRadiationSensorData = 7,
  YearlyPvYield = 8,
  DailyPvYield = 9,
  YearlyParabolicTroughYield = 10,
  DailyParabolicTroughYield = 11,
  YearlyParabolicDishYield = 12,
  DailyParabolicDishYield = 13,
  YearlyFresnelReflectorYield = 14,
  DailyFresnelReflectorYield = 15,
  YearlyHeliostatYield = 16,
  DailyHeliostatYield = 17,
  YearlyUpdraftTowerYield = 18,
  DailyUpdraftTowerYield = 19,
  YearlyBuildingEnergy = 20,
  DailyBuildingEnergy = 21,
  YearlyBatteryStorageEnergy = 22,
  DailyBatteryStorageEnergy = 23,
}

export enum Theme {
  Default = 'Default',
  Desert = 'Desert',
  Dune = 'Dune',
  Forest = 'Forest',
  Grassland = 'Grassland',
  Hill = 'Hill',
  Lake = 'Lake',
  Mountain = 'Mountain',
  Rural = 'Rural',
}

export enum DiurnalTemperatureModel {
  Sinusoidal = 1,
  PartonLogan = 2, // https://www.sciencedirect.com/science/article/abs/pii/0002157181901059
}

export enum Language {
  English = 'English',
  ChineseSimplified = '简体中文',
  ChineseTraditional = '繁体中文',
  Turkish = 'Türkçe',
  Spanish = 'Español',
  Ukrainian = 'Українська',
}

export enum ObjectType {
  Sky = 'Sky',
  Ground = 'Ground',
  Foundation = 'Foundation',
  Wall = 'Wall',
  Window = 'Window',
  Door = 'Door',
  Roof = 'Roof',
  PyramidRoof = 'Pyramid Roof',
  GableRoof = 'Gable Roof',
  HipRoof = 'Hip Roof',
  GambrelRoof = 'Gambrel Roof',
  MansardRoof = 'Mansard Roof',
  Sensor = 'Sensor',
  SolarPanel = 'Solar Panel',
  SolarWaterHeater = 'Solar Water Heater',
  ParabolicDish = 'Parabolic Dish',
  ParabolicTrough = 'Parabolic Trough',
  FresnelReflector = 'Fresnel Reflector',
  Heliostat = 'Heliostat',
  WindTurbine = 'Wind Turbine',
  VerticalAxisWindTurbine = 'Vertical Axis Wind Turbine',
  Cuboid = 'Cuboid',
  Human = 'Human',
  Tree = 'Tree',
  Flower = 'Flower',
  Polygon = 'Polygon',
  PolygonVertex = 'Polygon Vertex',
  Light = 'Light',
  BatteryStorage = 'Battery Storage',
  Ruler = 'Ruler',
  Protractor = 'Protractor',
  None = 'None',
}

export enum ParabolicDishStructureType {
  CentralPole = 1,
  CentralPoleWithTripod = 2,
  Quadrupod = 3,
}

export enum SolarStructure {
  None = 0,
  FocusPipe = 1,
  FocusTower = 2,
  UpdraftTower = 3,
}

export enum BirdSafeDesign {
  None = 0,
  Bicolor = 1,
  Striped = 2,
}

export enum ActionType {
  Select = 'Select',
  Move = 'Move',
  Resize = 'Resize',
  Rotate = 'Rotate',
  ContextMenu = 'ContextMenu',
}

export enum MoveHandleType {
  Default = 'Move Handle', // used when there is only one handle for moving
  Lower = 'Move Handle Lower',
  Upper = 'Move Handle Upper',
  Left = 'Move Handle Left',
  Right = 'Move Handle Right',
  Top = 'Move Handle Top',
  Mid = 'Move Handle Mid',
  Start = 'Move Handle Start',
  End = 'Move Handle End',
}

export enum MoveDirection {
  Left = 'Left',
  Right = 'Right',
  Up = 'Up',
  Down = 'Down',
}

export enum ResizeHandleType {
  LowerLeft = 'Resize Handle Lower Left',
  UpperLeft = 'Resize Handle Upper Left',
  LowerRight = 'Resize Handle Lower Right',
  UpperRight = 'Resize Handle Upper Right',
  LowerLeftTop = 'Resize Handle Lower Left Top',
  UpperLeftTop = 'Resize Handle Upper Left Top',
  LowerRightTop = 'Resize Handle Lower Right Top',
  UpperRightTop = 'Resize Handle Upper Right Top',
  Lower = 'Resize Handle Lower',
  Upper = 'Resize Handle Upper',
  Left = 'Resize Handle Left',
  Right = 'Resize Handle Right',
  Top = 'Resize Handle Top',
  Default = 'Resize Handle', // used for resizing a polygon
  Arch = 'Resize Handle Arch',
  WallPartialResizeLeft = 'Wall Partial Resize Handle Left',
  WallPartialResizeRight = 'Wall Partial Resize Handle Right',
  WallPartialResizeLeftTop = 'Wall Partial Resize Handle Left Top',
  WallPartialResizeRightTop = 'Wall Partial Resize Handle Right Top',
}

export enum RotateHandleType {
  Lower = 'Rotate Handle Lower',
  Upper = 'Rotate Handle Upper',
  Tilt = 'Rotate Handle Tilt',
}

export enum PolygonVertexAction {
  Delete = 'Delete Vertex',
  InsertBeforeIndex = 'Insert Vertex Before Index',
  InsertAfterIndex = 'Insert Vertex After Index',
}

export enum IntersectionPlaneType {
  Horizontal = 'Horizontal',
  Vertical = 'Vertical',
  Ground = 'Ground',
  Sky = 'Sky',
}

export enum Scope {
  OnlyThisObject = 1,
  AllObjectsOfThisTypeOnSurface = 2,
  AllObjectsOfThisTypeAboveFoundation = 3,
  AllObjectsOfThisType = 4,
  AllConnectedObjects = 5,
  OnlyThisSide = 6, // same wall
  AllSelectedObjectsOfThisType = 7,
}

export enum Orientation {
  portrait = 'Portrait',
  landscape = 'Landscape',
}

export enum RowAxis {
  eastWest = 'East-West', // absolute
  northSouth = 'North-South', // absolute
  leftRight = 'Left-Right', // relative to the parent
  upDown = 'Up-Down', // relative to the parent
}

export enum TrackerType {
  NO_TRACKER = 'None',
  HORIZONTAL_SINGLE_AXIS_TRACKER = 'HSAT',
  ALTAZIMUTH_DUAL_AXIS_TRACKER = 'AADAT',
  VERTICAL_SINGLE_AXIS_TRACKER = 'VSAT',
  TILTED_SINGLE_AXIS_TRACKER = 'TSAT',
}

export enum ShadeTolerance {
  NONE = 'None',
  HIGH = 'High',
  PARTIAL = 'Partial',
}

export enum Discretization {
  EXACT = 'Exact',
  APPROXIMATE = 'Approximate',
}

export enum TreeType {
  Apple = 'Apple',
  Birch = 'Birch',
  Coconut = 'Coconut',
  Dogwood = 'Dogwood',
  Elm = 'Elm',
  FanPalm = 'Fan Palm',
  Linden = 'Linden',
  Magnolia = 'Magnolia',
  Maple = 'Maple',
  Oak = 'Oak',
  Pine = 'Pine',
  Spruce = 'Spruce',
}

export enum FlowerType {
  Bellflower = 'Bellflower',
  Boxwood = 'Boxwood',
  CactusCombo1 = 'Cactus Combo 1',
  CactusCombo2 = 'Cactus Combo 2',
  CactusCombo3 = 'Cactus Combo 3',
  CactusCombo4 = 'Cactus Combo 4',
  Hibiscus = 'Hibiscus',
  Hosta = 'Hosta',
  Hydrangea = 'Hydrangea',
  Peony = 'Peony',
  RedRose = 'Red Rose',
  Spirea = 'Spirea',
  Sunflower = 'Sunflower',
  TallBush = 'Tall Bush',
  Tulip = 'Tulip',
  WhiteFlower = 'White Flower',
  YellowFlower = 'Yellow Flower',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export enum HumanName {
  Jaah = 'Jaah',
  Jack = 'Jack',
  Jacob = 'Jacob',
  Jacqueline = 'Jacqueline',
  Jade = 'Jade',
  Jamelia = 'Jamelia',
  James = 'James',
  Jane = 'Jane',
  Jaya = 'Jaya',
  Jaye = 'Jaye',
  Jeanette = 'Jeanette',
  Jedi = 'Jedi',
  Jeff = 'Jeff',
  Jena = 'Jena',
  Jennifer = 'Jennifer',
  Jess = 'Jess',
  Jett = 'Jett',
  Jill = 'Jill',
  Jiya = 'Jiya',
  Jocelyn = 'Jocelyn',
  Joan = 'Joan',
  Joel = 'Joel',
  Joey = 'Joey',
  John = 'John',
  Jonathon = 'Jonathon',
  Joseph = 'Joseph',
  Jose = 'Jose',
  Joshua = 'Joshua',
  Judd = 'Judd',
  Judy = 'Judy',
  Julia = 'Julia',
  Julio = 'Julio',
  Jumapili = 'Jumapili',
  June = 'June',
  Juro = 'Juro',
  Justin = 'Justin',
}

export enum PolygonTexture {
  Texture01 = 'Polygon Texture #1',
  Texture02 = 'Polygon Texture #2',
  Texture03 = 'Polygon Texture #3',
  Texture04 = 'Polygon Texture #4',
  Texture05 = 'Polygon Texture #5',
  Texture06 = 'Polygon Texture #6',
  Texture07 = 'Polygon Texture #7',
  Texture08 = 'Polygon Texture #8',
  Texture09 = 'Polygon Texture #9',
  Texture10 = 'Polygon Texture #10',
  NoTexture = 'No Polygon Texture',
}

export enum FoundationTexture {
  Texture01 = 'Foundation Texture #1',
  Texture02 = 'Foundation Texture #2',
  Texture03 = 'Foundation Texture #3',
  Texture04 = 'Foundation Texture #4',
  Texture05 = 'Foundation Texture #5',
  Texture06 = 'Foundation Texture #6',
  Texture07 = 'Foundation Texture #7',
  Texture08 = 'Foundation Texture #8',
  Texture09 = 'Foundation Texture #9',
  Texture10 = 'Foundation Texture #10',
  NoTexture = 'No Foundation Texture',
}

export enum CuboidTexture {
  Facade01 = 'Facade #1',
  Facade02 = 'Facade #2',
  Facade03 = 'Facade #3',
  Facade04 = 'Facade #4',
  Facade05 = 'Facade #5',
  Facade06 = 'Facade #6',
  Facade07 = 'Facade #7',
  Facade08 = 'Facade #8',
  Facade09 = 'Facade #9',
  Facade10 = 'Facade #10',
  NoTexture = 'No Facade Texture',
}

export enum WallTexture {
  Default = 'Wall Texture Default',
  Texture01 = 'Wall Texture #1',
  Texture02 = 'Wall Texture #2',
  Texture03 = 'Wall Texture #3',
  Texture04 = 'Wall Texture #4',
  Texture05 = 'Wall Texture #5',
  Texture06 = 'Wall Texture #6',
  Texture07 = 'Wall Texture #7',
  Texture08 = 'Wall Texture #8',
  Texture09 = 'Wall Texture #9',
  Texture10 = 'Wall Texture #10',
  NoTexture = 'No Wall Texture',
}

export enum DoorTexture {
  Default = 'Door Texture Default',
  Texture01 = 'Door Texture #1',
  Texture02 = 'Door Texture #2',
  Texture03 = 'Door Texture #3',
  Texture04 = 'Door Texture #4',
  Texture05 = 'Door Texture #5',
  Texture06 = 'Door Texture #6',
  Texture07 = 'Door Texture #7',
  Texture08 = 'Door Texture #8',
  Texture09 = 'Door Texture #9',
  Texture10 = 'Door Texture #10',
  Texture11 = 'Door Texture #11',
  Texture12 = 'Door Texture #12',
  Texture13 = 'Door Texture #13',
  Texture14 = 'Door Texture #14',
  Texture15 = 'Door Texture #15',
  Texture16 = 'Door Texture #16',
  Texture17 = 'Door Texture #17',
  NoTexture = 'No Door Texture',
}

export enum RoofTexture {
  Default = 'Roof Texture Default',
  Texture01 = 'Roof Texture #1',
  Texture02 = 'Roof Texture #2',
  Texture03 = 'Roof Texture #3',
  Texture04 = 'Roof Texture #4',
  Texture05 = 'Roof Texture #5',
  Texture06 = 'Roof Texture #6',
  Texture07 = 'Roof Texture #7',
  NoTexture = 'No Roof Texture',
}

export enum WallSide {
  Left = 'Left',
  Right = 'Right',
}

export enum ElementState {
  Valid = 'Valid',
  OverLap = 'OverLap',
  OutsideBoundary = 'OutsideBoundary',
  Invalid = 'Invalid',
}

export type WallAbsPos = {
  leftPointAbsPos: Vector2;
  rightPointAbsPos: Vector2;
  centerPointAbsPos: Vector2;
};

export enum RoofHandleType {
  Mid = 'Mid',
  Left = 'Left',
  Right = 'Right',
  TopMid = 'TopMid',
  TopLeft = 'TopLeft',
  TopRight = 'TopRight',
  FrontLeft = 'FrontLeft',
  FrontRight = 'FrontRight',
  BackLeft = 'BackLeft',
  BackRight = 'BackRight',
  Top = 'Top',
  Ridge = 'Ridge',
  Null = 'Null',
}

export interface OldRooftopElementData {
  parentId: string;
  foundationId?: string;
  position: number[];
  rotation: number[];
  normal: number[];
}

export type BoxArgs = [width?: number | undefined, height?: number | undefined, depth?: number | undefined];

export type SolarCollector =
  | SolarPanelModel
  | SolarWaterHeaterModel
  | FresnelReflectorModel
  | HeliostatModel
  | ParabolicDishModel
  | ParabolicTroughModel;

export enum EnergyModelingType {
  BUILDING = 'Building',
  PV = 'PV',
  CSP = 'CSP',
  SUT = 'SUT',
  WIND = 'Wind',
}

export type PermeableElement = WindowModel | DoorModel | RoofModel | WallModel;
