/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ElementModel} from "./elementModel";

export interface SensorModel extends ElementModel {

    light: boolean;
    heatFlux: boolean;
    lit?: boolean;

}
