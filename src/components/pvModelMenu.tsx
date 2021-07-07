/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";
import {Menu, Radio} from "antd";
import {useStore} from "../stores/common";
import {SolarPanelModel} from "../models/SolarPanelModel";

const {SubMenu} = Menu;

const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
};

export interface PvModelMenuProps {
    requestUpdate: () => void;

    [key: string]: any;
}

const PvModelMenu = ({
                         requestUpdate,
                         ...rest
                     }: PvModelMenuProps) => {

    const updateElementById = useStore(state => state.updateElementById);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const pvModules = useStore(state => state.pvModules);

    const solarPanel = getSelectedElement() as SolarPanelModel;

    return (
        <SubMenu key={'type'} title={'Change Model'} {...rest}>
            <Radio.Group value={solarPanel?.pvModel.name}
                         style={{height: '250px'}}
                         onChange={(e) => {
                             if (solarPanel) {
                                 updateElementById(solarPanel.id, {pvModel: pvModules[e.target.value]});
                                 requestUpdate();
                             }
                         }}
            >
                {Object.keys(pvModules).map(key => <Radio style={radioStyle} value={key}>{key}</Radio>)}
            </Radio.Group>
        </SubMenu>
    );

};

export default PvModelMenu;
