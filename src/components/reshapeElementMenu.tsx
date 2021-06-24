/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";
import {Menu, Space} from "antd";
import NumericInput from "react-numeric-input";
import {Util} from "../util";
import {useStore} from "../stores/common";

export interface ReshapeElementMenuProps {
    elementId: string;
    name: string;
}

const ReshapeElementMenu = ({
                                elementId,
                                name = 'default',
                            }: ReshapeElementMenuProps) => {

    const setElementSize = useStore(state => state.setElementSize);
    const setElementRotation = useStore(state => state.setElementRotation);
    const getElementById = useStore(state => state.getElementById);
    const element = getElementById(elementId);

    return (
        <Menu key={name}>
            <Menu.Item key={name + '-lx'}>
                <Space style={{width: '60px'}}>Length:</Space>
                <NumericInput min={0.1}
                              max={100}
                              precision={1}
                              value={element ? element.lx.toFixed(1) : 1}
                              size={5}
                              format={(x) => x + 'm'}
                              onChange={(e) => {
                                  if (element) {
                                      setElementSize(element.id, e ?? 1, element.ly);
                                  }
                              }}
                />
            </Menu.Item>
            <Menu.Item key={name + '-ly'}>
                <Space style={{width: '60px'}}>Width:</Space>
                <NumericInput min={0.1}
                              max={100}
                              precision={1}
                              value={element ? element.ly.toFixed(1) : 1}
                              size={5}
                              format={(y) => y + 'm'}
                              onChange={(e) => {
                                  if (element) {
                                      setElementSize(element.id, element.lx, e ?? 1);
                                  }
                              }}
                />
            </Menu.Item>
            <Menu.Item key={name + '-lz'}>
                <Space style={{width: '60px'}}>Height:</Space>
                <NumericInput min={0.1}
                              max={10}
                              precision={1}
                              step={0.1}
                              value={element ? element.lz.toFixed(1) : 0.1}
                              size={5}
                              format={(h) => h + 'm'}
                              onChange={(e) => {
                                  if (element) {
                                      setElementSize(element.id, element.lx, element.ly, e ?? 0.1);
                                  }
                              }}
                />
            </Menu.Item>
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
                                  }
                              }}
                />
            </Menu.Item>
        </Menu>
    );

};

export default ReshapeElementMenu;
