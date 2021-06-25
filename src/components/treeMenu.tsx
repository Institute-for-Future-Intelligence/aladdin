/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from "react";
import {Menu, Radio, Space} from "antd";
import {useStore} from "../stores/common";
import {TreeModel} from "../models/treeModel";
import {TreeType} from "../types";
import CottonwoodImage from "../resources/cottonwood.png";
import DogwoodImage from "../resources/dogwood.png";
import ElmImage from "../resources/elm.png";
import LindenImage from "../resources/linden.png";
import MapleImage from "../resources/maple.png";
import OakImage from "../resources/oak.png";
import PineImage from "../resources/pine.png";

const {SubMenu} = Menu;

const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
};

export interface TreeMenuProps {
    tree: TreeModel;
}

const TreeMenu = ({tree}: TreeMenuProps) => {

    const updateElementById = useStore(state => state.updateElementById);
    const [updateFlag, setUpdateFlag] = useState<boolean>(false);

    return (
        <SubMenu key={'type'} title={'Change Type'}>
            <Radio.Group value={tree.name}
                         style={{height: '250px'}}
                         onChange={(e) => {
                             if (tree) {
                                 updateElementById(tree.id, {name: e.target.value});
                                 setUpdateFlag(!updateFlag);
                             }
                         }}
            >
                <Radio style={radioStyle} value={TreeType.Cottonwood}>
                    <Space style={{padding: '10px'}} align={'center'} size={40}>
                        <img alt={TreeType.Cottonwood} src={CottonwoodImage} width={20}/>
                    </Space>
                    {TreeType.Cottonwood}
                </Radio>
                <Radio style={radioStyle} value={TreeType.Dogwood}>
                    <Space style={{padding: '10px'}} align={'center'} size={40}>
                        <img alt={TreeType.Dogwood} src={DogwoodImage} width={20}/>
                    </Space>
                    {TreeType.Dogwood}
                </Radio>
                <Radio style={radioStyle} value={TreeType.Elm}>
                    <Space style={{padding: '10px'}} align={'center'} size={40}>
                        <img alt={TreeType.Elm} src={ElmImage} width={20}/>
                    </Space>
                    {TreeType.Elm}
                </Radio>
                <Radio style={radioStyle} value={TreeType.Linden}>
                    <Space style={{padding: '10px'}} align={'center'} size={40}>
                        <img alt={TreeType.Linden} src={LindenImage} width={20}/>
                    </Space>
                    {TreeType.Linden}
                </Radio>
                <Radio style={radioStyle} value={TreeType.Maple}>
                    <Space style={{padding: '10px'}} align={'center'} size={40}>
                        <img alt={TreeType.Maple} src={MapleImage} width={20}/>
                    </Space>
                    {TreeType.Maple}
                </Radio>
                <Radio style={radioStyle} value={TreeType.Oak}>
                    <Space style={{padding: '10px'}} align={'center'} size={40}>
                        <img alt={TreeType.Oak} src={OakImage} width={20}/>
                    </Space>
                    {TreeType.Oak}
                </Radio>
                <Radio style={radioStyle} value={TreeType.Pine}>
                    <Space style={{padding: '10px'}} align={'center'} size={40}>
                        <img alt={TreeType.Pine} src={PineImage} width={20}/>
                    </Space>
                    {TreeType.Pine}
                </Radio>
            </Radio.Group>
        </SubMenu>
    );

};

export default TreeMenu;
