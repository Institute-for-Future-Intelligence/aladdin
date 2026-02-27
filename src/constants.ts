/*
 * @Copyright 2021-2026. Institute for Future Intelligence, Inc.
 */

import { Color, Euler, Vector2, Vector3 } from 'three';
import platform from 'platform';
import { HvacSystem } from './models/HvacSystem';
import {
  DesignProblem,
  Discretization,
  DiurnalTemperatureModel,
  FlowerType,
  GeneticAlgorithmSelectionMethod,
  HumanName,
  ObjectiveFunctionType,
  Orientation,
  ParabolicDishStructureType,
  RowAxis,
  SearchMethod,
  Theme,
  TreeType,
} from './types';
import { Rectangle } from './models/Rectangle';
import { GroundModel } from './models/GroundModel';

export const VERSION = '2.0.3';

// used for check old file that need to update light intensity.
export const LIGHT_INTENSITY_CHANGED_VERSION = '1.5.0';

export const HOME_URL: string = import.meta.env.PROD
  ? 'https://institute-for-future-intelligence.github.io/aladdin/'
  : 'http://localhost:3000/aladdin';

export const DEFAULT_ADDRESS = 'Natick, MA';
export const PRESET_COLORS = ['#627682', '#8884d8', '#f97356', '#1bc32c', '#c6502d', '#82ca9d', '#3eaec0', '#445111'];

export const HALF_PI = Math.PI / 2;

export const TWO_PI = Math.PI * 2;

export const Z_INDEX_FRONT_PANEL = 15;

export const THROTTLE_WAIT = 50;

export const BLACK = '#000000';
export const WHITE = '#FFFFFF';
export const GREY = '#808080';
export const BLUE = new Color(0, 0, 1);
export const GREEN = new Color(0, 1, 0);
export const YELLOW = new Color(1, 1, 0);
export const RED = new Color(1, 0, 0);
export const SOLAR_HEATMAP_COLORS = [BLUE, GREEN, YELLOW, RED];

export const UNDO_SHOW_INFO_DURATION = 0.5;
export const FLOATING_WINDOW_OPACITY = 0.8;
export const DEFAULT_HEAT_FLUX_DENSITY_FACTOR = 4;
export const DEFAULT_LEAF_OUT_DAY = 105;
export const DEFAULT_LEAF_OFF_DAY = 320;

export const DEFAULT_SCENE_RADIUS = 100;

export const DEFAULT_LINE_COLOR = BLACK;
export const DEFAULT_LINE_WIDTH = 0.2;
export const DEFAULT_LABEL_SIZE = 0.2;
export const DEFAULT_LABEL_FONT_SIZE = 20;
export const DEFAULT_LABEL_COLOR = WHITE;
export const DEFAULT_LABEL_HEIGHT = 0;

// element models
export const DEFAULT_FOUNDATION_LZ = 0.1;
export const DEFAULT_FOUNDATION_COLOR = GREY;
export const DEFAULT_FOUNDATION_SLAB_DEPTH = 1;
export const DEFAULT_FOUNDATION_SLOPE = 0.2;
export const DEFAULT_GROUND_FLOOR_R_VALUE = 2;

export const DEFAULT_CUBOID_COLOR = GREY;
export const DEFAULT_CUBOID_TRANSPARENCY = 0;

export const DEFAULT_WALL_COLOR = WHITE;
export const DEFAULT_WALL_EAVES_LENGTH = 0.3;
export const DEFAULT_WALL_HEIGHT = 5;
export const DEFAULT_WALL_THICKNESS = 0.3;
export const DEFAULT_WALL_UNFILLED_HEIGHT = 0.5;
export const DEFAULT_WALL_OPACITY = 0.5;
export const DEFAULT_WALL_STRUCTURE_SPACING = 2;
export const DEFAULT_WALL_STRUCTURE_WIDTH = 0.1;
export const DEFAULT_WALL_STRUCTURE_COLOR = WHITE;
export const DEFAULT_WALL_R_VALUE = 2;
export const DEFAULT_WALL_AIR_PERMEABILITY = 0;
export const DEFAULT_WALL_VOLUMETRIC_HEAT_CAPACITY = 0.5;

