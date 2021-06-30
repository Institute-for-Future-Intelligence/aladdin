/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ElementModel} from "./ElementModel";

export interface TreeModel extends ElementModel {

    name: string;
    evergreen: boolean;
    showModel: boolean;

}
