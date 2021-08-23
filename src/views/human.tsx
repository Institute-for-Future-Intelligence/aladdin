/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import JackImage from '../resources/jack.png';
import JadeImage from '../resources/jade.png';
import JaneImage from '../resources/jane.png';
import JayeImage from '../resources/jaye.png';
import JeanImage from '../resources/jean.png';
import JediImage from '../resources/jedi.png';
import JeffImage from '../resources/jeff.png';
import JenaImage from '../resources/jena.png';
import JeniImage from '../resources/jeni.png';
import JessImage from '../resources/jess.png';
import JettImage from '../resources/jett.png';
import JillImage from '../resources/jill.png';
import JoanImage from '../resources/joan.png';
import JoelImage from '../resources/joel.png';
import JohnImage from '../resources/john.png';
import JoseImage from '../resources/jose.png';
import JuddImage from '../resources/judd.png';
import JudyImage from '../resources/judy.png';
import JuneImage from '../resources/june.png';
import JuroImage from '../resources/juro.png';
import { DoubleSide, Euler, Mesh, TextureLoader, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { HumanModel } from '../models/HumanModel';
import { Billboard, Sphere } from '@react-three/drei';
import { MOVE_HANDLE_RADIUS } from '../constants';
import { HumanName } from '../types';

const Human = ({
  id,
  cx,
  cy,
  name = HumanName.Jack,
  selected = false,
  locked = false,
  ...props
}: HumanModel) => {
  const selectMe = useStore((state) => state.selectMe);
  const [hovered, setHovered] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);
  const meshRef = useRef<Mesh>(null!);
  const {
    gl: { domElement },
    camera,
  } = useThree();

  // have to add this to listen to world(camera) change, this is better than memo's shallow campare
  useStore((state) => state.cameraDirection);
  const cameraX = camera.position.x;
  const cameraY = camera.position.y;

  const texture = useMemo(() => {
    let textureImg;
    switch (name) {
      case HumanName.Jade:
        textureImg = JadeImage;
        break;
      case HumanName.Jane:
        textureImg = JaneImage;
        break;
      case HumanName.Jaye:
        textureImg = JayeImage;
        break;
      case HumanName.Jean:
        textureImg = JeanImage;
        break;
      case HumanName.Jedi:
        textureImg = JediImage;
        break;
      case HumanName.Jeff:
        textureImg = JeffImage;
        break;
      case HumanName.Jena:
        textureImg = JenaImage;
        break;
      case HumanName.Jeni:
        textureImg = JeniImage;
        break;
      case HumanName.Jess:
        textureImg = JessImage;
        break;
      case HumanName.Jett:
        textureImg = JettImage;
        break;
      case HumanName.Jill:
        textureImg = JillImage;
        break;
      case HumanName.Joan:
        textureImg = JoanImage;
        break;
      case HumanName.Joel:
        textureImg = JoelImage;
        break;
      case HumanName.John:
        textureImg = JohnImage;
        break;
      case HumanName.Jose:
        textureImg = JoseImage;
        break;
      case HumanName.Judd:
        textureImg = JuddImage;
        break;
      case HumanName.Judy:
        textureImg = JudyImage;
        break;
      case HumanName.June:
        textureImg = JuneImage;
        break;
      case HumanName.Juro:
        textureImg = JuroImage;
        break;
      default:
        textureImg = JackImage;
    }
    return new TextureLoader().load(textureImg, (texture) => {
      setUpdateFlag(!updateFlag);
    });
  }, [name]);

  const width = useMemo(() => {
    switch (name) {
      case HumanName.Jane:
        return 0.45;
      case HumanName.Jena:
        return 0.4;
      case HumanName.Joel:
        return 1;
      case HumanName.John:
        return 0.8;
      case HumanName.Jose:
        return 2;
      case HumanName.June:
        return 0.4;
      default:
        return 0.6;
    }
  }, [name]);

  const height = useMemo(() => {
    switch (name) {
      case HumanName.Jade:
        return 1.6;
      case HumanName.Jane:
        return 1.55;
      case HumanName.Jaye:
        return 1.65;
      case HumanName.Jean:
        return 1.8;
      case HumanName.Jedi:
        return 1.75;
      case HumanName.Jeff:
        return 1.65;
      case HumanName.Jena:
        return 1.5;
      case HumanName.Jeni:
        return 1.7;
      case HumanName.Jess:
        return 1.4;
      case HumanName.Jett:
        return 1.85;
      case HumanName.Jill:
        return 1.64;
      case HumanName.Joan:
        return 1.68;
      case HumanName.Joel:
        return 1.75;
      case HumanName.John:
        return 1.85;
      case HumanName.Jose:
        return 1.6;
      case HumanName.Judd:
        return 1.68;
      case HumanName.Judy:
        return 1.55;
      case HumanName.June:
        return 1.85;
      case HumanName.Juro:
        return 1.9;
      default:
        return 1.8;
    }
  }, [name]);

  const rotation = useMemo(() => {
    return new Euler(Math.PI / 2, -Math.atan2(cameraX - cx, cameraY - cy), 0);
  }, [cameraX, cameraY, cx, cy]);

  return (
    <group name={'Human Group ' + id} position={[cx, cy, height / 2]}>
      <Billboard
        uuid={id}
        args={[width, height]}
        ref={meshRef}
        name={name}
        userData={{ aabb: true }}
        follow={false}
        rotation={rotation}
        onContextMenu={(e) => {
          selectMe(id, e);
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
      >
        <meshBasicMaterial map={texture} alphaTest={0.5} side={DoubleSide} />
      </Billboard>

      {/* draw handle */}
      {selected && !locked && (
        <Sphere
          position={new Vector3(0, 0, -height / 2)}
          args={[MOVE_HANDLE_RADIUS * 4, 6, 6]}
          name={'Handle'}
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
          position={[0, 0, height / 2 + 0.4]}
        />
      )}
    </group>
  );
};

export default React.memo(Human);
