/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { ElementModel } from '../models/ElementModel';
import { ResizeHandleType } from '../types';
import i18n from '../i18n/i18n';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';

export interface RulerOnWallProps {
  element: ElementModel;
}

export const RulerOnWall = ({ element }: RulerOnWallProps) => {
  const language = useStore(Selector.language);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);

  const hx = element.lx / 2;
  const hz = element.lz / 2;
  const rulerArrowOffset = 0.05;
  const rulerLineWidth = 1;
  const rulerTickMarkWidth = 0.5;
  const color = element.lineColor ?? 'white';
  const lang = { lng: language };
  const labelBackgroundColor = 'darkorchid';
  const ratio = Math.max(0.25, (hx + hz) / 32);
  const rulerOffset = 0.25;
  const fontSize = 30;
  const yOffset = -0.1;

  // lower-left to upper-left
  const ll2ul = useMemo(() => {
    return (
      <>
        <textSprite
          userData={{ unintersectable: true }}
          backgroundColor={labelBackgroundColor}
          text={element.lz.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={fontSize}
          fontFace={'Times Roman'}
          textHeight={ratio}
          position={[-hx - rulerOffset, yOffset, 0]}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx - rulerOffset, 0, -hz],
            [-hx - rulerOffset, 0, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx - rulerOffset + rulerArrowOffset, 0, -hz + 3 * rulerArrowOffset],
            [-hx - rulerOffset, 0, -hz],
            [-hx - rulerOffset - rulerArrowOffset, 0, -hz + 3 * rulerArrowOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx - rulerOffset + rulerArrowOffset, 0, hz - 3 * rulerArrowOffset],
            [-hx - rulerOffset, 0, hz],
            [-hx - rulerOffset - rulerArrowOffset, 0, hz - 3 * rulerArrowOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, 0, -hz],
            [-hx - rulerOffset * 2, 0, -hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, 0, hz],
            [-hx - rulerOffset * 2, 0, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hz]);

  // lower-right to upper-right
  const lr2ur = useMemo(() => {
    return (
      <>
        <textSprite
          userData={{ unintersectable: true }}
          backgroundColor={labelBackgroundColor}
          text={element.lz.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={fontSize}
          fontFace={'Times Roman'}
          textHeight={ratio}
          position={[hx + rulerOffset, yOffset, 0]}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx + rulerOffset, 0, -hz],
            [hx + rulerOffset, 0, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx + rulerOffset + rulerArrowOffset, 0, -hz + 3 * rulerArrowOffset],
            [hx + rulerOffset, 0, -hz],
            [hx + rulerOffset - rulerArrowOffset, 0, -hz + 3 * rulerArrowOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx + rulerOffset + rulerArrowOffset, 0, hz - 3 * rulerArrowOffset],
            [hx + rulerOffset, 0, hz],
            [hx + rulerOffset - rulerArrowOffset, 0, hz - 3 * rulerArrowOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx, 0, -hz],
            [hx + rulerOffset * 2, 0, -hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx, 0, hz],
            [hx + rulerOffset * 2, 0, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hz]);

  // lower-left to lower-right
  const ll2lr = useMemo(() => {
    return (
      <>
        <textSprite
          userData={{ unintersectable: true }}
          backgroundColor={labelBackgroundColor}
          text={element.lx.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={fontSize}
          fontFace={'Times Roman'}
          textHeight={ratio}
          position={[0, yOffset, -hz - rulerOffset]}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, 0, -hz - rulerOffset],
            [hx, 0, -hz - rulerOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx + 3 * rulerArrowOffset, 0, -hz - rulerOffset - rulerArrowOffset],
            [-hx, 0, -hz - rulerOffset],
            [-hx + 3 * rulerArrowOffset, 0, -hz - rulerOffset + rulerArrowOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx - 3 * rulerArrowOffset, 0, -hz - rulerOffset - rulerArrowOffset],
            [hx, 0, -hz - rulerOffset],
            [hx - 3 * rulerArrowOffset, 0, -hz - rulerOffset + rulerArrowOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, 0, -hz],
            [-hx, 0, -hz - rulerOffset * 2],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx, 0, -hz],
            [hx, 0, -hz - rulerOffset * 2],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hz]);

  // upper-left to upper-right
  const ul2ur = useMemo(() => {
    return (
      <>
        <textSprite
          userData={{ unintersectable: true }}
          backgroundColor={labelBackgroundColor}
          text={element.lx.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={fontSize}
          fontFace={'Times Roman'}
          textHeight={ratio}
          position={[0, yOffset, hz + rulerOffset]}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, 0, hz + rulerOffset],
            [hx, 0, hz + rulerOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx + 3 * rulerArrowOffset, 0, hz + rulerOffset - rulerArrowOffset],
            [-hx, 0, hz + rulerOffset],
            [-hx + 3 * rulerArrowOffset, 0, hz + rulerOffset + rulerArrowOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx - 3 * rulerArrowOffset, 0, hz + rulerOffset - rulerArrowOffset],
            [hx, 0, hz + rulerOffset],
            [hx - 3 * rulerArrowOffset, 0, hz + rulerOffset + rulerArrowOffset],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, 0, hz],
            [-hx, 0, hz + rulerOffset * 2],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx, 0, hz],
            [hx, 0, hz + rulerOffset * 2],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hz]);

  if (resizeHandleType) {
    switch (resizeHandleType) {
      case ResizeHandleType.LowerLeft:
        return (
          <>
            {ll2ul}
            {ll2lr}
          </>
        );
      case ResizeHandleType.LowerRight:
        return (
          <>
            {lr2ur}
            {ll2lr}
          </>
        );
      case ResizeHandleType.UpperLeft:
        return (
          <>
            {ll2ul}
            {ul2ur}
          </>
        );
      case ResizeHandleType.UpperRight:
        return (
          <>
            {lr2ur}
            {ul2ur}
          </>
        );
    }
  }

  if (hoveredHandle) {
    switch (hoveredHandle) {
      case ResizeHandleType.LowerLeft:
        return (
          <>
            {ll2ul}
            {ll2lr}
          </>
        );
      case ResizeHandleType.LowerRight:
        return (
          <>
            {lr2ur}
            {ll2lr}
          </>
        );
      case ResizeHandleType.UpperLeft:
        return (
          <>
            {ll2ul}
            {ul2ur}
          </>
        );
      case ResizeHandleType.UpperRight:
        return (
          <>
            {lr2ur}
            {ul2ur}
          </>
        );
    }
  }

  return <></>;
};

export default React.memo(RulerOnWall);
