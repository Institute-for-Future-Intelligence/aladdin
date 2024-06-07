/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useCallback } from 'react';
import { ObjectType } from 'src/types';
import RefSolarPanel from './refSolarPanel';
import { useStore } from 'src/stores/common';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { shallow } from 'zustand/shallow';
import { HALF_PI } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';

export const SOLAR_PANELS_WRAPPER_NAME = 'Solar_Panels_Wrapper_Group';

interface SolarPanelWrapperProps {
  parentId: string;
  foundationId: string;
  parentType: ObjectType;
  plx: number;
  ply: number;
  plz: number;
}

/**
 * foundation: position is absolute to center of top surface, [cx, cy, 0].
 * wall: position is relative to center of wall outside surface, [cx, 0, cz], rotation is [0,0,0] when stick on wall.
 * roof: position is absolute to foundation top surface.
 * cuboid: position is absolute to center of cuboid.
 */
const SolarPanelWrapper = ({ parentId, foundationId, parentType, plx, ply, plz }: SolarPanelWrapperProps) => {
  const filterFn = useCallback(
    (e: ElementModel) => {
      if (e.type !== ObjectType.RefSolarPanel) return false;

      switch (parentType) {
        case ObjectType.Foundation:
        case ObjectType.Cuboid:
        case ObjectType.Wall: {
          return e.parentId === parentId;
        }
        case ObjectType.Roof: {
          return e.foundationId === foundationId;
        }
      }

      return false;
    },
    [parentId, foundationId, parentType],
  );

  const solarPanels = useStore((state) => state.elements.filter(filterFn) as SolarPanelModel[], shallow);

  switch (parentType) {
    case ObjectType.Foundation: {
      return (
        <group name={SOLAR_PANELS_WRAPPER_NAME} position={[0, 0, plz / 2]}>
          {solarPanels.map((sp) => (
            <RefSolarPanel key={sp.id} {...sp} />
          ))}
        </group>
      );
    }
    case ObjectType.Wall: {
      return (
        <group name={SOLAR_PANELS_WRAPPER_NAME} position={[0, 0, 0]}>
          {solarPanels.map((sp) => (
            <RefSolarPanel key={sp.id} {...sp} cx={sp.cx * plx} cz={sp.cz * plz} />
          ))}
        </group>
      );
    }
    case ObjectType.Roof: {
      return (
        <group name={SOLAR_PANELS_WRAPPER_NAME} position={[0, 0, 0]}>
          {solarPanels.map((sp) => (
            <RefSolarPanel key={sp.id} {...sp} />
          ))}
        </group>
      );
    }
    case ObjectType.Cuboid: {
      return (
        <group name={SOLAR_PANELS_WRAPPER_NAME} position={[0, 0, 0]}>
          {solarPanels.map((sp) => (
            <RefSolarPanel key={sp.id} {...sp} />
          ))}
        </group>
      );
    }
    default:
      return null;
  }
};

export default React.memo(SolarPanelWrapper);
