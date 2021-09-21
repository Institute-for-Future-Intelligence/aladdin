/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mesh, RepeatWrapping, TextureLoader, Vector3 } from 'three';
import { Box, Sphere, useTexture } from '@react-three/drei';

import { ActionType, ResizeHandleType as RType } from 'src/types';
import { Util } from 'src/Util';
import { HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from '../constants';
import { useStore } from 'src/stores/common';
import { WallModel } from 'src/models/WallModel';
import WireFrame from 'src/components/wireFrame';
import SolarPanelBluePortraitImage from '../resources/WallExteriorImage.png';

const Wall = ({
  id,
  cx,
  cy,
  lx = 1,
  ly = 0.25,
  lz = 4,
  relativeAngle,
  rotation = [0, 0, 0],
  parent,
  color = 'gray',
  lineColor = 'black',
  lineWidth = 0.1,
  locked = false,
  selected = false,
}: WallModel) => {
  const buildingWallID = useStore((state) => state.buildingWallID);
  const shadowEnabled = useStore((state) => state.viewState.shadowEnabled);

  const [wallAbsPosition, setWallAbsPosition] = useState<Vector3>();
  const [wallAbsAngle, setWallAbsAngle] = useState<number>();

  const baseRef = useRef<Mesh>();

  const getElementById = useStore((state) => state.getElementById);
  const selectMe = useStore((state) => state.selectMe);

  const p = getElementById(parent.id);
  const highLight = lx === 0;

  useEffect(() => {
    if (p) {
      setWallAbsPosition(Util.wallAbsolutePosition(new Vector3(cx, cy), p).setZ(lz / 2 + p.lz));
      setWallAbsAngle(p.rotation[2] + relativeAngle);
    }
  }, [cx, cy, p?.cx, p?.cy, p?.cz, p?.rotation]);

  const texture = useMemo(() => {
    return new TextureLoader().load(SolarPanelBluePortraitImage);
  }, []);

  return (
    <>
      {wallAbsPosition && wallAbsAngle !== undefined && (
        <group name={`Wall Group ${id}`} position={wallAbsPosition} rotation={[0, 0, wallAbsAngle]}>
          {/* wall body */}
          {/* <group position={[0, ly / 2, 0]}> */}
          <Box
            name={'Wall'}
            ref={baseRef}
            args={[lx - 0.001, ly, lz]}
            receiveShadow={shadowEnabled}
            castShadow={shadowEnabled}
            onPointerDown={(e) => {
              if (buildingWallID) return;
              selectMe(id, e, ActionType.Select);
            }}
          >
            <meshStandardMaterial attachArray="material" color={'black'} />
            <meshStandardMaterial attachArray="material" color={'black'} />
            <meshStandardMaterial attachArray="material" color={'white'} />
            <meshStandardMaterial attachArray="material" map={texture} />
            <meshStandardMaterial attachArray="material" color={color} />
            <meshStandardMaterial attachArray="material" color={color} />
          </Box>
          {/* </group> */}

          {/* wireFrame */}
          {/* {!selected && <WireFrame args={[lx, ly, lz]} />} */}

          {/* handles */}
          {(selected || buildingWallID === id) && (
            <>
              <ResizeHandle args={[-lx / 2, 0, -lz / 2]} id={id} handleType={RType.LowerLeft} highLight={highLight} />
              <ResizeHandle args={[lx / 2, 0, -lz / 2]} id={id} handleType={RType.LowerRight} highLight={highLight} />
              <ResizeHandle args={[-lx / 2, 0, lz / 2]} id={id} handleType={RType.UpperLeft} highLight={highLight} />
              <ResizeHandle args={[lx / 2, 0, lz / 2]} id={id} handleType={RType.UpperRight} highLight={highLight} />
            </>
          )}
        </group>
      )}
    </>
  );
};

interface ResizeHandlesProps {
  args: [x: number, y: number, z: number];
  id: string;
  handleType: RType;
  highLight: boolean;
  handleSize?: number;
}
const ResizeHandle = ({ args, id, handleType, highLight, handleSize = 0.2 }: ResizeHandlesProps) => {
  const resizeHandleType = useStore((state) => state.resizeHandleType);
  const buildingWallID = useStore((state) => state.buildingWallID);

  const [hovered, setHovered] = useState(false);

  const handleRef = useRef<Mesh>(null);

  const [x, y, z] = args;
  const color = handleType === RType.UpperRight ? 'blue' : 'white';
  // highLight ||
  // hovered ||
  // handleType === resizeHandleType ||
  // (buildingWallID && (handleType === RType.LowerRight || handleType === RType.UpperRight))
  //   ? HIGHLIGHT_HANDLE_COLOR
  //   : RESIZE_HANDLE_COLOR;

  const setCommonStore = useStore((state) => state.set);
  const selectMe = useStore((state) => state.selectMe);

  return (
    <Sphere
      name={handleType}
      ref={handleRef}
      args={[handleSize]}
      position={[x, y, z]}
      onPointerOver={() => {
        setHovered(true);
      }}
      onPointerOut={() => {
        setHovered(false);
      }}
      onPointerDown={(e) => {
        selectMe(id, e, ActionType.Resize);
        if (handleRef) {
          setCommonStore((state) => {
            const anchor = handleRef.current!.localToWorld(new Vector3(-x * 2, 0, 0));
            state.resizeAnchor.copy(anchor);
          });
        }
      }}
      onPointerUp={() => {
        setCommonStore((state) => {
          state.enableOrbitController = true;
        });
      }}
    >
      <meshStandardMaterial color={color} />
    </Sphere>
  );
};

export default Wall;
