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
}

export enum Theme {
    Default = 'Default',
    Desert = 'Desert',
    Grassland = 'Grassland',
}

export enum ObjectType {
    Sky = 'Sky',
    Ground = 'Ground',
    Foundation = 'Foundation',
    Sensor = 'Sensor',
    Cuboid = 'Cuboid',
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
}
