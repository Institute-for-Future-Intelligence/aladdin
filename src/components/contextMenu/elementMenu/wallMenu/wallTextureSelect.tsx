/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import WallTextureDefaultIcon from 'src/resources/wall_edge.png';
import WallTexture01Icon from 'src/resources/wall_01_menu.png';
import WallTexture02Icon from 'src/resources/wall_02_menu.png';
import WallTexture03Icon from 'src/resources/wall_03_menu.png';
import WallTexture04Icon from 'src/resources/wall_04_menu.png';
import WallTexture05Icon from 'src/resources/wall_05_menu.png';
import WallTexture06Icon from 'src/resources/wall_06_menu.png';
import WallTexture07Icon from 'src/resources/wall_07_menu.png';
import WallTexture08Icon from 'src/resources/wall_08_menu.png';
import WallTexture09Icon from 'src/resources/wall_09_menu.png';
import WallTexture10Icon from 'src/resources/wall_10_menu.png';
import React from 'react';
import { WallTexture } from '../../../../types';
import { Select } from 'antd';
import i18n from 'src/i18n/i18n';
import { useLanguage } from '../../../../hooks';

const { Option } = Select;

const WallTextureSelect = React.memo(
  ({
    texture,
    setTexture,
    height,
  }: {
    texture: WallTexture;
    setTexture: (t: WallTexture) => void;
    height?: number;
  }) => {
    const lang = useLanguage();

    return (
      <Select style={{ width: '150px' }} value={texture} onChange={(t) => setTexture(t)}>
        <Option key={WallTexture.NoTexture} value={WallTexture.NoTexture}>
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

        <Option key={WallTexture.Default} value={WallTexture.Default}>
          <img
            alt={WallTexture.Default}
            src={WallTextureDefaultIcon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.TextureDefault', lang)}
        </Option>

        <Option key={WallTexture.Texture01} value={WallTexture.Texture01}>
          <img
            alt={WallTexture.Texture01}
            src={WallTexture01Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture01', lang)}
        </Option>

        <Option key={WallTexture.Texture02} value={WallTexture.Texture02}>
          <img
            alt={WallTexture.Texture02}
            src={WallTexture02Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture02', lang)}
        </Option>

        <Option key={WallTexture.Texture03} value={WallTexture.Texture03}>
          <img
            alt={WallTexture.Texture03}
            src={WallTexture03Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture03', lang)}
        </Option>

        <Option key={WallTexture.Texture04} value={WallTexture.Texture04}>
          <img
            alt={WallTexture.Texture04}
            src={WallTexture04Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture04', lang)}
        </Option>

        <Option key={WallTexture.Texture05} value={WallTexture.Texture05}>
          <img
            alt={WallTexture.Texture05}
            src={WallTexture05Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture05', lang)}
        </Option>

        <Option key={WallTexture.Texture06} value={WallTexture.Texture06}>
          <img
            alt={WallTexture.Texture06}
            src={WallTexture06Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture06', lang)}
        </Option>

        <Option key={WallTexture.Texture07} value={WallTexture.Texture07}>
          <img
            alt={WallTexture.Texture07}
            src={WallTexture07Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture07', lang)}
        </Option>

        <Option key={WallTexture.Texture08} value={WallTexture.Texture08}>
          <img
            alt={WallTexture.Texture08}
            src={WallTexture08Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture08', lang)}
        </Option>

        <Option key={WallTexture.Texture09} value={WallTexture.Texture09}>
          <img
            alt={WallTexture.Texture09}
            src={WallTexture09Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture09', lang)}
        </Option>

        <Option key={WallTexture.Texture10} value={WallTexture.Texture10}>
          <img
            alt={WallTexture.Texture10}
            src={WallTexture10Icon}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('wallMenu.Texture10', lang)}
        </Option>
      </Select>
    );
  },
);

export default WallTextureSelect;
