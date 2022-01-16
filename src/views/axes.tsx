/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Line } from '@react-three/drei';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { useLoader } from '@react-three/fiber';
import { FontLoader, TextGeometryParameters } from 'three';
import helvetikerFont from '../fonts/helvetiker_regular.typeface.fnt';

export interface AxesProps {
  lineWidth?: number;
  endPoint?: number;
  showTickMarks?: boolean;
  showTickLabels?: boolean;
}

const Axes = ({ lineWidth = 1, endPoint = 1000, showTickMarks = true, showTickLabels = true }: AxesProps) => {
  const aabb = useStore(Selector.aabb);
  const sceneRadius = useStore(Selector.sceneRadius);
  const orthographic = useStore(Selector.viewState.orthographic);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  const nTicks = 50;
  const tickIntervalRef = useRef<number>(1);
  const labelIntervalRef = useRef<number>(tickIntervalRef.current * 10);
  const arrayRef = useRef<number[]>(new Array(nTicks).fill(1));

  const minorTickLength = 0.1;
  const majorTickLength = 0.3;
  const tickMarkColor = 'FloralWhite';
  const tickMarkLineWidth = lineWidth / 2;
  const font = useLoader(FontLoader, helvetikerFont);
  const fontSize = Math.min(1, Math.max(0.5, sceneRadius * 0.01));
  const textGeometryParams = {
    font: font,
    height: 0,
    size: fontSize,
  } as TextGeometryParameters;
  const cameraZ: number = orthographic ? aabb.max.z + 0.01 : 0;

  useEffect(() => {
    if (sceneRadius < 50) {
      tickIntervalRef.current = 1;
    } else if (sceneRadius < 100) {
      tickIntervalRef.current = 2;
    } else {
      tickIntervalRef.current = 5;
    }
    labelIntervalRef.current = 10 * tickIntervalRef.current;
    arrayRef.current = new Array(nTicks).fill(1);
    setUpdateFlag(!updateFlag);
  }, [sceneRadius]);

  const fetchTickLength = (i: number) => {
    return i % (5 * tickIntervalRef.current) === 0 ? majorTickLength : minorTickLength;
  };

  return (
    <>
      {/* x axis */}
      <Line
        userData={{ unintersectable: true }}
        points={[
          [-endPoint, 0, cameraZ],
          [endPoint, 0, cameraZ],
        ]}
        color={'red'}
        lineWidth={lineWidth}
      />
      {orthographic &&
        showTickMarks &&
        arrayRef.current.map((value, i) => {
          const j = (i + 1) * tickIntervalRef.current;
          const a = fetchTickLength(j);
          return (
            <React.Fragment key={j}>
              <Line
                userData={{ unintersectable: true }}
                points={[
                  [j, -a, cameraZ],
                  [j, a, cameraZ],
                ]}
                color={tickMarkColor}
                lineWidth={tickMarkLineWidth}
              />
              <Line
                userData={{ unintersectable: true }}
                points={[
                  [-j, -a, cameraZ],
                  [-j, a, cameraZ],
                ]}
                color={tickMarkColor}
                lineWidth={tickMarkLineWidth}
              />
            </React.Fragment>
          );
        })}
      {orthographic &&
        showTickLabels &&
        arrayRef.current.map((value, i) => {
          const j = (i + 1) * tickIntervalRef.current;
          return j % labelIntervalRef.current === 0 ? (
            <mesh
              userData={{ unintersectable: true }}
              key={j}
              position={[j - fontSize, -majorTickLength * 2 - fontSize, cameraZ]}
            >
              <textGeometry args={[(j < 10 ? ' ' : '') + j, textGeometryParams]} />
              <meshStandardMaterial attach="material" color={'lightGray'} />
            </mesh>
          ) : (
            <React.Fragment key={j} />
          );
        })}
      {orthographic &&
        showTickLabels &&
        arrayRef.current.map((value, i) => {
          const j = -(i + 1) * tickIntervalRef.current;
          return j % labelIntervalRef.current === 0 ? (
            <mesh
              userData={{ unintersectable: true }}
              key={j}
              position={[j - fontSize, -majorTickLength * 2 - fontSize, cameraZ]}
            >
              <textGeometry args={[(j > -10 ? ' ' : '') + j, textGeometryParams]} />
              <meshStandardMaterial attach="material" color={'lightGray'} />
            </mesh>
          ) : (
            <React.Fragment key={j} />
          );
        })}

      {/* y axis */}
      <Line
        userData={{ unintersectable: true }}
        points={[
          [0, -endPoint, cameraZ],
          [0, endPoint, cameraZ],
        ]}
        color={'blue'}
        lineWidth={lineWidth}
      />
      {/* tick mark line width is enlarged because they appear to be thinner in the y direction */}
      {orthographic &&
        showTickMarks &&
        arrayRef.current.map((value, i) => {
          const j = (i + 1) * tickIntervalRef.current;
          const a = fetchTickLength(j);
          return (
            <React.Fragment key={j}>
              <Line
                userData={{ unintersectable: true }}
                points={[
                  [-a, j, cameraZ],
                  [a, j, cameraZ],
                ]}
                color={tickMarkColor}
                lineWidth={tickMarkLineWidth * 1.5}
              />
              <Line
                userData={{ unintersectable: true }}
                points={[
                  [-a, -j, cameraZ],
                  [a, -j, cameraZ],
                ]}
                color={tickMarkColor}
                lineWidth={tickMarkLineWidth * 1.5}
              />
            </React.Fragment>
          );
        })}
      {orthographic &&
        showTickLabels &&
        arrayRef.current.map((value, i) => {
          const j = (i + 1) * tickIntervalRef.current;
          return j % labelIntervalRef.current === 0 ? (
            <mesh
              userData={{ unintersectable: true }}
              key={j}
              position={[-majorTickLength * 2 - fontSize * 2, j - fontSize / 2, cameraZ]}
            >
              <textGeometry args={[j + '', textGeometryParams]} />
              <meshStandardMaterial attach="material" color={'lightGray'} />
            </mesh>
          ) : (
            <React.Fragment key={j} />
          );
        })}
      {orthographic &&
        showTickLabels &&
        arrayRef.current.map((value, i) => {
          const j = -(i + 1) * tickIntervalRef.current;
          return j % labelIntervalRef.current === 0 ? (
            <mesh
              userData={{ unintersectable: true }}
              key={j}
              position={[-majorTickLength * 2 - fontSize * 2, j - fontSize / 2, cameraZ]}
            >
              <textGeometry args={[j + '', textGeometryParams]} />
              <meshStandardMaterial attach="material" color={'lightGray'} />
            </mesh>
          ) : (
            <React.Fragment key={j} />
          );
        })}

      {/* z axis */}
      {!orthographic && (
        <Line
          userData={{ unintersectable: true }}
          points={[
            [0, 0, 0],
            [0, 0, endPoint],
          ]}
          color={'green'}
          lineWidth={lineWidth}
        />
      )}
    </>
  );
};

export default React.memo(Axes);
