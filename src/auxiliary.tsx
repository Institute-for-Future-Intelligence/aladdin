/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { HALF_PI } from './constants';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ObjectType, ResizeHandleType } from './types';
import { PolarGrid } from './views/polarGrid';
import { VerticalRuler } from './views/verticalRuler';
import { HorizontalRuler } from './views/horizontalRuler';

export const Auxiliary = () => {
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const moveHandleType = useStore(Selector.moveHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const groundImage = useStore(Selector.viewState.groundImage);
  const sceneRadius = useStore(Selector.sceneRadius);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const addedFoundationId = useStore(Selector.addedFoundationId);

  const [showGrid, setShowGrid] = useState(false);
  const [showHorizontalRuler, setShowHorizontalRuler] = useState(false);
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
        resizeHandleType === ResizeHandleType.LowerLeftTop ||
        resizeHandleType === ResizeHandleType.LowerRightTop ||
        resizeHandleType === ResizeHandleType.UpperLeftTop ||
        resizeHandleType === ResizeHandleType.UpperRightTop ||
        (resizeHandleType === ResizeHandleType.UpperLeft && element?.type === ObjectType.Wall) ||
        (resizeHandleType === ResizeHandleType.UpperRight && element?.type === ObjectType.Wall);
      if (changeHeight) {
        setShowGrid(false);
        setShowVerticalRuler(true);
      } else {
        const changeWidthAndLength =
          resizeHandleType === ResizeHandleType.LowerLeft ||
          resizeHandleType === ResizeHandleType.LowerRight ||
          resizeHandleType === ResizeHandleType.UpperLeft ||
          resizeHandleType === ResizeHandleType.UpperRight;
        if (changeWidthAndLength) {
          setShowGrid(true);
          setShowHorizontalRuler(true);
        }
      }
    } else {
      setShowGrid(false);
      setShowVerticalRuler(false);
      setShowHorizontalRuler(false);
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
      {(((showGrid || moveHandleType) && !groundImage && legalOnGround()) || addedCuboidId || addedFoundationId) && (
        <gridHelper rotation={[HALF_PI, 0, 0]} name={'Grid'} args={[gridSize, gridDivisions, 'gray', '#444444']} />
      )}
      {rotateHandleType && element && !groundImage && legalOnGround() && <PolarGrid element={element} />}
      {showVerticalRuler && element && <VerticalRuler element={element} />}
      {showHorizontalRuler && element && <HorizontalRuler element={element} />}
    </>
  );
};
