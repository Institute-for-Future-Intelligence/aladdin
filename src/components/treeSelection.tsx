/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";
import {Select} from "antd";
import {useStore} from "../stores/common";
import {TreeType} from "../types";
import CottonwoodImage from "../resources/cottonwood.png";
import DogwoodImage from "../resources/dogwood.png";
import ElmImage from "../resources/elm.png";
import LindenImage from "../resources/linden.png";
import MapleImage from "../resources/maple.png";
import OakImage from "../resources/oak.png";
import PineImage from "../resources/pine.png";

const {Option} = Select;

export interface TreeSelectionProps {
    requestUpdate: () => void;

    [key: string]: any;
}

const TreeSelection = ({
                           requestUpdate,
                           ...rest
                       }: TreeSelectionProps) => {

    const updateElementById = useStore(state => state.updateElementById);
    const getSelectedElement = useStore(state => state.getSelectedElement);

    const tree = getSelectedElement();

    return (
        <Select style={{width: '120px'}}
                value={tree?.name}
                onChange={(value) => {
                    if (tree) {
                        updateElementById(tree.id, {
                            name: value,
                            evergreen: value === TreeType.Pine
                        });
                        requestUpdate();
                    }
                }}
        >
            <Option key={TreeType.Cottonwood} value={TreeType.Cottonwood}>
                <img alt={TreeType.Cottonwood} src={CottonwoodImage} height={20}
                     style={{paddingRight: '8px'}}/> {TreeType.Cottonwood}
            </Option>
            <Option key={TreeType.Dogwood} value={TreeType.Dogwood}>
                <img alt={TreeType.Dogwood} src={DogwoodImage} height={20}
                     style={{paddingRight: '8px'}}/> {TreeType.Dogwood}
            </Option>
            <Option key={TreeType.Elm} value={TreeType.Elm}>
                <img alt={TreeType.Elm} src={ElmImage} height={20}
                     style={{paddingRight: '8px'}}/> {TreeType.Elm}
            </Option>
            <Option key={TreeType.Linden} value={TreeType.Linden}>
                <img alt={TreeType.Linden} src={LindenImage} height={20}
                     style={{paddingRight: '8px'}}/> {TreeType.Linden}
            </Option>
            <Option key={TreeType.Maple} value={TreeType.Maple}>
                <img alt={TreeType.Maple} src={MapleImage} height={20}
                     style={{paddingRight: '8px'}}/> {TreeType.Maple}
            </Option>
            <Option key={TreeType.Oak} value={TreeType.Oak}>
                <img alt={TreeType.Oak} src={OakImage} height={20}
                     style={{paddingRight: '8px'}}/> {TreeType.Oak}
            </Option>
            <Option key={TreeType.Pine} value={TreeType.Pine}>
                <img alt={TreeType.Pine} src={PineImage} height={20}
                     style={{paddingRight: '8px'}}/> {TreeType.Pine}
            </Option>
        </Select>
    );

};

export default TreeSelection;
