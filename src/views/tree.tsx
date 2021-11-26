/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import CottonwoodImage from '../resources/cottonwood.png';
import CottonwoodShedImage from '../resources/cottonwood_shed.png';
import DogwoodImage from '../resources/dogwood.png';
import DogwoodShedImage from '../resources/dogwood_shed.png';
import ElmImage from '../resources/elm.png';
import ElmShedImage from '../resources/elm_shed.png';
import LindenImage from '../resources/linden.png';
import LindenShedImage from '../resources/linden_shed.png';
import MapleImage from '../resources/maple.png';
import MapleShedImage from '../resources/maple_shed.png';
import OakImage from '../resources/oak.png';
import OakShedImage from '../resources/oak_shed.png';
import PineImage from '../resources/pine.png';

import React, { useMemo, useRef, useState } from 'react';
import { DoubleSide, Euler, Mesh, MeshDepthMaterial, RGBADepthPacking, TextureLoader, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { useThree } from '@react-three/fiber';
import { Billboard, Cone, Plane, Sphere } from '@react-three/drei';
import { MOVE_HANDLE_RADIUS, TWO_PI } from '../constants';
import { TreeModel } from '../models/TreeModel';
import { ObjectType, TreeType } from '../types';

const Tree = ({
  id,
  cx,
  cy,
  cz,
  lx,
  lz,
  name = TreeType.Pine,
  selected = false,
  locked = false,
  showModel = false,
  evergreen = false,
  ...props
}: TreeModel) => {
  const setCommonStore = useStore(Selector.set);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const date = useStore(Selector.world.date);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const selectMe = useStore(Selector.selectMe);
  const sunlightDirection = useStore(Selector.sunlightDirection);

  const now = new Date(date);
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<Mesh>(null!);
  const {
    gl: { domElement },
    camera,
  } = useThree();
  const [updateFlag, setUpdateFlag] = useState(false);

  const month = now.getMonth() + 1;
  const noLeaves = !evergreen && (month < 4 || month > 10); // TODO: This needs to depend on location

  useStore(Selector.cameraDirection);
  const sunlightX = sunlightDirection.x;
  const sunlightZ = sunlightDirection.y;
  const cameraX = camera.position.x;
  const cameraZ = camera.position.y;

  const texture = useMemo(() => {
    let textureImg;
    switch (name) {
      case TreeType.Cottonwood:
        textureImg = noLeaves ? CottonwoodShedImage : CottonwoodImage;
        break;
      case TreeType.Dogwood:
        textureImg = noLeaves ? DogwoodShedImage : DogwoodImage;
        break;
      case TreeType.Elm:
        textureImg = noLeaves ? ElmShedImage : ElmImage;
        break;
      case TreeType.Linden:
        textureImg = noLeaves ? LindenShedImage : LindenImage;
        break;
      case TreeType.Maple:
        textureImg = noLeaves ? MapleShedImage : MapleImage;
        break;
      case TreeType.Oak:
        textureImg = noLeaves ? OakShedImage : OakImage;
        break;
      default:
        textureImg = PineImage;
    }
    return new TextureLoader().load(textureImg, (texture) => {
      setUpdateFlag(!updateFlag);
    });
  }, [name, noLeaves]);

  const customDepthMaterial = new MeshDepthMaterial({
    depthPacking: RGBADepthPacking,
    map: texture,
    alphaTest: 0.1,
  });

  const theta = useMemo(() => {
    switch (name) {
      case TreeType.Elm:
        return 0.78 * Math.PI;
      case TreeType.Dogwood:
        return 0.6 * Math.PI;
      case TreeType.Maple:
        return 0.65 * Math.PI;
      case TreeType.Oak:
        return 0.75 * Math.PI;
      default:
        return Math.PI * 0.7;
    }
  }, [name]);

  const solidTreeRotation = useMemo(() => {
    return new Euler(Math.PI / 2, -Math.atan2(cameraX - cx, cameraZ - cy), 0);
  }, [cameraX, cameraZ, cx, cy]);

  const shadowTreeRotation = useMemo(() => {
    return new Euler(Math.PI / 2, -Math.atan2(sunlightX, sunlightZ), 0);
  }, [sunlightX, sunlightZ]);

  // IMPORTANT: model mesh must use double side in order to intercept sunlight
  return (
    <group name={'Tree Group ' + id} position={[cx, cy, (cz ?? 0) + lz / 2]}>
      <Billboard uuid={id} name={name} userData={{ aabb: true }} follow={false} rotation={solidTreeRotation}>
        <Plane args={[lx, lz]}>
          <meshBasicMaterial map={texture} side={DoubleSide} alphaTest={0.5} />
        </Plane>
      </Billboard>

      {/* cast shadow */}
      <Billboard name={name + ' Shadow Billboard'} follow={false} rotation={shadowTreeRotation}>
        <Plane castShadow={shadowEnabled} args={[lx, lz]} customDepthMaterial={customDepthMaterial}>
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0} depthTest={false} />
        </Plane>
      </Billboard>

      {/* simulation model */}
      {name !== TreeType.Pine ? (
        <Sphere
          visible={(showModel && !noLeaves) || orthographic}
          userData={{ simulation: !noLeaves }}
          name={name + ' Model'}
          args={[lx / 2, 8, 8, 0, TWO_PI, 0, theta]}
          scale={[1, lz / lx, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial attach="material" side={DoubleSide} transparent={true} opacity={0.75} />
        </Sphere>
      ) : (
        <Cone
          visible={showModel || orthographic}
          name={name + ' Model'}
          userData={{ simulation: true }}
          position={[0, 0, lz * 0.1]}
          args={[lx / 2, lz, 8, 8, true]}
          scale={[1, 1, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial attach="material" side={DoubleSide} transparent={true} opacity={0.75} />
        </Cone>
      )}

      {/* billboard for interactions (don't use a plane as it may become unselected at some angle) */}
      <Billboard ref={meshRef} name={'Interaction Billboard'} visible={false} position={[0, 0, -lz / 2 + 0.5]}>
        <Plane
          args={[lx / 2, 1]}
          onContextMenu={(e) => {
            selectMe(id, e);
            setCommonStore((state) => {
              state.contextMenuObjectType = ObjectType.Tree;
            });
          }}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            selectMe(id, e);
          }}
          onPointerOver={(e) => {
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === meshRef.current;
              if (intersected) {
                setHovered(true);
              }
            }
          }}
          onPointerOut={(e) => {
            setHovered(false);
          }}
        />
      </Billboard>

      {/* draw handle */}
      {selected && !locked && (
        <Sphere
          position={new Vector3(0, 0, -lz / 2)}
          args={[MOVE_HANDLE_RADIUS * 4, 6, 6]}
          name={'Handle'}
          renderOrder={2}
          onPointerDown={(e) => {
            selectMe(id, e);
          }}
          onPointerOver={(e) => {
            domElement.style.cursor = 'move';
          }}
          onPointerOut={(e) => {
            domElement.style.cursor = 'default';
          }}
        >
          <meshStandardMaterial attach="material" color={'orange'} />
        </Sphere>
      )}
      {hovered && !selected && (
        <textSprite
          name={'Label'}
          text={name}
          fontSize={20}
          fontFace={'Times Roman'}
          textHeight={0.2}
          position={[0, 0, lz / 2 + 0.4]}
        />
      )}
    </group>
  );
};

export default React.memo(Tree);
