/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Euler, FontLoader, TextGeometryParameters, Vector3 } from 'three';
import { useLoader } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import helvetikerFont from '../fonts/helvetiker_regular.typeface.fnt';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ElementModel } from '../models/ElementModel';
import { HALF_PI } from '../constants';
import { ResizeHandleType } from '../types';
import { Util } from '../Util';

export const VerticalRuler = ({ element }: { element: ElementModel }) => {
  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);
  const selectedElementHeight = useStore(Selector.selectedElementHeight);

  const [height, setHeight] = useState<number>(Math.ceil(selectedElementHeight) + 1);
  const [shownHeight, setShownHeight] = useState<string>(selectedElementHeight.toFixed(1));
  const [position, setPosition] = useState<Vector3>();
  const [rotation, setRotation] = useState<Euler>();

  const color = 'lightGray';
  const font = useLoader(FontLoader, helvetikerFont);
  const textGeometryParamsTickLabel = {
    font: font,
    height: 0,
    size: 0.25,
  } as TextGeometryParameters;
  const textGeometryParams = {
    font: font,
    height: 0,
    size: 0.35,
  } as TextGeometryParameters;

  useEffect(() => {
    if (resizeHandleType) {
      const handlePos = getResizeHandlePosition(element, resizeHandleType);
      const cameraDir = getCameraDirection();
      const rotation = -Math.atan2(cameraDir.x, cameraDir.y) + Math.PI;
      setPosition(new Vector3(handlePos.x, handlePos.y, 0));
      setRotation(new Euler(HALF_PI, 0, rotation, 'ZXY'));
    }
  }, [resizeHandleType]);

  useEffect(() => {
    if (Util.isTopResizeHandle(hoveredHandle)) {
      const handlePos = getResizeHandlePosition(element, hoveredHandle as ResizeHandleType);
      const cameraDir = getCameraDirection();
      const rotation = -Math.atan2(cameraDir.x, cameraDir.y) + Math.PI;
      setPosition(new Vector3(handlePos.x, handlePos.y, 0));
      setRotation(new Euler(HALF_PI, 0, rotation, 'ZXY'));
    }
  }, [hoveredHandle]);

  useEffect(() => {
    setHeight(Math.ceil(selectedElementHeight) + 1);
    setShownHeight(selectedElementHeight.toFixed(1));
  }, [selectedElementHeight]);

  const tickLabels = new Array(height + 1).fill(0);

  return (
    <>
      {position && rotation && (
        <group position={position} rotation={rotation} name={'Vertical Ruler'}>
          <Line
            userData={{ unintersectable: true }}
            points={[
              [0, 0, 0],
              [0, height, 0],
            ]}
            color={color}
          />
          <mesh position={[-1.5, selectedElementHeight - 0.175, 0]} userData={{ unintersectable: true }}>
            <textGeometry args={[shownHeight, textGeometryParams]} />
            <meshStandardMaterial attach="material" color={'white'} />
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
                <mesh position={[0.4, i - 0.125, 0]} userData={{ unintersectable: true }}>
                  {textGeometry}
                  <meshStandardMaterial attach="material" color={color} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </>
  );
};

export default React.memo(VerticalRuler);
