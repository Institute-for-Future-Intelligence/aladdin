/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Select } from 'antd';
import React from 'react';
import { DoorTexture } from '../../../../types';
import { useLanguage } from '../../../../hooks';
import i18n from '../../../../i18n/i18n';
import DoorTextureDefaultIcon from '../../../../resources/door_edge.png';
import DoorTexture01Icon from '../../../../resources/door_01.png';
import DoorTexture02Icon from '../../../../resources/door_02.png';
import DoorTexture03Icon from '../../../../resources/door_03.png';
import DoorTexture04Icon from '../../../../resources/door_04.png';
import DoorTexture05Icon from '../../../../resources/door_05.png';
import DoorTexture06Icon from '../../../../resources/door_06.png';
import DoorTexture07Icon from '../../../../resources/door_07.png';
import DoorTexture08Icon from '../../../../resources/door_08.png';
import DoorTexture09Icon from '../../../../resources/door_09.png';
import DoorTexture10Icon from '../../../../resources/door_10.png';
import DoorTexture11Icon from '../../../../resources/door_11.png';
import DoorTexture12Icon from '../../../../resources/door_12.png';
import DoorTexture13Icon from '../../../../resources/door_13.png';
import DoorTexture14Icon from '../../../../resources/door_14.png';
import DoorTexture15Icon from '../../../../resources/door_15.png';
import DoorTexture16Icon from '../../../../resources/door_16.png';
import DoorTexture17Icon from '../../../../resources/door_17.png';

const { Option } = Select;

const DoorTextureSelect = React.memo(
  ({
    texture,
    setTexture,
    height,
  }: {
    texture: DoorTexture;
    setTexture: (t: DoorTexture) => void;
    height?: number;
  }) => {
    const lang = useLanguage();
    return (
      <Select style={{ width: '150px' }} value={texture} onChange={(value) => setTexture(value)}>
        <Option key={DoorTexture.NoTexture} value={DoorTexture.NoTexture}>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '12px',
              width: '32px',
              height: (height ?? 20) + 'px',
              border: '1px dashed dimGray',
            }}
          >
            {' '}
          </div>
          {i18n.t('shared.NoTexture', lang)}
        </Option>

        <Option key={DoorTexture.Default} value={DoorTexture.Default}>
          <img
            alt={DoorTexture.Default}
            src={DoorTextureDefaultIcon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.TextureDefault', lang)}
        </Option>

        <Option key={DoorTexture.Texture01} value={DoorTexture.Texture01}>
          <img
            alt={DoorTexture.Texture01}
            src={DoorTexture01Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture01', lang)}
        </Option>

        <Option key={DoorTexture.Texture02} value={DoorTexture.Texture02}>
          <img
            alt={DoorTexture.Texture02}
            src={DoorTexture02Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture02', lang)}
        </Option>

        <Option key={DoorTexture.Texture03} value={DoorTexture.Texture03}>
          <img
            alt={DoorTexture.Texture03}
            src={DoorTexture03Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture03', lang)}
        </Option>

        <Option key={DoorTexture.Texture04} value={DoorTexture.Texture04}>
          <img
            alt={DoorTexture.Texture04}
            src={DoorTexture04Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture04', lang)}
        </Option>

        <Option key={DoorTexture.Texture05} value={DoorTexture.Texture05}>
          <img
            alt={DoorTexture.Texture05}
            src={DoorTexture05Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture05', lang)}
        </Option>

        <Option key={DoorTexture.Texture06} value={DoorTexture.Texture06}>
          <img
            alt={DoorTexture.Texture06}
            src={DoorTexture06Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture06', lang)}
        </Option>

        <Option key={DoorTexture.Texture07} value={DoorTexture.Texture07}>
          <img
            alt={DoorTexture.Texture07}
            src={DoorTexture07Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture07', lang)}
        </Option>

        <Option key={DoorTexture.Texture08} value={DoorTexture.Texture08}>
          <img
            alt={DoorTexture.Texture08}
            src={DoorTexture08Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture08', lang)}
        </Option>

        <Option key={DoorTexture.Texture09} value={DoorTexture.Texture09}>
          <img
            alt={DoorTexture.Texture09}
            src={DoorTexture09Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture09', lang)}
        </Option>

        <Option key={DoorTexture.Texture10} value={DoorTexture.Texture10}>
          <img
            alt={DoorTexture.Texture10}
            src={DoorTexture10Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture10', lang)}
        </Option>

        <Option key={DoorTexture.Texture11} value={DoorTexture.Texture11}>
          <img
            alt={DoorTexture.Texture11}
            src={DoorTexture11Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture11', lang)}
        </Option>

        <Option key={DoorTexture.Texture12} value={DoorTexture.Texture12}>
          <img
            alt={DoorTexture.Texture12}
            src={DoorTexture12Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture12', lang)}
        </Option>

        <Option key={DoorTexture.Texture13} value={DoorTexture.Texture13}>
          <img
            alt={DoorTexture.Texture13}
            src={DoorTexture13Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture13', lang)}
        </Option>

        <Option key={DoorTexture.Texture14} value={DoorTexture.Texture14}>
          <img
            alt={DoorTexture.Texture14}
            src={DoorTexture14Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture14', lang)}
        </Option>

        <Option key={DoorTexture.Texture15} value={DoorTexture.Texture15}>
          <img
            alt={DoorTexture.Texture15}
            src={DoorTexture15Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture15', lang)}
        </Option>

        <Option key={DoorTexture.Texture16} value={DoorTexture.Texture16}>
          <img
            alt={DoorTexture.Texture16}
            src={DoorTexture16Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture16', lang)}
        </Option>

        <Option key={DoorTexture.Texture17} value={DoorTexture.Texture17}>
          <img
            alt={DoorTexture.Texture17}
            src={DoorTexture17Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('doorMenu.Texture17', lang)}
        </Option>
      </Select>
    );
  },
);

export default DoorTextureSelect;
