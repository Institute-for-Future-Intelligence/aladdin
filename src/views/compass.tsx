/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FontLoader, Mesh, MeshBasicMaterial, TextGeometryParameters } from 'three';
import compassObj from '../assets/compass.obj';
import helvetikerFont from '../fonts/helvetiker_regular.typeface.fnt';
import { Util } from '../Util';
import { useStore } from '../stores/common';

const Compass = () => {
  const model = useLoader(OBJLoader, compassObj);
  const font = useLoader(FontLoader, helvetikerFont);
  const mesh = useRef<Mesh>(null!);
  const textGeometryParams = {
    font: font,
    height: 0.0,
    size: 0.6,
  } as TextGeometryParameters;
  const textMaterial = new MeshBasicMaterial({ color: 'antiquewhite' });
  const compassMaterial = new MeshBasicMaterial({ color: 'red' });
  const PI = Math.PI;

  const cameraDirection = useStore((state) => state.cameraDirection);
  const dirc_X_Y = cameraDirection.setZ(0);
  const rotationZ = (-PI * 17) / 18 + Math.atan2(dirc_X_Y.x, dirc_X_Y.y);

  return (
    <mesh ref={mesh} name={'Compass'} rotation={[-PI / 3, 0, rotationZ]}>
      <mesh position={[-0.2, 2, 0]} material={textMaterial}>
        <textGeometry args={['N', textGeometryParams]} />
      </mesh>
      <mesh rotation={[0, 0, PI]} position={[0.25, -2, 0]} material={textMaterial}>
        <textGeometry args={['S', textGeometryParams]} />
      </mesh>
      <mesh rotation={[0, 0, Util.HALF_PI]} position={[-2, -0.4, 0]} material={textMaterial}>
        <textGeometry args={['W', textGeometryParams]} />
      </mesh>
      <mesh rotation={[0, 0, -Util.HALF_PI]} position={[2, 0.25, 0]} material={textMaterial}>
        <textGeometry args={['E', textGeometryParams]} />
      </mesh>
      <primitive object={model} material={compassMaterial} />
    </mesh>
  );
};

export default React.memo(Compass);
