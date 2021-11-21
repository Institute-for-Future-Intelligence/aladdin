/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Modal, Radio, RadioChangeEvent, Select, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, WallTexture } from '../../../types';
import { WallModel } from '../../../models/WallModel';
import Wall_01_Img from '../../../resources/wall_01.png';
import Wall_02_Img from '../../../resources/wall_02.png';
import Wall_03_Img from '../../../resources/wall_03.png';
import Wall_04_Img from '../../../resources/wall_04.png';
import Wall_05_Img from '../../../resources/wall_05.png';
import Wall_06_Img from '../../../resources/wall_06.png';
import Wall_07_Img from '../../../resources/wall_07.png';
import Wall_08_Img from '../../../resources/wall_08.png';

const { Option } = Select;

const WallSelection = () => {
  const updateWallTextureById = useStore(Selector.updateWallTextureById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const setCommonStore = useStore(Selector.set);

  const wall = getSelectedElement();

  const [textureType, setTextureType] = useState(wall?.textureType ?? WallTexture.NoTexture);
  const [prevTexture, setPrevTexture] = useState('');
  const [radioGroup, setRadioGroup] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOk = () => {
    if (wall) {
      switch (radioGroup) {
        case 1:
          updateWallTextureById(wall.id, textureType);
          break;

        case 2:
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall && e.parentId === wall.parentId) {
                (e as WallModel).textureType = textureType;
              }
            }
          });
          break;

        case 3:
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                (e as WallModel).textureType = textureType;
              }
            }
          });
          break;
      }
      setTextureType(textureType);
    }
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setTextureType(prevTexture);
  };

  const onRadioChange = (e: RadioChangeEvent) => {
    setRadioGroup(e.target.value);
  };

  const onSelectionChange = (value: string) => {
    setIsModalVisible(true);
    setPrevTexture(textureType);
    setTextureType(value);
  };

  return (
    <>
      <Modal title="Wall Texture" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <Radio.Group onChange={onRadioChange} value={radioGroup}>
          <Space direction="vertical">
            <Radio value={1}>Apply to only this wall</Radio>
            <Radio value={2}>Apply to all walls on this foundation</Radio>
            <Radio value={3}>Apply to all walls</Radio>
          </Space>
        </Radio.Group>
      </Modal>

      <Select style={{ width: '150px' }} value={textureType} onChange={onSelectionChange}>
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
    </>
  );
};

export default WallSelection;
