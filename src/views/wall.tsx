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
  ly = 1,
  lz = 4,
  relativeAngle,
  rotation = [0, 0, 0],
  leftOffset = 0,
  rightOffset = 0,
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
    return new TextureLoader().load(SolarPanelBluePortraitImage, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      texture.repeat.set(lx / 4, 1);
    });
  }, []);
  const texture2 = useMemo(() => {
    return new TextureLoader().load(SolarPanelBluePortraitImage, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      texture.repeat.set(ly / 4, 1);
      texture.rotation = Math.PI / 2;
    });
  }, []);
  const texture3 = useMemo(() => {
    return new TextureLoader().load(SolarPanelBluePortraitImage, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0.077, 0);
      texture.repeat.set(lx / 4, ly / 4);
    });
  }, []);

  useEffect(() => {
    texture.repeat.set(lx / 4, 1);
    texture3.repeat.set(lx / 4, ly / 4);
  }, [lx]);
  useEffect(() => {
    texture2.repeat.set(ly / 4, 1);
  }, [ly]);

  return (
    <>
      {wallAbsPosition && wallAbsAngle !== undefined && (
        <group name={`Wall Group ${id}`} position={wallAbsPosition} rotation={[0, 0, wallAbsAngle]}>
          {/* wall body */}
          <group position={[leftOffset / 2 - rightOffset / 2, ly / 2, 0]}>
            <Box
              name={'Wall'}
              ref={baseRef}
              args={[lx - leftOffset - rightOffset - 0.001, ly, lz]}
              receiveShadow={shadowEnabled}
              castShadow={shadowEnabled}
              onPointerDown={(e) => {
                if (buildingWallID) return;
                selectMe(id, e, ActionType.Select);
              }}
            >
              <meshStandardMaterial attachArray="material" color={'white'} />
              <meshStandardMaterial attachArray="material" color={'white'} />
              <meshStandardMaterial attachArray="material" color={'white'} />
              <meshStandardMaterial attachArray="material" map={texture} />
              <meshStandardMaterial attachArray="material" color={'white'} />
              <meshStandardMaterial attachArray="material" color={'white'} />
            </Box>
          </group>

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
const ResizeHandle = ({ args, id, handleType, highLight, handleSize = 0.4 }: ResizeHandlesProps) => {
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
