/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Euler, Mesh, Vector3} from "three";
import {useStore} from "../stores/common";
import {SensorModel} from "../models/SensorModel";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {HIGHLIGHT_HANDLE_COLOR, MOVE_HANDLE_RADIUS} from "../constants";
import {ActionType, ObjectType} from "../types";
import {Util} from "../Util";

const Sensor = ({
                    id,
                    cx,
                    cy,
                    cz,
                    lx = 1,
                    ly = 1,
                    lz = 0.1,
                    rotation = [0, 0, 0],
                    normal = [0, 0, 1],
                    color = 'white',
                    lineColor = 'black',
                    lineWidth = 0.1,
                    selected = false,
                    showLabel = false,
                    parent,
                    light = true,
                    heatFlux = false,
                }: SensorModel) => {

    const shadowEnabled = useStore(state => state.viewState.shadowEnabled);
    const getElementById = useStore(state => state.getElementById);
    const selectMe = useStore(state => state.selectMe);
    const {gl: {domElement}} = useThree();
    const [hovered, setHovered] = useState(false);
    const baseRef = useRef<Mesh>();
    const handleRef = useRef<Mesh>();

    if (parent) {
        const p = getElementById(parent.id);
        if (p) {
            switch (p.type) {
                case ObjectType.Foundation:
                    cz = p.cz + p.lz / 2;
                    if (Util.isZero(rotation[2])) {
                        cx = p.cx + cx * p.lx;
                        cy = p.cy + cy * p.ly;
                    } else {
                        // we must rotate the real length, not normalized length
                        const v = new Vector3(cx * p.lx, cy * p.ly, 0);
                        v.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, rotation[2]);
                        cx = p.cx + v.x;
                        cy = p.cy + v.y;
                    }
                    break;
                case ObjectType.Cuboid:
                    if (Util.isZero(rotation[2])) {
                        cx = p.cx + cx * p.lx;
                        cy = p.cy + cy * p.ly;
                        cz = p.cz + cz * p.lz;
                    } else {
                        // we must rotate the real length, not normalized length
                        const v = new Vector3(cx * p.lx, cy * p.ly, cz * p.lz);
                        v.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, rotation[2]);
                        cx = p.cx + v.x;
                        cy = p.cy + v.y;
                        cz = p.cz + v.z;
                    }
                    break;
            }
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

    const euler = useMemo(() => {
        const v = new Vector3().fromArray(normal);
        if (Util.isSame(v, Util.UNIT_VECTOR_POS_Z)) {
            // top face in model coordinate system
            return new Euler(0, rotation[2], 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_X)) {
            // east face in model coordinate system
            return new Euler(0, rotation[2], Util.HALF_PI);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_X)) {
            // west face in model coordinate system
            return new Euler(0, rotation[2], Util.HALF_PI);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_Y)) {
            // south face in the model coordinate system
            return new Euler(0, rotation[2] + Util.HALF_PI, Util.HALF_PI);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_Y)) {
            // north face in the model coordinate system
            return new Euler(0, rotation[2] + Util.HALF_PI, Util.HALF_PI);
        }
        return new Euler(0, rotation[2], 0);
    }, [normal, rotation]);

    const spritePosition = useMemo(() => {
        const v = new Vector3().fromArray(normal);
        if (Util.isSame(v, Util.UNIT_VECTOR_POS_Z)) {
            // top face in model coordinate system
            return new Vector3(0, lz + 0.2, 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_X)) {
            // east face in model coordinate system
            return new Vector3(0, -0.2, 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_X)) {
            // west face in model coordinate system
            return new Vector3(0, 0.2, 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_Y)) {
            // south face in the model coordinate system
            return new Vector3(0, -0.2, 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_Y)) {
            // north face in the model coordinate system
            return new Vector3(0, 0.2, 0);
        }
        return new Vector3(0, lz + 0.2, 0);
    }, [normal]);

    return (

        <group name={'Sensor Group ' + id}
               rotation={euler}
               position={[cx, cz + hz, cy]}>

            {/* draw rectangle (too small to cast shadow) */}
            <Box receiveShadow={shadowEnabled}
                 uuid={id}
                 userData={{aabb: true}}
                 ref={baseRef}
                 args={[lx, lz, ly]}
                 name={'Sensor'}
                 onPointerDown={(e) => {
                     if (e.button === 2) return; // ignore right-click
                     selectMe(id, e);
                 }}
                 onContextMenu={(e) => {
                     selectMe(id, e);
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
                    selectMe(id, e, ActionType.Move);
                }}>
                <meshStandardMaterial attach="material" color={'orange'}/>
            </Sphere>
            }
            {(hovered || showLabel) && !selected &&
            <textSprite
                name={'Label'}
                text={element?.label ? element.label : 'Sensor'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={spritePosition}
            />
            }
        </group>
    )
};

// this one may not use React.memo as it needs to move with its parent.
// there may be a way to notify a memorized component when its parent changes
export default Sensor;
