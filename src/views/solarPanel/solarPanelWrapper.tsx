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
 * sp position data on foundtion is absolute position to the center point on top surface, which means sp's cz = 0.
 *
 */
// todo: specific to foundation only for now
const SolarPanelWrapper = ({ parentId, foundationId, parentType, plx, ply, plz }: SolarPanelWrapperProps) => {
  const filterFn = useCallback(
    (e: ElementModel) => {
      if (e.type !== ObjectType.RefSolarPanel) return false;

      switch (parentType) {
        case ObjectType.Foundation:
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
    default:
      return null;
  }
};

export default React.memo(SolarPanelWrapper);
