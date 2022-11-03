/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef } from 'react';
import { DoubleSide, FrontSide, Mesh, MeshStandardMaterial, Shape, Vector3 } from 'three';
import { Box, Cylinder, Extrude, Plane } from '@react-three/drei';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { FrameDataType, MullionDataType, WireframeDataType } from './window';
import { ResizeHandleType } from 'src/types';
import { useStoreRef } from 'src/stores/commonRef';

interface ArchWindowProps {
  dimension: number[];
  position: number[];
  mullionData: MullionDataType;
  frameData: FrameDataType;
  wireframeData: WireframeDataType;
  glassMaterial: JSX.Element;
}
interface MullionProps {
  dimension: number[];
  mullionData: MullionDataType;
  shadowEnabled: boolean;
}

interface FrameProps {
  dimension: number[];
  frameData: FrameDataType;
  shadowEnabled: boolean;
}

interface WireframeProps {
  cy: number;
  dimension: number[];
  wireframeData: WireframeDataType;
}

type ArgsType = [x: number, y: number, z: number];

const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: FrontSide });

const Mullion = React.memo(({ dimension, mullionData, shadowEnabled }: MullionProps) => {
  const [lx, ly, lz] = dimension;

  const {
    width: mullionWidth,
    spacingX: mullionSpacingX,
    spacingY: mullionSpacingY,
    color: mullionColor,
  } = mullionData;

  const radialSegments = 3;
  const heightSegments = 1;

  const mullionRadius = mullionWidth / 2;

  const archHeight = Math.min(lx, lz) / 2;

  const material = useMemo(() => <meshStandardMaterial color={mullionColor} />, [mullionColor]);

  const drawArchMullionShape = (s: Shape, x: number, z: number, width: number) => {
    const hw = (width / 2) * 0.75;
    s.moveTo(x - hw, 0);
    s.lineTo(x + hw, 0);
    s.quadraticCurveTo(x + hw, z + hw, 0, z + hw);
    s.quadraticCurveTo(-x - hw, z + hw, -x - hw, 0);
    s.lineTo(-x + hw, 0);
    s.quadraticCurveTo(-x + hw, z - hw, 0, z - hw);
    s.quadraticCurveTo(x - hw, z - hw, x - hw, 0);
  };

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
    const dividers = Math.round((lz - archHeight) / mullionSpacingY) - 1;
    if (dividers <= 0 || mullionWidth === 0) {
      return [archHeight / 2];
    }
    const step = (lz - archHeight) / (dividers + 1);
    let z = step / 2;
    if (dividers % 2 !== 0) {
      arr.push(0);
      z = step;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, z += step) {
      arr.push(z, -z);
    }
    arr.push(z);
    return arr;
  }, [lx, lz, mullionWidth, mullionSpacingY]);

  const archMullions = useMemo(() => {
    const arr: Shape[] = [];
    let dividers = Math.floor((Math.round(lx / mullionSpacingX) - 1) / 2);
    let step = mullionSpacingX;
    if ((Math.round(lx / mullionSpacingX) - 1) % 2 === 0) {
      step -= mullionSpacingX / 2;
    }
    for (let i = 0; i < dividers; i++) {
      const s = new Shape();
      drawArchMullionShape(s, step, (step / (lx / 2)) * archHeight, mullionWidth);
      arr.push(s);
      step += mullionSpacingX;
    }
    return arr;
  }, [lx, lz, mullionWidth, mullionSpacingX]);

  return (
    <group name={'Window Mullion Group'} position={[0, -0.001, 0]}>
      {verticalMullions.map((x, index) => (
        <Cylinder
          key={index}
          position={[x, 0, -archHeight / 2]}
          args={[mullionRadius, mullionRadius, lz - archHeight, radialSegments, heightSegments]}
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
          position={[0, 0, z - archHeight / 2]}
          args={[mullionRadius, mullionRadius, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        >
          {material}
        </Cylinder>
      ))}
      {archMullions.map((shape, index) => (
        <Extrude
          key={index}
          position={[0, mullionRadius / 2, lz / 2 - archHeight]}
          rotation={[HALF_PI, 0, 0]}
          args={[shape, { steps: 1, depth: mullionRadius, bevelEnabled: false }]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
        >
          {material}
        </Extrude>
      ))}
    </group>
  );
});

const Frame = React.memo(({ dimension, frameData, shadowEnabled }: FrameProps) => {
  const [lx, ly, lz] = dimension;
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
        position={[0, 0, -lz / 2 - sillThickness / 2]}
        args={[sillLength, sillDepth, sillThickness]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>
    </group>
  );
});

const Wireframe = React.memo(({ cy, dimension, wireframeData }: WireframeProps) => {
  const [lx, ly, lz] = dimension;
  const { lineWidth, lineColor, selected, locked } = wireframeData;

  const hx = lx / 2;
  const hz = lz / 2;

  const radialSegments = 3;
  const heightSegments = 1;

  const material = useMemo(() => new MeshStandardMaterial({ color: lineColor }), [lineColor]);
  const highLightMaterial = useMemo(() => new MeshStandardMaterial({ color: LOCKED_ELEMENT_SELECTION_COLOR }), []);

  const renderLines = (width: number, mat: MeshStandardMaterial) => {
    const wireframeRadius = width / 2;
    return (
      <>
        <Cylinder
          args={[width, width, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          position={[0, 0, hz - wireframeRadius]}
          material={mat}
        />
        <Cylinder
          args={[width, width, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          position={[0, 0, -hz + wireframeRadius]}
          material={mat}
        />
        <Cylinder
          args={[width, width, lz, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          position={[hx - wireframeRadius, 0, 0]}
          material={mat}
        />
        <Cylinder
          args={[width, width, lz, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          position={[-hx + wireframeRadius, 0, 0]}
          material={mat}
        />
      </>
    );
  };

  return (
    <group name={'Window Wireframe Group'}>
      <group position={[0, cy, 0]}>{renderLines(lineWidth / 20, material)}</group>
      {locked && selected && renderLines(lineWidth / 5, highLightMaterial)}
    </group>
  );
});

const ArchWindow = ({ dimension, position, mullionData, frameData, wireframeData, glassMaterial }: ArchWindowProps) => {
  const [lx, ly, lz, archHeight] = dimension;
  const [cx, cy, cz] = position;

  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const shape = useMemo(() => {
    const s = new Shape();
    const hx = lx / 2;
    const hz = lz / 2;
    const ah = Math.min(archHeight, lz, hx);
    s.moveTo(-hx, -hz);
    s.lineTo(hx, -hz);
    s.lineTo(hx, hz - ah);
    if (ah > 0) {
      const r = ah / 2 + lx ** 2 / (8 * ah);
      const [cX, cY] = [0, hz - r];
      const startAngle = Math.acos(hx / r);
      const endAngle = Math.PI - startAngle;
      s.absarc(cX, cY, r, startAngle, endAngle, false);
    } else {
      s.lineTo(-hx, hz);
    }
    s.lineTo(-hx, -hz);
    return s;
  }, [lx, lz]);

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
      <group name={'Arch Window Plane Group'} position={[0, cy, 0]}>
        <mesh name={'Window Glass mesh'} rotation={[HALF_PI, 0, 0]}>
          <shapeBufferGeometry args={[shape]} />
          {glassMaterial}
        </mesh>

        {/* {mullionData.showMullion && (
          <Mullion dimension={dimension} mullionData={mullionData} shadowEnabled={shadowEnabled} />
        )} */}
      </group>

      {/* {frameData.showFrame && <Frame dimension={dimension} frameData={frameData} shadowEnabled={shadowEnabled} />} */}

      {/* <Wireframe cy={cy} dimension={dimension} wireframeData={wireframeData} /> */}

      {renderSealPlane([ly, lz], [-lx / 2, ly / 2, 0], [HALF_PI, HALF_PI, 0])}
      {renderSealPlane([ly, lz], [lx / 2, ly / 2, 0], [HALF_PI, -HALF_PI, 0])}
      {renderSealPlane([lx, ly], [0, ly / 2, lz / 2], [Math.PI, 0, 0])}
      {renderSealPlane([lx, ly], [0, ly / 2, -lz / 2])}
    </>
  );
};

export default React.memo(ArchWindow);
