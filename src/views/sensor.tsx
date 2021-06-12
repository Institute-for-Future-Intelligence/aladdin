/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Vector3} from "three";
import {useStore} from "../stores/common";
import {SensorModel} from "../models/sensorModel";
import {ClickObjectType} from "../types";

const Sensor = ({
                    id,
                    cx,
                    cy,
                    lx = 1,
                    ly = 1,
                    height = 0.1,
                    color = 'gray',
                    lineColor = 'black',
                    lineWidth = 0.1,
                    hovered = false,
                    selected = false,
                    showLabel = true,
                }: SensorModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);

    const baseRef = useRef();
    const handleRef = useRef();

    const position = new Vector3(cx, height / 2, cy);
    const positionLL = new Vector3(cx - lx / 2, height / 2, cy - ly / 2);
    const positionUL = new Vector3(cx - lx / 2, height / 2, cy + ly / 2);
    const positionLR = new Vector3(cx + lx / 2, height / 2, cy - ly / 2);
    const positionUR = new Vector3(cx + lx / 2, height / 2, cy + ly / 2);

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

        <group>

            {/* draw rectangle */}
            <Box castShadow receiveShadow
                 ref={baseRef}
                 name={'Foundation'}
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
                             setCommonStore((state) => {
                                 state.clickObjectType = ClickObjectType.Sensor;
                             });
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
                <meshStandardMaterial attach="material" color={hovered ? 'lightGray' : color}/>
            </Box>

            <>
                {/* draw wireframe lines upper face */}
                <Line points={[[positionLL.x, height, positionLL.z], [positionLR.x, height, positionLR.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, height, positionLR.z], [positionUR.x, height, positionUR.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, height, positionUR.z], [positionUL.x, height, positionUL.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, height, positionUL.z], [positionLL.x, height, positionLL.z]]}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line points={[[positionLL.x, 0, positionLL.z], [positionLR.x, 0, positionLR.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, 0, positionLR.z], [positionUR.x, 0, positionUR.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, 0, positionUR.z], [positionUL.x, 0, positionUL.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, 0, positionUL.z], [positionLL.x, 0, positionLL.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line points={[[positionLL.x, 0, positionLL.z], [positionLL.x, height, positionLL.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, 0, positionLR.z], [positionLR.x, height, positionLR.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, 0, positionUL.z], [positionUL.x, height, positionUL.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, 0, positionUR.z], [positionUR.x, height, positionUR.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
            </>

            {/* draw handle */}
            {selected &&
            <Sphere
                ref={handleRef}
                args={[0.1, 6, 6]}
                position={position}>
                <meshStandardMaterial attach="material" color={'white'}/>
            </Sphere>
            }
            {(hovered || showLabel) &&
            <textSprite
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
