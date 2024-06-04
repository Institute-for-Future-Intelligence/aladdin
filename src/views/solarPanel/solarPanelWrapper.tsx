/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { ObjectType } from 'src/types';
import RefSolarPanel from './refSolarPanel';
import { useStore } from 'src/stores/common';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { shallow } from 'zustand/shallow';
import { HALF_PI } from 'src/constants';

export const SOLAR_PANELS_WRAPPER_NAME = 'Solar_Panels_Wrapper_Group';

interface SolarPanelWrapperProps {
  parentId: string;
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
const SolarPanelWrapper = ({ parentId, parentType, plx, ply, plz }: SolarPanelWrapperProps) => {
  const solarPanels = useStore(
    (state) =>
      state.elements.filter((e) => e.type === ObjectType.RefSolarPanel && e.parentId === parentId) as SolarPanelModel[],
    shallow,
  );

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

    default:
      return null;
  }
};

export default React.memo(SolarPanelWrapper);
