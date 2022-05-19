/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 *
 * Not sure why I wanted wireframe to be treated differently in a previous version
 * when there is a ground image.
 */

import React, { useEffect, useRef } from 'react';
import { BufferGeometry, LineBasicMaterial, Mesh, Vector3 } from 'three';

export interface WireframeProps {
  hx: number;
  hy: number;
  hz: number;
  lineColor?: string;
  lineWidth?: number;
}

const Wireframe = ({ hx, hy, hz, lineColor = 'black', lineWidth = 0.2 }: WireframeProps) => {
  const ref = useRef<Mesh>(null);

  // Upper-Lower / Front-Back / Left-Right
  const UFL = new Vector3(-hx, -hy, hz);
  const UFR = new Vector3(hx, -hy, hz);
  const UBL = new Vector3(-hx, hy, hz);
  const UBR = new Vector3(hx, hy, hz);
  const LFL = new Vector3(-hx, -hy, -hz);
  const LFR = new Vector3(hx, -hy, -hz);
  const LBL = new Vector3(-hx, hy, -hz);
  const LBR = new Vector3(hx, hy, -hz);

  useEffect(() => {
    if (ref.current) {
      const points = [
        // upper
        UFL,
        UFR,
        UFR,
        UBR,
        UBR,
        UBL,
        UBL,
        UFL,

        // lower
        LFL,
        LFR,
        LFR,
        LBR,
        LBR,
        LBL,
        LBL,
        LFL,

        // vertical
        UFL,
        LFL,
        UFR,
        LFR,
        UBR,
        LBR,
        UBL,
        LBL,
      ];

      const geometry = new BufferGeometry().setFromPoints(points);
      const material = new LineBasicMaterial({ color: lineColor, linewidth: lineWidth });

      ref.current.geometry = geometry;
      ref.current.material = material;
    }
  }, []);

  return <lineSegments ref={ref} />;
};

export default React.memo(Wireframe);
