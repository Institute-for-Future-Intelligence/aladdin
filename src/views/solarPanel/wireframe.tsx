/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Line } from '@react-three/drei';
import { LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';

interface WireframeProps {
  hlx: number;
  hly: number;
}

const Wireframe = React.memo(({ hlx, hly }: WireframeProps) => {
  return (
    <Line
      name={'Selection highlight lines'}
      userData={{ unintersectable: true }}
      points={[
        [-hlx, -hly, 0],
        [-hlx, hly, 0],
        [hlx, hly, 0],
        [hlx, -hly, 0],
        [-hlx, -hly, 0],
      ]}
      lineWidth={3}
      color={LOCKED_ELEMENT_SELECTION_COLOR}
    />
  );
});

export default Wireframe;
