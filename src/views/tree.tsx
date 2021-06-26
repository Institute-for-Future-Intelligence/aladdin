/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import CottonwoodImage from "../resources/cottonwood.png";
import CottonwoodShedImage from "../resources/cottonwood_shed.png";
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
import {TreeModel} from "../models/TreeModel";
import {ShedTreeType, TreeType} from "../types";

const Tree = ({
                  id,
                  cx,
                  cy,
                  lx,
                  lz,
                  name = TreeType.Pine,
                  selected = false,
                  ...props
              }: TreeModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const shadowEnabled = useStore(state => state.viewState.shadowEnabled);
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<Mesh>(null!);
    const {gl: {domElement}} = useThree();

    const texture = useMemo(() => {
        const loader = new TextureLoader();
        let texture;
        switch (name) {
            case TreeType.Cottonwood:
                texture = loader.load(CottonwoodImage);
                break;
            case ShedTreeType.Cottonwood:
                texture = loader.load(CottonwoodShedImage);
                break;
            case TreeType.Dogwood:
                texture = loader.load(DogwoodImage);
                break;
            case ShedTreeType.Dogwood:
                texture = loader.load(DogwoodShedImage);
                break;
            case TreeType.Elm:
                texture = loader.load(ElmImage);
                break;
            case ShedTreeType.Elm:
                texture = loader.load(ElmShedImage);
                break;
            case TreeType.Linden:
                texture = loader.load(LindenImage);
                break;
            case ShedTreeType.Linden:
                texture = loader.load(LindenShedImage);
                break;
            case TreeType.Maple:
                texture = loader.load(MapleImage);
                break;
            case ShedTreeType.Maple:
                texture = loader.load(MapleShedImage);
                break;
            case TreeType.Oak:
                texture = loader.load(OakImage);
                break;
            case ShedTreeType.Oak:
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
        <group name={'Tree Group ' + id}
               position={[cx, lz / 2, cy]}>

            <Billboard
                uuid={id}
                castShadow={shadowEnabled}
                args={[lx, lz]}
                ref={meshRef}
                renderOrder={0}
                customDepthMaterial={
                    new MeshDepthMaterial({
                        depthPacking: RGBADepthPacking,
                        map: texture,
                        alphaTest: 0.1
                    })
                }
                name={name}
                onContextMenu={(e) => {
                    selectMe(e);
                }}
                onPointerDown={(e) => {
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
                renderOrder={2}
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
