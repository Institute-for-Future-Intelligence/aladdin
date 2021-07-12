/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useMemo, useRef, useState} from "react";
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
import {DoubleSide, Mesh, MeshDepthMaterial, RGBADepthPacking, Vector3} from "three";
import {useStore} from "../stores/common";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {Billboard, Cone, Sphere, useTexture} from "@react-three/drei";
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
                  sunlightDirection,
                  ...props
              }: TreeModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const world = useStore(state => state.world);
    const now = new Date(world.date);
    const shadowEnabled = useStore(state => state.viewState.shadowEnabled);
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<Mesh>(null!);
    const {gl: {domElement}, camera} = useThree();

    const month = now.getMonth();
    const noLeaves = !evergreen && (month < 4 || month > 10); // TODO: This needs to depend on location

    const sunlightX = sunlightDirection.x;
    const sunlightZ = sunlightDirection.z;
    const cameraX = camera.position.x;
    const cameraZ = camera.position.z

    const textureImg = useMemo(() => {
        switch (name) {
            case TreeType.Cottonwood:
                return noLeaves ? CottonwoodShedImage : CottonwoodImage;
            case TreeType.Dogwood:
                return noLeaves ? DogwoodShedImage : DogwoodImage;
            case TreeType.Elm:
                return noLeaves ? ElmShedImage : ElmImage;
            case TreeType.Linden:
                return noLeaves ? LindenShedImage : LindenImage;
            case TreeType.Maple:
                return noLeaves ? MapleShedImage : MapleImage;
            case TreeType.Oak:
                return noLeaves ? OakShedImage : OakImage;
            default:
                return PineImage;
        }
    }, [name, world.date]);

    const texture = useTexture(textureImg);

    const customDepthMaterial = new MeshDepthMaterial({
        depthPacking: RGBADepthPacking,
        map: texture,
        alphaTest: 0.1,
    })

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
                args={[lx, lz]} 
                userData={{aabb: true}}
                follow={false}
                rotation={[0, Math.atan2(cameraX, cameraZ), 0]}
            >
                <meshBasicMaterial map={texture} side={DoubleSide} alphaTest={0.5}/>
            </Billboard>

            {/* cast shadow */}
            <Billboard
                args={[lx, lz]}
                castShadow={shadowEnabled}
                follow={false}
                customDepthMaterial={customDepthMaterial}
                rotation={[0, Math.atan2(sunlightX, sunlightZ), 0]} 
            >
                <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0} depthTest={false}/>
            </Billboard>

            {/* simulation model */}
            {name !== TreeType.Pine ?
                <Sphere visible={showModel && !noLeaves}
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
                position={[0, -lz / 2 + 0.5, 0]}
                args={[lx / 2, 1]}
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
            />

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
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[0, lz / 2 + 0.4, 0]}
            />
            }

        </group>
    )
};

export default React.memo(Tree);