export const DEFAULT_WINDOW_COLOR = WHITE; // frame color
export const DEFAULT_WINDOW_TINT = '#73D8FF';
export const DEFAULT_WINDOW_OPACITY = 0.5;
export const DEFAULT_WINDOW_SHUTTER_COLOR = GREY;
export const DEFAULT_WINDOW_SHUTTER_WIDTH = 0.5;
export const DEFAULT_WINDOW_FRAME_WIDTH = 0.1;
export const DEFAULT_WINDOW_SILL_WIDTH = 0.1;
export const DEFAULT_WINDOW_ARCH_HEIGHT = 1;
export const DEFAULT_WINDOW_U_VALUE = 2;
export const DEFAULT_WINDOW_AIR_PERMEABILITY = 0;
export const DEFAULT_MULLION_WIDTH = 0.06;
export const DEFAULT_MULLION_COLOR = WHITE;
export const DEFAULT_HORIZONTAL_MULLION_SPACING = 0.5;
export const DEFAULT_VERTICAL_MULLION_SPACING = 0.5;

export const DEFAULT_DOOR_COLOR = WHITE;
export const DEFAULT_DOOR_U_VALUE = 1;
export const DEFAULT_DOOR_AIR_PERMEABILITY = 0;
export const DEFAULT_DOOR_VOLUMETRIC_HEAT_CAPACITY = 0.5;
export const DEFAULT_DOOR_ARCH_HEIGHT = 1;
export const DEFAULT_DOOR_OPACITY = 1;
export const DEFAULT_DOOR_FRAME_COLOR = WHITE;

export const DEFAULT_ROOF_COLOR = '#454769';
export const DEFAULT_ROOF_THICKNESS = 0.2;
export const DEFAULT_ROOF_RISE = 2;
export const DEFAULT_ROOF_R_VALUE = 2;
export const DEFAULT_ROOF_VOLUMETRIC_HEAT_CAPACITY = 0.5;
export const DEFAULT_ROOF_AIR_PERMEABILITY = 0;
export const DEFAULT_ROOF_SIDE_COLOR = WHITE;
export const DEFAULT_ROOF_RAFTER_SPACING = 1;
export const DEFAULT_ROOF_RAFTER_WIDTH = 0.1;
export const DEFAULT_ROOF_RAFTER_COLOR = WHITE;
export const DEFAULT_ROOF_OPACITY = 0.5;
export const DEFAULT_ROOF_GLASS_TINT = '#73D8FF';
export const DEFAULT_CEILING_R_VALUE = 2;

export const DEFAULT_LIGHT_COLOR = '#ffff99';
export const DEFAULT_LIGHT_INTENSITY = 3;
export const DEFAULT_LIGHT_DISTANCE = 5;
export const DEFAULT_LIGHT_DECAY = 2;
export const DEFAULT_LIGHT_LX = 0.16;
export const DEFAULT_LIGHT_LY = 0.16;
export const DEFAULT_LIGHT_LZ = 0.08;

export const DEFAULT_SENSOR_LX = 0.1;
export const DEFAULT_SENSOR_LY = 0.1;
export const DEFAULT_SENSOR_LZ = 0.01;

export const SOLAR_PANEL_BLUE_SPECULAR = '#3BB9FF';
export const SOLAR_PANEL_BLACK_SPECULAR = '#36454F';

