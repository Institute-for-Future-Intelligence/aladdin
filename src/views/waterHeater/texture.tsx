/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import { useEffect, useMemo, useState } from 'react';
import { SOLAR_PANEL_CELL_COLOR_BLUE } from 'src/constants';
import { CanvasTexture, RepeatWrapping } from 'three';

export const useWaterHeaterTexture = (lx: number, ly: number) => {
  const [texture, setTexture] = useState<CanvasTexture | null>(canvasTexture);

  const nx = useMemo(() => Math.max(1, Math.round(lx / 0.15)), [lx]);

  useEffect(() => {
    if (canvasTexture) {
      canvasTexture.repeat.set(nx, 1);
      canvasTexture.wrapS = RepeatWrapping;
      setTexture(canvasTexture.clone());
    }
  }, [nx]);

  return texture;
};

const drawWaterHeaterCanvasTexture = () => {
  const frameColor = 'grey';
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  [canvas.width, canvas.height] = [10, 10];

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, 10, 10);
    ctx.fillStyle = SOLAR_PANEL_CELL_COLOR_BLUE;
    ctx.fillRect(0, 0, 6, 10);
  }

  return new CanvasTexture(canvas);
};

const canvasTexture = drawWaterHeaterCanvasTexture();
