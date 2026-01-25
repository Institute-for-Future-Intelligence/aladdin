/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { PolygonCuboidModel } from '../../models/PolygonCuboidModel';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import { Shape, ExtrudeGeometry } from 'three';

export interface PolygonCuboidProps {
  model: PolygonCuboidModel;
}

const PolygonCuboid = ({ model }: PolygonCuboidProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const { id, vertices, height, color = 'gray', transparency = 0 } = model;

  // Create extruded geometry from polygon vertices
  const geometry = useMemo(() => {
    if (!vertices || vertices.length < 3) {
      return null;
    }

    // Create a shape from the vertices
    const shape = new Shape();
    shape.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      shape.lineTo(vertices[i].x, vertices[i].y);
    }
    shape.closePath();

    // Extrude settings
    const extrudeSettings = {
      depth: height ?? 1,
      bevelEnabled: false,
    };

    return new ExtrudeGeometry(shape, extrudeSettings);
  }, [vertices, height]);

  if (!geometry) {
    return null;
  }

  return (
    <group name={`Polygon Cuboid ${id}`}>
      <mesh
        geometry={geometry}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
        // rotation={[-Math.PI / 2, 0, 0]} // Rotate to align with XY plane
      >
        <meshStandardMaterial color={color} transparent={transparency > 0} opacity={1 - transparency} />
      </mesh>
    </group>
  );
};

export default React.memo(PolygonCuboid);
