/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Mesh, Vector3} from "three";
import {useStore} from "../stores/common";
import {SensorModel} from "../models/sensorModel";
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
                    light = true,
                    heatFlux = false,
                }: SensorModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const shadowEnabled = useStore(state => state.shadowEnabled);
    const getElementById = useStore(state => state.getElementById);
    const {gl: {domElement}} = useThree();
    const [hovered, setHovered] = useState(false);
    const baseRef = useRef<Mesh>();
    const handleRef = useRef<Mesh>();

    const position = new Vector3(cx, cz, cy);
    const positionLL = new Vector3(cx - lx / 2, 0, cy - ly / 2);
    const positionUL = new Vector3(cx - lx / 2, 0, cy + ly / 2);
    const positionLR = new Vector3(cx + lx / 2, 0, cy - ly / 2);
    const positionUR = new Vector3(cx + lx / 2, 0, cy + ly / 2);

    const element = getElementById(id);

    const selectMe = (e: ThreeEvent<MouseEvent>) => {
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

        <group name={'Sensor Group ' + id}>

            {/* draw rectangle (too small to cast shadow) */}
            <Box receiveShadow={shadowEnabled}
                 ref={baseRef}
                 args={[lx, lz, ly]}
                 position={[cx, lz / 2, cy]}
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
                <Line points={[[positionLL.x, lz, positionLL.z], [positionLR.x, lz, positionLR.z]]}
                      name={'Line LL-LR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, lz, positionLR.z], [positionUR.x, lz, positionUR.z]]}
                      name={'Line LR-UR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, lz, positionUR.z], [positionUL.x, lz, positionUL.z]]}
                      name={'Line UR-UL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, lz, positionUL.z], [positionLL.x, lz, positionLL.z]]}
                      name={'Line UL-LL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line points={[positionLL, positionLR]}
                      name={'Line LL-LR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLR, positionUR]}
                      name={'Line LR-UR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUR, positionUL]}
                      name={'Line UR-UL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUL, positionLL]}
                      name={'Line UL-LL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line points={[positionLL, [positionLL.x, lz, positionLL.z]]}
                      name={'Line LL-LL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLR, [positionLR.x, lz, positionLR.z]]}
                      name={'Line LR-LR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUL, [positionUL.x, lz, positionUL.z]]}
                      name={'Line UL-UL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUR, [positionUR.x, lz, positionUR.z]]}
                      name={'Line UR-UR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
            </>
            }

            {/* draw handle */}
            {selected &&
            <Sphere
                ref={handleRef}
                position={position}
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
                position={[cx, lz + 0.2, cy]}
            />
            }
        </group>
    )
};

export default Sensor;
