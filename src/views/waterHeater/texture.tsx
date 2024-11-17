/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import { useEffect, useMemo, useState } from 'react';
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
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  [canvas.width, canvas.height] = [130, 100];

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#768ca6';
    ctx.fillRect(10, 0, 15, 100);

    const gradient1 = ctx.createLinearGradient(25, 0, 45, 0);
    gradient1.addColorStop(0, '#7ea4cf');
    gradient1.addColorStop(1, '#9ab7d9');
    ctx.fillStyle = gradient1;
    ctx.fillRect(25, 0, 20, 100);

    const gradient2 = ctx.createLinearGradient(45, 0, 110, 0);
    gradient2.addColorStop(0, '#6F87A1');
    gradient2.addColorStop(0.6, '#30455B');
    gradient2.addColorStop(0.85, '#496279');
    gradient2.addColorStop(1, '#3E536B');
    ctx.fillStyle = gradient2;
    ctx.fillRect(45, 0, 65, 100);
  }

  return new CanvasTexture(canvas);
};

const canvasTexture = drawWaterHeaterCanvasTexture();
