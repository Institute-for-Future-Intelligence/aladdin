/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {extend, Object3DNode} from "@react-three/fiber";
import TextSprite from "three-spritetext";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

// Extend makes these JSX elements (with the first character lower-cased)
extend({TextSprite});
extend({OrbitControls});

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'textSprite': Object3DNode<TextSprite, typeof TextSprite>;
            'orbitControls': Object3DNode<OrbitControls, typeof OrbitControls>;
        }
    }
}

export interface User {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    uid: string | null;
}

export interface CloudFileInfo {
    readonly timestamp: number;
    readonly fileName: string;
    readonly owner: string;
    readonly email: string;
    readonly uuid: string;
}

export interface DatumEntry {
    [key: string]: number | undefined | string;
}

export enum GraphDataType {
    HourlyTemperatures = 0,
    MonthlyTemperatures = 1,
    SunshineHours = 2,
    DaylightData = 3,
    ClearnessData = 4,
    YearlyRadiationSensorData = 5,
    DailyRadiationSensorData = 6,
    YearlyPvYeild = 7,
    DailyPvYield = 8,
}

export enum Theme {
    Default = 'Default',
    Desert = 'Desert',
    Forest = 'Forest',
    Grassland = 'Grassland',
}

export enum ObjectType {
    Sky = 'Sky',
    Ground = 'Ground',
    Foundation = 'Foundation',
    Sensor = 'Sensor',
    SolarPanel = 'Solar Panel',
    Cuboid = 'Cuboid',
    Human = 'Human',
    Tree = 'Tree',
    None = 'None'
}

export enum ActionType {
    Select = 'Select',
    Move = 'Move',
    Resize = 'Resize',
}

export enum MoveHandleType {
    Lower = 'Move Handle Lower',
    Upper = 'Move Handle Upper',
    Left = 'Move Handle Left',
    Right = 'Move Handle Right',
    Top = 'Move Handle Top',
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
}

export enum IntersectionPlaneType {
    Horizontal = 'Horizontal',
    Vertical = 'Vertical',
    Ground = 'Ground',
}

export enum Orientation {
    portrait = 'Portrait',
    landscape = 'Landscape'
}

export enum TrackerType {
    NO_TRACKER = 'None',
    HORIZONTAL_SINGLE_AXIS_TRACKER = 'HSAT',
    ALTAZIMUTH_DUAL_AXIS_TRACKER = 'AADAT',
    VERTICAL_SINGLE_AXIS_TRACKER = 'VSAT',
    TILTED_SINGLE_AXIS_TRACKER = 'TSAT'
}

export enum ShadeTolerance {
    NONE = 'None',
    HIGH = 'High',
    PARTIAL = 'Partial'
}

export enum TreeType {
    Cottonwood = 'Cottonwood',
    Dogwood = 'Dogwood',
    Elm = 'Elm',
    Linden = 'Linden',
    Maple = 'Maple',
    Oak = 'Oak',
    Pine = 'Pine'
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
}
