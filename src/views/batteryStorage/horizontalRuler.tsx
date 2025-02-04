/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Line } from '@react-three/drei';
import { ResizeHandleType } from 'src/types';
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/hooks';
import { HandleType } from './handlesGroup';

export interface HorizontalRulerRef {
  update: (lx: number, ly: number) => void;
}

export const TEXT_SPRITE_NAME = 'Text Sprite';

interface Props {
  hx: number;
  hy: number;
  handle: HandleType;
}

const HorizontalRuler = forwardRef<HorizontalRulerRef, Props>((args, ref) => {
  const lang = useLanguage();

  const [hx, setHx] = useState(args.hx);
  const [hy, setHy] = useState(args.hy);
  const lx = hx * 2;
  const ly = hy * 2;
  const hz = 0.1;

  const verticalLift = 0.2;
  const rulerArrowOffset = 0.2;
  const rulerLineWidth = 1;
  const rulerTickMarkWidth = 0.5;
  const color = 'white';
  const labelBackgroundColor = 'darkorchid';
  const ratio = Math.max(0.3, (hx + hy) / 32);
  const rulerOffset = 0.5;

  useImperativeHandle(ref, () => ({
    update(hx, hy) {
      setHx(hx);
      setHy(hy);
    },
  }));

  const ll2ul = useMemo(() => {
    return (
      <>
        <textSprite
          name={TEXT_SPRITE_NAME}
          userData={{ unintersectable: true }}
          backgroundColor={labelBackgroundColor}
          text={ly.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={80}
          fontFace={'Times Roman'}
          textHeight={ratio}
          position={[-hx - rulerOffset, 0, hz + verticalLift]}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx - rulerOffset, -hy, hz],
            [-hx - rulerOffset, hy, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx - rulerOffset + rulerArrowOffset, -hy + 3 * rulerArrowOffset, hz],
            [-hx - rulerOffset, -hy, hz],
            [-hx - rulerOffset - rulerArrowOffset, -hy + 3 * rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx - rulerOffset + rulerArrowOffset, hy - 3 * rulerArrowOffset, hz],
            [-hx - rulerOffset, hy, hz],
            [-hx - rulerOffset - rulerArrowOffset, hy - 3 * rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, -hy, hz],
            [-hx - rulerOffset * 2, -hy, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, hy, hz],
            [-hx - rulerOffset * 2, hy, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hy, hz, lang, color, verticalLift]);

  const lr2ur = useMemo(() => {
    return (
      <>
        <textSprite
          name={TEXT_SPRITE_NAME}
          userData={{ unintersectable: true }}
          backgroundColor={labelBackgroundColor}
          text={ly.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={80}
          fontFace={'Times Roman'}
          textHeight={ratio}
          position={[hx + rulerOffset, 0, hz + verticalLift]}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx + rulerOffset, -hy, hz],
            [hx + rulerOffset, hy, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx + rulerOffset + rulerArrowOffset, -hy + 3 * rulerArrowOffset, hz],
            [hx + rulerOffset, -hy, hz],
            [hx + rulerOffset - rulerArrowOffset, -hy + 3 * rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx + rulerOffset + rulerArrowOffset, hy - 3 * rulerArrowOffset, hz],
            [hx + rulerOffset, hy, hz],
            [hx + rulerOffset - rulerArrowOffset, hy - 3 * rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx, -hy, hz],
            [hx + rulerOffset * 2, -hy, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx, hy, hz],
            [hx + rulerOffset * 2, hy, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hy, hz, lang, color, verticalLift]);

  const ll2lr = useMemo(() => {
    return (
      <>
        <textSprite
          name={TEXT_SPRITE_NAME}
          userData={{ unintersectable: true }}
          backgroundColor={labelBackgroundColor}
          text={lx.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={80}
          fontFace={'Times Roman'}
          textHeight={ratio}
          position={[0, -hy - rulerOffset, hz + verticalLift]}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, -hy - rulerOffset, hz],
            [hx, -hy - rulerOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx + 3 * rulerArrowOffset, -hy - rulerOffset - rulerArrowOffset, hz],
            [-hx, -hy - rulerOffset, hz],
            [-hx + 3 * rulerArrowOffset, -hy - rulerOffset + rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx - 3 * rulerArrowOffset, -hy - rulerOffset - rulerArrowOffset, hz],
            [hx, -hy - rulerOffset, hz],
            [hx - 3 * rulerArrowOffset, -hy - rulerOffset + rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, -hy, hz],
            [-hx, -hy - rulerOffset * 2, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx, -hy, hz],
            [hx, -hy - rulerOffset * 2, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hy, hz, lang, color, verticalLift]);

  const ul2ur = useMemo(() => {
    return (
      <>
        <textSprite
          name={TEXT_SPRITE_NAME}
          userData={{ unintersectable: true }}
          backgroundColor={labelBackgroundColor}
          text={lx.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
          fontSize={80}
          fontFace={'Times Roman'}
          textHeight={ratio}
          position={[0, hy + rulerOffset, hz + verticalLift]}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, hy + rulerOffset, hz],
            [hx, hy + rulerOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx + 3 * rulerArrowOffset, hy + rulerOffset - rulerArrowOffset, hz],
            [-hx, hy + rulerOffset, hz],
            [-hx + 3 * rulerArrowOffset, hy + rulerOffset + rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx - 3 * rulerArrowOffset, hy + rulerOffset - rulerArrowOffset, hz],
            [hx, hy + rulerOffset, hz],
            [hx - 3 * rulerArrowOffset, hy + rulerOffset + rulerArrowOffset, hz],
          ]}
          color={color}
          linewidth={rulerLineWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-hx, hy, hz],
            [-hx, hy + rulerOffset * 2, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
        <Line
          userData={{ unintersectable: true }}
          points={[
            [hx, hy, hz],
            [hx, hy + rulerOffset * 2, hz],
          ]}
          color={color}
          linewidth={rulerTickMarkWidth}
        />
      </>
    );
  }, [hx, hy, hz, lang, color, verticalLift]);

  switch (args.handle) {
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

  return <></>;
});

export default HorizontalRuler;
