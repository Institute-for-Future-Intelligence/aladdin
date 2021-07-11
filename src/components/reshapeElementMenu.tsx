/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";
import {InputNumber, Menu, Space} from "antd";
import {Util} from "../Util";
import {useStore} from "../stores/common";
import {ObjectType} from "../types";

export interface ReshapeElementMenuProps {
    elementId: string;
    name: string;
    maxWidth?: number;
    maxLength?: number;
    maxHeight?: number;
    adjustWidth?: boolean;
    adjustLength?: boolean;
    adjustHeight?: boolean;
    adjustAngle?: boolean;
    widthName?: string;
    requestUpdate: () => void;

    [key: string]: any;
}

const ReshapeElementMenu = ({
                                elementId,
                                name = 'default',
                                maxWidth = 100,
                                maxLength = 100,
                                maxHeight = 100,
                                adjustWidth = true,
                                adjustLength = true,
                                adjustHeight = true,
                                adjustAngle = true,
                                widthName = 'Width',
                                requestUpdate,
                                ...rest
                            }: ReshapeElementMenuProps) => {

    const setElementSize = useStore(state => state.setElementSize);
    const setElementRotation = useStore(state => state.setElementRotation);
    const getElementById = useStore(state => state.getElementById);
    const updateElementById = useStore(state => state.updateElementById);
    const element = getElementById(elementId);

    return (
        <Menu key={name} {...rest}>
            {adjustWidth &&
            <Menu.Item key={name + '-lx'}>
                <Space style={{width: '60px'}}>{widthName}:</Space>
                <InputNumber min={0.1.toString()} // FIXME: Why can't it accept 0.1 here? (It is fine in contextMenu)
                             max={maxWidth.toString()}
                             step={0.5}
                             precision={1}
                             value={element ? element.lx.toFixed(1) : 1}
                             formatter={(x) => Number(x).toFixed(1) + ' m'}
                             onChange={(value) => {
                                 if (element && value) {
                                     setElementSize(element.id, value as number, element.ly);
                                     requestUpdate();
                                 }
                             }}
                />
            </Menu.Item>
            }
            {adjustLength &&
            <Menu.Item key={name + '-ly'}>
                <Space style={{width: '60px'}}>Length:</Space>
                <InputNumber min={0.1.toString()}
                             max={maxLength.toString()}
                             step={0.5}
                             precision={1}
                             value={element ? element.ly.toFixed(1) : 1}
                             formatter={(y) =>  Number(y).toFixed(1) + ' m'}
                             onChange={(value) => {
                                 if (element && value) {
                                     setElementSize(element.id, element.lx, value as number);
                                     requestUpdate();
                                 }
                             }}
                />
            </Menu.Item>
            }
            {adjustHeight &&
            <Menu.Item key={name + '-lz'}>
                <Space style={{width: '60px'}}>Height:</Space>
                <InputNumber min={0.1.toString()}
                             max={maxHeight.toString()}
                             step={0.1}
                             precision={1}
                             value={element ? element.lz.toFixed(1) : 0.1}
                             formatter={(h) =>  Number(h).toFixed(1) + ' m'}
                             onChange={(value) => {
                                 if (element && value) {
                                     setElementSize(element.id, element.lx, element.ly, value as number);
                                     // the following objects stand on the ground and should raise their z coordinates
                                     if (
                                         element.type === ObjectType.Human ||
                                         element.type === ObjectType.Tree ||
                                         element.type === ObjectType.Foundation ||
                                         element.type === ObjectType.Cuboid) {
                                         updateElementById(element.id, {cz: (value as number) / 2});
                                     }
                                     requestUpdate();
                                 }
                             }}
                />
            </Menu.Item>
            }
            {adjustAngle &&
            <Menu.Item key={name + '-angle'}>
                <Space style={{width: '60px'}}>Angle:</Space>
                <InputNumber min={0}
                             max={360.0.toString()}
                             step={1}
                             precision={1}
                             value={element ? Util.toDegrees(element.rotation[2]).toFixed(1) : 0}
                             formatter={(a) =>  Number(a).toFixed(1) + '°'}
                             onChange={(value) => {
                                 if (element && value !== null) {
                                     setElementRotation(
                                         element.id,
                                         element.rotation[0],
                                         element.rotation[1],
                                         Util.toRadians(typeof value === 'string' ? parseFloat(value) : value)
                                     );
                                     requestUpdate();
                                 }
                             }}
                />
            </Menu.Item>
            }
        </Menu>
    );

};

export default ReshapeElementMenu;
