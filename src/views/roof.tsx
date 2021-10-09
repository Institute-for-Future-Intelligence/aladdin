/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'src/stores/common';
import { RoofModel } from 'src/models/RoofModel';
import { Extrude } from '@react-three/drei';
import { Shape, Vector3 } from 'three';

const Roof = ({ cz, lz, parent, points }: RoofModel) => {
  const getElementById = useStore((state) => state.getElementById);

  const [absPos, setAbsPos] = useState<Vector3>(null!);
  const [absAngle, setAbsAngle] = useState<number>(null!);
  const currParent = getElementById(parent.id);

  useEffect(() => {
    if (currParent) {
      setAbsPos(new Vector3(currParent.cx, currParent.cy, cz));
      setAbsAngle(currParent.rotation[2]);
    }
  }, [currParent]);

  useEffect(() => {}, []);

  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(points[0][0], points[0][1]);

    for (const point of points) {
      s.lineTo(point[0], point[1]);
    }
    return s;
  }, []);

  const settings = useMemo(() => {
    return {
      depth: lz,
      bevelEnabled: false,
    };
  }, []);

  return (
    <group position={absPos} rotation={[0, 0, absAngle]} castShadow receiveShadow>
      <Extrude args={[shape, settings]} scale={1.1}>
        <meshStandardMaterial attachArray="material" color={'#002745'} />
        <meshStandardMaterial attachArray="material" color={'#002745'} />
      </Extrude>
    </group>
  );
};

export default Roof;
