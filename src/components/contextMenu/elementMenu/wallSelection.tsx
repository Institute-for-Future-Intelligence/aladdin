/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { useStore } from '../../../stores/common';
import { WallTexture } from '../../../types';
import WallExteriorImage from '../../../resources/WallExteriorImage.png';
import { WallModel } from 'src/models/WallModel';

const { Option } = Select;

const WallSelection = () => {
  const updateElementById = useStore((state) => state.updateElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  const wall = getSelectedElement() as WallModel;

  return (
    <Select
      style={{ width: '150px' }}
      value={wall?.texture}
      onChange={(value) => {
        if (wall) {
          updateElementById(wall.id, {
            texture: value,
          });
          setUpdateFlag(!updateFlag);
        }
      }}
    >
      <Option key={WallTexture.default} value={WallTexture.default}>
        <img alt={WallTexture.default} src={WallExteriorImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {WallTexture.default}
      </Option>
    </Select>
  );
};

export default WallSelection;