export const DEFAULT_WIND_TURBINE_BLADE_COLOR = WHITE;
export const DEFAULT_WIND_TURBINE_STRIPE_COLOR = '#404040';
export const DEFAULT_WIND_TURBINE_SPEED = 10;
export const DEFAULT_WIND_TURBINE_NUMBER_OF_BLADES = 3;
export const DEFAULT_WIND_TURBINE_PITCH_ANGLE = Math.PI / 18;
export const DEFAULT_WIND_TURBINE_RELATIVE_YAW_ANGLE = 0;
export const DEFAULT_WIND_TURBINE_INITIAL_ROTOR_ANGLE = 0;
export const DEFAULT_WIND_TURBINE_TOWER_HEIGHT = 20;
export const DEFAULT_WIND_TURBINE_TOWER_RADIUS = 0.5;
export const DEFAULT_WIND_TURBINE_BLADE_RADIUS = 10;
export const DEFAULT_WIND_TURBINE_BLADE_MAXIMUM_CHORD_LENGTH = 1;
export const DEFAULT_WIND_TURBINE_BLADE_MAXIMUM_CHORD_RADIUS = 3;
export const DEFAULT_WIND_TURBINE_BLADE_ROOT_RADIUS = 0.3;
export const DEFAULT_WIND_TURBINE_HUB_RADIUS = 0.75;
export const DEFAULT_WIND_TURBINE_HUB_LENGTH = 1.5;

export const DEFAULT_BATTERY_STORAGE_COLOR = '#C7BABE';
export const DEFAULT_BATTERY_STORAGE_EFFICIENCY = 0.95;

export const DEFAULT_SOLAR_WATER_HEATER_COLOR = GREY;
export const DEFAULT_SOLAR_WATER_HEATER_TANK_RADIUS = 0.3;
export const DEFAULT_SOLAR_WATER_HEATER_HEIGHT = 1;

export const DEFAULT_SOLAR_COLLECTOR_TILT_ANGLE = 0;
export const DEFAULT_SOLAR_COLLECTOR_RELATIVE_AZIMUTH = 0;

export const DEFAULT_SOLAR_PANEL_MODEL = 'SPR-X21-335-BLK';
export const DEFAULT_SOLAR_PANEL_ORIENTATION = Orientation.landscape;
export const DEFAULT_SOLAR_PANEL_COLOR = WHITE;
export const DEFAULT_SOLAR_PANEL_FRAME_COLOR = WHITE;
export const DEFAULT_SOLAR_PANEL_POLE_RADIUS = 0.05;
export const DEFAULT_SOLAR_PANEL_POLE_HEIGHT = 1;
export const DEFAULT_SOLAR_PANEL_POLE_SPACING = 3;
export const DEFAULT_SOLAR_PANEL_BATTERY_STORAGE_ID = null;

export const DEFAULT_PARABOLIC_DISH_REFLECTANCE = 0.9;
export const DEFAULT_PARABOLIC_DISH_ABSORPTANCE = 0.95;
export const DEFAULT_PARABOLIC_DISH_OPTICAL_EFFICIENCY = 0.7;
export const DEFAULT_PARABOLIC_DISH_THERMAL_EFFICIENCY = 0.3;
export const DEFAULT_PARABOLIC_DISH_RIM_DIAMETER = 4;
export const DEFAULT_PARABOLIC_DISH_LATUS_RECTUM = 8;
export const DEFAULT_PARABOLIC_DISH_POLE_HEIGHT = 0.2;
export const DEFAULT_PARABOLIC_DISH_POLE_RADIUS = 0.1;
export const DEFAULT_PARABOLIC_DISH_RECEIVER_STRUCTURE = ParabolicDishStructureType.CentralPole;
export const DEFAULT_PARABOLIC_DISH_RECEIVER_RADIUS = 0.25;
export const DEFAULT_PARABOLIC_DISH_RECEIVER_POLE_RADIUS = 0.1;

export const DEFAULT_PARABOLIC_TROUGH_REFLECTANCE = 0.9;
export const DEFAULT_PARABOLIC_TROUGH_ABSORPTANCE = 0.95;
export const DEFAULT_PARABOLIC_TROUGH_ABSORBER_TUBE_RADIUS = 0.05;
export const DEFAULT_PARABOLIC_TROUGH_OPTICAL_EFFICIENCY = 0.7;
export const DEFAULT_PARABOLIC_TROUGH_THERMAL_EFFICIENCY = 0.3;
export const DEFAULT_PARABOLIC_TROUGH_LATUS_RECTUM = 2;
export const DEFAULT_PARABOLIC_TROUGH_POLE_HEIGHT = 0.2;
export const DEFAULT_PARABOLIC_TROUGH_POLE_RADIUS = 0.05;
export const DEFAULT_PARABOLIC_TROUGH_WIDTH = 2;
export const DEFAULT_PARABOLIC_TROUGH_MODULE_LENGTH = 3;

