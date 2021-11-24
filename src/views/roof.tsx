/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../stores/common';
import { RoofModel } from '../models/RoofModel';
import { Extrude, Sphere } from '@react-three/drei';
import { Shape, Vector3 } from 'three';
import * as Selector from '../stores/selector';
import { ActionType, ObjectType } from '../types';

const Roof = ({ id, cz, lz, selected, parentId, points }: RoofModel) => {
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);

  const [absPos, setAbsPos] = useState<Vector3>(null!);
  const [absAngle, setAbsAngle] = useState<number>(null!);
  const currParent = getElementById(parentId);

  useEffect(() => {
    if (currParent) {
      setAbsPos(new Vector3(currParent.cx, currParent.cy, cz));
      setAbsAngle(currParent.rotation[2]);
    }
  }, [currParent]);

  useEffect(() => {}, []);

  // only these elements are allowed to be on the roof
  const legalOnRoof = (type: ObjectType) => {
    return type === ObjectType.Human || type === ObjectType.Sensor || type === ObjectType.SolarPanel;
  };

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
