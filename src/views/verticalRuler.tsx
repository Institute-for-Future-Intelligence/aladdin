/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Euler } from 'three';
import { useLoader } from '@react-three/fiber';
import { Line } from '@react-three/drei';
//@ts-expect-error ignore
import helvetikerFont from '../fonts/helvetiker_regular.typeface.fnt';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ElementModel } from '../models/ElementModel';
import { HALF_PI } from '../constants';
import { ObjectType, ResizeHandleType } from '../types';
import { FontLoader, TextGeometryParameters } from 'three/examples/jsm/Addons';
import { RoofModel } from '../models/RoofModel';

export const VerticalRuler = ({ element }: { element: ElementModel }) => {
  const cameraDirection = useStore(Selector.cameraDirection);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);

  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);

  const isRoof = element.type === ObjectType.Roof;
  const color = 'lightGray';
  const font = useLoader(FontLoader, helvetikerFont);
  const textGeometryParamsTickLabel = {
    font: font,
    height: 0,
    size: 0.2,
  } as TextGeometryParameters;
  const textGeometryParams = {
    font: font,
    height: 0,
    size: 0.35,
  } as TextGeometryParameters;

  const position = useMemo(() => {
    const handle = resizeHandleType ?? hoveredHandle;
    return getResizeHandlePosition(element, handle as ResizeHandleType);
  }, [resizeHandleType, hoveredHandle]);

  const rotation = useMemo(() => {
    const rotation = -Math.atan2(cameraDirection.x, cameraDirection.y) + Math.PI;
    return new Euler(HALF_PI, 0, rotation, 'ZXY');
  }, [cameraDirection.x, cameraDirection.y]);

  const getRulerLength = () => {
    let height = element.lz;
    if (isRoof) {
      height = useStore.getState().selectedElementHeight;
    }
    return Math.ceil(height) + 1;
  };

  const getHeightText = () => {
    let height = element.lz;
    if (isRoof) {
      height = (element as RoofModel).rise;
    }
    return height.toFixed(1) + ' m';
  };

  const getTextPositionZ = () => {
    if (isRoof) {
      return useStore.getState().selectedElementHeight + 1;
    }
    return element.lz - 0.175;
  };

  if (!resizeHandleType && !hoveredHandle) return null;

  const rulerLength = getRulerLength();
  const heightText = getHeightText();
  const textPositionZ = getTextPositionZ();
  const tickLabels = new Array(rulerLength + 1).fill(0);

  return (
    <group position={position} rotation={rotation} name={'Vertical Ruler'}>
      <Line
        userData={{ unintersectable: true }}
        points={[
          [0, 0, 0],
          [0, rulerLength, 0],
        ]}
        color={color}
      />
      <mesh position={[-1.5, textPositionZ, 0]} userData={{ unintersectable: true }}>
        <textGeometry args={[heightText, textGeometryParams]} />
        <meshBasicMaterial attach="material" color={'white'} />
      </mesh>
      {tickLabels.map((e, i) => {
        const len = 0.2 + (i % 5 === 0 ? 0.05 : 0);
        const textGeometry = <textGeometry args={[`${i}`, textGeometryParamsTickLabel]} />;
        return (
          <group key={i}>
            <Line
              userData={{ unintersectable: true }}
              points={[
                [-len, i, 0],
                [len, i, 0],
              ]}
              lineWidth={0.5}
              color={color}
            />
            {!isRoof && (
              <mesh position={[0.4, i - 0.125, 0]} userData={{ unintersectable: true }}>
                {textGeometry}
                <meshBasicMaterial attach="material" color={color} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default React.memo(VerticalRuler);
