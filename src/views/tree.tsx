/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import DogwoodImage from "../resources/dogwood.png";
import DogwoodShedImage from "../resources/dogwood_shed.png";
import ElmImage from "../resources/elm.png";
import ElmShedImage from "../resources/elm_shed.png";
import LindenImage from "../resources/linden.png";
import LindenShedImage from "../resources/linden_shed.png";
import MapleImage from "../resources/maple.png";
import MapleShedImage from "../resources/maple_shed.png";
import OakImage from "../resources/oak.png";
import OakShedImage from "../resources/oak_shed.png";
import PineImage from "../resources/pine.png";
import {DoubleSide, Mesh, MeshDepthMaterial, RGBADepthPacking, TextureLoader, Vector3} from "three";
import {useStore} from "../stores/common";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {Billboard, Sphere} from "@react-three/drei";
import {MOVE_HANDLE_RADIUS} from "../constants";
import {TreeModel} from "../models/treeModel";

const Tree = ({
                  id,
                  cx,
                  cy,
                  lz,
                  name = 'Pine',
                  selected = false,
                  ...props
              }: TreeModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const shadowEnabled = useStore(state => state.shadowEnabled);
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<Mesh>(null!);
    const {gl: {domElement}} = useThree();

    let dimX, dimY;
    switch (name) {
        case 'Dogwood':
        case 'Dogwood_Shed':
            dimX = 3;
            dimY = 4.3;
            break;
        case 'Elm':
        case 'Elm_Shed':
            dimX = 3;
            dimY = 3;
            break;
        case 'Linden':
        case 'Linden_Shed':
            dimX = 3;
            dimY = 3;
            break;
        case 'Maple':
        case 'Maple_Shed':
            dimX = 3;
            dimY = 3;
            break;
        case 'Oak':
        case 'Oak_Shed':
            dimX = 3;
            dimY = 3;
            break;
        default:
            dimX = 2;
            dimY = 6.5;
    }

    const texture = useMemo(() => {
        const loader = new TextureLoader();
        let texture;
        switch (name) {
            case 'Dogwood':
                texture = loader.load(DogwoodImage);
                break;
            case 'Dogwood_Shed':
                texture = loader.load(DogwoodShedImage);
                break;
            case 'Elm':
                texture = loader.load(ElmImage);
                break;
            case 'Elm_Shed':
                texture = loader.load(ElmShedImage);
                break;
            case 'Linden':
                texture = loader.load(LindenImage);
                break;
            case 'Linden_Shed':
                texture = loader.load(LindenShedImage);
                break;
            case 'Maple':
                texture = loader.load(MapleImage);
                break;
            case 'Maple_Shed':
                texture = loader.load(MapleShedImage);
                break;
            case 'Oak':
                texture = loader.load(OakImage);
                break;
            case 'Oak_Shed':
                texture = loader.load(OakShedImage);
                break;
            default:
                texture = loader.load(PineImage);
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
        <group name={'Tree Group ' + id} position={[cx, lz / 2, cy]}>

            <Billboard
                castShadow={shadowEnabled}
                args={[dimX, dimY]}
                ref={meshRef}
                customDepthMaterial={
                    new MeshDepthMaterial({
                        depthPacking: RGBADepthPacking,
                        map: texture,
                        alphaTest: 0.5
                    })
                }
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

export default Tree;
