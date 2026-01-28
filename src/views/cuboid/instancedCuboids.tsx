/*
 * @Copyright 2026. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Instances, Instance } from '@react-three/drei';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Color } from 'three';
import { InstancedModel } from 'src/models/InstancedModel';

export interface InstancedCuboidsProps {
  cuboids: InstancedModel[];
}

/** Clamp 0~1 */
function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

/**
 * 返回输入颜色附近的随机颜色
 * @param baseColor 颜色字符串或 THREE.Color
 * @param intensity 亮度扰动幅度
 */
function getRandomNearbyColor(baseColor: string | Color, intensity: number = 0.2): Color {
  const color = typeof baseColor === 'string' ? new Color(baseColor) : baseColor.clone();

  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);

  // 色相轻微扰动 ±0.02
  const hueJitter = (Math.random() - 0.5) * 0.04;
  const h = (hsl.h + hueJitter + 1) % 1;

  // 饱和度轻微扰动 ±0.05
  const sJitter = (Math.random() - 0.5) * 0.1;
  const s = clamp01(hsl.s + sJitter);

  // 亮度扰动 ±intensity，但暗色不再继续变暗
  const minL = 0.15;
  const lJitter = (Math.random() - 0.5) * 2 * intensity;
  const l = clamp01(Math.max(minL, hsl.l + lJitter));

  return new Color().setHSL(h, s, l);
}

const InstancedCuboids = ({ cuboids }: InstancedCuboidsProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  console.log('instanced buildings', cuboids);
  return (
    <group name="Instanced Models">
      <Instances limit={5000} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        <boxGeometry />
        <meshStandardMaterial />

        {cuboids.map((model) => {
          const { id, cx, cy, cz = 0, lx = 1, ly = 1, lz = 1, rotation = [0, 0, 0] } = model;

          return (
            <Instance
              key={id}
              position={[cx, cy, cz]}
              scale={[lx, ly, lz]}
              rotation={[0, 0, rotation[2]]}
              color={getRandomNearbyColor(model.color ?? 'grey')}
            />
          );
        })}
      </Instances>
    </group>
  );
};

export default React.memo(InstancedCuboids);
