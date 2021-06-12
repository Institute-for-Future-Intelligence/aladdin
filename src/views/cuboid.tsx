/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Vector3} from "three";
import {useStore} from "../stores/common";
import {CuboidModel} from "../models/cuboidModel";

const Cuboid = ({
                    id,
                    cx,
                    cy,
                    lx = 1,
                    ly = 1,
                    height = 1,
                    color = 'white',
                    lineColor = 'black',
                    lineWidth = 0.1,
                    hovered = false,
                    selected = false,
                }: CuboidModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);

    const baseRef = useRef();
    const handleLLTopRef = useRef();
    const handleULTopRef = useRef();
    const handleLRTopRef = useRef();
    const handleURTopRef = useRef();
    const handleLLBotRef = useRef();
    const handleULBotRef = useRef();
    const handleLRBotRef = useRef();
    const handleURBotRef = useRef();

    const positionLLTop = new Vector3(cx - lx / 2, height, cy - ly / 2);
    const positionULTop = new Vector3(cx - lx / 2, height, cy + ly / 2);
    const positionLRTop = new Vector3(cx + lx / 2, height, cy - ly / 2);
    const positionURTop = new Vector3(cx + lx / 2, height, cy + ly / 2);

    const positionLLBot = new Vector3(cx - lx / 2, 0, cy - ly / 2);
    const positionULBot = new Vector3(cx - lx / 2, 0, cy + ly / 2);
    const positionLRBot = new Vector3(cx + lx / 2, 0, cy - ly / 2);
    const positionURBot = new Vector3(cx + lx / 2, 0, cy + ly / 2);

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

            {/* draw rectangular cuboid */}
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
                 position={[cx, height / 2, cy]}>
                <meshStandardMaterial attach="material" color={color}/>
            </Box>

            <>
                {/* draw wireframe lines upper face */}
                <Line points={[[positionLLTop.x, height, positionLLTop.z], [positionLRTop.x, height, positionLRTop.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLRTop.x, height, positionLRTop.z], [positionURTop.x, height, positionURTop.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionURTop.x, height, positionURTop.z], [positionULTop.x, height, positionULTop.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionULTop.x, height, positionULTop.z], [positionLLTop.x, height, positionLLTop.z]]}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line
                    points={[[positionLLTop.x, 0, positionLLTop.z], [positionLRTop.x, 0, positionLRTop.z]]}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[[positionLRTop.x, 0, positionLRTop.z], [positionURTop.x, 0, positionURTop.z]]}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[[positionURTop.x, 0, positionURTop.z], [positionULTop.x, 0, positionULTop.z]]}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[[positionULTop.x, 0, positionULTop.z], [positionLLTop.x, 0, positionLLTop.z]]}
                    lineWidth={lineWidth}
                    color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line
                    points={[[positionLLTop.x, 0, positionLLTop.z], [positionLLTop.x, height, positionLLTop.z]]}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[[positionLRTop.x, 0, positionLRTop.z], [positionLRTop.x, height, positionLRTop.z]]}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[[positionULTop.x, 0, positionULTop.z], [positionULTop.x, height, positionULTop.z]]}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[[positionURTop.x, 0, positionURTop.z], [positionURTop.x, height, positionURTop.z]]}
                    lineWidth={lineWidth}
                    color={lineColor}/>
            </>

            {/* draw handles */}
            {selected &&
            <>
                <Sphere ref={handleLLTopRef}
                        args={[0.1, 6, 6]}
                        position={positionLLTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleULTopRef}
                        args={[0.1, 6, 6]}
                        position={positionULTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleLRTopRef}
                        args={[0.1, 6, 6]}
                        position={positionLRTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleURTopRef}
                        args={[0.1, 6, 6]}
                        position={positionURTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleLLBotRef}
                        args={[0.1, 6, 6]}
                        position={positionLLBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleULBotRef}
                        args={[0.1, 6, 6]}
                        position={positionULBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleLRBotRef}
                        args={[0.1, 6, 6]}
                        position={positionLRBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleURBotRef}
                        args={[0.1, 6, 6]}
                        position={positionURBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
            </>
            }

            {hovered &&
            <textSprite
                text={'Box'}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                scale={[0.4, 0.2, 0.2]}
                position={[cx, height + 0.2, cy]}
            />
            }

        </group>
    )
};

export default Cuboid;
