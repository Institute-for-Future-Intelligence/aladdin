/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from 'react';
import JackImage from "./resources/jack.png";
import JadeImage from "./resources/jade.png";
import JaneImage from "./resources/jane.png";
import JayeImage from "./resources/jaye.png";
import JeanImage from "./resources/jean.png";
import JediImage from "./resources/jedi.png";
import JeffImage from "./resources/jeff.png";
import JenaImage from "./resources/jena.png";
import JeniImage from "./resources/jeni.png";
import JessImage from "./resources/jess.png";
import JettImage from "./resources/jett.png";
import JillImage from "./resources/jill.png";
import JoanImage from "./resources/joan.png";
import JoelImage from "./resources/joel.png";
import JohnImage from "./resources/john.png";
import JoseImage from "./resources/jose.png";
import JuddImage from "./resources/judd.png";
import JudyImage from "./resources/judy.png";
import JuneImage from "./resources/june.png";
import JuroImage from "./resources/juro.png";
import CottonwoodImage from "./resources/cottonwood.png";
import DogwoodImage from "./resources/dogwood.png";
import ElmImage from "./resources/elm.png";
import LindenImage from "./resources/linden.png";
import MapleImage from "./resources/maple.png";
import OakImage from "./resources/oak.png";
import PineImage from "./resources/pine.png";
import styled from "styled-components";
import 'antd/dist/antd.css';
import {useStore} from "./stores/common";
import {useWorker} from "@koale/useworker";
import {Menu, Checkbox, Radio, Space} from 'antd';
import {HumanName, ObjectType, Theme, TreeType} from "./types";
import ReshapeElementMenu from "./components/reshapeElementMenu";
import {TreeModel} from "./models/treeModel";
import {HumanModel} from "./models/humanModel";

// TODO: Reduce the space between menu items
const StyledMenu = styled(Menu)`
  padding: 0;
  margin: 0;
`;

const {SubMenu} = StyledMenu;

const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
};

export interface ContextMenuProps {

    city: string | null;
    collectDailyLightSensorData: () => void;
    collectYearlyLightSensorData: () => void;

    [key: string]: any;

}

