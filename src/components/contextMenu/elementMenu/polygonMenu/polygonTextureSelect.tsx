/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Select } from 'antd';
import React from 'react';
import { PolygonTexture } from '../../../../types';
import { useLanguage } from '../../../../hooks';
import i18n from '../../../../i18n/i18n';
import Polygon_Texture_01_Menu from '../../../../resources/foundation_01_menu.png';
import Polygon_Texture_02_Menu from '../../../../resources/foundation_02_menu.png';
import Polygon_Texture_03_Menu from '../../../../resources/foundation_03_menu.png';
import Polygon_Texture_04_Menu from '../../../../resources/foundation_04_menu.png';
import Polygon_Texture_05_Menu from '../../../../resources/foundation_05_menu.png';
import Polygon_Texture_06_Menu from '../../../../resources/foundation_06_menu.png';
import Polygon_Texture_07_Menu from '../../../../resources/foundation_07_menu.png';
import Polygon_Texture_08_Menu from '../../../../resources/polygon_08_menu.png';
import Polygon_Texture_09_Menu from '../../../../resources/polygon_09_menu.png';
import Polygon_Texture_10_Menu from '../../../../resources/polygon_10_menu.png';

const { Option } = Select;

const PolygonTextureSelect = React.memo(
  ({
    texture,
    setTexture,
    height,
  }: {
    texture: PolygonTexture;
    setTexture: (t: PolygonTexture) => void;
    height?: number;
  }) => {
    const lang = useLanguage();
    return (
      <Select style={{ width: '150px' }} value={texture} onChange={(t) => setTexture(t)}>
        <Option key={PolygonTexture.NoTexture} value={PolygonTexture.NoTexture}>
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

        <Option key={PolygonTexture.Texture01} value={PolygonTexture.Texture01}>
          <img
            alt={PolygonTexture.Texture01}
            src={Polygon_Texture_01_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture01', lang)}
        </Option>

        <Option key={PolygonTexture.Texture02} value={PolygonTexture.Texture02}>
          <img
            alt={PolygonTexture.Texture02}
            src={Polygon_Texture_02_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture02', lang)}
        </Option>

        <Option key={PolygonTexture.Texture03} value={PolygonTexture.Texture03}>
          <img
            alt={PolygonTexture.Texture03}
            src={Polygon_Texture_03_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture03', lang)}
        </Option>

        <Option key={PolygonTexture.Texture04} value={PolygonTexture.Texture04}>
          <img
            alt={PolygonTexture.Texture04}
            src={Polygon_Texture_04_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture04', lang)}
        </Option>

        <Option key={PolygonTexture.Texture05} value={PolygonTexture.Texture05}>
          <img
            alt={PolygonTexture.Texture05}
            src={Polygon_Texture_05_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture05', lang)}
        </Option>

        <Option key={PolygonTexture.Texture06} value={PolygonTexture.Texture06}>
          <img
            alt={PolygonTexture.Texture06}
            src={Polygon_Texture_06_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture06', lang)}
        </Option>

        <Option key={PolygonTexture.Texture07} value={PolygonTexture.Texture07}>
          <img
            alt={PolygonTexture.Texture07}
            src={Polygon_Texture_07_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture07', lang)}
        </Option>

        <Option key={PolygonTexture.Texture08} value={PolygonTexture.Texture08}>
          <img
            alt={PolygonTexture.Texture08}
            src={Polygon_Texture_08_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture08', lang)}
        </Option>

        <Option key={PolygonTexture.Texture09} value={PolygonTexture.Texture09}>
          <img
            alt={PolygonTexture.Texture09}
            src={Polygon_Texture_09_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture09', lang)}
        </Option>

        <Option key={PolygonTexture.Texture10} value={PolygonTexture.Texture10}>
          <img
            alt={PolygonTexture.Texture10}
            src={Polygon_Texture_10_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('polygonMenu.Texture10', lang)}
        </Option>
      </Select>
    );
  },
);

export default PolygonTextureSelect;
