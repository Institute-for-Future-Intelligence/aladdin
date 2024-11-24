/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useCallback } from 'react';
import { ObjectType } from 'src/types';
import SolarPanel from './solarPanel';
import { useStore } from 'src/stores/common';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { shallow } from 'zustand/shallow';
import { ElementModel } from 'src/models/ElementModel';

export const SOLAR_PANELS_WRAPPER_NAME = 'Solar_Panels_Wrapper_Group';

interface SolarPanelWrapperProps {
  parentId: string;
  foundationId: string;
  wrapperType: ObjectType;
  plx: number;
  ply: number;
  plz: number;
}

/**
 * foundation: position is absolute to center of foundation, rotation is relative to foundation.
 * wall: position is relative[-0.5, 0.5] to center of wall outside surface, [cx, 0, cz], rotation is [HALF_PI,0,0] when stick on wall.
 * roof: position is absolute to foundation top surface, rotation is relative to foundation.
 * cuboid: position is absolute to center of cuboid, rotation is relative to parent cuboid.
 */
const SolarPanelWrapper = React.memo(
  ({ parentId, foundationId, wrapperType, plx, ply, plz }: SolarPanelWrapperProps) => {
    const filterFn = useCallback(
      (e: ElementModel) => {
        if (e.type !== ObjectType.SolarPanel) return false;

        const sp = e as SolarPanelModel;

        switch (wrapperType) {
          case ObjectType.Foundation: {
            return (
              sp.foundationId === foundationId &&
              (sp.parentType === ObjectType.Foundation || sp.parentType === ObjectType.Roof)
            );
          }
          case ObjectType.Cuboid: {
            return sp.foundationId === foundationId && sp.parentType === ObjectType.Cuboid;
          }
          case ObjectType.Wall: {
            return e.parentId === parentId && sp.parentType === ObjectType.Wall;
          }
        }

        return false;
      },
      [parentId, foundationId, wrapperType],
    );

    const solarPanels = useStore((state) => state.elements.filter(filterFn) as SolarPanelModel[], shallow);

    switch (wrapperType) {
      case ObjectType.Foundation:
      case ObjectType.Cuboid: {
        return (
          <group name={SOLAR_PANELS_WRAPPER_NAME}>
            {solarPanels.map((sp) => (
              <SolarPanel key={sp.id} {...sp} />
            ))}
          </group>
        );
      }
      case ObjectType.Wall: {
        return (
          <group name={SOLAR_PANELS_WRAPPER_NAME}>
            {solarPanels.map((sp) => (
              <SolarPanel key={sp.id} {...sp} cx={sp.cx * plx} cz={sp.cz * plz} />
            ))}
          </group>
        );
      }
      default:
        return null;
    }
  },
);

export default SolarPanelWrapper;
