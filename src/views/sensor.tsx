/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Mesh, Vector3} from "three";
import {useStore} from "../stores/common";
import {SensorModel} from "../models/SensorModel";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {HIGHLIGHT_HANDLE_COLOR, MOVE_HANDLE_RADIUS} from "../constants";

const Sensor = ({
                    id,
                    cx,
                    cy,
                    cz,
                    lx = 1,
                    ly = 1,
                    lz = 0.1,
                    color = 'white',
                    lineColor = 'black',
                    lineWidth = 0.1,
                    selected = false,
                    showLabel = false,
                    parent,
                    light = true,
                    heatFlux = false,
                }: SensorModel) => {

    const setCommonStore = useStore(state => state.set);
    const shadowEnabled = useStore(state => state.viewState.shadowEnabled);
    const getElementById = useStore(state => state.getElementById);
    const {gl: {domElement}} = useThree();
    const [hovered, setHovered] = useState(false);
    const baseRef = useRef<Mesh>();
    const handleRef = useRef<Mesh>();

    if (parent) {
        const p = getElementById(parent.id);
        if(p) {
            cz = p.cz + p.lz / 2;
            cx += p.cx;
            cy += p.cy;
        }
    }
    cy = -cy; // we want positive y to point north

    const hx = lx / 2;
    const hy = ly / 2;
    const hz = lz / 2;
    const positionLL = new Vector3(-hx, hz, -hy);
    const positionUL = new Vector3(-hx, hz, hy);
    const positionLR = new Vector3(hx, hz, -hy);
    const positionUR = new Vector3(hx, hz, hy);
    const element = getElementById(id);

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

        <group name={'Sensor Group ' + id}
               position={[cx, cz + hz, cy]}>

            {/* draw rectangle (too small to cast shadow) */}
            <Box receiveShadow={shadowEnabled}
                 uuid={id}
                 ref={baseRef}
                 args={[lx, lz, ly]}
                 name={'Sensor'}
                 onPointerDown={(e) => {
                     selectMe(e);
                 }}
                 onContextMenu={(e) => {
                     selectMe(e);
                 }}
                 onPointerOver={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             setHovered(true);
                             domElement.style.cursor = 'move';
                         }
                     }
                 }}
                 onPointerOut={(e) => {
                     setHovered(false);
                     domElement.style.cursor = 'default';
                 }}
            >
                <meshStandardMaterial attach="material" color={element?.lit ? HIGHLIGHT_HANDLE_COLOR : color}/>
            </Box>

            {!selected &&
            <>
                {/* draw wireframe lines upper face */}
                <Line points={[positionLL, positionLR]}
                      name={'Line LL-LR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLR, positionUR]}
                      name={'Line LR-UR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUR, positionUL]}
                      name={'Line UR-UL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUL, positionLL]}
                      name={'Line UL-LL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line points={[[positionLL.x, -hz, positionLL.z], [positionLR.x, -hz, positionLR.z]]}
                      name={'Line LL-LR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, -hz, positionLR.z], [positionUR.x, -hz, positionUR.z]]}
                      name={'Line LR-UR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, -hz, positionUR.z], [positionUL.x, -hz, positionUL.z]]}
                      name={'Line UR-UL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, -hz, positionUL.z], [positionLL.x, -hz, positionLL.z]]}
                      name={'Line UL-LL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line points={[[positionLL.x, -hz, positionLL.z], positionLL]}
                      name={'Line LL-LL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, -hz, positionLR.z], positionLR]}
                      name={'Line LR-LR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, -hz, positionUL.z], positionUL]}
                      name={'Line UL-UL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, -hz, positionUR.z], positionUR]}
                      name={'Line UR-UR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
            </>
            }

            {/* draw handle */}
            {selected &&
            <Sphere
                ref={handleRef}
                position={new Vector3(0, 0, 0)}
                args={[MOVE_HANDLE_RADIUS, 6, 6]}
                name={'Handle'}
                onPointerDown={(e) => {
                    selectMe(e);
                }}>
                <meshStandardMaterial attach="material" color={'orange'}/>
            </Sphere>
            }
            {(hovered || showLabel) && !selected &&
            <textSprite
                name={'Label'}
                text={'Sensor'}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                scale={[0.5, 0.2, 0.2]}
                position={[0, lz + 0.2, 0]}
            />
            }
        </group>
    )
};

export default Sensor;
