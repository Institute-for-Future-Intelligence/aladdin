/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { ElementModel } from '../models/ElementModel';
import { ObjectType, ResizeHandleType } from '../types';
import i18n from '../i18n/i18n';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';

export interface HorizontalRulerProps {
  element: ElementModel;
  resizeHandleType: ResizeHandleType | null;
}

export const HorizontalRuler = ({ element, resizeHandleType }: HorizontalRulerProps) => {
  const language = useStore(Selector.language);

  const hx = element.lx / 2;
  const hy = element.ly / 2;
  const rulerArrowOffset = 0.2;
  const rulerLineWidth = 1;
  const rulerTickMarkWidth = 0.5;
  const color = element.lineColor ?? 'white';
  const lang = { lng: language };
  const labelBackgroundColor = 'darkorchid';

  const rulerOffset = useMemo(() => {
    switch (element.type) {
      case ObjectType.Cuboid:
        return Math.max(0.5, Math.max(hx, hy) * 0.1);
    }
    return 0.5;
  }, [element.type, hx, hy]);

  const hz = useMemo(() => {
    switch (element.type) {
      case ObjectType.Cuboid:
        return -element.lz / 2 + 0.1;
    }
    return 0.1;
  }, [element.type]);

  const ll2ul = useMemo(() => {
    return (
      <>
        <textSprite
          backgroundColor={labelBackgroundColor}
          text={element.ly.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={80}
          fontFace={'Times Roman'}
          textHeight={1}
          position={[-hx - rulerOffset, 0, hz + rulerOffset]}
        />
        <Line
          points={[
            [-hx - rulerOffset, -hy, hz],
            [-hx - rulerOffset, hy, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [-hx - rulerOffset + rulerArrowOffset, -hy + 3 * rulerArrowOffset, hz],
            [-hx - rulerOffset, -hy, hz],
            [-hx - rulerOffset - rulerArrowOffset, -hy + 3 * rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [-hx - rulerOffset + rulerArrowOffset, hy - 3 * rulerArrowOffset, hz],
            [-hx - rulerOffset, hy, hz],
            [-hx - rulerOffset - rulerArrowOffset, hy - 3 * rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [-hx, -hy, hz],
            [-hx - rulerOffset * 2, -hy, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          points={[
            [-hx, hy, hz],
            [-hx - rulerOffset * 2, hy, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hy, hz]);

  const lr2ur = useMemo(() => {
    return (
      <>
        <textSprite
          backgroundColor={labelBackgroundColor}
          text={element.ly.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={80}
          fontFace={'Times Roman'}
          textHeight={1}
          position={[hx + rulerOffset, 0, hz + rulerOffset]}
        />
        <Line
          points={[
            [hx + rulerOffset, -hy, hz],
            [hx + rulerOffset, hy, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [hx + rulerOffset + rulerArrowOffset, -hy + 3 * rulerArrowOffset, hz],
            [hx + rulerOffset, -hy, hz],
            [hx + rulerOffset - rulerArrowOffset, -hy + 3 * rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [hx + rulerOffset + rulerArrowOffset, hy - 3 * rulerArrowOffset, hz],
            [hx + rulerOffset, hy, hz],
            [hx + rulerOffset - rulerArrowOffset, hy - 3 * rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [hx, -hy, hz],
            [hx + rulerOffset * 2, -hy, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          points={[
            [hx, hy, hz],
            [hx + rulerOffset * 2, hy, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hy, hz]);

  const ll2lr = useMemo(() => {
    return (
      <>
        <textSprite
          backgroundColor={labelBackgroundColor}
          text={element.lx.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={80}
          fontFace={'Times Roman'}
          textHeight={1}
          position={[0, -hy - rulerOffset, hz + rulerOffset]}
        />
        <Line
          points={[
            [-hx, -hy - rulerOffset, hz],
            [hx, -hy - rulerOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [-hx + 3 * rulerArrowOffset, -hy - rulerOffset - rulerArrowOffset, hz],
            [-hx, -hy - rulerOffset, hz],
            [-hx + 3 * rulerArrowOffset, -hy - rulerOffset + rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [hx - 3 * rulerArrowOffset, -hy - rulerOffset - rulerArrowOffset, hz],
            [hx, -hy - rulerOffset, hz],
            [hx - 3 * rulerArrowOffset, -hy - rulerOffset + rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [-hx, -hy, hz],
            [-hx, -hy - rulerOffset * 2, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          points={[
            [hx, -hy, hz],
            [hx, -hy - rulerOffset * 2, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hy, hz]);

  const ul2ur = useMemo(() => {
    return (
      <>
        <textSprite
          backgroundColor={labelBackgroundColor}
          text={element.lx.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={80}
          fontFace={'Times Roman'}
          textHeight={1}
          position={[0, hy + rulerOffset, hz + rulerOffset]}
        />
        <Line
          points={[
            [-hx, hy + rulerOffset, hz],
            [hx, hy + rulerOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [-hx + 3 * rulerArrowOffset, hy + rulerOffset - rulerArrowOffset, hz],
            [-hx, hy + rulerOffset, hz],
            [-hx + 3 * rulerArrowOffset, hy + rulerOffset + rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [hx - 3 * rulerArrowOffset, hy + rulerOffset - rulerArrowOffset, hz],
            [hx, hy + rulerOffset, hz],
            [hx - 3 * rulerArrowOffset, hy + rulerOffset + rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          points={[
            [-hx, hy, hz],
            [-hx, hy + rulerOffset * 2, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          points={[
            [hx, hy, hz],
            [hx, hy + rulerOffset * 2, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hy, hz]);

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
    default:
      return <></>;
  }
};

export default React.memo(HorizontalRuler);
