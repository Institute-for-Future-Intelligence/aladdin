/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {Vector3} from "three";
import {GroundModel} from "./GroundModel";

export interface WorldModel {

    name: string;
    cameraPosition: Vector3;
    panCenter: Vector3;
    ground: GroundModel;

}
