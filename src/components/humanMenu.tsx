/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";
import {Menu, Radio, Space} from "antd";
import {HumanName} from "../types";
import JackImage from "../resources/jack.png";
import JadeImage from "../resources/jade.png";
import JaneImage from "../resources/jane.png";
import JayeImage from "../resources/jaye.png";
import JeanImage from "../resources/jean.png";
import JediImage from "../resources/jedi.png";
import JeffImage from "../resources/jeff.png";
import JenaImage from "../resources/jena.png";
import JeniImage from "../resources/jeni.png";
import JessImage from "../resources/jess.png";
import JettImage from "../resources/jett.png";
import JillImage from "../resources/jill.png";
import JoanImage from "../resources/joan.png";
import JoelImage from "../resources/joel.png";
import JohnImage from "../resources/john.png";
import JoseImage from "../resources/jose.png";
import JuddImage from "../resources/judd.png";
import JudyImage from "../resources/judy.png";
import JuneImage from "../resources/june.png";
import JuroImage from "../resources/juro.png";
import {useStore} from "../stores/common";

const {SubMenu} = Menu;

const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
};

export interface HumanMenuProps {
    requestUpdate: () => void;

    [key: string]: any;
}

const HumanMenu = ({
                       requestUpdate,
                       ...rest
                   }: HumanMenuProps) => {

    const updateElementById = useStore(state => state.updateElementById);
    const getSelectedElement = useStore(state => state.getSelectedElement);

    const human = getSelectedElement();

    return (
        <SubMenu key={'person'} title={'Change Person'}  {...rest}>
            <Radio.Group value={human?.name}
                         style={{height: '625px'}}
                         onChange={(e) => {
                             if (human) {
                                 updateElementById(human.id, {name: e.target.value});
                                 requestUpdate();
                             }
                         }}
            >
                <Radio style={radioStyle} value={HumanName.Jack}>
                    <Space style={{paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jack} src={JackImage} width={10}/>
                    </Space>
                    {HumanName.Jack}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jade}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jade} src={JadeImage} width={10}/>
                    </Space>
                    {HumanName.Jade}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jane}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jane} src={JaneImage} width={10}/>
                    </Space>
                    {HumanName.Jane}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jaye}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jaye} src={JayeImage} width={10}/>
                    </Space>
                    {HumanName.Jaye}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jean}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jean} src={JeanImage} width={10}/>
                    </Space>
                    {HumanName.Jean}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jedi}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jedi} src={JediImage} width={10}/>
                    </Space>
                    {HumanName.Jedi}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jeff}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jeff} src={JeffImage} width={10}/>
                    </Space>
                    {HumanName.Jeff}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jena}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jena} src={JenaImage} width={10}/>
                    </Space>
                    {HumanName.Jena}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jeni}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jeni} src={JeniImage} width={10}/>
                    </Space>
                    {HumanName.Jeni}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jess}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jess} src={JessImage} width={10}/>
                    </Space>
                    {HumanName.Jess}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jett}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jett} src={JettImage} width={10}/>
                    </Space>
                    {HumanName.Jett}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jill}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jill} src={JillImage} width={10}/>
                    </Space>
                    {HumanName.Jill}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Joan}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Joan} src={JoanImage} width={10}/>
                    </Space>
                    {HumanName.Joan}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Joel}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Joel} src={JoelImage} width={10}/>
                    </Space>
                    {HumanName.Joel}
                </Radio>
                <Radio style={radioStyle} value={HumanName.John}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.John} src={JohnImage} width={10}/>
                    </Space>
                    {HumanName.John}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Jose}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Jose} src={JoseImage} width={10}/>
                    </Space>
                    {HumanName.Jose}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Judd}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Judd} src={JuddImage} width={10}/>
                    </Space>
                    {HumanName.Judd}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Judy}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.Judy} src={JudyImage} width={10}/>
                    </Space>
                    {HumanName.Judy}
                </Radio>
                <Radio style={radioStyle} value={HumanName.June}>
                    <Space style={{paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px'}}
                           align={'center'}
                           size={40}>
                        <img alt={HumanName.June} src={JuneImage} width={10}/>
                    </Space>
                    {HumanName.June}
                </Radio>
                <Radio style={radioStyle} value={HumanName.Juro}>
                    <Space style={{paddingTop: '10px', paddingRight: '10px'}} align={'center'} size={40}>
                        <img alt={HumanName.Juro} src={JuroImage} width={10}/>
                    </Space>
                    {HumanName.Juro}
                </Radio>
            </Radio.Group>
        </SubMenu>
    );

};

export default HumanMenu;
