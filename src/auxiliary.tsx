/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { HALF_PI } from './constants';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ObjectType, ResizeHandleType } from './types';
import { PolarGrid } from './polarGrid';
import { VerticalRuler } from './verticalRuler';

export const Auxiliary = () => {
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const moveHandleType = useStore(Selector.moveHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const groundImage = useStore(Selector.viewState.groundImage);
  const sceneRadius = useStore(Selector.sceneRadius);
  const buildingCuboidId = useStore(Selector.buildingCuboidId);
  const buildingFoundationId = useStore(Selector.buildingFoundationId);

  const [showGrid, setShowGrid] = useState(false);
  const [showVerticalRuler, setshowVerticalRuler] = useState(false);
  const [gridSize, setGridSize] = useState(2 * sceneRadius);
  const [gridDivisions, setDivisions] = useState(2 * sceneRadius);
  const element = getSelectedElement();

  useEffect(() => {
    const unit = Math.floor(sceneRadius / 50) + 1;
    const dividsions = Math.round(sceneRadius / unit) * 2;
    setGridSize(dividsions * unit);
    setDivisions(dividsions);
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
      {(((showGrid || moveHandleType) && !groundImage && legalOnGround()) ||
        buildingCuboidId ||
        buildingFoundationId) && (
        <gridHelper rotation={[HALF_PI, 0, 0]} name={'Grid'} args={[gridSize, gridDivisions, 'gray', '#444444']} />
      )}
      {rotateHandleType && element && !groundImage && legalOnGround() && <PolarGrid element={element} />}
      {showVerticalRuler && element && <VerticalRuler element={element} />}
    </>
  );
};

export default React.memo(Auxiliary);
