/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useRefStore } from './stores/commonRef';
import { useLanguage } from './views/hooks';
import i18n from './i18n/i18n';

const CANVAS_SIZE = 150;
const BLACK = 'black';
const WHITE = 'white';
const FONT = '20px serif';

const CompassContainer = ({ visible = true }: { visible: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const lang = useLanguage();

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

    const center = CANVAS_SIZE / 2;
    const pointerHalfWidth = 10;
    const compassRadius = 40;
    const fontPosition = 15;
    const pointerToEdge = 20;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // outer ring
    ctx.beginPath();
    ctx.arc(center, center, compassRadius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = BLACK;
    ctx.stroke();

    // inner ring
    ctx.beginPath();
    ctx.arc(center, center, compassRadius - 10, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = BLACK;
    ctx.stroke();

    // pointer - N
    ctx.beginPath();
    ctx.moveTo(center, pointerToEdge);
    ctx.lineTo(center - pointerHalfWidth, center - pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = WHITE;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(center, pointerToEdge);
    ctx.lineTo(center + pointerHalfWidth, center - pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = BLACK;
    ctx.fill();

    // pointer - S
    ctx.beginPath();
    ctx.moveTo(center, CANVAS_SIZE - pointerToEdge);
    ctx.lineTo(center - pointerHalfWidth, center + pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = BLACK;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(center, CANVAS_SIZE - pointerToEdge);
    ctx.lineTo(center + pointerHalfWidth, center + pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = WHITE;
    ctx.fill();

    // pointer - W
    ctx.beginPath();
    ctx.moveTo(pointerToEdge, center);
    ctx.lineTo(center - pointerHalfWidth, center - pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = BLACK;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pointerToEdge, center);
    ctx.lineTo(center - pointerHalfWidth, center + pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = WHITE;
    ctx.fill();

    // pointer - E
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE - pointerToEdge, center);
    ctx.lineTo(center + pointerHalfWidth, center - pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = WHITE;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE - pointerToEdge, center);
    ctx.lineTo(center + pointerHalfWidth, center + pointerHalfWidth);
    ctx.lineTo(center, center);
    ctx.fillStyle = BLACK;
    ctx.fill();

    // text
    ctx.font = FONT;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'center';

    ctx.fillText(`${i18n.t('word.N', lang)}`, center, fontPosition);

    ctx.save();
    ctx.translate(CANVAS_SIZE, CANVAS_SIZE);
    ctx.rotate(Math.PI);
    ctx.fillText(`${i18n.t('word.S', lang)}`, center, fontPosition);
    ctx.restore();

    ctx.fillStyle = BLACK;

    ctx.save();
    ctx.translate(0, CANVAS_SIZE);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${i18n.t('word.W', lang)}`, center, fontPosition);
    ctx.restore();

    ctx.save();
    ctx.translate(CANVAS_SIZE, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`${i18n.t('word.E', lang)}`, center, fontPosition);
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
        height: `${CANVAS_SIZE}px`,
        width: `${CANVAS_SIZE}px`,
        margin: '5px',
        pointerEvents: 'none',
      }}
    ></canvas>
  );
};

export default CompassContainer;
