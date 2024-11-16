/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import { useMemo } from 'react';
import { RepeatWrapping, TextureLoader } from 'three';
import WaterHeaterTexture from 'src/resources/water_heater_texture.png';
import { invalidate } from '@react-three/fiber';

export const useWaterHeaterTexture = (lx: number, ly: number) => {
  const textureLoader = useMemo(() => new TextureLoader(), []);
  const nx = useMemo(() => Math.max(1, Math.round(lx * 2)), [lx]);

  return useMemo(() => {
    return textureLoader.load(WaterHeaterTexture, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.set(nx, 1);
      invalidate();
    });
  }, [nx]);
};
