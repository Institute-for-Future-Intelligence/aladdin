/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { WallTexture } from '../../../types';
import Wall_01_Img from '../../../resources/wall_01.png';
import Wall_02_Img from '../../../resources/wall_02.png';
import Wall_03_Img from '../../../resources/wall_03.png';
import Wall_04_Img from '../../../resources/wall_04.png';
import Wall_05_Img from '../../../resources/wall_05.png';
import Wall_06_Img from '../../../resources/wall_06.png';
import Wall_07_Img from '../../../resources/wall_07.png';
import Wall_08_Img from '../../../resources/wall_08.png';
import { WallModel } from 'src/models/WallModel';

const { Option } = Select;

const WallSelection = () => {
  const updateElementById = useStore(Selector.updateElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);

  const wall = getSelectedElement() as WallModel;

  const [value, setValue] = useState(wall.textureType);

  return (
    <Select
      style={{ width: '150px' }}
      value={value}
      onChange={(value) => {
        if (wall) {
          updateElementById(wall.id, {
            textureType: value,
          });
          setValue(value);
        }
      }}
    >
      <Option key={WallTexture.NoTexture} value={WallTexture.NoTexture}>
        {/* <img alt={WallTexture.NoTexture} src={Wall_08_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '} */}
        {WallTexture.NoTexture}
      </Option>

      <Option key={WallTexture.Texture_1} value={WallTexture.Texture_1}>
        <img alt={WallTexture.Texture_1} src={Wall_01_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.Texture_1}
      </Option>

      <Option key={WallTexture.Texture_2} value={WallTexture.Texture_2}>
        <img alt={WallTexture.Texture_2} src={Wall_02_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.Texture_2}
      </Option>

      <Option key={WallTexture.Texture_3} value={WallTexture.Texture_3}>
        <img alt={WallTexture.Texture_3} src={Wall_03_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.Texture_3}
      </Option>
      <Option key={WallTexture.Texture_4} value={WallTexture.Texture_4}>
        <img alt={WallTexture.Texture_4} src={Wall_04_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.Texture_4}
      </Option>

      <Option key={WallTexture.Texture_5} value={WallTexture.Texture_5}>
        <img alt={WallTexture.Texture_5} src={Wall_05_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.Texture_5}
      </Option>

      <Option key={WallTexture.Texture_3} value={WallTexture.Texture_3}>
        <img alt={WallTexture.Texture_3} src={Wall_03_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.Texture_3}
      </Option>

      <Option key={WallTexture.Texture_6} value={WallTexture.Texture_6}>
        <img alt={WallTexture.Texture_6} src={Wall_06_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.Texture_6}
      </Option>

      <Option key={WallTexture.Texture_7} value={WallTexture.Texture_7}>
        <img alt={WallTexture.Texture_7} src={Wall_07_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.Texture_7}
      </Option>

      <Option key={WallTexture.Texture_8} value={WallTexture.Texture_8}>
        <img alt={WallTexture.Texture_8} src={Wall_08_Img} height={20} width={35} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.Texture_8}
      </Option>
    </Select>
  );
};

export default WallSelection;
