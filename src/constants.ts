/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Color, Euler, Vector2, Vector3 } from 'three';
import platform from 'platform';
import { HvacSystem } from './models/HvacSystem';
import { Theme } from './types';

export const VERSION = '1.7.6';

// used for check old file that need to update light intensity.
export const LIGHT_INTENSITY_CHANGED_VERSION = '1.5.0';

export const HOME_URL: string = import.meta.env.PROD
  ? 'https://institute-for-future-intelligence.github.io/aladdin/'
  : 'http://localhost:3000/aladdin';

export const DEFAULT_ADDRESS = 'Natick, MA';
export const PRESET_COLORS = ['#627682', '#8884d8', '#f97356', '#1bc32c', '#c6502d', '#82ca9d', '#3eaec0', '#445111'];

export const Z_INDEX_FRONT_PANEL = 15;

export const THROTTLE_WAIT = 50;

export const UNDO_SHOW_INFO_DURATION = 0.5;
export const FLOATING_WINDOW_OPACITY = 0.8;
export const BLUE = new Color(0, 0, 1);
export const GREEN = new Color(0, 1, 0);
export const YELLOW = new Color(1, 1, 0);
export const RED = new Color(1, 0, 0);
export const SOLAR_HEATMAP_COLORS = [BLUE, GREEN, YELLOW, RED];
export const DEFAULT_HEAT_FLUX_SCALE_FACTOR = 20;
export const DEFAULT_HEAT_FLUX_COLOR = 'gray';
export const DEFAULT_HEAT_FLUX_WIDTH = 0.5;
export const DEFAULT_HEAT_FLUX_DENSITY_FACTOR = 4;

export const DEFAULT_GROUND_FLOOR_R_VALUE = 2;
export const DEFAULT_WALL_R_VALUE = 2;
export const DEFAULT_ROOF_R_VALUE = 2;
export const DEFAULT_CEILING_R_VALUE = 2;
export const DEFAULT_WINDOW_U_VALUE = 2;
export const DEFAULT_DOOR_U_VALUE = 1;
export const DEFAULT_FOUNDATION_SLAB_DEPTH = 1;

export const DEFAULT_SOLAR_PANEL_MODEL = 'SPR-X21-335-BLK';
export const DEFAULT_SOLAR_PANEL_SHININESS = 100;
export const DEFAULT_WINDOW_SHININESS = 200;
export const SOLAR_PANEL_BLUE_SPECULAR = '#3BB9FF';
export const SOLAR_PANEL_BLACK_SPECULAR = '#36454F';

export const DEFAULT_WIND_TURBINE_BLADE_COLOR = '#FFFFFF';
export const DEFAULT_WIND_TURBINE_STRIPE_COLOR = '#404040';

export const DEFAULT_MODEL_MAP_ZOOM = 10;
export const LAT_LNG_FRACTION_DIGITS = 4;

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
export const DEFAULT_LEAF_OUT_DAY = 105;
export const DEFAULT_LEAF_OFF_DAY = 320;

export const DEFAULT_SKY_RADIUS = 5000;
export const DEFAULT_FOV = 45;
export const DEFAULT_SHADOW_CAMERA_FAR = 10000;
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

export const HALF_PI = Math.PI / 2;

export const TWO_PI = Math.PI * 2;

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

export const DEFAULT_HVAC_SYSTEM = { heatingSetpoint: 20, coolingSetpoint: 20, temperatureThreshold: 3 } as HvacSystem;

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
