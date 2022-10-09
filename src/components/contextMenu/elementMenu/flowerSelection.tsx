/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { FlowerType } from '../../../types';
import BellflowerImage from '../../../resources/bellflower.png';
import SunflowerImage from '../../../resources/sunflower.png';
import TulipImage from '../../../resources/tulip.png';
import WhiteFlowerImage from '../../../resources/white_flower.png';
import YellowFlowerImage from '../../../resources/yellow_flower.png';
import { UndoableChange } from '../../../undo/UndoableChange';
import i18n from '../../../i18n/i18n';
import { FlowerModel } from '../../../models/FlowerModel';

const { Option } = Select;

const FlowerSelection = () => {
  const language = useStore(Selector.language);
  const updateFlowerTypeById = useStore(Selector.updateFlowerTypeById);
  const addUndoable = useStore(Selector.addUndoable);
  const flower = useStore.getState().getSelectedElement() as FlowerModel;

  const [updateFlag, setUpdateFlag] = useState(false);
  const lang = { lng: language };

  return (
    <Select
      style={{ width: '160px' }}
      value={flower?.name ?? FlowerType.WhiteFlower}
      onChange={(value) => {
        if (flower) {
          const oldFlower = flower.name;
          if (oldFlower !== value) {
            const undoableChange = {
              name: 'Change Flower',
              timestamp: Date.now(),
              oldValue: oldFlower,
              newValue: value,
              changedElementId: flower.id,
              changedElementType: flower.type,
              undo: () => {
                updateFlowerTypeById(undoableChange.changedElementId, undoableChange.oldValue as FlowerType);
              },
              redo: () => {
                updateFlowerTypeById(undoableChange.changedElementId, undoableChange.newValue as FlowerType);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateFlowerTypeById(flower.id, value);
            setUpdateFlag(!updateFlag);
          }
        }
      }}
    >
      <Option key={FlowerType.Bellflower} value={FlowerType.Bellflower}>
        <img alt={FlowerType.Bellflower} src={BellflowerImage} height={20} style={{ paddingRight: '16px' }} />{' '}
        {i18n.t('flower.Bellflower', lang)}
      </Option>
      <Option key={FlowerType.Sunflower} value={FlowerType.Sunflower}>
        <img alt={FlowerType.Sunflower} src={SunflowerImage} height={20} style={{ paddingRight: '16px' }} />{' '}
        {i18n.t('flower.Sunflower', lang)}
      </Option>
      <Option key={FlowerType.Tulip} value={FlowerType.Tulip}>
        <img alt={FlowerType.Tulip} src={TulipImage} height={20} style={{ paddingRight: '16px' }} />{' '}
        {i18n.t('flower.Tulip', lang)}
      </Option>
      <Option key={FlowerType.WhiteFlower} value={FlowerType.WhiteFlower}>
        <img alt={FlowerType.WhiteFlower} src={WhiteFlowerImage} height={20} style={{ paddingRight: '16px' }} />{' '}
        {i18n.t('flower.WhiteFlower', lang)}
      </Option>
      <Option key={FlowerType.YellowFlower} value={FlowerType.YellowFlower}>
        <img alt={FlowerType.YellowFlower} src={YellowFlowerImage} height={20} style={{ paddingRight: '16px' }} />{' '}
        {i18n.t('flower.YellowFlower', lang)}
      </Option>
    </Select>
  );
};

export default FlowerSelection;
