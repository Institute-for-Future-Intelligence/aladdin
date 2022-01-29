/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import { WindowModel } from '../../../models/WindowModel';

export const WindowMenu = () => {
  const window = useStore(Selector.selectedElement) as WindowModel;

  return (
    <>
      <Copy keyName={'window-copy'} />
      <Cut keyName={'window-cut'} />
      <Lock keyName={'window-lock'} />
    </>
  );
};
