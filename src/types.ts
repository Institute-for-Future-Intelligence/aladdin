/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { extend, Object3DNode } from '@react-three/fiber';
import TextSprite from 'three-spritetext';
import { MyOrbitControls } from './js/MyOrbitControls';
import { ParabolicCylinderGeometry } from './js/ParabolicCylinderGeometry';
import { ParaboloidGeometry } from './js/ParaboloidGeometry';
import { ConvexGeometry } from './js/ConvexGeometry';

// Extend makes these JSX elements (with the first character lower-cased)
extend({ TextSprite });
extend({ MyOrbitControls });
extend({ ParabolicCylinderGeometry });
extend({ ParaboloidGeometry });
extend({ ConvexGeometry });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      textSprite: Object3DNode<TextSprite, typeof TextSprite>;
      myOrbitControls: Object3DNode<MyOrbitControls, typeof MyOrbitControls>;
      parabolicCylinderGeometry: Object3DNode<ParabolicCylinderGeometry, typeof ParabolicCylinderGeometry>;
      paraboloidGeometry: Object3DNode<ParaboloidGeometry, typeof ParaboloidGeometry>;
      convexGeometry: Object3DNode<ConvexGeometry, typeof ConvexGeometry>;
    }
  }
}

export interface User {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string | null;
  signFile: boolean;
  noLogging: boolean;
  schoolID: SchoolID;
  classID: ClassID;
}

export enum FirebaseName {
  FILES = 'Files',
  LOG_DATA = 'Log Data',
}

export enum SchoolID {
  UNKNOWN = 'UNKNOWN SCHOOL',
  SCHOOL1 = 'SCHOOL 1',
  SCHOOL2 = 'SCHOOL 2',
  SCHOOL3 = 'SCHOOL 3',
  SCHOOL4 = 'SCHOOL 4',
  SCHOOL5 = 'SCHOOL 5',
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
  readonly fileName: string;
  readonly owner: string;
  readonly email: string;
  readonly uuid: string;
  readonly userid: string;
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

export enum DesignProblem {
  SOLAR_PANEL_TILT_ANGLE = 'Solar Panel Tilt Angle',
  SOLAR_PANEL_ARRAY = 'Solar Panel Array',
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
  [key: string]: number | undefined | string;
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
}

export enum Theme {
  Default = 'Default',
  Desert = 'Desert',
  Forest = 'Forest',
  Grassland = 'Grassland',
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
  WaterHeater = 'Water Heater',
  ParabolicDish = 'Parabolic Dish',
  ParabolicTrough = 'Parabolic Trough',
  FresnelReflector = 'Fresnel Reflector',
  Heliostat = 'Heliostat',
  WindTurbine = 'Wind Turbine',
  Cuboid = 'Cuboid',
  Human = 'Human',
  Tree = 'Tree',
  Flower = 'Flower',
  Polygon = 'Polygon',
  PolygonVertex = 'Polygon Vertex',
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

export enum SolarPanelTextureType {
  BluePortrait = 'Blue Portrait',
  BlueLandscape = 'Blue Landscape',
  BlackPortrait = 'Black Portrait',
  BlackLandscape = 'Black Landscape',
}

export enum ActionType {
  Select = 'Select',
  Move = 'Move',
  Resize = 'Resize',
  Rotate = 'Rotate',
}

export enum MoveHandleType {
  Default = 'Move Handle', // used when there is only one handle for moving
  Lower = 'Move Handle Lower',
  Upper = 'Move Handle Upper',
  Left = 'Move Handle Left',
  Right = 'Move Handle Right',
  Top = 'Move Handle Top',
  Mid = 'Move Handle Mid',
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
}

export enum Orientation {
  portrait = 'Portrait',
  landscape = 'Landscape',
}

export enum RowAxis {
  zonal = 'Zonal', // east-west
  meridional = 'Meridional', // north-south
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
  Cottonwood = 'Cottonwood',
  Dogwood = 'Dogwood',
  Elm = 'Elm',
  Linden = 'Linden',
  Magnolia = 'Magnolia',
  Maple = 'Maple',
  Oak = 'Oak',
  Palm = 'Palm',
  Pine = 'Pine',
  Spruce = 'Spruce',
}

export enum FlowerType {
  Bellflower = 'Bellflower',
  Hibiscus = 'Hibiscus',
  Hosta = 'Hosta',
  Hydrangea = 'Hydrangea',
  Peony = 'Peony',
  RedRose = 'Red Rose',
  Sunflower = 'Sunflower',
  TallBush = 'Tall Bush',
  Tulip = 'Tulip',
  WhiteFlower = 'White Flower',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export enum HumanName {
  Jack = 'Jack',
  Jade = 'Jade',
  Jane = 'Jane',
  Jaye = 'Jaye',
  Jean = 'Jean',
  Jedi = 'Jedi',
  Jeff = 'Jeff',
  Jena = 'Jena',
  Jeni = 'Jeni',
  Jess = 'Jess',
  Jett = 'Jett',
  Jill = 'Jill',
  Joan = 'Joan',
  Joel = 'Joel',
  John = 'John',
  Jose = 'Jose',
  Judd = 'Judd',
  Judy = 'Judy',
  June = 'June',
  Juro = 'Juro',
  Xiaoli = 'Xiaoli',
  Xiaoming = 'Xiaoming',
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
