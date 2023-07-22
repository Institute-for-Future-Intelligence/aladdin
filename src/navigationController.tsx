/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 *
 */

import React from 'react';
import { useStore } from './stores/common';
import { ObjectType } from './types';
import * as Selector from 'src/stores/selector';
import { useThree } from '@react-three/fiber';

export const NavigationController = () => {
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const addedFoundationId = useStore(Selector.addedFoundationId);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const { gl } = useThree();

  gl.domElement.style.cursor =
    objectTypeToAdd !== ObjectType.None || addedCuboidId || addedFoundationId ? 'crosshair' : 'default';

  return null;
};

export default React.memo(NavigationController);