export const DEFAULT_FRESNEL_REFLECTOR_RECEIVER = 'None';
export const DEFAULT_FRESNEL_REFLECTOR_REFLECTANCE = 0.9;
export const DEFAULT_FRESNEL_REFLECTOR_POLE_HEIGHT = 0.2;
export const DEFAULT_FRESNEL_REFLECTOR_POLE_RADIUS = 0.05;
export const DEFAULT_FRESNEL_REFLECTOR_WIDTH = 2;
export const DEFAULT_FRESNEL_REFLECTOR_MODULE_LENGTH = 3;

export const DEFAULT_HELIOSTAT_TOWER = 'None';
export const DEFAULT_HELIOSTAT_REFLECTANCE = 0.9;
export const DEFAULT_HELIOSTAT_POLE_HEIGHT = 0.2;
export const DEFAULT_HELIOSTAT_POLE_RADIUS = 0.1;
export const DEFAULT_HELIOSTAT_WIDTH = 4;
export const DEFAULT_HELIOSTAT_LENGTH = 2;

export const DEFAULT_HUMAN_NAME = HumanName.Jack;
export const DEFAULT_FLOWER_TYPE = FlowerType.YellowFlower;
export const DEFAULT_TREE_TYPE = TreeType.Dogwood;
export const DEFAULT_TREE_SPREAD = 3;
export const DEFAULT_TREE_HEIGHT = 4;

export const DEFAULT_PROTRACTOR_LY = 0.25;
export const DEFAULT_PROTRACTOR_LZ = 0.1;
export const DEFAULT_PROTRACTOR_RADIUS = 1;
export const DEFAULT_PROTRACTOR_COLOR = GREY;
export const DEFAULT_PROTRACTOR_TICK_MARK_COLOR = BLACK;

// world
export const DEFAULT_LATITUDE = 42.2844063;
export const DEFAULT_LONGITUDE = -71.3488548;
export const DEFAULT_COUNTRY_CODE = 'US';

export const DEFAULT_NAME = 'default';
export const DEFAULT_GROUND: GroundModel = {
  albedo: 0.3,
  thermalDiffusivity: 0.05,
  snowReflectionFactors: new Array(12).fill(0),
};

export const DEFAULT_LEAF_DAY_OF_YEAR_1 = DEFAULT_LEAF_OUT_DAY;
export const DEFAULT_LEAF_DAY_OF_YEAR_2 = DEFAULT_LEAF_OFF_DAY;

export const DEFAULT_AIR_ATTENUATION_COEFFICIENT = 0.01;
export const DEFAULT_AIR_CONVECTIVE_COEFFICIENT = 5;

export const DEFAULT_TIMES_PER_HOUR = 1;
export const DEFAULT_DAYS_PER_YEAR = 12;
export const DEFAULT_MONTHLY_IRRADIANCE_LOSSES = new Array<number>(12).fill(0.05);
export const DEFAULT_PV_GRID_CELL_SIZE = 0.5;
export const DEFAULT_DISCRETIZATION = Discretization.APPROXIMATE;
export const DEFAULT_DIURNAL_TEMPERATURE_MODEL = DiurnalTemperatureModel.Sinusoidal;
export const DEFAULT_HIGHEST_TEMPERATURE_TIME_IN_MINUTES = 900;

export const DEFAULT_APPLY_ELECTRICITY_CONSUMPTIONS = false;
export const DEFAULT_MONTHLY_ELECTRICITY_CONSUMPTIONS = new Array(12).fill(600);

export const DEFAULT_SOLAR_PANEL_VISIBILITY_GRID_CELL_SIZE = 0.2;
export const DEFAULT_SOLAR_RADIATION_HEATMAP_GRID_CELL_SIZE = 0.5;

export const DEFAULT_CSP_TIMES_PER_HOUR = 1;
export const DEFAULT_CSP_DAYS_PER_YEAR = 4;
export const DEFAULT_CSP_GRID_CELL_SIZE = 0.5;

