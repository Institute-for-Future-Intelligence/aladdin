/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Euler, FontLoader, TextGeometryParameters, Vector3 } from 'three';
import { useLoader } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import helvetikerFont from './fonts/helvetiker_regular.typeface.fnt';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ElementModel } from './models/ElementModel';
import { Util } from './Util';

export const VerticalRuler = ({ element }: { element: ElementModel }) => {
  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const selectedElementHeight = useStore(Selector.selectedElementHeight);

  const [height, setHeight] = useState<number>(Math.ceil(selectedElementHeight) + 1);
  const [shownHeight, setShownHeight] = useState<string>(selectedElementHeight.toFixed(1));
  const [position, setPostion] = useState<Vector3>();
  const [rotation, setRotation] = useState<Euler>();

  const font = useLoader(FontLoader, helvetikerFont);
  const fontSize = 0.4;
  const textGeometryParams = {
    font: font,
    height: 0.0,
    size: fontSize,
  } as TextGeometryParameters;
  const color = 'lightGray';

  useEffect(() => {
    if (resizeHandleType) {
      const handlePos = getResizeHandlePosition(element, resizeHandleType);
      const cameraDir = getCameraDirection();
      const rotation = -Math.atan2(cameraDir.x, cameraDir.y) + Math.PI;
      setPostion(new Vector3(handlePos.x, handlePos.y, 0));
      setRotation(new Euler(Util.HALF_PI, 0, rotation, 'ZXY'));
    }
  }, [resizeHandleType]);

  useEffect(() => {
    console.log(selectedElementHeight);
    setHeight(Math.ceil(selectedElementHeight) + 1);
    setShownHeight(selectedElementHeight.toFixed(1));
  }, [selectedElementHeight]);

  const tickLabels = new Array(height + 1).fill(0);

  return (
    <>
      {position && rotation && (
        <group position={position} rotation={rotation} name={'Vertical Ruler'}>
          <Line
            points={[
              [0, 0, 0],
              [0, height, 0],
            ]}
            color={color}
          />
          {tickLabels.map((e, i) => {
            const len = 0.4 + (i % 5 === 0 ? 0.4 : 0);
            const lineWidth = i % 5 === 0 ? 1.5 : 0.5;
            const posL = i > 9 ? -1.7 : -1.5;
            const posR = i > 9 ? 1 : 1.2;
            const textGeometry = <textGeometry args={[`${i}`, textGeometryParams]} />;
            return (
              <group key={i}>
                <Line
                  points={[
                    [-len, i, 0],
                    [len, i, 0],
                  ]}
                  lineWidth={lineWidth}
                  color={color}
                />
                <mesh position={[posL, i, 0]}>
                  {textGeometry}
                  <meshStandardMaterial attach="material" color={color} />
                </mesh>
                <mesh position={[posR, i, 0]}>
                  {textGeometry}
                  <meshStandardMaterial attach="material" color={color} />
                </mesh>
                <mesh position={[-0.5, parseFloat(shownHeight) + 0.5, 0]}>
                  <textGeometry args={[shownHeight, textGeometryParams]} />
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
