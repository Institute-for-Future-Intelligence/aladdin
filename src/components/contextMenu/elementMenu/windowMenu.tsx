/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from 'src/stores/common';
import ReshapeElementMenu from 'src/components/reshapeElementMenu';
import { Copy, Cut, Lock } from '../menuItems';

export const WindowMenu = () => {
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const selectedElement = getSelectedElement();

  return (
    <>
      <Copy />
      <Cut />
      <Lock />
      {selectedElement && (
        <ReshapeElementMenu
          elementId={selectedElement.id}
          name={'window'}
          maxLength={10}
          maxHeight={10}
          adjustAngle={false}
          adjustWidth={false}
          lengthStep={0.1}
          heigthStep={0.1}
          style={{ paddingLeft: '20px' }}
        />
      )}
    </>
  );
};
