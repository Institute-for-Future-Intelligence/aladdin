/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { Group, Mesh } from 'three';
//@ts-expect-error ignore
import sampleMtl from '../assets/house.mtl';
//@ts-expect-error ignore
import sampleObj from '../assets/house.obj';

export interface ObjProps {
  scale?: number;
}

const Obj = ({ scale = 0.5 }: ObjProps) => {
  const mesh = useRef<Mesh>(null!);

  const material = useLoader(MTLLoader, sampleMtl) as MTLLoader.MaterialCreator;
  const model = useLoader(OBJLoader, sampleObj, (loader) => {
    material.preload();
    loader.setMaterials(material);
  }) as Group;

  if (model) {
    model.castShadow = true;
    model.receiveShadow = true;
    model.traverse((children) => {
      if (children instanceof Mesh) {
        children.castShadow = true;
        children.receiveShadow = true;
      }
    });
  }

  return (
    <mesh ref={mesh} position={[-3, 0, 3]}>
      <primitive object={model} scale={scale} />
    </mesh>
  );
};

export default Obj;