const ContextMenu = ({
                         city,
                         collectDailyLightSensorData,
                         collectYearlyLightSensorData,
                         ...rest
                     }: ContextMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const updateElementById = useStore(state => state.updateElementById);
    const axes = useStore(state => state.axes);
    const grid = useStore(state => state.grid);
    const theme = useStore(state => state.theme);
    const showHeliodonPanel = useStore(state => state.showHeliodonPanel);
    const showGroundPanel = useStore(state => state.showGroundPanel);
    const showWeatherPanel = useStore(state => state.showWeatherPanel);
    const clickObjectType = useStore(state => state.clickObjectType);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const selectedElement = getSelectedElement();
    const [updateFlag, setUpdateFlag] = useState<boolean>(false);

    switch (selectedElement ? selectedElement.type : clickObjectType) {
        case ObjectType.Sky:
            return (
                <StyledMenu style={{padding: 0, margin: 0}}>
                    <Menu.Item key={'axes'}>
                        <Checkbox checked={axes} onChange={(e) => {
                            setCommonStore(state => {
                                state.axes = e.target.checked;
                            });
                        }}>
                            Axes
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'heliodon-settings'}>
                        <Checkbox checked={showHeliodonPanel} onChange={(e) => {
                            setCommonStore(state => {
                                state.showHeliodonPanel = e.target.checked;
                            });
                        }}>
                            Heliodon Settings
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'weather-data'}>
                        <Checkbox checked={showWeatherPanel} onChange={(e) => {
                            setCommonStore(state => {
                                state.showWeatherPanel = e.target.checked;
                            });
                        }}>
                            Weather Data
                        </Checkbox>
                    </Menu.Item>
                    <SubMenu key={'theme'} title={'Theme'}>
                        <Radio.Group value={theme} style={{height: '105px'}} onChange={(e) => {
                            setCommonStore(state => {
                                state.theme = e.target.value;
                            });
                        }}>
                            <Radio style={radioStyle} value={Theme.Default}>Default</Radio>
                            <Radio style={radioStyle} value={Theme.Desert}>Desert</Radio>
                            <Radio style={radioStyle} value={Theme.Grassland}>Grassland</Radio>
                        </Radio.Group>
                    </SubMenu>
                </StyledMenu>);
        case ObjectType.Foundation:
            return (
                <StyledMenu>
                    <Menu.Item key={'foundation-copy'}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'foundation-cut'}>
                        Cut
                    </Menu.Item>
                    {selectedElement && <ReshapeElementMenu elementId={selectedElement.id} name={'foundation'}/>}
                </StyledMenu>
            );
        case ObjectType.Sensor:
            return (
                <StyledMenu>
                    <Menu.Item key={'sensor-copy'}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'sensor-cut'}>
                        Cut
                    </Menu.Item>
                    <Menu.Item key={'sensor-light'}>
                        <Checkbox checked={!!selectedElement?.showLabel} onChange={(e) => {
                            if (selectedElement) {
                                updateElementById(selectedElement.id, {showLabel: e.target.checked});
                            }
                        }}>
                            Show Label
                        </Checkbox>
                    </Menu.Item>
                    <SubMenu key={'analysis'} title={'Analysis'}>
                        <Menu.Item key={'sensor-collect-daily-data'} onClick={collectDailyLightSensorData}>
                            Collect Daily Data
                        </Menu.Item>
                        <Menu.Item key={'sensor-collect-yearly-data'} onClick={collectYearlyLightSensorData}>
                            Collect Yearly Data
                        </Menu.Item>
                    </SubMenu>
                </StyledMenu>
            );
        case ObjectType.Cuboid:
            return (
                <StyledMenu>
                    <Menu.Item key={'cuboid-copy'}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'cuboid-cut'}>
                        Cut
                    </Menu.Item>
                    {selectedElement && <ReshapeElementMenu elementId={selectedElement.id} name={'foundation'}/>}
                </StyledMenu>
            );
        case ObjectType.Human:
            return (
                <StyledMenu>
                    <Menu.Item key={'human-copy'}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'human-cut'}>
                        Cut
                    </Menu.Item>
                    <SubMenu key={'person'} title={'Change Person'}>
                        <Radio.Group value={(selectedElement as HumanModel).name}
                                     style={{height: '625px'}}
                                     onChange={(e) => {
                                         if (selectedElement) {
                                             updateElementById(selectedElement.id, {name: e.target.value});
                                             setUpdateFlag(!updateFlag);
                                         }
                                     }}>
                            <Radio style={radioStyle} value={HumanName.Jack}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jack} src={JackImage} width={10}/>
                                </Space>
                                {HumanName.Jack}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jade}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jade} src={JadeImage} width={10}/>
                                </Space>
                                {HumanName.Jade}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jane}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jane} src={JaneImage} width={10}/>
                                </Space>
                                {HumanName.Jane}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jaye}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jaye} src={JayeImage} width={10}/>
                                </Space>
                                {HumanName.Jaye}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jean}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jean} src={JeanImage} width={10}/>
                                </Space>
                                {HumanName.Jean}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jedi}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jedi} src={JediImage} width={10}/>
                                </Space>
                                {HumanName.Jedi}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jeff}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jeff} src={JeffImage} width={10}/>
                                </Space>
                                {HumanName.Jeff}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jena}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jena} src={JenaImage} width={10}/>
                                </Space>
                                {HumanName.Jena}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jeni}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jeni} src={JeniImage} width={10}/>
                                </Space>
                                {HumanName.Jeni}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jess}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jess} src={JessImage} width={10}/>
                                </Space>
                                {HumanName.Jess}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jett}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jett} src={JettImage} width={10}/>
                                </Space>
                                {HumanName.Jett}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jill}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jill} src={JillImage} width={10}/>
                                </Space>
                                {HumanName.Jill}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Joan}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Joan} src={JoanImage} width={10}/>
                                </Space>
                                {HumanName.Joan}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Joel}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Joel} src={JoelImage} width={10}/>
                                </Space>
                                {HumanName.Joel}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.John}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.John} src={JohnImage} width={10}/>
                                </Space>
                                {HumanName.John}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Jose}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Jose} src={JoseImage} width={10}/>
                                </Space>
                                {HumanName.Jose}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Judd}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Judd} src={JuddImage} width={10}/>
                                </Space>
                                {HumanName.Judd}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Judy}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Judy} src={JudyImage} width={10}/>
                                </Space>
                                {HumanName.Judy}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.June}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.June} src={JuneImage} width={10}/>
                                </Space>
                                {HumanName.June}
                            </Radio>
                            <Radio style={radioStyle} value={HumanName.Juro}>
                                <Space style={{padding: '10px'}} align={'center'} size={40}>
                                    <img alt={HumanName.Juro} src={JuroImage} width={10}/>
                                </Space>
                                {HumanName.Juro}
                            </Radio>
                        </Radio.Group>
                    </SubMenu>
                </StyledMenu>
            );
        case ObjectType.Tree:
            return (
                <StyledMenu style={{padding: 0, margin: 0}}>
                    <Menu.Item key={'tree-copy'}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'tree-cut'}>
                        Cut
                    </Menu.Item>
                    {selectedElement &&
                    <ReshapeElementMenu elementId={selectedElement.id}
                                        name={'tree'}
                                        widthName={'Spread'}
                                        length={false}
                                        angle={false}/>
                    }
                    <SubMenu key={'type'} title={'Change Type'}>
                        <Radio.Group value={(selectedElement as TreeModel).name}
                                     style={{height: '250px'}}
                                     onChange={(e) => {
                                         if (selectedElement) {
                                             updateElementById(selectedElement.id, {name: e.target.value});
                                             setUpdateFlag(!updateFlag);
                                         }
                                     }}>
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
                </StyledMenu>
            );
        default:
            return (
                <StyledMenu>
                    <Menu.Item key={'ground-grid'}>
                        <Checkbox checked={grid} onChange={(e) => {
                            setCommonStore(state => {
                                state.grid = e.target.checked;
                            });
                        }}>
                            Grid
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'ground-settings'}>
                        <Checkbox checked={showGroundPanel} onChange={(e) => {
                            setCommonStore(state => {
                                state.showGroundPanel = e.target.checked;
                            });
                        }}>
                            Ground Settings
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'ground-paste'}>
                        Paste
                    </Menu.Item>
                </StyledMenu>
            );
    }

};

export default ContextMenu;
