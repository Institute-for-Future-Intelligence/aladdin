/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { ObjectType } from 'src/types';
import RefSolarPanel from './refSolarPanel';
import { useStore } from 'src/stores/common';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { shallow } from 'zustand/shallow';

export const SOLAR_PANELS_WRAPPER_NAME = 'Solar_Panels_Wrapper_Group';

interface SolarPanelWrapperProps {
  parentId: string;
  lx: number;
  ly: number;
  lz: number;
}

/**
 * sp position data on foundtion is absolute position to the center point on top surface, which means sp's cz = 0.
 *
 */
// todo: specific to foundation only for now
const SolarPanelWrapper = ({ parentId, lx, ly, lz }: SolarPanelWrapperProps) => {
  const solarPanels = useStore(
    (state) =>
      state.elements.filter(
        (e) => (e.type === ObjectType.SolarPanel || e.type === ObjectType.RefSolarPanel) && e.parentId === parentId,
      ) as SolarPanelModel[],
    shallow,
  );

  return (
    <group name={SOLAR_PANELS_WRAPPER_NAME} position={[0, 0, lz / 2]}>
      {solarPanels.map((sp) => {
        if (sp.type === ObjectType.RefSolarPanel) {
          return <RefSolarPanel key={sp.id} {...sp} cx={sp.cx} cy={sp.cy} cz={0} />;
        } else {
          return null;
        }
      })}
    </group>
  );
};

export default React.memo(SolarPanelWrapper);
