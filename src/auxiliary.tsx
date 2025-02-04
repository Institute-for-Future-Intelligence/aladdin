/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { HALF_PI } from './constants';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { MoveHandleType, ObjectType, ResizeHandleType, RoofHandleType, RotateHandleType } from './types';
import { PolarGrid } from './views/polarGrid';
import { VerticalRuler } from './views/verticalRuler';
import { Util } from './Util';

export const Auxiliary = React.memo(() => {
  const moveHandleType = useStore(Selector.moveHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);
  const groundImage = useStore(Selector.viewState.groundImage);
  const sceneRadius = useStore(Selector.sceneRadius);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const addedFoundationId = useStore(Selector.addedFoundationId);

  const element = useStore((state) => {
    if (state.selectedElement) {
      const selectedElementId = state.selectedElement.id;
      return state.elements.find((e) => e.id === selectedElementId);
    }
  });

  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(2 * sceneRadius);
  const [gridDivisions, setDivisions] = useState(2 * sceneRadius);

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
    } else {
      setShowGrid(false);
    }
  }, [resizeHandleType, element?.type]);

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

  const showPolarGridByHover = hoveredHandle === RotateHandleType.Lower || hoveredHandle === RotateHandleType.Upper;

  const showVerticalRulerHelper = (
    handle: MoveHandleType | ResizeHandleType | RotateHandleType | RoofHandleType | null,
  ) => {
    return (
      (Util.isTopResizeHandle(handle) && element?.type !== ObjectType.BatteryStorage) ||
      (element?.type === ObjectType.Wall && Util.isTopResizeHandleOfWall(handle)) ||
      (element?.type === ObjectType.Roof && Util.isRiseHandleOfRoof(handle))
    );
  };

  const handle = resizeHandleType ?? hoveredHandle;

  const showVerticalRuler = showVerticalRulerHelper(handle);

  if (!element) return null;

  return (
    <>
      {(((showGrid || moveHandleType || Util.isMoveHandle(hoveredHandle)) && !groundImage && legalOnGround()) ||
        addedCuboidId ||
        addedFoundationId) && (
        <gridHelper rotation={[HALF_PI, 0, 0]} name={'Grid'} args={[gridSize, gridDivisions, 'gray', '#444444']} />
      )}
      {(rotateHandleType || showPolarGridByHover) && element && legalOnGround() && <PolarGrid element={element} />}
      {showVerticalRuler && <VerticalRuler element={element} />}
    </>
  );
});