export const DEFAULT_SUT_TIMES_PER_HOUR = 1;
export const DEFAULT_SUT_DAYS_PER_YEAR = 4;
export const DEFAULT_SUT_GRID_CELL_SIZE = 1;

export const DEFAULT_NO_ANIMATION_FOR_HEATMAP_SIMULATION = false;
export const DEFAULT_NO_ANIMATION_FOR_THERMAL_SIMULATION = false;
export const DEFAULT_NO_ANIMATION_FOR_SENSOR_DATA_COLLECTION = false;
export const DEFAULT_NO_ANIMATION_FOR_SOLAR_PANEL_SIMULATION = false;
export const DEFAULT_NO_ANIMATION_FOR_SOLAR_UPDRAFT_TOWER_SIMULATION = false;

// view state
export const DEFAULT_VIEW_NAVIGATION_VIEW = false;
export const DEFAULT_VIEW_ORTHOGRAPHIC = false;
export const DEFAULT_VIEW_ENABLE_ROTATE = true;
export const DEFAULT_VIEW_DIRECT_LIGHT_INTENSITY = 3.5;
export const DEFAULT_VIEW_AMBIENT_LIGHT_INTENSITY = 0.2;
export const DEFAULT_VIEW_CAMERA_POSITION = [5, -30, 1];
export const DEFAULT_VIEW_CAMERA_POSITION_2D = [0, 0, 150];
export const DEFAULT_VIEW_PAN_CENTER = [0, 0, 0];
export const DEFAULT_VIEW_PAN_CENTER_2D = [0, 0, 0];
export const DEFAULT_VIEW_CAMERA_ZOOM = 20;
export const DEFAULT_VIEW_CAMERA_POSITION_NAV = [5, -30, 1];
export const DEFAULT_VIEW_CAMERA_ROTATION_NAV = [1.5374753309166491, 0.16505866097993566, 0.005476951734475092];
export const DEFAULT_VIEW_SHADOW_CAMERA_FAR = 10000;

export const DEFAULT_VIEW_AXES = true;
export const DEFAULT_VIEW_HEAT_FLUX_SCALE_FACTOR = 20;
export const DEFAULT_VIEW_HEAT_FLUX_COLOR = 'gray';
export const DEFAULT_VIEW_HEAT_FLUX_WIDTH = 0.5;
export const DEFAULT_VIEW_SOLAR_RADIATION_HEAT_MAP_MAX_VALUE = 5;
export const DEFAULT_VIEW_SOLAR_RADIATION_HEAT_MAP_REFLECTION_ONLY = false;
export const DEFAULT_VIEW_SHADOW_ENABLED = true;
export const DEFAULT_VIEW_THEME = 'Default';
export const DEFAULT_VIEW_HELIODON = false;
export const DEFAULT_VIEW_SHOW_SUN_ANGLES = false;
export const DEFAULT_VIEW_SHOW_AZIMUTH_ANGLE = true;
export const DEFAULT_VIEW_SHOW_ELEVATION_ANGLE = true;
export const DEFAULT_VIEW_SHOW_ZENITH_ANGLE = true;
export const DEFAULT_VIEW_HIDE_ADDRESS = false;
export const DEFAULT_VIEW_GROUND_IMAGE = false;
export const DEFAULT_VIEW_GROUND_IMAGE_TYPE = 'roadmap';
export const DEFAULT_VIEW_GROUND_COLOR = '#16A5A5';
export const DEFAULT_VIEW_WATER_SURFACE = false;
export const DEFAULT_VIEW_SOLAR_PANEL_SHININESS = 100;
export const DEFAULT_VIEW_WINDOW_SHININESS = 200;

