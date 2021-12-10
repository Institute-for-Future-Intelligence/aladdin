/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';

export const WindowMenu = () => {
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectedElement = getSelectedElement();

  return (
    <>
      <Copy keyName={'window-copy'} />
      <Cut keyName={'window-cut'} />
      <Lock keyName={'window-lock'} />
    </>
  );
};
