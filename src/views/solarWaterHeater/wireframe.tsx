/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Line } from '@react-three/drei';
import { LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';

interface WireframeProps {
  waterTankLength: number;
  waterTankRadius: number;
  panelWidth: number;
}

const Wireframe = React.memo(({ waterTankLength, waterTankRadius, panelWidth }: WireframeProps) => {
  const hlx = waterTankLength / 2;
  const bottomY = panelWidth / 2;
  const topY = bottomY + waterTankRadius;
  return (
    <Line
      name={'Selection highlight lines'}
      userData={{ unintersectable: true }}
      points={[
        [-hlx, -bottomY, 0],
        [-hlx, topY, 0],
        [hlx, topY, 0],
        [hlx, -bottomY, 0],
        [-hlx, -bottomY, 0],
      ]}
      lineWidth={3}
      color={LOCKED_ELEMENT_SELECTION_COLOR}
    />
  );
});

export default Wireframe;