export const DEFAULT_VIEW_SHOW_MODEL_TREE = false;
export const DEFAULT_VIEW_HIDE_SHARE_LINKS = false;
export const DEFAULT_VIEW_SHOW_MAP_PANEL = false;
export const DEFAULT_VIEW_SHOW_HELIODON_PANEL = false;
export const DEFAULT_VIEW_SHOW_WEATHER_PANEL = false;
export const DEFAULT_VIEW_SHOW_DIURNAL_TEMPERATURE_PANEL = false;
export const DEFAULT_VIEW_SHOW_STICKY_NOTE_PANEL = false;
export const DEFAULT_VIEW_SHOW_AUDIO_PLAYER_PANEL = false;
export const DEFAULT_VIEW_SHOW_SITE_INFO_PANEL = true;
export const DEFAULT_VIEW_SHOW_DESIGN_INFO_PANEL = false;
export const DEFAULT_VIEW_SHOW_INSTRUCTION_PANEL = true;
export const DEFAULT_VIEW_SHOW_DAILY_LIGHT_SENSOR_PANEL = false;
export const DEFAULT_VIEW_SHOW_YEARLY_LIGHT_SENSOR_PANEL = false;
export const DEFAULT_VIEW_SHOW_DAILY_PV_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_YEARLY_PV_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_SOLAR_PANEL_VISIBILITY_RESULTS_PANEL = false;
export const DEFAULT_VIEW_SHOW_DAILY_PARABOLIC_TROUGH_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_YEARLY_PARABOLIC_TROUGH_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_DAILY_PARABOLIC_DISH_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_YEARLY_PARABOLIC_DISH_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_DAILY_FRESNEL_REFLECTOR_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_YEARLY_FRESNEL_REFLECTOR_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_DAILY_HELIOSTAT_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_YEARLY_HELIOSTAT_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_DAILY_UPDRAFT_TOWER_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_YEARLY_UPDRAFT_TOWER_YIELD_PANEL = false;
export const DEFAULT_VIEW_SHOW_DAILY_BUILDING_ENERGY_PANEL = false;
export const DEFAULT_VIEW_SHOW_YEARLY_BUILDING_ENERGY_PANEL = false;
export const DEFAULT_VIEW_SHOW_DAILY_BATTERY_STORAGE_ENERGY_PANEL = false;
export const DEFAULT_VIEW_SHOW_YEARLY_BATTERY_STORAGE_ENERGY_PANEL = false;
export const DEFAULT_VIEW_SHOW_EVOLUTION_PANEL = false;
export const DEFAULT_VIEW_AUTO_ROTATE = false;

export const DEFAULT_HELIODON_PANEL_X = 0;
export const DEFAULT_HELIODON_PANEL_Y = 0;
export const DEFAULT_MAP_PANEL_X = 0;
export const DEFAULT_MAP_PANEL_Y = 0;
export const DEFAULT_VIEW_WEATHER_PANEL_RECT = new Rectangle(0, 0, 500, 500);
export const DEFAULT_VIEW_DIURNAL_TEMPERATURE_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_STICKY_NOTE_PANEL_RECT = new Rectangle(0, 0, 400, 300);
export const DEFAULT_VIEW_AUDIO_PLAYER_PANEL_RECT = new Rectangle(0, 0, 360, 120);
export const DEFAULT_VIEW_DAILY_LIGHT_SENSOR_PANEL_RECT = new Rectangle(0, 0, 600, 360);
export const DEFAULT_VIEW_YEARLY_LIGHT_SENSOR_PANEL_RECT = new Rectangle(0, 0, 600, 500);
export const DEFAULT_VIEW_YEARLY_LIGHT_SENSOR_PANEL_SHOW_DAYLIGHT = false;
export const DEFAULT_VIEW_YEARLY_LIGHT_SENSOR_PANEL_SHOW_CLEARNESS = false;
export const DEFAULT_VIEW_DAILY_PV_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_YEARLY_PV_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_VISIBILITY_RESULTS_PANEL_RECT = new Rectangle(0, 0, 600, 470);
export const DEFAULT_VIEW_DAILY_PARABOLIC_TROUGH_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_YEARLY_PARABOLIC_TROUGH_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_DAILY_PARABOLIC_DISH_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_YEARLY_PARABOLIC_DISH_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_DAILY_FRESNEL_REFLECTOR_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_YEARLY_FRESNEL_REFLECTOR_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_DAILY_HELIOSTAT_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_YEARLY_HELIOSTAT_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_DAILY_UPDRAFT_TOWER_YIELD_PANEL_RECT = new Rectangle(0, 0, 640, 550);
export const DEFAULT_VIEW_YEARLY_UPDRAFT_TOWER_YIELD_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_DAILY_BUILDING_ENERGY_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_YEARLY_BUILDING_ENERGY_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_DAILY_BATTERY_STORAGE_ENERGY_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_YEARLY_BATTERY_STORAGE_ENERGY_PANEL_RECT = new Rectangle(0, 0, 600, 400);
export const DEFAULT_VIEW_EVOLUTION_PANEL_RECT = new Rectangle(0, 0, 640, 400);

