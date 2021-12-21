/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FontLoader, Group, MeshBasicMaterial, TextGeometryParameters } from 'three';
import compassObj from '../assets/compass.obj';
import helvetikerFont from '../fonts/helvetiker_regular.typeface.fnt';
import { useStoreRef } from 'src/stores/commonRef';
import { HALF_PI } from '../constants';

const Compass = () => {
  const model = useLoader(OBJLoader, compassObj);
  const font = useLoader(FontLoader, helvetikerFont);
  const textGeometryParams = {
    font: font,
    height: 0.0,
    size: 0.6,
  } as TextGeometryParameters;
  const textMaterial = new MeshBasicMaterial({ color: 'antiquewhite' });
  const compassMaterial = new MeshBasicMaterial({ color: 'red' });

  const compassRef = useRef<Group>(null);
  useEffect(() => {
    if (compassRef && compassRef.current) {
      useStoreRef.setState((state) => {
        state.compassRef = compassRef;
      });
    }
  }, []);

  return (
    <group ref={compassRef} name={'Compass'}>
      <mesh position={[-0.2, 2, 0]} material={textMaterial}>
        <textGeometry args={['N', textGeometryParams]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI]} position={[0.25, -2, 0]} material={textMaterial}>
        <textGeometry args={['S', textGeometryParams]} />
      </mesh>
      <mesh rotation={[0, 0, HALF_PI]} position={[-2, -0.4, 0]} material={textMaterial}>
        <textGeometry args={['W', textGeometryParams]} />
      </mesh>
      <mesh rotation={[0, 0, -HALF_PI]} position={[2, 0.25, 0]} material={textMaterial}>
        <textGeometry args={['E', textGeometryParams]} />
      </mesh>
      <primitive object={model} material={compassMaterial} />
    </group>
  );
};

export default React.memo(Compass);
