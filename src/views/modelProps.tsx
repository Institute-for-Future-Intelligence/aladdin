/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";

export interface ModelProps {
    id: string;
    cx: number; // x coordinate of the center
    cy: number; // y coordinate of the center
    selected?: boolean,
    color?: string;
    lineColor?: string;
    hoverColor?: string;

    [key: string]: any;
}
