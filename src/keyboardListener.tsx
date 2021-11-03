/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect } from 'react';
import { ObjectType } from './types';
import { WallModel } from './models/WallModel';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';

export interface KeyboardListenerProps {
  keyFlag: boolean; // flip this every time to ensure that handleKey is called in useEffect
  keyName: string | undefined;
  keyDown: boolean;
  keyUp: boolean;
  canvas?: HTMLCanvasElement;
}

const KeyboardListener = ({ keyFlag, keyName, keyDown, keyUp, canvas }: KeyboardListenerProps) => {
  const setCommonStore = useStore(Selector.set);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const deleteElementById = useStore(Selector.deleteElementById);
  const getElementById = useStore(Selector.getElementById);
  const updateElementById = useStore(Selector.updateElementById);

  useEffect(() => {
    handleKey();
  }, [keyFlag, keyName, keyDown, keyUp]);

  const handleKey = () => {
    switch (keyName) {
      case 'delete':
        const selectedElement = getSelectedElement();
        if (selectedElement) {
          if (selectedElement.type === ObjectType.Wall) {
            const currentWall = selectedElement as WallModel;
            if (currentWall.leftJoints.length > 0) {
              const targetWall = getElementById(currentWall.leftJoints[0].id) as WallModel;
              if (targetWall) {
                updateElementById(targetWall.id, { rightOffset: 0, rightJoints: [] });
              }
            }
            if (currentWall.rightJoints.length > 0) {
              const targetWall = getElementById(currentWall.rightJoints[0].id) as WallModel;
              if (targetWall) {
                updateElementById(targetWall.id, { leftOffset: 0, leftJoints: [] });
              }
            }
            setCommonStore((state) => {
              state.deletedWallID = selectedElement.id;
            });
          }
          deleteElementById(selectedElement.id);
          if (canvas) {
            canvas.style.cursor = 'default'; // if an element is deleted but the cursor is not default
          }
        }
        break;
    }
  };

  return <></>;
};

export default React.memo(KeyboardListener);
