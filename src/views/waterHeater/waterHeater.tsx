/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Box, Cylinder, Sphere } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import { HALF_PI } from 'src/constants';
import { useSelected } from 'src/hooks';
import { WaterHeaterModel } from 'src/models/WaterHeaterModel';
import { SolarPanelUtil } from '../solarPanel/SolarPanelUtil';
import { useStore } from 'src/stores/common';
import * as Selector from '../../stores/selector';
import { ObjectType } from 'src/types';

const WaterHeater = React.memo((waterHeater: WaterHeaterModel) => {
  const { id, cx, cy, cz, rotation } = waterHeater;
  const selected = useSelected(id);

  const setCommonStore = useStore(Selector.set);

  const waterTankRadius = 0.3;
  const waterTankLength = 1.75;
  const mountHeight = 0.5; // surface to tank bottom

  const panelWidth = 1.5;
  const panelLength = 2;
  const panelThickness = 0.05;

  const angle = Math.asin((mountHeight + waterTankRadius) / panelLength);

  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    event.stopPropagation();
    SolarPanelUtil.setSelected(id, true);
    if (event.button === 2) {
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.WaterHeater;
      });
    }
  };

  return (
    <group
      position={[cx, cy, cz]}
      rotation={[rotation[0], rotation[1], rotation[2], 'ZXY']}
      onPointerDown={onGroupPointerDown}
    >
      {/* base */}
      {/* <group position={[0, 0, 0.005]}>
        <Box args={[2, 2, 0.01]} />
      </group> */}

      {/* water tank */}
      <Cylinder
        args={[waterTankRadius, waterTankRadius, waterTankLength]}
        position={[0, panelLength / 2, waterTankRadius + mountHeight]}
        rotation={[0, 0, HALF_PI]}
      >
        <meshStandardMaterial color={'grey'} />
      </Cylinder>

      <group position={[0, panelLength / 2, waterTankRadius + mountHeight]} rotation={[angle, 0, 0]}>
        <group position={[0, -panelLength / 2, panelThickness / 2]}>
          {/* panel */}
          <Box args={[panelWidth, panelLength, panelThickness]}>
            <meshStandardMaterial color={'grey'} />
          </Box>

          {/* move handle */}
          {selected && <Sphere args={[0.1]} />}
        </group>
      </group>

      {/* mount */}
      <group position={[0, panelLength / 2, mountHeight / 2]} rotation={[HALF_PI, 0, 0]}>
        <Cylinder args={[0.05, 0.05, mountHeight + 0.1]} position={[-0.5, 0, 0]}>
          <meshStandardMaterial color={'grey'} />
        </Cylinder>
        <Cylinder args={[0.05, 0.05, mountHeight + 0.1]} position={[0.5, 0, 0]}>
          <meshStandardMaterial color={'grey'} />
        </Cylinder>
      </group>
    </group>
  );
});

export default WaterHeater;
