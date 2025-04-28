/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useLoader } from '@react-three/fiber';
import { HALF_PI } from 'src/constants';
import { FontLoader, TextGeometryParameters } from 'three/examples/jsm/Addons';
//@ts-expect-error ignore
import helvetikerFont from 'src/assets/helvetiker_regular.typeface.fnt';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Ring } from '@react-three/drei';
import { DoubleSide } from 'three';
import { Util } from 'src/Util';
import React from 'react';

interface PolarGridProps {
  relativeAzimuth: number;
  lx: number;
  ly: number;
}

export interface PolarGridRefProps {
  setAzimuth: (val: number) => void;
}

const PolarGrid = React.memo(
  forwardRef<PolarGridRefProps, PolarGridProps>(({ lx, ly, relativeAzimuth }, ref) => {
    const radius = Math.max(5, Math.hypot(lx, ly) * 0.75);

    const tickLabels = useMemo(() => new Array(25).fill(0), []);

    const font = useLoader(FontLoader, helvetikerFont);
    const fontSize = radius * 0.05;
    const textGeometryParams = {
      font: font,
      height: 0.0,
      size: fontSize,
    } as TextGeometryParameters;

    const getOffset = (i: number) => {
      if (i === 0) {
        return -fontSize * 0.3;
      } else if (i > 0 && i < 7) {
        return -fontSize * 0.8;
      } else {
        return -fontSize * 1.2;
      }
    };

    const [angle, setAngle] = useState(relativeAzimuth);

    useImperativeHandle(ref, () => ({
      setAzimuth: (val: number) => {
        if (val < -Math.PI) {
          setAngle(val + Math.PI * 2);
        } else if (val > Math.PI) {
          setAngle(val - Math.PI * 2);
        } else {
          setAngle(val);
        }
      },
    }));

    return (
      <group rotation={[HALF_PI, 0, 0]} position={[0, 0, 0.1]} name={'Solar Panel Polar Grid Group'}>
        <polarGridHelper args={[radius, 24, 6, 120, 'white', 'white']} userData={{ unintersectable: true }} />
        <Ring
          args={[radius * 0.98, radius, 24, 1, HALF_PI, angle]}
          userData={{ unintersectable: true }}
          rotation={[-HALF_PI, 0, 0]}
        >
          <meshBasicMaterial side={DoubleSide} color={'yellow'} />
        </Ring>

        <group rotation={[0, angle, 0]}>
          <mesh position={[-0.5, 0, -radius * 0.9]} rotation={[-HALF_PI, 0, 0]} userData={{ unintersectable: true }}>
            <textGeometry args={[`${-Util.toDegrees(angle).toFixed(1)}°`, textGeometryParams]} />
          </mesh>
        </group>

        {tickLabels.map((v, i) => {
          let times = Math.ceil(i / 2) * (i % 2 === 0 ? 1 : -1);
          if (times === -12) times = 12;
          const offset = getOffset(Math.abs(times));
          return (
            <group key={i} rotation={[0, (times * Math.PI) / 12, 0]}>
              <mesh
                position={[offset, 0, -radius * 1.05]}
                rotation={[-HALF_PI, 0, 0]}
                userData={{ unintersectable: true }}
              >
                <textGeometry args={[`${-15 * times}°`, textGeometryParams]} />
                <meshStandardMaterial attach="material" color={'lightGray'} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }),
);

export default PolarGrid;
