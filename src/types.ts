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

export interface GraphDatumEntry {
    [key: string]: number | undefined;
}

export enum WeatherDataType {
    HourlyTemperatures = 0,
    MonthlyTemperatures = 1,
    SunshineHours = 2,
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
