/*
 * @Copyright 2022-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { FlowerType, ObjectType } from '../../../../types';
import BellflowerImage from 'src/resources/bellflower.png';
import BoxwoodImage from 'src/resources/boxwood.png';
import CactusCombo1Image from 'src/resources/cactus_combo_1.png';
import CactusCombo2Image from 'src/resources/cactus_combo_2.png';
import CactusCombo3Image from 'src/resources/cactus_combo_3.png';
import CactusCombo4Image from 'src/resources/cactus_combo_4.png';
import HibiscusImage from 'src/resources/hibiscus.png';
import HydrangeaImage from 'src/resources/hydrangea.png';
import HostaImage from 'src/resources/hosta.png';
import PeonyImage from 'src/resources/peony.png';
import RedRoseImage from 'src/resources/red_rose.png';
import SpireaImage from 'src/resources/spirea.png';
import SunflowerImage from 'src/resources/sunflower.png';
import TallBushImage from 'src/resources/tall_bush.png';
import TulipImage from 'src/resources/tulip.png';
import WhiteFlowerImage from 'src/resources/white_flower.png';
import YellowFlowerImage from 'src/resources/yellow_flower.png';
import { UndoableChange } from '../../../../undo/UndoableChange';
import i18n from '../../../../i18n/i18n';
import { FlowerModel } from '../../../../models/FlowerModel';
import { FlowerData } from '../../../../FlowerData';
import { useLanguage } from '../../../../hooks';

const { Option } = Select;

const style = {
  display: 'flex',
  justifyContent: 'start',
  alignItems: 'center',
};

const FlowerSelection = React.memo(({ flower }: { flower: FlowerModel }) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const [updateFlag, setUpdateFlag] = useState(false);
  const lang = useLanguage();

  const updateFlowerTypeById = (id: string, type: FlowerType) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Flower && e.id === id) {
          const flower = e as FlowerModel;
          flower.name = type;
          flower.lx = FlowerData.fetchSpread(type);
          flower.lz = FlowerData.fetchHeight(type);
          break;
        }
      }
    });
  };

  return (
    <Select
      style={{ width: '200px' }}
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
            setCommonStore((state) => {
              state.actionState.flowerType = value;
            });
            setUpdateFlag(!updateFlag);
          }
        }
      }}
    >
      <Option key={FlowerType.WhiteFlower} value={FlowerType.WhiteFlower}>
        <span style={style}>
          <img alt={FlowerType.WhiteFlower} src={WhiteFlowerImage} height={20} style={{ paddingRight: '17px' }} />{' '}
          {i18n.t('flower.WhiteFlower', lang)}
        </span>
      </Option>
      <Option key={FlowerType.YellowFlower} value={FlowerType.YellowFlower}>
        <span style={style}>
          <img alt={FlowerType.YellowFlower} src={YellowFlowerImage} height={20} style={{ paddingRight: '16px' }} />{' '}
          {i18n.t('flower.YellowFlower', lang)}
        </span>
      </Option>
      <Option key={FlowerType.Hibiscus} value={FlowerType.Hibiscus}>
        <span style={style}>
          <img alt={FlowerType.Hibiscus} src={HibiscusImage} height={20} style={{ paddingRight: '19px' }} />{' '}
          {i18n.t('flower.Hibiscus', lang)}
        </span>
      </Option>
      <Option key={FlowerType.Hydrangea} value={FlowerType.Hydrangea}>
        <span style={style}>
          <img alt={FlowerType.Hydrangea} src={HydrangeaImage} height={20} style={{ paddingRight: '18px' }} />{' '}
          {i18n.t('flower.Hydrangea', lang)}
        </span>
      </Option>
      <Option key={FlowerType.Spirea} value={FlowerType.Spirea}>
        <span style={style}>
          <img alt={FlowerType.Spirea} src={SpireaImage} height={20} style={{ paddingRight: '18px' }} />{' '}
          {i18n.t('flower.Spirea', lang)}
        </span>
      </Option>
      <Option key={FlowerType.Hosta} value={FlowerType.Hosta}>
        <span style={style}>
          <img alt={FlowerType.Hosta} src={HostaImage} height={20} style={{ paddingRight: '18px' }} />{' '}
          {i18n.t('flower.Hosta', lang)}
        </span>
      </Option>
      <Option key={FlowerType.Peony} value={FlowerType.Peony}>
        <span style={style}>
          <img alt={FlowerType.Peony} src={PeonyImage} height={20} style={{ paddingRight: '17px' }} />{' '}
          {i18n.t('flower.Peony', lang)}
        </span>
      </Option>
      <Option key={FlowerType.Boxwood} value={FlowerType.Boxwood}>
        <span style={style}>
          <img alt={FlowerType.Boxwood} src={BoxwoodImage} height={20} style={{ paddingRight: '23px' }} />{' '}
          {i18n.t('flower.Boxwood', lang)}
        </span>
      </Option>
      <Option key={FlowerType.TallBush} value={FlowerType.TallBush}>
        <span style={style}>
          <img alt={FlowerType.TallBush} src={TallBushImage} height={20} style={{ paddingRight: '32px' }} />{' '}
          {i18n.t('flower.TallBush', lang)}
        </span>
      </Option>
      <Option key={FlowerType.CactusCombo1} value={FlowerType.CactusCombo1}>
        <span style={style}>
          <img alt={FlowerType.CactusCombo1} src={CactusCombo1Image} height={20} style={{ paddingRight: '26px' }} />{' '}
          {i18n.t('flower.CactusCombo1', lang)}
        </span>
      </Option>
      <Option key={FlowerType.CactusCombo2} value={FlowerType.CactusCombo2}>
        <span style={style}>
          <img alt={FlowerType.CactusCombo2} src={CactusCombo2Image} height={20} style={{ paddingRight: '26px' }} />{' '}
          {i18n.t('flower.CactusCombo2', lang)}
        </span>
      </Option>
      <Option key={FlowerType.CactusCombo3} value={FlowerType.CactusCombo3}>
        <span style={style}>
          <img alt={FlowerType.CactusCombo3} src={CactusCombo3Image} height={20} style={{ paddingRight: '26px' }} />{' '}
          {i18n.t('flower.CactusCombo3', lang)}
        </span>
      </Option>
      <Option key={FlowerType.CactusCombo4} value={FlowerType.CactusCombo4}>
        <span style={style}>
          <img alt={FlowerType.CactusCombo4} src={CactusCombo4Image} height={20} style={{ paddingRight: '26px' }} />{' '}
          {i18n.t('flower.CactusCombo4', lang)}
        </span>
      </Option>
      <Option key={FlowerType.RedRose} value={FlowerType.RedRose}>
        <span style={style}>
          <img alt={FlowerType.RedRose} src={RedRoseImage} height={20} style={{ paddingRight: '26px' }} />{' '}
          {i18n.t('flower.RedRose', lang)}
        </span>
      </Option>
      <Option key={FlowerType.Bellflower} value={FlowerType.Bellflower}>
        <span style={style}>
          <img alt={FlowerType.Bellflower} src={BellflowerImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('flower.Bellflower', lang)}
        </span>
      </Option>
      <Option key={FlowerType.Sunflower} value={FlowerType.Sunflower}>
        <span style={style}>
          <img alt={FlowerType.Sunflower} src={SunflowerImage} height={20} style={{ paddingRight: '32px' }} />{' '}
          {i18n.t('flower.Sunflower', lang)}
        </span>
      </Option>
      <Option key={FlowerType.Tulip} value={FlowerType.Tulip}>
        <span style={style}>
          <img alt={FlowerType.Tulip} src={TulipImage} height={20} style={{ paddingRight: '24px' }} />{' '}
          {i18n.t('flower.Tulip', lang)}
        </span>
      </Option>
    </Select>
  );
});

export default FlowerSelection;
