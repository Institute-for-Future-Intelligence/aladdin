/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FontLoader, Group, MeshBasicMaterial, TextGeometryParameters } from 'three';
import compassObj from '../assets/compass.obj';
import helvetikerFont from '../fonts/helvetiker_regular.typeface.fnt';
import { useRefStore } from 'src/stores/commonRef';
import { HALF_PI } from '../constants';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';

const Compass = () => {
  const groundImage = useStore(Selector.viewState.groundImage);
  const groundImageType = useStore(Selector.viewState.groundImageType) ?? 'roadmap';
  const model = useLoader(OBJLoader, compassObj);
  const font = useLoader(FontLoader, helvetikerFont);
  const textGeometryParams = {
    font: font,
    height: 0.0,
    size: 0.6,
  } as TextGeometryParameters;
  const compassMaterial = new MeshBasicMaterial({ color: 'red' });

  const textMaterial = useMemo(() => {
    return new MeshBasicMaterial({
      color: groundImage ? (groundImageType !== 'roadmap' ? 'antiquewhite' : 'darkslategrey') : 'darkgrey',
    });
  }, [groundImage, groundImageType]);

  const compassRef = useRef<Group>(null);
  useEffect(() => {
    if (compassRef && compassRef.current) {
      useRefStore.setState((state) => {
        state.compassRef = compassRef;
      });
    }
  }, []);

  return (
    <group ref={compassRef} name={'Compass'} scale={0.85}>
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