export const DEFAULT_VIEW_MAP_ZOOM = 18;
export const DEFAULT_VIEW_MAP_TYPE = 'roadmap';
export const DEFAULT_VIEW_MAP_TILT = 0;

export const DEFAULT_MODEL_MAP_ZOOM = 10;
export const LAT_LNG_FRACTION_DIGITS = 4;

// Solar Panel Array Layout Params
export const DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS = {
  pvModelName: 'CS6X-355P-FG',
  rowAxis: RowAxis.leftRight,
  orientation: Orientation.landscape,
  tiltAngle: 0,
  rowsPerRack: 1,
  interRowSpacing: 2,
  poleHeight: 1,
  poleSpacing: 3,
  margin: 0,
};

// Solar Panel Array Layout Constraints
export const DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS = {
  minimumInterRowSpacing: 2,
  maximumInterRowSpacing: 10,
  minimumRowsPerRack: 1,
  maximumRowsPerRack: 6,
  minimumTiltAngle: -HALF_PI,
  maximumTiltAngle: HALF_PI,
  poleHeight: 1,
  poleSpacing: 5,
  orientation: Orientation.landscape,
  pvModelName: 'CS6X-355P-FG',
  rowAxis: RowAxis.leftRight,
};

// Genetic Algorithm Params
export const DEFAULT_GENETIC_ALGORITHM_PARAMS = {
  problem: DesignProblem.SOLAR_PANEL_TILT_ANGLE,
  objectiveFunctionType: ObjectiveFunctionType.DAILY_TOTAL_OUTPUT,
  selectionMethod: GeneticAlgorithmSelectionMethod.ROULETTE_WHEEL,
  searchMethod: SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION,
  populationSize: 20,
  maximumGenerations: 5,
  selectionRate: 0.5,
  crossoverRate: 0.5,
  mutationRate: 0.1,
  convergenceThreshold: 0.01,
  localSearchRadius: 0.1,
};

// Particle Swarm Optimization Params
export const DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS = {
  problem: DesignProblem.SOLAR_PANEL_TILT_ANGLE,
  objectiveFunctionType: ObjectiveFunctionType.DAILY_TOTAL_OUTPUT,
  searchMethod: SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION,
  swarmSize: 20,
  maximumSteps: 5,
  vmax: 0.01,
  inertia: 0.8,
  cognitiveCoefficient: 0.1,
  socialCoefficient: 0.1,
  convergenceThreshold: 0.01,
  localSearchRadius: 0.1,
};

export const DEFAULT_ECONOMICS_PARAMS = {
  projectLifeSpan: 25,
  electricitySellingPrice: 0.25, // US dollars per kWh
  operationalCostPerUnit: 0.15, // US dollars per day
};

export const DEFAULT_AUDIO_URL = 'https://intofuture.org/podcast/aladdin.mp3';
export const DEFAULT_AUDIO_TITLE = 'Instruction';

export const MONTHS_ABBV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DEFAULT_SKY_RADIUS = 5000;
export const DEFAULT_FOV = 45;
export const DEFAULT_SHADOW_MAP_SIZE = 4096;
export const STARLIGHT_INTENSITY = 0.1;

export const MOVE_HANDLE_RADIUS = 0.1;
export const RESIZE_HANDLE_SIZE = 0.16;

