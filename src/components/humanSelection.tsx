/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { HumanName } from '../types';
import JackImage from '../resources/jack.png';
import JadeImage from '../resources/jade.png';
import JaneImage from '../resources/jane.png';
import JayeImage from '../resources/jaye.png';
import JeanImage from '../resources/jean.png';
import JediImage from '../resources/jedi.png';
import JeffImage from '../resources/jeff.png';
import JenaImage from '../resources/jena.png';
import JeniImage from '../resources/jeni.png';
import JessImage from '../resources/jess.png';
import JettImage from '../resources/jett.png';
import JillImage from '../resources/jill.png';
import JoanImage from '../resources/joan.png';
import JoelImage from '../resources/joel.png';
import JohnImage from '../resources/john.png';
import JoseImage from '../resources/jose.png';
import JuddImage from '../resources/judd.png';
import JudyImage from '../resources/judy.png';
import JuneImage from '../resources/june.png';
import JuroImage from '../resources/juro.png';
import { useStore } from '../stores/common';
import { HumanModel } from '../models/HumanModel';

const { Option } = Select;

export interface HumanSelectionProps {
  [key: string]: any;
}

const HumanSelection = ({ ...rest }: HumanSelectionProps) => {
  const updateElementById = useStore((state) => state.updateElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  const human = getSelectedElement() as HumanModel;

  return (
    <Select
      style={{ width: '120px' }}
      value={human?.name}
      onChange={(value) => {
        if (human) {
          updateElementById(human.id, { name: value });
          setUpdateFlag(!updateFlag);
        }
      }}
    >
      <Option key={HumanName.Jack} value={HumanName.Jack}>
        <img alt={HumanName.Jack} src={JackImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jack}
      </Option>
      <Option key={HumanName.Jade} value={HumanName.Jade}>
        <img alt={HumanName.Jade} src={JadeImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jade}
      </Option>
      <Option key={HumanName.Jane} value={HumanName.Jane}>
        <img alt={HumanName.Jane} src={JaneImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jane}
      </Option>
      <Option key={HumanName.Jaye} value={HumanName.Jaye}>
        <img alt={HumanName.Jaye} src={JayeImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jaye}
      </Option>
      <Option key={HumanName.Jean} value={HumanName.Jean}>
        <img alt={HumanName.Jean} src={JeanImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jean}
      </Option>
      <Option key={HumanName.Jedi} value={HumanName.Jedi}>
        <img alt={HumanName.Jedi} src={JediImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jedi}
      </Option>
      <Option key={HumanName.Jeff} value={HumanName.Jeff}>
        <img alt={HumanName.Jeff} src={JeffImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jeff}
      </Option>
      <Option key={HumanName.Jena} value={HumanName.Jena}>
        <img alt={HumanName.Jena} src={JenaImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jena}
      </Option>
      <Option key={HumanName.Jeni} value={HumanName.Jeni}>
        <img alt={HumanName.Jeni} src={JeniImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jeni}
      </Option>
      <Option key={HumanName.Jess} value={HumanName.Jess}>
        <img alt={HumanName.Jess} src={JessImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jess}
      </Option>
      <Option key={HumanName.Jett} value={HumanName.Jett}>
        <img alt={HumanName.Jett} src={JettImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jett}
      </Option>
      <Option key={HumanName.Jill} value={HumanName.Jill}>
        <img alt={HumanName.Jill} src={JillImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jill}
      </Option>
      <Option key={HumanName.Joan} value={HumanName.Joan}>
        <img alt={HumanName.Joan} src={JoanImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Joan}
      </Option>
      <Option key={HumanName.Joel} value={HumanName.Joel}>
        <img alt={HumanName.Joel} src={JoelImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Joel}
      </Option>
      <Option key={HumanName.John} value={HumanName.John}>
        <img alt={HumanName.John} src={JohnImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.John}
      </Option>
      <Option key={HumanName.Jose} value={HumanName.Jose}>
        <img alt={HumanName.Jose} src={JoseImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Jose}
      </Option>
      <Option key={HumanName.Judd} value={HumanName.Judd}>
        <img alt={HumanName.Judd} src={JuddImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Judd}
      </Option>
      <Option key={HumanName.Judy} value={HumanName.Judy}>
        <img alt={HumanName.Judy} src={JudyImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Judy}
      </Option>
      <Option key={HumanName.June} value={HumanName.June}>
        <img alt={HumanName.June} src={JuneImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.June}
      </Option>
      <Option key={HumanName.Juro} value={HumanName.Juro}>
        <img alt={HumanName.Juro} src={JuroImage} height={20} style={{ paddingRight: '8px' }} /> {HumanName.Juro}
      </Option>
    </Select>
  );
};

export default HumanSelection;
