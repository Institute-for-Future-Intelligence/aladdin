/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export const VERSION = '0.0.1';

export const isProd = process.env.NODE_ENV === 'production';

export const HOME_URL: string = isProd
  ? 'https://institute-for-future-intelligence.github.io/aladdin/'
  : 'http://localhost:3000/aladdin';

export const PRESET_COLORS = [
  '#8884d8',
  '#f97356',
  '#1bc32c',
  '#c6502d',
  '#82ca9d',
  '#3eaec0',
  '#627682',
  '#445111',
];

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const WORKSPACE_SIZE = 100;

export const MOVE_HANDLE_OFFSET = 0.12;
export const MOVE_HANDLE_RADIUS = 0.1;
export const RESIZE_HANDLE_SIZE = 0.16;

export const MOVE_HANDLE_COLOR_1 = 'orange';
export const MOVE_HANDLE_COLOR_2 = 'orchid';
export const MOVE_HANDLE_COLOR_3 = 'pink';
export const RESIZE_HANDLE_COLOR = 'white';
export const HIGHLIGHT_HANDLE_COLOR = 'red';
