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
import {HumanModel} from "../models/HumanModel";
import {Billboard, Sphere} from "@react-three/drei";
import {MOVE_HANDLE_RADIUS} from "../constants";
import {HumanName} from "../types";

const Human = ({
                   id,
                   cx,
                   cy,
                   name = HumanName.Jack,
                   selected = false,
                   locked = false,
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
            case HumanName.Jade:
                texture = loader.load(JadeImage);
                break;
            case HumanName.Jane:
                texture = loader.load(JaneImage);
                break;
            case HumanName.Jaye:
                texture = loader.load(JayeImage);
                break;
            case HumanName.Jean:
                texture = loader.load(JeanImage);
                break;
            case HumanName.Jedi:
                texture = loader.load(JediImage);
                break;
            case HumanName.Jeff:
                texture = loader.load(JeffImage);
                break;
            case HumanName.Jena:
                texture = loader.load(JenaImage);
                break;
            case HumanName.Jeni:
                texture = loader.load(JeniImage);
                break;
            case HumanName.Jess:
                texture = loader.load(JessImage);
                break;
            case HumanName.Jett:
                texture = loader.load(JettImage);
                break;
            case HumanName.Jill:
                texture = loader.load(JillImage);
                break;
            case HumanName.Joan:
                texture = loader.load(JoanImage);
                break;
            case HumanName.Joel:
                texture = loader.load(JoelImage);
                break;
            case HumanName.John:
                texture = loader.load(JohnImage);
                break;
            case HumanName.Jose:
                texture = loader.load(JoseImage);
                break;
            case HumanName.Judd:
                texture = loader.load(JuddImage);
                break;
            case HumanName.Judy:
                texture = loader.load(JudyImage);
                break;
            case HumanName.June:
                texture = loader.load(JuneImage);
                break;
            case HumanName.Juro:
                texture = loader.load(JuroImage);
                break;
            default:
                texture = loader.load(JackImage);
        }
        return texture;
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
        <group name={'Human Group ' + id}
               position={[cx, height / 2, cy]}>

            <Billboard
                uuid={id}
                args={[width, height]}
                ref={meshRef}
                name={name}
                onContextMenu={(e) => {
                    selectMe(e);
                }}
                onPointerDown={(e) => {
                    if (e.button === 2) return; // ignore right-click
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
            {selected && !locked &&
            <Sphere
                position={new Vector3(0, -height / 2, 0)}
                args={[MOVE_HANDLE_RADIUS * 4, 6, 6]}
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
                position={[0, height / 2 + 0.4, 0]}
            />
            }

        </group>
    )
};

export default React.memo(Human);
