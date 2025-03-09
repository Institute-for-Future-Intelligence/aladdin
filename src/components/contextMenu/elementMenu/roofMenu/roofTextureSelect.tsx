/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Select } from 'antd';
import React from 'react';
import { RoofTexture } from '../../../../types';
import { useLanguage } from '../../../../hooks';
import i18n from '../../../../i18n/i18n';
import RoofTextureDefaultIcon from '../../../../resources/roof_edge_menu.png';
import RoofTexture01Icon from '../../../../resources/roof_01_menu.png';
import RoofTexture02Icon from '../../../../resources/roof_02_menu.png';
import RoofTexture03Icon from '../../../../resources/roof_03_menu.png';
import RoofTexture04Icon from '../../../../resources/roof_04_menu.png';
import RoofTexture05Icon from '../../../../resources/roof_05_menu.png';
import RoofTexture06Icon from '../../../../resources/roof_06_menu.png';
import RoofTexture07Icon from '../../../../resources/roof_07_menu.png';

const { Option } = Select;

const RoofTextureSelect = React.memo(
  ({
    texture,
    setTexture,
    height,
  }: {
    texture: RoofTexture;
    setTexture: (t: RoofTexture) => void;
    height?: number;
  }) => {
    const lang = useLanguage();
    return (
      <Select style={{ width: '150px' }} value={texture} onChange={(t) => setTexture(t)}>
        <Option key={RoofTexture.NoTexture} value={RoofTexture.NoTexture}>
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

        <Option key={RoofTexture.Default} value={RoofTexture.Default}>
          <img
            alt={RoofTexture.Default}
            src={RoofTextureDefaultIcon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('roofMenu.TextureDefault', lang)}
        </Option>

        <Option key={RoofTexture.Texture01} value={RoofTexture.Texture01}>
          <img
            alt={RoofTexture.Texture01}
            src={RoofTexture01Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('roofMenu.Texture01', lang)}
        </Option>

        <Option key={RoofTexture.Texture02} value={RoofTexture.Texture02}>
          <img
            alt={RoofTexture.Texture02}
            src={RoofTexture02Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('roofMenu.Texture02', lang)}
        </Option>

        <Option key={RoofTexture.Texture03} value={RoofTexture.Texture03}>
          <img
            alt={RoofTexture.Texture03}
            src={RoofTexture03Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('roofMenu.Texture03', lang)}
        </Option>

        <Option key={RoofTexture.Texture04} value={RoofTexture.Texture04}>
          <img
            alt={RoofTexture.Texture04}
            src={RoofTexture04Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('roofMenu.Texture04', lang)}
        </Option>

        <Option key={RoofTexture.Texture05} value={RoofTexture.Texture05}>
          <img
            alt={RoofTexture.Texture05}
            src={RoofTexture05Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('roofMenu.Texture05', lang)}
        </Option>

        <Option key={RoofTexture.Texture06} value={RoofTexture.Texture06}>
          <img
            alt={RoofTexture.Texture06}
            src={RoofTexture06Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('roofMenu.Texture06', lang)}
        </Option>

        <Option key={RoofTexture.Texture07} value={RoofTexture.Texture07}>
          <img
            alt={RoofTexture.Texture07}
            src={RoofTexture07Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('roofMenu.Texture07', lang)}
        </Option>
      </Select>
    );
  },
);

export default RoofTextureSelect;
