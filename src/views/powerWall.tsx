/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Box, Sphere } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import { useSelected } from 'src/hooks';
import { ElementModel } from 'src/models/ElementModel';
import { PowerWallModel } from 'src/models/PowerWallModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { shallow } from 'zustand/shallow';
import * as Selector from '../stores/selector';
import { SolarPanelUtil } from './solarPanel/SolarPanelUtil';

interface WrapperProps {
  parentId: string;
  foundationId: string;
  parentLx: number;
  parentLz: number;
}

interface PowerWallProps {}

const PowerWallWrapper = React.memo(({ parentId, foundationId, parentLx, parentLz }: WrapperProps) => {
  const filter = (e: ElementModel) => {
    if (e.type !== ObjectType.PowerWall) return false;
    return e.parentId === parentId;
  };

  const powerWalls = useStore((state) => state.elements.filter(filter) as PowerWallModel[], shallow);

  return powerWalls.map((pw) => (
    <PowerWall key={pw.id} {...(pw as PowerWallModel)} cx={pw.cx * parentLx} cz={pw.cz * parentLz} />
  ));
});

const PowerWall = (powerWall: PowerWallModel) => {
  const { id, cx, cz, lx, ly, lz, color } = powerWall;
  const hy = ly / 2;

  const setCommonStore = useStore(Selector.set);

  const selected = useSelected(id);

  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    event.stopPropagation();
    SolarPanelUtil.setSelected(id, true);
    if (event.button === 2) {
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.SolarPanel;
      });
    }
  };

  return (
    <group name={`Power_Wall_Group ${id}`} position={[cx, 0, cz]} onPointerDown={onGroupPointerDown}>
      <Box args={[lx, ly, lz]} position={[0, -hy, 0]}>
        <meshStandardMaterial color={color} />
      </Box>
      {selected && <Sphere args={[0.2]} position={[0, -ly, 0]} />}
    </group>
  );
};

export default PowerWallWrapper;
