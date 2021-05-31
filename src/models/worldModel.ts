/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {Vector3} from "three";
import {ElementModel} from "./elementModel";

export interface WorldModel {

    name: string;
    cameraPosition: Vector3;
    elements: ElementModel[];

}
