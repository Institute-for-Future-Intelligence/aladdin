/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import { WindowModel } from '../../../models/WindowModel';
import MullinoWidthInput from './windowMullionWidthInput';
import { Menu } from 'antd';
import i18n from 'src/i18n/i18n';

export const WindowMenu = () => {
  const window = useStore(Selector.selectedElement) as WindowModel;

  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [mullionWidthDialogVisible, setMullionWidthDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  return (
    window && (
      <>
        <Copy keyName={'window-copy'} />
        <Cut keyName={'window-cut'} />
        <Lock keyName={'window-lock'} />

        {mullionWidthDialogVisible && <MullinoWidthInput setDialogVisible={setMullionWidthDialogVisible} />}
        <Menu.Item
          key={'window-mullionWidth'}
          style={{ paddingLeft: paddingLeft }}
          onClick={() => {
            setApplyCount(0);
            setMullionWidthDialogVisible(true);
          }}
        >
          {i18n.t('windowMenu.MullionWidth', lang)} ...
        </Menu.Item>
      </>
    )
  );
};
