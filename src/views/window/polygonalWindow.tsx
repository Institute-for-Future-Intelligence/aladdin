/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { Box, Cylinder, Extrude, Plane, Tube } from '@react-three/drei';
import React, { useMemo } from 'react';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { useStore } from 'src/stores/common';
import { DoubleSide, Euler, MeshStandardMaterial, Shape, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { FrameDataType, Shutter, WireframeDataType } from './window';
import { RoofUtil } from '../roof/RoofUtil';
import { ShutterProps } from 'src/models/WindowModel';

interface PolygonalWindowProps {
  dimension: number[];
  position: number[];
  polygonTop: number[];
  glassMaterial: JSX.Element;
  empty: boolean;
  interior: boolean;
  wireframeData: WireframeDataType;
  frameData: FrameDataType;
  shutter: ShutterProps;
}

interface FrameProps {
  dimension: number[];
  polygonTop: number[];
  frameData: FrameDataType;
  shadowEnabled: boolean;
}

const CYLINDER_HEIGHT_SEGMENTS = 1;
const CYLINDER_RADIAL_SEGMENTS = 3;
const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: DoubleSide });
const HALF_PI_Z_EULER = new Euler(0, 0, -HALF_PI);

const Frame = React.memo(({ dimension, polygonTop, frameData, shadowEnabled }: FrameProps) => {
  const [lx, ly, lz] = dimension;
  const [topX, topH] = polygonTop;
  const { color, width, sillWidth } = frameData;
  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const [hx, hz] = [lx / 2, lz / 2];
  const halfWidth = width / 2;
  const depth = halfWidth / 2;
  const sillLength = lx + width * 3;
  const sillThickness = width;

  // from right to left, 2D. length should be 5.
  const innerPoints = useMemo(() => {
    const botRight = new Vector3(hx, -hz);
    const topRight = new Vector3(hx, hz);
    const topLeft = new Vector3(-hx, hz);
    const botLeft = new Vector3(-hx, -hz);
    const topMid = new Vector3(topX * lx, topH + hz);
    return [botRight, topRight, topMid, topLeft, botLeft];
  }, [hx, hz, topX, topH]);

  const outerPoints = useMemo(() => {
    const normals: Vector3[] = [];
    for (let i = 1; i < innerPoints.length; i++) {
      const p1 = innerPoints[i - 1];
      const p2 = innerPoints[i];
      const n = new Vector3().subVectors(p2, p1).normalize().applyEuler(HALF_PI_Z_EULER);
      normals.push(n);
    }

    const edgesAfterOffset: { start: Vector3; end: Vector3 }[] = [];
    for (let i = 0; i < normals.length; i++) {
      const n = normals[i];
      const offset = n.clone().multiplyScalar(width);
      if (i < innerPoints.length - 1) {
        const p1 = innerPoints[i].clone().add(offset);
        const p2 = innerPoints[i + 1].clone().add(offset);
        edgesAfterOffset.push({ start: p1, end: p2 });
      }
    }

    const points: Vector3[] = [];
    points.push(edgesAfterOffset[0].start);
    for (let i = 1; i < edgesAfterOffset.length; i++) {
      const edge1 = edgesAfterOffset[i - 1];
      const edge2 = edgesAfterOffset[i];
      const point = RoofUtil.getIntersectionPoint(edge1.start, edge1.end, edge2.start, edge2.end);
      points.push(point);
    }
    points.push(edgesAfterOffset[edgesAfterOffset.length - 1].end);

    return points;
  }, [innerPoints, width]);

  const shape = useMemo(() => {
    const s = new Shape();
    for (let i = 0; i < outerPoints.length; i++) {
      const point = outerPoints[i];
      if (i === 0) {
        s.moveTo(point.x, point.y);
      } else {
        s.lineTo(point.x, point.y);
      }
    }
    for (let i = innerPoints.length - 1; i >= 0; i--) {
      const point = innerPoints[i];
      s.lineTo(point.x, point.y);
    }
    s.closePath();
    return s;
  }, [innerPoints, outerPoints]);

  return (
    <group name={'Window Frame Group'} position={[0, -depth / 2, 0]}>
      <Extrude
        position={[0, depth / 2, 0]}
        rotation={[HALF_PI, 0, 0]}
        args={[shape, { steps: 1, depth: depth, bevelEnabled: false }]}
      />
      {/* bottom */}
      <Box
        position={[0, 0, -lz / 2 - (sillWidth === 0 ? 0 : sillThickness / 2)]}
        args={sillWidth === 0 ? [lx + 2 * width, depth, width] : [sillLength, sillWidth ?? width, sillThickness]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>
    </group>
  );
});

const PolygonalWindow = ({
  dimension,
  polygonTop,
  position,
  glassMaterial,
  empty,
  interior,
  wireframeData,
  frameData,
  shutter,
}: PolygonalWindowProps) => {
  const [cx, cy, cz] = position;
  const [lx, ly, lz] = dimension;
  const [hx, hy, hz] = dimension.map((v) => v / 2);
  const [topX, topH] = polygonTop;
  const { lineWidth, lineColor, selected, locked, opacity } = wireframeData;

  const absTopX = topX * lx;
  const topRightLength = Math.hypot(topH, hx - absTopX);
  const topRightRotation = Math.asin(topH / topRightLength);
  const topLeftLength = Math.hypot(topH, hx + absTopX);
  const topLeftRotation = -Math.asin(topH / topLeftLength);

  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const shutterLength = useMemo(() => shutter.width * lx, [lx, shutter]);
  const shutterPosX = useMemo(
    () => ((shutterLength + frameData.width + lx) / 2) * 1.025,
    [lx, shutterLength, frameData.width],
  );

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
        args={[wireframeWidth, wireframeWidth, length, CYLINDER_RADIAL_SEGMENTS, CYLINDER_HEIGHT_SEGMENTS]}
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

      {frameData.showFrame && (
        <Frame dimension={dimension} polygonTop={polygonTop} frameData={frameData} shadowEnabled={shadowEnabled} />
      )}

      <Shutter
        cx={shutterPosX}
        lx={shutterLength}
        lz={lz}
        color={shutter.color}
        showLeft={shutter.showLeft}
        showRight={shutter.showRight}
        spacing={frameData.showFrame ? frameData.width / 2 : 0}
      />

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

      <group position={[-hx + 0.001, hy, hz - 0.01]} rotation={[0, topLeftRotation, 0]}>
        {renderSealPlane(topLeftLength, topLeftLength / 2)}
        {renderWireframeLine(topLeftLength, topLeftLength / 2)}
      </group>

      <group position={[hx - 0.001, hy, hz - 0.01]} rotation={[0, topRightRotation, 0]}>
        {renderSealPlane(topRightLength, -topRightLength / 2)}
        {renderWireframeLine(topRightLength, -topRightLength / 2)}
      </group>
    </>
  );
};

export default React.memo(PolygonalWindow);
