/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useRefStore } from './stores/commonRef';
import { useLanguage } from './views/hooks';
import i18n from './i18n/i18n';

const STYLE_SIZE = 120;
const BLACK = 'black';
const WHITE = 'white';

const Compass = ({ visible = true }: { visible: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const lang = useLanguage();

  const PIXEL_RATIO = window.devicePixelRatio;
  const CANVAS_SIZE = STYLE_SIZE * PIXEL_RATIO;
  const scale = CANVAS_SIZE / 150;

  const fontSize = 20 * scale;
  const FONT = fontSize + 'px serif';

  useEffect(() => {
    if (canvasRef.current) {
      useRefStore.setState((state) => {
        state.compassRef = canvasRef;
      });
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    // all these numbers are based on 150px
    const pointerLength = 55 * scale;
    const pointerHalfWidth = 10 * scale;

    const outerRingRadius = 40 * scale;
    const outerRingWidth = 5 * scale;
    const innerRingRadius = 30 * scale;
    const innerRingWidth = scale;
    const outlineWidth = scale;

    const fontToEdge = 15 * scale;

    const center = CANVAS_SIZE / 2;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // outer ring
    ctx.beginPath();
    ctx.arc(center, center, outerRingRadius, 0, Math.PI * 2);
    ctx.lineWidth = outerRingWidth;
    ctx.strokeStyle = BLACK;
    ctx.stroke();

    // inner ring
    ctx.beginPath();
    ctx.arc(center, center, innerRingRadius, 0, Math.PI * 2);
    ctx.lineWidth = innerRingWidth;
    ctx.strokeStyle = BLACK;
    ctx.stroke();

    ctx.lineWidth = outlineWidth;

    // pointer - N
    ctx.beginPath();
    ctx.moveTo(center, center - pointerLength);
    ctx.lineTo(center - pointerHalfWidth, center - pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = WHITE;
    ctx.stroke();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(center, center - pointerLength);
    ctx.lineTo(center + pointerHalfWidth, center - pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = BLACK;
    ctx.stroke();
    ctx.fill();

    // pointer - S
    ctx.beginPath();
    ctx.moveTo(center, center + pointerLength);
    ctx.lineTo(center - pointerHalfWidth, center + pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = BLACK;
    ctx.stroke();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(center, center + pointerLength);
    ctx.lineTo(center + pointerHalfWidth, center + pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = WHITE;
    ctx.stroke();
    ctx.fill();

    // pointer - W
    ctx.beginPath();
    ctx.moveTo(center - pointerLength, center);
    ctx.lineTo(center - pointerHalfWidth, center - pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = BLACK;
    ctx.stroke();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(center - pointerLength, center);
    ctx.lineTo(center - pointerHalfWidth, center + pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = WHITE;
    ctx.stroke();
    ctx.fill();

    // pointer - E
    ctx.beginPath();
    ctx.moveTo(center + pointerLength, center);
    ctx.lineTo(center + pointerHalfWidth, center - pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = WHITE;
    ctx.stroke();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(center + pointerLength, center);
    ctx.lineTo(center + pointerHalfWidth, center + pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = BLACK;
    ctx.stroke();
    ctx.fill();

    // text
    ctx.font = FONT;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'center';

    ctx.fillText(`${i18n.t('compass.N', lang)}`, center, fontToEdge);

    ctx.save();
    ctx.translate(CANVAS_SIZE, CANVAS_SIZE);
    ctx.rotate(Math.PI);
    ctx.fillText(`${i18n.t('compass.S', lang)}`, center, fontToEdge);
    ctx.restore();

    ctx.fillStyle = BLACK;

    ctx.save();
    ctx.translate(0, CANVAS_SIZE);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${i18n.t('compass.W', lang)}`, center, fontToEdge);
    ctx.restore();

    ctx.save();
    ctx.translate(CANVAS_SIZE, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`${i18n.t('compass.E', lang)}`, center, fontToEdge);
    ctx.restore();
  }, [lang]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      id="compassCanvas"
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{
        position: 'absolute',
        bottom: '0',
        right: '0',
        height: `${STYLE_SIZE}px`,
        width: `${STYLE_SIZE}px`,
        margin: '5px',
        pointerEvents: 'none',
      }}
    ></canvas>
  );
};

export default React.memo(Compass);
