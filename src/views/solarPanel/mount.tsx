import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useStore } from 'src/stores/common';
import * as Selector from '../../stores/selector';
import { Box } from '@react-three/drei';
import { Group } from 'three';
import { useInnerState } from './hooks';

interface MountProps {
  lx: number;
  ly: number;
  tiltAngle: number;
  modelLength: number;
  visiable: boolean;
}

export interface MountRefProps {
  update: (angle: number, ly: number) => void;
  resizeX: (val: number) => void;
  setVisiable: (b: boolean) => void;
}

const Mount = React.memo(
  forwardRef(({ lx, ly, tiltAngle, modelLength, visiable }: MountProps, ref) => {
    const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

    const mountPositionRatio = 0.75;

    const calculateMount = (tiltAngle: number, ly: number) => {
      const sideLength = ly * mountPositionRatio;
      const cosTiltAngle = Math.cos(tiltAngle);
      const halfTiltAngle = tiltAngle / 2;

      const length = sideLength * Math.sin(halfTiltAngle) * 2;
      const mountAngle = halfTiltAngle;
      const cz = (sideLength - ly / 2) * cosTiltAngle + length * Math.sin(mountAngle);

      return { cz, mountAngle, length };
    };

    const { cz, mountAngle, length } = useMemo(() => calculateMount(tiltAngle, ly), [tiltAngle, ly]);

    const [_lx, setLx] = useInnerState(lx);
    const [_visiable, setVisiable] = useInnerState(visiable);

    const mountArray = useMemo(() => {
      const arr: number[] = [];
      const nx = Math.round(_lx / modelLength);
      let curr = nx % 2 === 0 ? modelLength / 2 : 0;
      while (curr < _lx / 2) {
        arr.push(curr, -curr);
        curr += modelLength;
      }
      return arr;
    }, [_lx, modelLength]);

    useImperativeHandle(ref, () => ({
      update(angle: number, ly: number) {
        if (czGroup.current && rotationGroup.current && lengthGroup.current) {
          const { cz, mountAngle, length } = calculateMount(-angle, ly);

          czGroup.current.position.y = -cz;
          rotationGroup.current.rotation.x = -mountAngle;
          lengthGroup.current.position.z = length / 2;
          lengthGroup.current.scale.z = length - 0.025;
        }
      },
      resizeX(val: number) {
        setLx(val);
      },
      setVisiable(b: boolean) {
        setVisiable(b);
      },
    }));

    const czGroup = useRef<Group>(null!);
    const rotationGroup = useRef<Group>(null!);
    const lengthGroup = useRef<Group>(null!);

    if (!_visiable) return null;
    return (
      <group ref={czGroup} position={[0, -cz, 0]} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        <group ref={rotationGroup} rotation={[-mountAngle, 0, 0]}>
          <group ref={lengthGroup} position={[0, 0, length / 2]} scale={[1, 1, length - 0.025]}>
            {mountArray.map((x, i) => {
              return (
                <Box key={i} position={[x, 0, 0]} args={[0.05, 0.05, 1]}>
                  <meshStandardMaterial color={'#BFBFBF'} />
                </Box>
              );
            })}
          </group>
        </group>
      </group>
    );
  }),
);

export default Mount;
