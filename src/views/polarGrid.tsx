/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { DoubleSide, Vector3 } from 'three';
import { useLoader } from '@react-three/fiber';
import { Ring } from '@react-three/drei';
//@ts-expect-error ignore
import helvetikerFont from '../assets/helvetiker_regular.typeface.fnt';
import { Util } from '../Util';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ObjectType } from '../types';
import { ElementModel } from '../models/ElementModel';
import { HALF_PI } from '../constants';
import { FontLoader, TextGeometryParameters } from 'three/examples/jsm/Addons';

export const PolarGrid = React.memo(({ element, height }: { element: ElementModel; height?: number }) => {
  const rotateHandle = useStore(Selector.rotateHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);
  const angle = useStore(Selector.selectedElementAngle);
  const getParent = useStore(Selector.getParent);
  const groundImage = useStore(Selector.viewState.groundImage);

  const [position, setPosition] = useState<Vector3>();
  const [radius, setRadius] = useState<number>(10);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (rotateHandle || hoveredHandle) {
      const { cx, cy, lx, ly, type } = element;
      switch (type) {
        case ObjectType.SolarPanel: {
          const currParent = getParent(element);
          if (currParent) {
            const rcx = cx * currParent.lx;
            const rcy = cy * currParent.ly;
            setPosition(new Vector3(rcx, rcy, height ?? currParent.lz));
          }
          break;
        }
        case ObjectType.Foundation: {
          setPosition(new Vector3(cx, cy, groundImage ? 0.1 : 0));
          break;
        }
        case ObjectType.Cuboid: {
          const { pos } = Util.getWorldDataById(element.id);
          const { rot } = Util.getWorldDataById(element.parentId);
          setPosition(new Vector3(pos.x, pos.y, pos.z - element.lz / 2 + 0.2));
          setRotation(rot);
          break;
        }
        default: {
          setPosition(new Vector3(cx, cy, groundImage ? 0.2 : 0));
          break;
        }
      }
      setRadius(Math.max(5, Math.hypot(lx, ly) * 0.75));
    }
  }, [element, rotateHandle, hoveredHandle, groundImage, height]);

  const font = useLoader(FontLoader, helvetikerFont);
  const fontSize = radius * 0.05;
  const textGeometryParams = {
    font: font,
    height: 0.0,
    size: fontSize,
  } as TextGeometryParameters;

  const tickLabels = new Array(25).fill(0);

  const getOffset = (i: number) => {
    if (i === 0) {
      return -fontSize * 0.3;
    } else if (i > 0 && i < 7) {
      return -fontSize * 0.8;
    } else {
      return -fontSize * 1.2;
    }
  };

  const color = groundImage ? '#222' : '#ccc';

  return (
    <>
      {position && (
        <group position={position} rotation={[HALF_PI, rotation, 0]} name={'Polar Auxiliary'}>
          <polarGridHelper args={[radius, 24, 6, 120, color, color]} userData={{ unintersectable: true }} />
          <Ring
            args={[radius * 0.98, radius, 24, 1, HALF_PI, angle]}
            userData={{ unintersectable: true }}
            rotation={[-HALF_PI, 0, 0]}
          >
            <meshBasicMaterial side={DoubleSide} color={'yellow'} />
          </Ring>

          {/* shown angle */}
          <group rotation={[0, angle, 0]}>
            <mesh position={[-0.5, 0, -radius * 0.9]} rotation={[-HALF_PI, 0, 0]} userData={{ unintersectable: true }}>
              <textGeometry args={[`${-Util.toDegrees(angle).toFixed(1)}°`, textGeometryParams]} />
            </mesh>
          </group>

          {/* tick labels */}
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
      )}
    </>
  );
});
