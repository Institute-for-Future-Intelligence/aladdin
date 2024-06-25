/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Cylinder } from '@react-three/drei';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { useStore } from 'src/stores/common';
import { Group, Vector4 } from 'three';

interface PolesProps {
  lx: number;
  ly: number;
  poleRadius: number;
  poleHeight: number;
  poleSpacing: number;
  tiltAngle: number;
  color: string;
  visiable: boolean;
}

export interface PolesRefProps {
  update: ({ lx, ly, tilt }: { lx?: number; ly?: number; tilt?: number }) => void;
  setVisiable: (b: boolean) => void;
}

const useInnerState = <T,>(val: T) => {
  const [_val, setVal] = useState<T>(val);
  useEffect(() => {
    if (val !== _val) {
      setVal(val);
    }
  }, [val]);
  return [_val, setVal] as [T, React.Dispatch<React.SetStateAction<T>>];
};

const Poles = React.memo(
  forwardRef<PolesRefProps, PolesProps>(
    ({ lx, ly, poleRadius, poleHeight, poleSpacing, tiltAngle, color, visiable }: PolesProps, ref) => {
      const radialSegment = useStore((state) => (state.elements.length > 100 ? 2 : 4));

      const [_lx, setLx] = useInnerState(lx);
      const [_ly, setLy] = useInnerState(ly);
      const [_tilt, setTilt] = useInnerState(tiltAngle);
      const [_visiable, setVisiable] = useInnerState(visiable);

      const groupRef = useRef<Group>(null!);

      useImperativeHandle(
        ref,
        () => ({
          update({ lx, ly, tilt }: { lx?: number; ly?: number; tilt?: number }) {
            if (lx !== undefined) {
              setLx(lx);
            }
            if (ly !== undefined) {
              setLy(ly);
            }
            if (tilt !== undefined) {
              setTilt(tilt);
            }
          },
          setVisiable(b) {
            setVisiable(b);
          },
        }),
        [],
      );

      const polesPositionArray = useMemo<Vector4[]>(() => {
        const poleArray: Vector4[] = [];
        const poleNx = Math.floor((0.5 * _lx) / poleSpacing);
        const poleNy = Math.floor((0.5 * _ly * Math.abs(Math.cos(_tilt))) / poleSpacing);
        const tanTilt = Math.tan(_tilt);
        for (let ix = -poleNx; ix <= poleNx; ix++) {
          for (let iy = -poleNy; iy <= poleNy; iy++) {
            const xi = ix * poleSpacing;
            const yi = iy * poleSpacing;
            const wi = tanTilt * yi + poleHeight;
            const zi = (wi - poleHeight) / 2;
            poleArray.push(new Vector4(xi, yi, zi, wi));
          }
        }
        return poleArray;
      }, [_lx, _ly, _tilt, poleSpacing, poleHeight]);

      if (!_visiable) return null;
      return (
        <group name={'Poles group'} ref={groupRef} position={[0, 0, -poleHeight / 2]}>
          {polesPositionArray.map((p, i) => {
            if (p.w < 0) return null;
            return (
              <Cylinder
                userData={{ unintersectable: true }}
                key={i}
                name={'Pole ' + i}
                castShadow={false}
                receiveShadow={false}
                args={[poleRadius, poleRadius, p.w, radialSegment, 1]}
                position={[p.x, p.y, p.z]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial color={color} />
              </Cylinder>
            );
          })}
        </group>
      );
    },
  ),
);

export default Poles;
