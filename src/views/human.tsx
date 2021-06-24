/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import JackImage from "../resources/jack.png";
import JadeImage from "../resources/jade.png";
import JaneImage from "../resources/jane.png";
import JayeImage from "../resources/jaye.png";
import JeanImage from "../resources/jean.png";
import JediImage from "../resources/jedi.png";
import JeffImage from "../resources/jeff.png";
import JenaImage from "../resources/jena.png";
import JeniImage from "../resources/jeni.png";
import JessImage from "../resources/jess.png";
import JettImage from "../resources/jett.png";
import JillImage from "../resources/jill.png";
import JoanImage from "../resources/joan.png";
import JoelImage from "../resources/joel.png";
import JohnImage from "../resources/john.png";
import JoseImage from "../resources/jose.png";
import JuddImage from "../resources/judd.png";
import JudyImage from "../resources/judy.png";
import JuneImage from "../resources/june.png";
import JuroImage from "../resources/juro.png";
import {DoubleSide, Mesh, TextureLoader, Vector3} from "three";
import {useStore} from "../stores/common";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {HumanModel} from "../models/humanModel";
import {Billboard, Sphere} from "@react-three/drei";
import {MOVE_HANDLE_RADIUS} from "../constants";

const Human = ({
                   id,
                   cx,
                   cy,
                   lz,
                   name = 'Jack',
                   selected = false,
                   ...props
               }: HumanModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<Mesh>(null!);
    const {gl: {domElement}} = useThree();
    const texture = useMemo(() => {
        const loader = new TextureLoader();
        let texture;
        switch (name) {
            case 'Jade':
                texture = loader.load(JadeImage);
                break;
            case 'Jane':
                texture = loader.load(JaneImage);
                break;
            case 'Jaye':
                texture = loader.load(JayeImage);
                break;
            case 'Jean':
                texture = loader.load(JeanImage);
                break;
            case 'Jedi':
                texture = loader.load(JediImage);
                break;
            case 'Jeff':
                texture = loader.load(JeffImage);
                break;
            case 'Jena':
                texture = loader.load(JenaImage);
                break;
            case 'Jeni':
                texture = loader.load(JeniImage);
                break;
            case 'Jess':
                texture = loader.load(JessImage);
                break;
            case 'Jett':
                texture = loader.load(JettImage);
                break;
            case 'Jill':
                texture = loader.load(JillImage);
                break;
            case 'Joan':
                texture = loader.load(JoanImage);
                break;
            case 'Joel':
                texture = loader.load(JoelImage);
                break;
            case 'John':
                texture = loader.load(JohnImage);
                break;
            case 'Jose':
                texture = loader.load(JoseImage);
                break;
            case 'Judd':
                texture = loader.load(JuddImage);
                break;
            case 'Judy':
                texture = loader.load(JudyImage);
                break;
            case 'June':
                texture = loader.load(JuneImage);
                break;
            case 'Juro':
                texture = loader.load(JuroImage);
                break;
            default:
                texture = loader.load(JackImage);
        }
        return texture;
    }, [name]);

    const selectMe = (e: ThreeEvent<MouseEvent>) => {
        // We must check if there is really a first intersection, onPointerDown does not guarantee it
        // onPointerDown listener for an object can still fire an event even when the object is behind another one
        if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === e.eventObject;
            if (intersected) {
                setCommonStore((state) => {
                    for (const e of state.elements) {
                        e.selected = e.id === id;
                    }
                });
            }
        }
    };

    return (
        <group name={'Human Group ' + id} position={[cx, lz / 2, cy]}>

            <Billboard
                args={[0.6, 2]}
                ref={meshRef}
                name={name}
                onContextMenu={(e) => {
                    selectMe(e);
                }}
                onClick={(e) => {
                    selectMe(e);
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
                <meshBasicMaterial attach={'material'}
                                   map={texture}
                                   opacity={1}
                                   transparent={true}
                                   side={DoubleSide}/>
            </Billboard>

            {/* draw handle */}
            {selected &&
            <Sphere
                position={new Vector3(0, -lz / 2, 0)}
                args={[MOVE_HANDLE_RADIUS * 2, 6, 6]}
                name={'Handle'}
                onPointerDown={(e) => {
                    selectMe(e);
                }}
                onPointerOver={(e) => {
                    domElement.style.cursor = 'move';
                }}
                onPointerOut={(e) => {
                    domElement.style.cursor = 'default';
                }}
            >
                <meshStandardMaterial attach="material" color={'orange'}/>
            </Sphere>
            }
            {hovered && !selected &&
            <textSprite
                name={'Label'}
                text={name}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                scale={[0.5, 0.2, 0.2]}
                position={[0, lz / 2 + 0.4, 0]}
            />
            }

        </group>
    )
};

export default Human;
