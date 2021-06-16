/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Vector3} from "three";
import {useStore} from "../stores/common";
import {SensorModel} from "../models/sensorModel";

const Sensor = ({
                    id,
                    cx,
                    cy,
                    cz,
                    lx = 1,
                    ly = 1,
                    height = 0.1,
                    color = 'white',
                    lineColor = 'black',
                    lineWidth = 0.1,
                    hovered = false,
                    selected = false,
                    showLabel = false,
                    light = true,
                    heatFlux = false,
                }: SensorModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const getElementById = useStore(state => state.getElementById);

    const baseRef = useRef();
    const handleRef = useRef();

    const position = new Vector3(cx, cz, cy);
    const positionLL = new Vector3(cx - lx / 2, 0, cy - ly / 2);
    const positionUL = new Vector3(cx - lx / 2, 0, cy + ly / 2);
    const positionLR = new Vector3(cx + lx / 2, 0, cy - ly / 2);
    const positionUR = new Vector3(cx + lx / 2, 0, cy + ly / 2);

    const element = getElementById(id);

    const selectMe = () => {
        setCommonStore((state) => {
            const w = state.worlds['default'];
            if (w) {
                for (const e of w.elements) {
                    e.selected = e.id === id;
                }
            }
        });
    };

    const hoverMe = (on: boolean) => {
        setCommonStore((state) => {
            const w = state.worlds['default'];
            if (w) {
                for (const e of w.elements) {
                    if (e.id === id) {
                        e.hovered = on;
                        break;
                    }
                }
            }
        });
    };

    return (

        <group name={'Sensor Group'}>

            {/* draw rectangle (too small to cast shadow) */}
            <Box receiveShadow
                 ref={baseRef}
                 name={'Sensor'}
                 onClick={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             selectMe();
                         }
                     }
                 }}
                 onContextMenu={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             selectMe();
                         }
                     }
                 }}
                 onPointerOver={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             hoverMe(true);
                         }
                     }
                 }}
                 onPointerOut={(e) => {
                     hoverMe(false);
                 }}
                 args={[lx, height, ly]}
                 position={[cx, height / 2, cy]}
            >
                <meshStandardMaterial attach="material" color={element?.lit ? 'red' : color}/>
            </Box>

            <>
                {/* draw wireframe lines upper face */}
                <Line points={[[positionLL.x, height, positionLL.z], [positionLR.x, height, positionLR.z]]}
                      name={'Line LL-LR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, height, positionLR.z], [positionUR.x, height, positionUR.z]]}
                      name={'Line LR-UR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, height, positionUR.z], [positionUL.x, height, positionUL.z]]}
                      name={'Line UR-UL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, height, positionUL.z], [positionLL.x, height, positionLL.z]]}
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
                <Line points={[positionLL, [positionLL.x, height, positionLL.z]]}
                      name={'Line LL-LL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLR, [positionLR.x, height, positionLR.z]]}
                      name={'Line LR-LR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUL, [positionUL.x, height, positionUL.z]]}
                      name={'Line UL-UL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUR, [positionUR.x, height, positionUR.z]]}
                      name={'Line UR-UR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
            </>

            {/* draw handle */}
            {selected &&
            <Sphere
                ref={handleRef}
                args={[0.1, 6, 6]}
                name={'Handle'}
                position={position}>
                <meshStandardMaterial attach="material" color={'white'}/>
            </Sphere>
            }
            {(hovered || showLabel) &&
            <textSprite
                name={'Label'}
                text={'Sensor'}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                scale={[0.5, 0.2, 0.2]}
                position={[cx, height + 0.2, cy]}
            />
            }
        </group>
    )
};

export default Sensor;
