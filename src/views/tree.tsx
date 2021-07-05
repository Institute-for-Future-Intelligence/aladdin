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
import {Billboard, Cone, Sphere} from "@react-three/drei";
import {MOVE_HANDLE_RADIUS} from "../constants";
import {TreeModel} from "../models/TreeModel";
import {TreeType} from "../types";
import {Util} from "../Util";

const Tree = ({
                  id,
                  cx,
                  cy,
                  lx,
                  lz,
                  name = TreeType.Pine,
                  selected = false,
                  locked = false,
                  showModel = false,
                  evergreen = false,
                  ...props
              }: TreeModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const world = useStore(state => state.world);
    const now = new Date(world.date);
    const shadowEnabled = useStore(state => state.viewState.shadowEnabled);
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<Mesh>(null!);
    const {gl: {domElement}} = useThree();

    const month = now.getMonth();
    const noLeaves = !evergreen && (month < 4 || month > 10); // TODO: This needs to depend on location

    const texture = useMemo(() => {
        const loader = new TextureLoader();
        let texture;
        switch (name) {
            case TreeType.Cottonwood:
                texture = loader.load(noLeaves ? CottonwoodShedImage : CottonwoodImage);
                break;
            case TreeType.Dogwood:
                texture = loader.load(noLeaves ? DogwoodShedImage : DogwoodImage);
                break;
            case TreeType.Elm:
                texture = loader.load(noLeaves ? ElmShedImage : ElmImage);
                break;
            case TreeType.Linden:
                texture = loader.load(noLeaves ? LindenShedImage : LindenImage);
                break;
            case TreeType.Maple:
                texture = loader.load(noLeaves ? MapleShedImage : MapleImage);
                break;
            case TreeType.Oak:
                texture = loader.load(noLeaves ? OakShedImage : OakImage);
                break;
            default:
                texture = loader.load(PineImage);
        }
        return texture;
    }, [name, world.date]);

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

    // IMPORTANT: model mesh must use double side in order to intercept sunlight
    return (
        <group name={'Tree Group ' + id}
               position={[cx, lz / 2, cy]}>

            <Billboard
                uuid={id}
                name={name}
                castShadow={shadowEnabled}
                args={[lx, lz]}
                renderOrder={0}
                customDepthMaterial={
                    new MeshDepthMaterial({
                        depthPacking: RGBADepthPacking,
                        map: texture,
                        alphaTest: 0.1
                    })
                }
            >
                <meshBasicMaterial attach={'material'}
                                   map={texture}
                                   opacity={1}
                                   transparent={true}
                                   side={DoubleSide}/>
            </Billboard>

            {/* simulation model */}
            {name !== TreeType.Pine ?
                <Sphere visible={showModel}
                        userData={{simulation: !noLeaves}}
                        args={[lx / 2, 8, 8, 0, Util.TWO_PI, 0, theta]}
                        scale={[1, lz / lx, 1]}>
                    <meshStandardMaterial attach="material" side={DoubleSide} transparent={true} opacity={0.75}/>
                </Sphere>
                :
                <Cone visible={showModel}
                      userData={{simulation: true}}
                      position={[0, lz * 0.1, 0]}
                      args={[lx / 2, lz, 8, 8, true]}
                      scale={[1, 1, 1]}>
                    <meshStandardMaterial attach="material" side={DoubleSide} transparent={true} opacity={0.75}/>
                </Cone>
            }

            {/* billboard for interactions (don't use a plane as it may become unselected at some angle) */}
            <Billboard
                ref={meshRef}
                name={'Interaction Billboard'}
                visible={false}
                castShadow={false}
                position={[0, -lz / 2 + 0.5, 0]}
                args={[lx / 2, 1]}
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
                <meshStandardMaterial attach="material" side={DoubleSide} transparent={true} opacity={0.5}/>
            </Billboard>

            {/* draw handle */}
            {selected && !locked &&
            <Sphere
                position={new Vector3(0, -lz / 2, 0)}
                args={[MOVE_HANDLE_RADIUS * 4, 6, 6]}
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
