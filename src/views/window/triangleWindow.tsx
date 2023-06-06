/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { Cylinder, Plane } from '@react-three/drei';
import React, { useMemo } from 'react';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { useStore } from 'src/stores/common';
import { DoubleSide, Material, MeshStandardMaterial, Shape } from 'three';
import * as Selector from 'src/stores/selector';
import { WireframeDataType } from './window';

interface TriangleWindowProps {
  dimension: number[];
  position: number[];
  topX: number;
  glassMaterial: JSX.Element;
  empty: boolean;
  wireframeData: WireframeDataType;
}

const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: DoubleSide });

const TriangleWindow = ({ dimension, topX, position, glassMaterial, empty, wireframeData }: TriangleWindowProps) => {
  const [cx, cy, cz] = position;
  const [lx, ly, lz] = dimension;
  const [hx, hy, hz] = dimension.map((v) => v / 2);
  const { lineWidth, lineColor, selected, locked, opacity } = wireframeData;

  const absTopX = topX * lx;
  const rightSealPlaneLength = Math.hypot(lz, hx - absTopX);
  const rightSealPlaneRotaion = Math.asin(lz / rightSealPlaneLength);
  const leftSealPlaneLength = Math.hypot(lz, hx + absTopX);
  const leftSealPlaneRotation = -Math.asin(lz / leftSealPlaneLength);

  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const glassShape = useMemo(() => {
    const shape = new Shape();
    const hx = lx / 2;
    const hz = lz / 2;
    const tx = topX * lx;

    shape.moveTo(-hx, -hz);
    shape.lineTo(hx, -hz);
    shape.lineTo(tx, hz);
    shape.closePath();

    return shape;
  }, [lx, lz, topX]);

  const wireframeMaterial = useMemo(() => {
    if (selected && locked) {
      return new MeshStandardMaterial({ color: LOCKED_ELEMENT_SELECTION_COLOR });
    } else {
      return new MeshStandardMaterial({ color: lineColor });
    }
  }, [lineColor, selected, locked]);

  const wireframeWidth = useMemo(() => {
    if (locked && selected) {
      return lineWidth / 5;
    } else {
      return lineWidth / 20;
    }
  }, [lineWidth, selected, locked]);

  const wireframeCy = useMemo(() => {
    if (locked && selected) {
      return -ly / 2;
    } else {
      return -cy;
    }
  }, [cy, ly, selected, locked]);

  const renderWireframeLine = (cx: number, length: number) => {
    return (
      <Cylinder
        args={[wireframeWidth, wireframeWidth, length, 3, 1]}
        position={[cx, wireframeCy, 0]}
        rotation={[0, 0, HALF_PI]}
        material={wireframeMaterial}
      />
    );
  };
  return (
    <>
      {!empty && (
        <mesh name={'Triangle Glass Plane'} position={[0, cy, 0]} rotation={[HALF_PI, 0, 0]}>
          <shapeBufferGeometry args={[glassShape]} />
          {glassMaterial}
        </mesh>
      )}

      <group position={[0, hy, -hz + 0.01]}>
        <Plane
          name={'Window Seal Plane Bottom'}
          args={[lx, ly]}
          material={sealPlanesMaterial}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        />
        {renderWireframeLine(0, lx)}
      </group>

      <group position={[hx, hy, -hz - 0.01]} rotation={[0, rightSealPlaneRotaion, 0]}>
        <Plane
          name={'Window Seal Plane Right'}
          args={[rightSealPlaneLength, ly]}
          position={[-rightSealPlaneLength / 2, 0, 0]}
          material={sealPlanesMaterial}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        />
        {renderWireframeLine(-rightSealPlaneLength / 2, rightSealPlaneLength)}
      </group>
      <group position={[-lx / 2, hy, -hz - 0.01]} rotation={[0, leftSealPlaneRotation, 0]}>
        <Plane
          name={'Window Seal Plane Left'}
          args={[leftSealPlaneLength, ly]}
          position={[leftSealPlaneLength / 2, 0, 0]}
          material={sealPlanesMaterial}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        />
        {renderWireframeLine(leftSealPlaneLength / 2, leftSealPlaneLength)}
      </group>
    </>
  );
};

export default React.memo(TriangleWindow);
