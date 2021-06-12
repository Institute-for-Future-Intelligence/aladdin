/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export interface ElementModel {

    id: string;
    type: string;
    cx: number; // x coordinate of the center
    cy: number; // y coordinate of the center

    selected?: boolean;
    hovered?: boolean;
    color?: string;
    lineColor?: string;
    lineWidth?: number;
    showLabel?: boolean;

    [key: string]: any;
}
