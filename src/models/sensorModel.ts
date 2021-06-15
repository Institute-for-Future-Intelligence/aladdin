/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ElementModel} from "./elementModel";

export interface SensorModel extends ElementModel {

    cz: number;
    lx: number;
    ly: number;
    light: boolean;
    heatFlux: boolean;
    time?: Date;
    lit?: boolean;

}
