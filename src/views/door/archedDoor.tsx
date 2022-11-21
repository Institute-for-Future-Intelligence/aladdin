/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { HALF_PI } from 'src/constants';
import { useStore } from 'src/stores/common';
import { Material, Shape } from 'three';
import { ArchedWireframe } from '../window/archedWindow';
import { WireframeDataType } from '../window/window';
import * as Selector from 'src/stores/selector';

interface ArchedDoorProps {
  dimension: number[];
  color: string;
  selected: boolean;
  locked: boolean;
  material: Material;
  filled: boolean;
}

const ArchedDoor = React.memo(({ dimension, color, selected, locked, material, filled }: ArchedDoorProps) => {
  const [lx, ly, lz, archHeight] = dimension;
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const doorShape = useMemo(() => {
    const s = new Shape();
    const hx = lx / 2;
    const hz = lz / 2;
    const ah = Math.min(archHeight, lz, hx);
    s.moveTo(hx, -hz);
    s.lineTo(hx, hz - ah);
    if (ah > 0.1) {
      const r = ah / 2 + lx ** 2 / (8 * ah);
      const [cX, cY] = [0, hz - r];
      const startAngle = Math.acos(hx / r);
      const endAngle = Math.PI - startAngle;
      s.absarc(cX, cY, r, startAngle, endAngle, false);
    } else {
      s.lineTo(-hx, hz);
    }
    s.lineTo(-hx, -hz);

    // save for pointer selection
    // const ihx = lx * 0.4;
    // const ihz = lz * 0.4;
    // const iah = Math.min(archHeight * 0.8, lz * 0.8, hx * 0.8);
    // s.lineTo(-ihx, -hz);
    // if (iah > 0.1) {
    //   s.lineTo(-ihx, hz - iah);
    //   const r = iah / 2 + (lx * 0.8) ** 2 / (8 * iah);
    //   const [cX, cY] = [0, ihz - r];
    //   const startAngle = Math.acos(ihx / r);
    //   const endAngle = Math.PI - startAngle;
    //   s.absarc(cX, cY, r, endAngle, startAngle, true);
    // } else {
    //   s.lineTo(-ihx, ihz);
    //   s.lineTo(ihx, ihz);
    // }
    // s.lineTo(ihx, -hz);

    s.closePath();
    return s;
  }, [lx, lz, archHeight]);

  const wireframeData = useMemo(() => {
    const lineWidth = locked && selected ? 0.2 : 0.1;
    return { lineColor: 'black', lineWidth, opacity: 1, selected, locked } as WireframeDataType;
  }, [selected, locked]);

  return (
    <group name={'Arched door group'}>
      <mesh
        name={'Door plane mesh'}
        rotation={[HALF_PI, 0, 0]}
        material={material}
        castShadow={shadowEnabled && filled}
        receiveShadow={shadowEnabled && filled}
      >
        <shapeBufferGeometry args={[doorShape]} />
      </mesh>

      {filled && (
        <mesh
          name={'Door plane mesh inside'}
          position={[0, 0.1, 0]}
          rotation={[-HALF_PI, 0, Math.PI]}
          material={material}
          castShadow={shadowEnabled && filled}
          receiveShadow={shadowEnabled && filled}
        >
          <shapeBufferGeometry args={[doorShape]} />
        </mesh>
      )}

      <ArchedWireframe cy={0} dimension={dimension} wireframeData={wireframeData} />
      <ArchedWireframe cy={ly} dimension={dimension} wireframeData={wireframeData} />
    </group>
  );
});

export default ArchedDoor;
