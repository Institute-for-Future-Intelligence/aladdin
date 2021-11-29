/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { WORKSPACE_SIZE } from './constants';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ObjectType, ResizeHandleType } from './types';
import { PolarGrid } from './polarGrid';
import { VerticalRuler } from './verticalRuler';

export const Auxiliary = () => {
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const enableOrbitController = useStore(Selector.enableOrbitController);
  const moveHandleType = useStore(Selector.moveHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const groundImage = useStore(Selector.viewState.groundImage);

  const [showGrid, setShowGrid] = useState(false);
  const [showVerticalRuler, setshowVerticalRuler] = useState(false);
  const element = getSelectedElement();

  useEffect(() => {
    if (resizeHandleType) {
      const changeHeight =
        resizeHandleType === ResizeHandleType.LowerLeftTop ||
        resizeHandleType === ResizeHandleType.LowerRightTop ||
        resizeHandleType === ResizeHandleType.UpperLeftTop ||
        resizeHandleType === ResizeHandleType.UpperRightTop ||
        (resizeHandleType === ResizeHandleType.UpperLeft && element?.type === ObjectType.Wall) ||
        (resizeHandleType === ResizeHandleType.UpperRight && element?.type === ObjectType.Wall);
      setShowGrid(!changeHeight);
      setshowVerticalRuler(changeHeight);
    } else {
      setShowGrid(false);
      setshowVerticalRuler(false);
    }
  }, [resizeHandleType]);

  // only these elements are allowed to be on the ground
  const legalOnGround = () => {
    const type = getSelectedElement()?.type;
    return (
      type === ObjectType.Foundation ||
      type === ObjectType.Cuboid ||
      type === ObjectType.Tree ||
      type === ObjectType.Human
    );
  };

  return (
    <>
      {!enableOrbitController && (
        <>
          {(showGrid || moveHandleType) && !groundImage && legalOnGround() && (
            <gridHelper
              rotation={[Math.PI / 2, 0, 0]}
              name={'Grid'}
              args={[WORKSPACE_SIZE, WORKSPACE_SIZE, 'gray', '#444444']}
            />
          )}
          {rotateHandleType && element && !groundImage && legalOnGround() && <PolarGrid element={element} />}
          {showVerticalRuler && element && <VerticalRuler element={element} />}
        </>
      )}
    </>
  );
};

export default React.memo(Auxiliary);
