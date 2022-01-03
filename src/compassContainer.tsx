/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import styled from 'styled-components';
import Compass from './views/compass';

const Container = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  height: 125px;
  width: 200px;
  pointer-events: none;
`;

const CompassContainer = ({ visible = true }: { visible: boolean }) => {
  return (
    <Container className="compass-container" style={{ visibility: visible ? 'visible' : 'hidden' }}>
      <Canvas camera={{ fov: 45 }}>
        <directionalLight position={[0, 5, 0]} intensity={0.2} />
        <ambientLight intensity={0.1} />
        <Suspense fallback={null}>
          <Compass />
        </Suspense>
      </Canvas>
    </Container>
  );
};

export default CompassContainer;
