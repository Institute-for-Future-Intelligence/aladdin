/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
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
  const sceneRadius = useStore(Selector.sceneRadius);
  const cameraPosition = useStore(Selector.viewState.cameraPosition);
  const orthographic = useStore(Selector.viewState.orthographic);
  const minorTickLength = 0.1;
  const majorTickLength = 0.3;
  const tickMarkColor = 'FloralWhite';
  const tickMarkLineWidth = lineWidth / 2;
  const font = useLoader(FontLoader, helvetikerFont);
  const fontSize = Math.max(0.25, sceneRadius * 0.005);
  const textGeometryParams = {
    font: font,
    height: 0,
    size: fontSize,
  } as TextGeometryParameters;

  const fetchTickLength = (i: number) => {
    return i % 5 === 0 ? majorTickLength : minorTickLength;
  };

  const cameraZ: number = orthographic ? cameraPosition[2] : 0;

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
        [...Array(sceneRadius)].map((x, i) => {
          const j = i + 1;
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
        [...Array(sceneRadius)].map((x, i) => {
          const j = i + 1;
          return j % 5 === 0 ? (
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
        [...Array(sceneRadius)].map((x, i) => {
          const j = -(i + 1);
          return j % 5 === 0 ? (
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
        [...Array(sceneRadius)].map((y, i) => {
          const j = i + 1;
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
        [...Array(sceneRadius)].map((y, i) => {
          const j = i + 1;
          return j % 5 === 0 ? (
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
        [...Array(sceneRadius)].map((y, i) => {
          const j = -(i + 1);
          return j % 5 === 0 ? (
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
