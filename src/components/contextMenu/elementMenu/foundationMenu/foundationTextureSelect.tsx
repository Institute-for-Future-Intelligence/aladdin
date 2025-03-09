/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Select } from 'antd';
import React from 'react';
import { FoundationTexture } from '../../../../types';
import { useLanguage } from '../../../../hooks';
import i18n from '../../../../i18n/i18n';
import Foundation_Texture_01_Menu from '../../../../resources/foundation_01_menu.png';
import Foundation_Texture_02_Menu from '../../../../resources/foundation_02_menu.png';
import Foundation_Texture_03_Menu from '../../../../resources/foundation_03_menu.png';
import Foundation_Texture_04_Menu from '../../../../resources/foundation_04_menu.png';
import Foundation_Texture_05_Menu from '../../../../resources/foundation_05_menu.png';
import Foundation_Texture_06_Menu from '../../../../resources/foundation_06_menu.png';
import Foundation_Texture_07_Menu from '../../../../resources/foundation_07_menu.png';

const { Option } = Select;

const FoundationTextureSelect = React.memo(
  ({
    texture,
    setTexture,
    height,
  }: {
    texture: FoundationTexture;
    setTexture: (t: FoundationTexture) => void;
    height?: number;
  }) => {
    const lang = useLanguage();
    return (
      <Select style={{ width: '150px' }} value={texture} onChange={(t) => setTexture(t)}>
        <Option key={FoundationTexture.NoTexture} value={FoundationTexture.NoTexture}>
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

        <Option key={FoundationTexture.Texture01} value={FoundationTexture.Texture01}>
          <img
            alt={FoundationTexture.Texture01}
            src={Foundation_Texture_01_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('foundationMenu.Texture01', lang)}
        </Option>

        <Option key={FoundationTexture.Texture02} value={FoundationTexture.Texture02}>
          <img
            alt={FoundationTexture.Texture02}
            src={Foundation_Texture_02_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('foundationMenu.Texture02', lang)}
        </Option>

        <Option key={FoundationTexture.Texture03} value={FoundationTexture.Texture03}>
          <img
            alt={FoundationTexture.Texture03}
            src={Foundation_Texture_03_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('foundationMenu.Texture03', lang)}
        </Option>

        <Option key={FoundationTexture.Texture04} value={FoundationTexture.Texture04}>
          <img
            alt={FoundationTexture.Texture04}
            src={Foundation_Texture_04_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('foundationMenu.Texture04', lang)}
        </Option>

        <Option key={FoundationTexture.Texture05} value={FoundationTexture.Texture05}>
          <img
            alt={FoundationTexture.Texture05}
            src={Foundation_Texture_05_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('foundationMenu.Texture05', lang)}
        </Option>

        <Option key={FoundationTexture.Texture06} value={FoundationTexture.Texture06}>
          <img
            alt={FoundationTexture.Texture06}
            src={Foundation_Texture_06_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('foundationMenu.Texture06', lang)}
        </Option>

        <Option key={FoundationTexture.Texture07} value={FoundationTexture.Texture07}>
          <img
            alt={FoundationTexture.Texture07}
            src={Foundation_Texture_07_Menu}
            height={height ?? 20}
            width={40}
            style={{ paddingRight: '8px' }}
          />{' '}
          {i18n.t('foundationMenu.Texture07', lang)}
        </Option>
      </Select>
    );
  },
);

export default FoundationTextureSelect;
