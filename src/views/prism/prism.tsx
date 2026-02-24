/*
 * @Copyright 2026. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { PrismModel } from '../../models/PolygonCuboidModel';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import { Color, Shape, ExtrudeGeometry } from 'three';
import { ObjectType } from 'src/types';
import { Util } from 'src/Util';

export interface PrismProps {
  model: PrismModel;
}

// Spring green, summer deep green, autumn yellow-brown, winter pale brown
const SPRING_COLOR = new Color('#5aad2e');
const SUMMER_COLOR = new Color('#4a9700');
const AUTUMN_COLOR = new Color('#c8a832');
const WINTER_COLOR = new Color('#a0926b');

const getSeasonalGreenspaceColor = (dayOfYear: number): string => {
  // Spring: 60~150, Summer: 150~270, Autumn: 270~330, Winter: 330~60
  const c = new Color();
  if (dayOfYear >= 60 && dayOfYear < 150) {
    // Spring: lerp from winter to summer green
    const t = (dayOfYear - 60) / 90;
    c.lerpColors(SPRING_COLOR, SUMMER_COLOR, t);
  } else if (dayOfYear >= 150 && dayOfYear < 270) {
    // Summer: deep green
    c.copy(SUMMER_COLOR);
  } else if (dayOfYear >= 270 && dayOfYear < 330) {
    // Autumn: lerp from green to yellow
    const t = (dayOfYear - 270) / 60;
    c.lerpColors(SUMMER_COLOR, AUTUMN_COLOR, t);
  } else {
    // Winter: pale brown
    c.copy(WINTER_COLOR);
  }
  return '#' + c.getHexString();
};

const Prism = ({ model }: PrismProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);

  const { id, vertices, height, color = 'gray', transparency = 0 } = model;

  const dayOfYear = useMemo(() => {
    const doy = Util.dayOfYear(new Date(date));
    return latitude < 0 ? (doy + 182) % 365 : doy;
  }, [date, latitude]);

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

  const seasonalColor = useMemo(() => {
    if (model.type === ObjectType.Greenspace) {
      return getSeasonalGreenspaceColor(dayOfYear);
    }
    return null;
  }, [model.type, dayOfYear]);

  if (!geometry) {
    return null;
  }

  const _color = model.type === ObjectType.PrismBuilding ? 'white' : seasonalColor ?? color;
  return (
    <group name={`prism ${id}`}>
      <mesh geometry={geometry} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        <meshStandardMaterial color={_color} transparent={transparency > 0} opacity={1 - transparency} />
      </mesh>
    </group>
  );
};

export default React.memo(Prism);
