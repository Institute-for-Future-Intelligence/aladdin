/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {Foundation} from "./foundation";
import {Vector3} from "three";

export interface World {

    name: string;
    cameraPosition: Vector3;
    foundations: { [key: string]: Foundation };

}
