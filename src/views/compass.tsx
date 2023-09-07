/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { DoubleSide, Group, Mesh, MeshBasicMaterial, ShapeGeometry } from 'three';
import compassSVG from '../assets/compass.svg';
import { useRefStore } from 'src/stores/commonRef';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';

const Compass = () => {
  const isCameraUnderGround = usePrimitiveStore((state) => state.isCameraUnderGround);

  const svgLoader = useMemo(() => new SVGLoader(), []);

  const compassRef = useRef<Group>(null);
  useEffect(() => {
    if (compassRef && compassRef.current) {
      useRefStore.setState((state) => {
        state.compassRef = compassRef;
      });
    }
  }, []);

  useEffect(() => {
    svgLoader.load(compassSVG, (data) => {
      if (!compassRef.current) return;

      const paths = data.paths;
      const group = new Group();

      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];

        const color = isCameraUnderGround ? 'white' : path.color;

        const material = new MeshBasicMaterial({
          color: color,
          side: DoubleSide,
          depthWrite: false,
        });

        const shapes = SVGLoader.createShapes(path);

        for (let j = 0; j < shapes.length; j++) {
          const shape = shapes[j];
          const geometry = new ShapeGeometry(shape);
          const mesh = new Mesh(geometry, material);
          group.add(mesh);
        }
      }

      group.position.set(-650, -650, 0);

      compassRef.current.add(group);
    });
  }, [isCameraUnderGround]);

  return <group ref={compassRef} name={'Compass'} scale={0.004} rotation={[0, Math.PI, 0]} />;
};

export default React.memo(Compass);
