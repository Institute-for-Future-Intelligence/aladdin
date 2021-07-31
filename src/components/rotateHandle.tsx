/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */
import React from 'react';
import { Torus, Cone, Circle } from '@react-three/drei';

const RotateHandle = ({color}: {color: string}) => {
  const rotationHandleLMesh = (<meshStandardMaterial color={color} />);
  return (
      <>
          <Torus args={[0.15, 0.05, 8, 12, 3/2*Math.PI]} rotation={[Math.PI/2, 0, Math.PI/2]}>
              {rotationHandleLMesh}
          </Torus>
          <Cone args={[0.1, 0.1, 10]} rotation={[Math.PI/2, 0, 0]} position={[0.15, 0, 0.05]}>
              {rotationHandleLMesh}
          </Cone>
          <Circle args={[0.05]} rotation={[0, Math.PI/2, 0]} position={[0, 0, 0.15]}>
              {rotationHandleLMesh}
          </Circle>
      </>
  )
}

export default RotateHandle;

