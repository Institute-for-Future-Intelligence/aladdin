/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ElementModel} from "./ElementModel";
import {TrackerType} from "../types";

export interface SolarPanelModel extends ElementModel {

    // a number in (0, 1) (backward compatibility, should use pvModuleSpecs.getCellEfficiency)
    efficiency: number;

    temperatureCoefficientPmax: number; // backward compatibility, should use pvModuleSpecs.getPmaxTc
    nominalOperatingCellTemperature :number; // backward compatibility, should use pvModuleSpecs.getNoct

    baseHeight: number;
    relativeAzimuth: number;
    titleAngle: number;
    monthlyTiltAngles: number[]; // seasonally adjusted tilt angles
    trackerType: TrackerType;

}
