/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Line, Ring } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { HALF_PI, RESIZE_HANDLE_COLOR } from 'src/constants';
import { RotateHandleType } from 'src/types';
import { DoubleSide, Group } from 'three';
import SpriteText from 'three-spritetext';
import { useHandleSize } from '../wall/hooks';
import { useHandle } from './hooks';

interface TiltHandleProps {
  tiltAngle: number;
  positionZ: number;
  isOnVerticalSurface: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
}

export interface TiltHandleRefPros {
  setVisiable: (b: boolean) => void;
  update: (angle: number, z: number) => void;
}

const TiltHandle = React.memo(
  forwardRef<TiltHandleRefPros, TiltHandleProps>(
    ({ tiltAngle, positionZ, isOnVerticalSurface, onPointerDown, onPointerMove }, ref) => {
      const handleSize = useHandleSize() * 3;
      const degreeUnit = Math.PI / 12;

      const ringThetaLength = useMemo(() => (isOnVerticalSurface ? HALF_PI : Math.PI), [isOnVerticalSurface]);
      const degree = useMemo(
        () => (isOnVerticalSurface ? new Array(7).fill(0) : new Array(13).fill(0)),
        [isOnVerticalSurface],
      );
      const z = useMemo(() => (isOnVerticalSurface ? positionZ : 0), [isOnVerticalSurface, positionZ]);

      const [showTiltAngle, setShowTiltAngle] = useState(false);

      const tiltHandleGroupRef = useRef<Group>(null!);
      const tiltHandlePointerRef = useRef<Group>(null!);
      const textRef = useRef<SpriteText>(null!);

      const { _color, _onPointerDown, _onPointerMove, _onPointerLeave } = useHandle(RESIZE_HANDLE_COLOR, 'grab');

      useImperativeHandle(
        ref,
        () => {
          return {
            setVisiable(b: boolean) {
              if (tiltHandleGroupRef.current) {
                tiltHandleGroupRef.current.visible = b;
              }
            },
            update(angle: number, z: number) {
              if (tiltHandlePointerRef.current) {
                tiltHandlePointerRef.current.rotation.set(angle, 0, 0);
              }
              if (textRef.current) {
                textRef.current.text = getAngleText(angle);
              }
              if (tiltHandleGroupRef.current) {
                tiltHandleGroupRef.current.position.z = z;
              }
            },
          };
        },
        [],
      );

      const getAngleText = (angle: number) => {
        const a = isOnVerticalSurface ? -angle : angle;
        return `${Math.floor((a / Math.PI) * 180)}°`;
      };

      const onTiltHandlePointerDown = (event: ThreeEvent<PointerEvent>) => {
        setShowTiltAngle(true);
        onPointerDown(event);
        _onPointerDown();
      };

      const onTiltHandlePointerMove = (event: ThreeEvent<PointerEvent>) => {
        onPointerMove(event);
      };

      // onPointerUp
      useEffect(() => {
        const onPointerUp = () => {
          setShowTiltAngle(false);
        };
        window.addEventListener('pointerup', onPointerUp);
        return () => window.addEventListener('pointerup', onPointerUp);
      }, []);

      return (
        <group name={'Tilt_Handle_Group'} ref={tiltHandleGroupRef} position={[0, 0, z]}>
          {/* ring handles */}
          <Ring
            name={RotateHandleType.Tilt}
            args={[handleSize, 1.125 * handleSize, 18, 2, 0, ringThetaLength]}
            rotation={[HALF_PI, 0, HALF_PI, 'ZXY']}
            onPointerDown={onTiltHandlePointerDown}
            onPointerMove={_onPointerMove}
            onPointerLeave={_onPointerLeave}
          >
            <meshBasicMaterial side={DoubleSide} color={_color} />
          </Ring>
          {showTiltAngle && (
            <>
              {/* tilt handle intersection plane */}
              <Ring
                name={'Tilt_Handle_Intersection_Plane'}
                args={[handleSize, 2 * handleSize, 18, 2, 0, ringThetaLength]}
                rotation={[HALF_PI, 0, HALF_PI, 'ZXY']}
                onPointerMove={onTiltHandlePointerMove}
              >
                <meshBasicMaterial transparent depthTest={false} opacity={0.5} side={DoubleSide} />
              </Ring>

              {/* scale */}
              <group rotation={[-HALF_PI, 0, 0]}>
                {degree.map((e, i) => {
                  const text = isOnVerticalSurface ? `${90 - i * 15}°` : `${i * 15 - 90}°`;
                  return (
                    <group key={i} rotation={[degreeUnit * i, 0, 0, 'ZXY']}>
                      <Line
                        points={[
                          [0, 0, 1.8 * handleSize],
                          [0, 0, 2 * handleSize],
                        ]}
                        color={'white'}
                        transparent={true}
                        opacity={0.5}
                      />
                      <textSprite
                        userData={{ unintersectable: true }}
                        text={text}
                        fontSize={20 * handleSize}
                        fontFace={'Times Roman'}
                        textHeight={0.15 * handleSize}
                        position={[0, 0, 1.6 * handleSize]}
                      />
                    </group>
                  );
                })}
              </group>
              {/* pointer group */}
              <group ref={tiltHandlePointerRef} rotation={[tiltAngle, 0, 0]}>
                {/* pointer */}
                <Line
                  points={[
                    [0, 0, handleSize],
                    [0, 0, 1.75 * handleSize],
                  ]}
                />

                {/* show current degree */}
                <textSprite
                  ref={textRef}
                  userData={{ unintersectable: true }}
                  text={getAngleText(tiltAngle)}
                  fontSize={20 * handleSize}
                  fontFace={'Times Roman'}
                  textHeight={0.2 * handleSize}
                  position={[0, 0, 0.75 * handleSize]}
                />
              </group>
            </>
          )}
        </group>
      );
    },
  ),
);

export default TiltHandle;
