/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Cone, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { getSunDirection } from 'src/analysis/sunTools';
import { useStore } from 'src/stores/common';
import { Group, Object3DEventMap, Vector3 } from 'three';
import SpriteText from 'three-spritetext';
import { Line2, LineSegments2 } from 'three/examples/jsm/Addons';
import * as Selector from '../../stores/selector';
import { tempEuler, tempQuaternion_0, tempVector3_0, tempVector3_1, tempVector3_2 } from 'src/helpers';
import { Util } from 'src/Util';
import { HALF_PI } from 'src/constants';

interface SunBeamProps {
  positionZ: number;
  rotationX: number;
  topTiltGroupRef: React.MutableRefObject<Group<Object3DEventMap>>;
}

export interface SunBeamRefProps {
  setPositionZ: (z: number) => void;
  setRotationX: (r: number) => void;
}

export const NormalPointer = React.memo(() => {
  return (
    <group name="Normal Pointer Group">
      <Line
        points={[
          [0, 0, 0],
          [0, 0, 1],
        ]}
        userData={{ unintersectable: true }}
        lineWidth={0.5}
        color={'white'}
      />
      <Cone
        position={[0, 0, 1]}
        rotation={[HALF_PI, 0, 0]}
        userData={{ unintersectable: true }}
        args={[0.04, 0.2, 4, 2]}
      >
        <meshBasicMaterial color={'white'} />
      </Cone>
    </group>
  );
});

const SunBeam = React.memo(
  React.forwardRef<SunBeamRefProps, SunBeamProps>(({ positionZ, rotationX, topTiltGroupRef }, ref) => {
    const sceneRadius = useStore(Selector.sceneRadius);
    const date = useStore(Selector.world.date);
    const latitude = useStore(Selector.world.latitude);

    const sunBeamLength = useMemo(() => Math.max(100, 10 * sceneRadius), [sceneRadius]);
    const sunDirection = useMemo(() => getSunDirection(new Date(date), latitude), [date, latitude]);

    const groupRef = useRef<Group>(null!);
    const beamRef = useRef<Line2 | LineSegments2>(null!);
    const angleTextRef = useRef<SpriteText>(null!);

    const [angleLinePoints, setAngleLinePoints] = useState<Vector3[] | null>(null);
    const [angleText, setAngleText] = useState<string | null>(null);
    const [position, setPosition] = useState<Vector3 | null>(new Vector3());
    const [show, setShow] = useState(false);

    const setShowBeam = (b: boolean) => {
      if (b) {
        if (!show) {
          setShow(true);
        }
      } else {
        if (show) setShow(false);
      }
    };

    const isShowBeam = (angle: number) => {
      if (sunDirection.z < 0) return false;
      if (angle < 0 || angle > 90) return false;
      return true;
    };

    const getAngle = () => {
      if (!topTiltGroupRef.current) return -1;
      const angle = (topTiltGroupRef.current.getWorldDirection(tempVector3_0).angleTo(sunDirection) / Math.PI) * 180;
      return angle;
    };

    const getAngleText = (angle: number) => {
      const angleText = angle.toFixed(1) + '°';
      return angleText;
    };

    const getAngleLinePoints = () => {
      if (!topTiltGroupRef.current || !groupRef.current) return null;

      const euler = tempEuler.setFromQuaternion(groupRef.current.getWorldQuaternion(tempQuaternion_0), 'ZXY');
      tempEuler.set(-euler.x, 0, -euler.z, 'XYZ');

      const worldPos = groupRef.current.getWorldPosition(tempVector3_2);

      const normal = topTiltGroupRef.current
        .localToWorld(tempVector3_0.set(0, 0, 0.5))
        .sub(worldPos)
        .applyEuler(tempEuler);

      const beam = beamRef.current.localToWorld(tempVector3_1.set(0, 0, 0.5)).sub(worldPos).applyEuler(tempEuler);

      return [normal.clone(), beam.clone()];
    };

    const isAngleLinePointsSame = (curr: Vector3[] | null) => {
      if (!angleLinePoints || angleLinePoints.length !== 2 || !curr || curr.length !== 2) return false;
      const [curr1, curr2] = curr;
      const [prev1, prev2] = angleLinePoints;

      return Util.isSame(curr1, prev1) && Util.isSame(curr2, prev2);
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          setPositionZ(z) {
            if (groupRef.current) {
              groupRef.current.position.z = z;
            }
          },
          setRotationX(r) {
            if (groupRef.current) {
              groupRef.current.rotation.x = r;
            }
          },
        };
      },
      [],
    );

    useEffect(() => {
      if (!topTiltGroupRef.current) return;

      const angle = getAngle();
      const isShow = isShowBeam(angle);
      if (!isShow) {
        setShowBeam(false);
        return;
      } else {
        setShowBeam(true);
      }

      setAngleText(getAngleText(angle));

      const angleLinePoints = getAngleLinePoints();
      setAngleLinePoints(angleLinePoints);

      if (angleLinePoints && angleLinePoints.length === 2) {
        const [p1, p2] = angleLinePoints;
        const position = new Vector3().addVectors(p1, p2).divideScalar(2).multiplyScalar(1.5);
        setPosition(position);
      }
    }, []);

    useFrame(() => {
      if (!topTiltGroupRef.current) return;

      const angle = getAngle();

      const isShow = isShowBeam(angle);
      if (!isShow) {
        setShowBeam(false);
        return;
      } else {
        setShowBeam(true);
      }

      if (beamRef.current) {
        beamRef.current.lookAt(beamRef.current.getWorldPosition(tempVector3_0).add(sunDirection));
      }

      // todo: could modify buffergeometry directly to improve performance
      const angleLinePoints = getAngleLinePoints();
      if (!isAngleLinePointsSame(angleLinePoints)) {
        setAngleLinePoints(angleLinePoints);
      }

      if (angleTextRef.current && angleLinePoints?.length === 2) {
        const [p1, p2] = angleLinePoints;
        angleTextRef.current.position.addVectors(p1, p2).divideScalar(2).multiplyScalar(1.5);
        angleTextRef.current.text = getAngleText(angle);
      }
    });

    if (!show) return null;

    return (
      <group ref={groupRef} position={[0, 0, positionZ]} rotation={[rotationX, 0, 0]}>
        <Line
          name={'Sun Beam'}
          ref={beamRef}
          points={[
            [0, 0, 0],
            [0, 0, sunBeamLength],
          ]}
          userData={{ unintersectable: true }}
          lineWidth={0.5}
          color={'white'}
        />
        {angleLinePoints && position && angleText && (
          <>
            <Line
              name={'Angle Line'}
              points={angleLinePoints}
              userData={{ unintersectable: true }}
              lineWidth={1}
              color={'white'}
            />
            <textSprite
              ref={angleTextRef}
              position={position}
              text={angleText}
              userData={{ unintersectable: true }}
              fontSize={20}
              fontFace={'Times Roman'}
              textHeight={0.1}
            />
          </>
        )}
      </group>
    );
  }),
);

export default SunBeam;