export const MOVE_HANDLE_COLOR_1 = 'orange';
export const MOVE_HANDLE_COLOR_2 = 'orchid';
export const MOVE_HANDLE_COLOR_3 = 'pink';
export const RESIZE_HANDLE_COLOR = 'white';
export const HIGHLIGHT_HANDLE_COLOR = 'red';
export const LOCKED_ELEMENT_SELECTION_COLOR = 'yellow';

export const GRID_RATIO = 5;
export const FINE_GRID_SCALE = 0.1;
export const NORMAL_GRID_SCALE = GRID_RATIO * FINE_GRID_SCALE;

export const MAXIMUM_HEATMAP_CELLS = 10000;

// solar panel texture
export const RESOLUTION = 250;
export const MARGIN_PERCENT = 0.01;
export const GAP_PERCENT = 0.005;
export const SOLAR_PANEL_CELL_COLOR_BLACK = '#000';
export const SOLAR_PANEL_CELL_COLOR_BLUE = '#01345B';

export const INVALID_ELEMENT_COLOR = '#fe6f5e';

export const GROUND_ID = 'Ground';

export const ZERO_TOLERANCE = 0.0001;

export const UNIT_VECTOR_POS_Z_ARRAY = [0, 0, 1];

export const UNIT_VECTOR_NEG_Y_ARRAY = [0, -1, 0];

export const UNIT_VECTOR_POS_X = new Vector3(1, 0, 0);

export const UNIT_VECTOR_NEG_X = new Vector3(-1, 0, 0);

export const UNIT_VECTOR_POS_Y = new Vector3(0, 1, 0);

export const UNIT_VECTOR_NEG_Y = new Vector3(0, -1, 0);

export const UNIT_VECTOR_POS_Z = new Vector3(0, 0, 1);

export const UNIT_VECTOR_NEG_Z = new Vector3(0, 0, -1);

export const ORIGIN_VECTOR2 = new Vector2(0, 0);

export const ORIGIN_VECTOR3 = new Vector3(0, 0, 0);

export const PARABOLIC_DISH_STRUCTURE_CENTRAL_POLE = 1;

export const PARABOLIC_DISH_STRUCTURE_TRIPOD = 2;

export const HALF_PI_Z_EULER = new Euler(0, 0, HALF_PI);

export const REGEX_ALLOWABLE_IN_NAME = /^[A-Za-z0-9\s-_()!?%&,]*$/;

export const KeyCtrl = isMac() ? '⌘' : 'Ctrl';

export const DEFAULT_HVAC_SYSTEM = {
  heatingSetpoint: 20,
  coolingSetpoint: 20,
  temperatureThreshold: 3,
  coefficientOfPerformanceAC: 4,
} as HvacSystem;

export enum Operation {
  Move = 'Move',
  RotateUpper = 'RotateUpper',
  RotateLower = 'RotateLower',
  ResizeX = 'ResizeX',
  ResizeY = 'ResizeY',
  ResizeHeight = 'ResizeHeight',
  Tilt = 'Tilt',
  None = 'None',
}

export enum SurfaceType {
  Vertical = 'Vertical',
  Horizontal = 'Horizontal',
  Inclined = 'Inclined',
}

export enum ColorType {
  Filled = 'Filled',
  Line = 'Line=',
}

export const themes = [
  { value: Theme.Default, label: 'skyMenu.ThemeDefault' },
  { value: Theme.Desert, label: 'skyMenu.ThemeDesert' },
  { value: Theme.Dune, label: 'skyMenu.ThemeDune' },
  { value: Theme.Forest, label: 'skyMenu.ThemeForest' },
  { value: Theme.Grassland, label: 'skyMenu.ThemeGrassland' },
  { value: Theme.Hill, label: 'skyMenu.ThemeHill' },
  { value: Theme.Lake, label: 'skyMenu.ThemeLake' },
  { value: Theme.Mountain, label: 'skyMenu.ThemeMountain' },
  { value: Theme.Rural, label: 'skyMenu.ThemeRural' },
];

function isMac() {
  const os = platform.os?.family;
  if (os) return os.includes('Mac') || os.includes('OS X');
  return false;
}
