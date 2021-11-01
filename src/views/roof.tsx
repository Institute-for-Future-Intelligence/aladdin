/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'src/stores/common';
import { RoofModel } from 'src/models/RoofModel';
import { Extrude, Sphere } from '@react-three/drei';
import { Shape, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { ActionType } from 'src/types';

const Roof = ({ id, cz, lz, selected, parent, points }: RoofModel) => {
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);

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
    s.moveTo(points[0].x, points[0].y);

    for (const point of points) {
      s.lineTo(point.x, point.y);
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
    <group position={absPos} rotation={[0, 0, absAngle]}>
      <Extrude
        args={[shape, settings]}
        scale={1.1}
        onPointerDown={(e) => {
          selectMe(id, e, ActionType.Select);
        }}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial attachArray="material" color={'#002745'} />
        <meshStandardMaterial attachArray="material" color={'#002745'} />
      </Extrude>

      {/* handle */}
      {selected && <Sphere args={[0.4]} position={[0, 0, 1]} />}
    </group>
  );
};

export default Roof;
