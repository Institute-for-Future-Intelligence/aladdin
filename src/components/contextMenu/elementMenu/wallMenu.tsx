/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from '../../../stores/selector';
import ReshapeElementMenu from 'src/components/reshapeElementMenu';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import WallSelection from './wallSelection';

export const WallMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);

  const selectedElement = getSelectedElement();
  const lang = { lng: language };

  return (
    <>
      <Copy />
      <Cut />
      <Lock />
      <Menu>
        <Menu.Item key={'wall-change-texture'} style={{ paddingLeft: '36px' }}>
          <Space style={{ width: '60px' }}>{i18n.t('wallMenu.Texture', lang)}: </Space>
          <WallSelection key={'walls'} />
        </Menu.Item>
      </Menu>
      {selectedElement && (
        <ReshapeElementMenu
          elementId={selectedElement.id}
          name={'wall'}
          maxLength={50}
          maxWidth={2}
          maxHeight={50}
          adjustAngle={false}
          widthName={i18n.t('wallMenu.Thickness', lang)}
          widthStep={0.1}
          style={{ paddingLeft: '20px' }}
        />
      )}
    </>
  );
};
