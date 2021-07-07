/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ElementModel} from "./ElementModel";
import {Orientation, TrackerType} from "../types";
import {PvModel} from "./PvModel";

export interface SolarPanelModel extends ElementModel {

    pvModel: PvModel;
    baseHeight: number;
    relativeAzimuth: number;
    titleAngle: number;
    monthlyTiltAngles: number[]; // seasonally adjusted tilt angles
    trackerType: TrackerType;
    orientation: Orientation;
    drawSunBeam: boolean;
    poleSpacingX: number;
    poleSpacingY: number;

}
