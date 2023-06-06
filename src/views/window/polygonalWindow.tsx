/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { Cylinder, Plane } from '@react-three/drei';
import React, { useMemo } from 'react';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { useStore } from 'src/stores/common';
import { DoubleSide, MeshStandardMaterial, Shape } from 'three';
import * as Selector from 'src/stores/selector';
import { WireframeDataType } from './window';

interface PolygonalWindowProps {
  dimension: number[];
  position: number[];
  polygonTop: number[];
  glassMaterial: JSX.Element;
  empty: boolean;
  interior: boolean;
  wireframeData: WireframeDataType;
}

const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: DoubleSide });

const CYLINDER_RADIAL_SEGMENTS = 3;
const CYLINDER_HEIGHT_SEGMENTS = 1;

const PolygonalWindow = ({
  dimension,
  polygonTop,
  position,
  glassMaterial,
  empty,
  interior,
  wireframeData,
}: PolygonalWindowProps) => {
  const [cx, cy, cz] = position;
  const [lx, ly, lz] = dimension;
  const [hx, hy, hz] = dimension.map((v) => v / 2);
  const [topX, topH] = polygonTop;
  const { lineWidth, lineColor, selected, locked, opacity } = wireframeData;

  const absTopX = topX * lx;
  const topRightSealPlaneLength = Math.hypot(topH, hx - absTopX);
  const topRightSealPlaneRotaion = Math.asin(topH / topRightSealPlaneLength);
  const topLeftSealPlaneLength = Math.hypot(topH, hx + absTopX);
  const topLeftSealPlaneRotation = -Math.asin(topH / topLeftSealPlaneLength);

  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const glassShape = useMemo(() => {
    const shape = new Shape();
    const hx = lx / 2;
    const hz = lz / 2;
    const tx = topX * lx; // abs

    shape.moveTo(-hx, -hz);
    shape.lineTo(hx, -hz);
    shape.lineTo(hx, hz);
    shape.lineTo(tx, hz + topH);
    shape.lineTo(-hx, hz);
    shape.closePath();

    return shape;
  }, [lx, lz, topX, topH]);

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

  const renderWireframeLine = (length: number, offset = 0) => {
    return (
      <Cylinder
        args={[wireframeWidth, wireframeWidth, length, 3, 1]}
        position={[offset, wireframeCy, 0]}
        rotation={[0, 0, HALF_PI]}
        material={wireframeMaterial}
      />
    );
  };

  const renderSealPlane = (length: number, offset = 0) => {
    return (
      <Plane
        args={[length, ly]}
        position={[offset, 0, 0]}
        material={sealPlanesMaterial}
        receiveShadow={shadowEnabled}
        castShadow={shadowEnabled}
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

      <group position={[0, hy, -hz + 0.001]}>
        {renderSealPlane(lx)}
        {renderWireframeLine(lx)}
      </group>

      <group position={[-hx + 0.001, hy, 0]} rotation={[0, HALF_PI, 0]}>
        {renderSealPlane(lz)}
        {renderWireframeLine(lz)}
      </group>

      <group position={[hx - 0.001, hy, 0]} rotation={[0, -HALF_PI, 0]}>
        {renderSealPlane(lz)}
        {renderWireframeLine(lz)}
      </group>

      <group position={[-hx + 0.001, hy, hz - 0.01]} rotation={[0, topLeftSealPlaneRotation, 0]}>
        {renderSealPlane(topLeftSealPlaneLength, topLeftSealPlaneLength / 2)}
        {renderWireframeLine(topLeftSealPlaneLength, topLeftSealPlaneLength / 2)}
      </group>

      <group position={[hx - 0.001, hy, hz - 0.01]} rotation={[0, topRightSealPlaneRotaion, 0]}>
        {renderSealPlane(topRightSealPlaneLength, -topRightSealPlaneLength / 2)}
        {renderWireframeLine(topRightSealPlaneLength, -topRightSealPlaneLength / 2)}
      </group>
    </>
  );
};

export default React.memo(PolygonalWindow);
