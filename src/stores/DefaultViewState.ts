/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ViewState} from "../views/ViewState";

export class DefaultViewState implements ViewState {

    axes: boolean;
    shadowEnabled: boolean;

    constructor() {

        this.axes = true;
        this.shadowEnabled = true;

    }

}
