/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ElementModel} from "./ElementModel";
import {Orientation, TrackerType} from "../types";
import {PvModel} from "./PvModel";

export interface SolarPanelModel extends ElementModel {

    pvModel: PvModel;
    relativeAzimuth: number; // in radian
    tiltAngle: number; // in radian
    monthlyTiltAngles: number[]; // seasonally adjusted tilt angles
    trackerType: TrackerType;
    orientation: Orientation;
    drawSunBeam: boolean;

    poleHeight: number;
    poleRadius: number;
    poleSpacingX: number;
    poleSpacingY: number;

}
