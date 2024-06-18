/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Line, Ring } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { RotateHandleType } from 'src/types';
import { DoubleSide, Group } from 'three';
import SpriteText from 'three-spritetext';

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
      const tiltHandleSize = 1;
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
            args={[1, 1.1, 18, 2, 0, ringThetaLength]}
            rotation={[HALF_PI, 0, HALF_PI, 'ZXY']}
            onPointerDown={onTiltHandlePointerDown}
          >
            <meshBasicMaterial side={DoubleSide} />
          </Ring>
          {showTiltAngle && (
            <>
              {/* tilt handle intersection plane */}
              <Ring
                name={'Tilt_Handle_Intersection_Plane'}
                args={[tiltHandleSize, 2 * tiltHandleSize, 18, 2, 0, ringThetaLength]}
                rotation={[HALF_PI, 0, HALF_PI, 'ZXY']}
                onPointerMove={onTiltHandlePointerMove}
              >
                <meshBasicMaterial depthTest={false} transparent={true} opacity={0.5} side={DoubleSide} />
              </Ring>

              {/* scale */}
              <group rotation={[-HALF_PI, 0, 0]}>
                {degree.map((e, i) => {
                  const text = isOnVerticalSurface ? `${90 - i * 15}°` : `${i * 15 - 90}°`;
                  return (
                    <group key={i} rotation={[degreeUnit * i, 0, 0, 'ZXY']}>
                      <Line
                        points={[
                          [0, 0, 1.8 * tiltHandleSize],
                          [0, 0, 2 * tiltHandleSize],
                        ]}
                        color={'white'}
                        transparent={true}
                        opacity={0.5}
                      />
                      <textSprite
                        userData={{ unintersectable: true }}
                        text={text}
                        fontSize={20 * tiltHandleSize}
                        fontFace={'Times Roman'}
                        textHeight={0.15 * tiltHandleSize}
                        position={[0, 0, 1.6 * tiltHandleSize]}
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
                    [0, 0, tiltHandleSize],
                    [0, 0, 1.75 * tiltHandleSize],
                  ]}
                />

                {/* show current degree */}
                <textSprite
                  ref={textRef}
                  userData={{ unintersectable: true }}
                  text={getAngleText(tiltAngle)}
                  fontSize={20 * tiltHandleSize}
                  fontFace={'Times Roman'}
                  textHeight={0.2 * tiltHandleSize}
                  position={[0, 0, 0.75 * tiltHandleSize]}
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
