/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from "react";
import {Menu, Space} from "antd";
import NumericInput from "react-numeric-input";
import {Util} from "../Util";
import {useStore} from "../stores/common";

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
                            }: ReshapeElementMenuProps) => {

    const [updateFlag, setUpdateFlag] = useState<boolean>(false);
    const setElementSize = useStore(state => state.setElementSize);
    const setElementRotation = useStore(state => state.setElementRotation);
    const getElementById = useStore(state => state.getElementById);
    const element = getElementById(elementId);

    return (
        <Menu key={name}>
            {adjustWidth &&
            <Menu.Item key={name + '-lx'}>
                <Space style={{width: '60px'}}>{widthName}:</Space>
                <NumericInput min={0.1}
                              max={maxWidth}
                              precision={1}
                              value={element ? element.lx.toFixed(1) : 1}
                              size={5}
                              format={(x) => x + 'm'}
                              onChange={(e) => {
                                  if (element) {
                                      setElementSize(element.id, e ?? 1, element.ly);
                                      setUpdateFlag(!updateFlag);
                                  }
                              }}
                />
            </Menu.Item>
            }
            {adjustLength &&
            <Menu.Item key={name + '-ly'}>
                <Space style={{width: '60px'}}>Length:</Space>
                <NumericInput min={0.1}
                              max={maxLength}
                              precision={1}
                              value={element ? element.ly.toFixed(1) : 1}
                              size={5}
                              format={(y) => y + 'm'}
                              onChange={(e) => {
                                  if (element) {
                                      setElementSize(element.id, element.lx, e ?? 1);
                                      setUpdateFlag(!updateFlag);
                                  }
                              }}
                />
            </Menu.Item>
            }
            {adjustHeight &&
            <Menu.Item key={name + '-lz'}>
                <Space style={{width: '60px'}}>Height:</Space>
                <NumericInput min={0.1}
                              max={maxHeight}
                              precision={1}
                              step={0.1}
                              value={element ? element.lz.toFixed(1) : 0.1}
                              size={5}
                              format={(h) => h + 'm'}
                              onChange={(e) => {
                                  if (element) {
                                      setElementSize(element.id, element.lx, element.ly, e ?? 0.1);
                                      setUpdateFlag(!updateFlag);
                                  }
                              }}
                />
            </Menu.Item>
            }
            {adjustAngle &&
            <Menu.Item key={name + '-angle'}>
                <Space style={{width: '60px'}}>Angle:</Space>
                <NumericInput min={0}
                              max={360}
                              precision={1}
                              value={element ? Util.toDegrees(element.rotation[1]).toFixed(1) : 0}
                              size={5}
                              format={(a) => a + '°'}
                              onChange={(e) => {
                                  if (element) {
                                      setElementRotation(
                                          element.id,
                                          element.rotation[0],
                                          Util.toRadians(e ?? 0),
                                          element.rotation[2]
                                      );
                                      setUpdateFlag(!updateFlag);
                                  }
                              }}
                />
            </Menu.Item>
            }
        </Menu>
    );

};

export default ReshapeElementMenu;
