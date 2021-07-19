/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";
import {WORKSPACE_SIZE} from "./constants";
import {useStore} from "./stores/common";
import {ObjectType} from "./types";

const Grid = () => {

    const grid = useStore((state) => state.grid);
    const enableOrbitController = useStore((state) => state.enableOrbitController);
    const getSelectedElement = useStore((state) => state.getSelectedElement);
    const viewStateGroundImage = useStore((state) => state.viewState.groundImage);

    // only these elements are allowed to be on the ground
    const legalOnGround = () => {
        const type = getSelectedElement()?.type;
        return (
            type === ObjectType.Foundation ||
            type === ObjectType.Cuboid ||
            type === ObjectType.Tree ||
            type === ObjectType.Human
        );
    };

    return (
        <React.Fragment>
            {(grid || !enableOrbitController) && legalOnGround() && !viewStateGroundImage && (
                <gridHelper name={"Grid"} args={[WORKSPACE_SIZE, WORKSPACE_SIZE, "gray", "gray"]}/>
            )}
        </React.Fragment>

    );
};

export default React.memo(Grid);
