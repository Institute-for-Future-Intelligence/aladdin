/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { DoubleSide, MeshStandardMaterial } from 'three';
import { Box, Cylinder, Plane } from '@react-three/drei';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { HALF_PI } from 'src/constants';
import { FrameDataType, MullionDataType } from './window';

interface RectangleWindowProps {
  dimension: number[];
  position: number[];
  mullionData: MullionDataType;
  frameData: FrameDataType;
  glassMaterial: JSX.Element;
}
interface MullionProps {
  lx: number;
  lz: number;
  mullionData: MullionDataType;
  shadowEnabled: boolean;
}

interface FrameProps {
  lx: number;
  ly: number;
  lz: number;
  frameData: FrameDataType;
  shadowEnabled: boolean;
}

type ArgsType = [x: number, y: number, z: number];

const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: DoubleSide });

const Mullion = React.memo(({ lx, lz, mullionData, shadowEnabled }: MullionProps) => {
  const {
    width: mullionWidth,
    spacingX: mullionSpacingX,
    spacingY: mullionSpacingY,
    color: mullionColor,
  } = mullionData;

  const radialSegments = 3;
  const heightSegments = 1;

  const mullionRadius = mullionWidth / 2;

  const material = useMemo(() => <meshStandardMaterial color={mullionColor} />, [mullionColor]);

  const verticalMullions = useMemo(() => {
    const arr: number[] = [];
    const dividers = Math.round(lx / mullionSpacingX) - 1;
    if (dividers <= 0 || mullionWidth === 0) {
      return arr;
    }
    const step = lx / (dividers + 1);
    let x = step / 2;
    if (dividers % 2 !== 0) {
      arr.push(0);
      x = step;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, x += step) {
      arr.push(x, -x);
    }
    return arr;
  }, [lx, mullionWidth, mullionSpacingX]);

  const horizontalMullions = useMemo(() => {
    const arr: number[] = [];
    const dividers = Math.round(lz / mullionSpacingY) - 1;
    if (dividers <= 0 || mullionWidth === 0) {
      return arr;
    }
    const step = lz / (dividers + 1);
    let z = step / 2;
    if (dividers % 2 !== 0) {
      arr.push(0);
      z = step;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, z += step) {
      arr.push(z, -z);
    }
    return arr;
  }, [lz, mullionWidth, mullionSpacingY]);

  return (
    <group name={'Mullion Group'} position={[0, -0.001, 0]}>
      {verticalMullions.map((x, index) => (
        <Cylinder
          key={index}
          position={[x, 0.00025, 0]}
          args={[mullionRadius, mullionRadius, lz, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        >
          {material}
        </Cylinder>
      ))}
      {horizontalMullions.map((z, index) => (
        <Cylinder
          key={index}
          position={[0, 0.0005, z]}
          args={[mullionRadius, mullionRadius, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        >
          {material}
        </Cylinder>
      ))}
    </group>
  );
});

const Frame = React.memo(({ lx, ly, lz, frameData, shadowEnabled }: FrameProps) => {
  const { color, width } = frameData;
  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const halfWidth = width / 2;
  const depth = halfWidth;

  const sillLength = lx + width * 3;
  const sillThickness = width;
  const sillDepth = width;

  return (
    <group name={'Window Frame Group'} position={[0, 0, 0]}>
      {/* top */}
      <Box
        position={[0, 0, lz / 2]}
        args={[lx + width, depth, width]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* left */}
      <Box
        position={[-lx / 2, 0, 0]}
        args={[width, depth, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* right */}
      <Box position={[lx / 2, 0, 0]} args={[width, depth, lz]} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        {material}
      </Box>

      {/* bottom */}
      <Box
        position={[0, -sillDepth / 2, -lz / 2 - sillThickness / 2]}
        args={[sillLength, sillDepth, sillThickness]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>
    </group>
  );
});

const RectangleWindow = ({ dimension, position, mullionData, frameData, glassMaterial }: RectangleWindowProps) => {
  const [lx, ly, lz] = dimension;
  const [cx, cy, cz] = position;

  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const renderSealPlane = (args: [width: number, height: number], position: ArgsType, rotation?: ArgsType) => (
    <Plane
      name={'Window Seal Plane'}
      args={args}
      position={position}
      rotation={rotation}
      material={sealPlanesMaterial}
      receiveShadow={shadowEnabled}
      castShadow={shadowEnabled}
    />
  );

  return (
    <>
      <group position={[0, cy, 0]}>
        <Plane name={'Window Glass Plane'} args={[lx, lz]} rotation={[HALF_PI, 0, 0]}>
          {glassMaterial}
        </Plane>

        {mullionData.showMullion && <Mullion lx={lx} lz={lz} mullionData={mullionData} shadowEnabled={shadowEnabled} />}
      </group>

      {frameData.showFrame && <Frame lx={lx} ly={ly} lz={lz} frameData={frameData} shadowEnabled={shadowEnabled} />}

      {renderSealPlane([ly, lz], [-lx / 2, ly / 2, 0], [HALF_PI, HALF_PI, 0])}
      {renderSealPlane([ly, lz], [lx / 2, ly / 2, 0], [HALF_PI, -HALF_PI, 0])}
      {renderSealPlane([lx, ly], [0, ly / 2, lz / 2], [Math.PI, 0, 0])}
      {renderSealPlane([lx, ly], [0, ly / 2, -lz / 2])}
    </>
  );
};

export default React.memo(RectangleWindow);
