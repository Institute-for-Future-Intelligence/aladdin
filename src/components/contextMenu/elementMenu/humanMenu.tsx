/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu, Space } from 'antd';
import HumanSelection from './humanSelection';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { HumanModel } from '../../../models/HumanModel';

export const HumanMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);

  const tree = getSelectedElement() as HumanModel;
  const editable = !tree?.locked;

  return (
    <>
      <Copy keyName={'human-copy'} />
      {editable && <Cut keyName={'human-cut'} />}
      <Lock keyName={'human-lock'} />
      {editable && (
        <Menu>
          <Menu.Item key={'human-change-person'} style={{ paddingLeft: '36px' }}>
            <Space style={{ width: '120px' }}>{i18n.t('peopleMenu.ChangePerson', { lng: language })}: </Space>
            <HumanSelection key={'humans'} />
          </Menu.Item>
        </Menu>
      )}
    </>
  );
};
