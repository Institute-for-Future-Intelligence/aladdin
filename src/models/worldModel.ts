/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {Vector3} from "three";
import {ElementModel} from "./elementModel";
import {GroundModel} from "./groundModel";

export interface WorldModel {

    name: string;
    cameraPosition: Vector3;
    ground?: GroundModel;
    elements: ElementModel[];

}
