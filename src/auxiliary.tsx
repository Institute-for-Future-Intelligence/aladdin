/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { HALF_PI } from './constants';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from './types';
import { PolarGrid } from './views/polarGrid';
import { VerticalRuler } from './views/verticalRuler';
import { Util } from './Util';

export const Auxiliary = () => {
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const moveHandleType = useStore(Selector.moveHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);
  const groundImage = useStore(Selector.viewState.groundImage);
  const sceneRadius = useStore(Selector.sceneRadius);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const addedFoundationId = useStore(Selector.addedFoundationId);

  const [showGrid, setShowGrid] = useState(false);
  const [showVerticalRuler, setShowVerticalRuler] = useState(false);
  const [gridSize, setGridSize] = useState(2 * sceneRadius);
  const [gridDivisions, setDivisions] = useState(2 * sceneRadius);
  const element = getSelectedElement();

  useEffect(() => {
    const unit = Math.floor(sceneRadius / 50) + 1;
    const divisions = Math.round(sceneRadius / unit) * 2;
    setGridSize(divisions * unit);
    setDivisions(divisions);
  }, [sceneRadius]);

  useEffect(() => {
    if (resizeHandleType) {
      const changeHeight =
        Util.isTopResizeHandle(resizeHandleType) ||
        (resizeHandleType === ResizeHandleType.UpperLeft && element?.type === ObjectType.Wall) ||
        (resizeHandleType === ResizeHandleType.UpperRight && element?.type === ObjectType.Wall);
      setShowGrid(!changeHeight);
      setShowVerticalRuler(changeHeight);
    } else {
      setShowGrid(false);
      setShowVerticalRuler(false);
    }
  }, [resizeHandleType]);

  // only these elements are allowed to be on the ground
  const legalOnGround = () => {
    if (!element) return false;
    const type = element.type;
    return (
      type === ObjectType.Foundation ||
      type === ObjectType.Cuboid ||
      (type === ObjectType.Tree && element.parentId === ObjectType.Ground) ||
      (type === ObjectType.Human && element.parentId === ObjectType.Ground)
    );
  };

  const hoverRotationHandle = hoveredHandle === RotateHandleType.Lower || hoveredHandle === RotateHandleType.Upper;

  return (
    <>
      {(((showGrid || moveHandleType || Util.isMoveHandle(hoveredHandle)) && !groundImage && legalOnGround()) ||
        addedCuboidId ||
        addedFoundationId) && (
        <gridHelper rotation={[HALF_PI, 0, 0]} name={'Grid'} args={[gridSize, gridDivisions, 'gray', '#444444']} />
      )}
      {(rotateHandleType || hoverRotationHandle) && element && !groundImage && legalOnGround() && (
        <PolarGrid element={element} />
      )}
      {(showVerticalRuler || Util.isTopResizeHandle(hoveredHandle)) && element && <VerticalRuler element={element} />}
    </>
  );
};
