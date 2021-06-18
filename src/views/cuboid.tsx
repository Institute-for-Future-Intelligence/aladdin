/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
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
                    selected = false,
                }: CuboidModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const [hovered, setHovered] = useState(false);

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

    return (

        <group name={'Cuboid Group'}>

            {/* draw rectangular cuboid */}
            <Box castShadow receiveShadow
                 ref={baseRef}
                 name={'Cuboid'}
                 onPointerDown={(e) => {
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
                             setHovered(true);
                         }
                     }
                 }}
                 onPointerOut={(e) => {
                     setHovered(false);
                 }}
                 args={[lx, height, ly]}
                 position={[cx, height / 2, cy]}>
                <meshStandardMaterial attach="material" color={color}/>
            </Box>

            <>
                {/* draw wireframe lines top */}
                <Line points={[positionLLTop, positionLRTop]}
                      name={'Line LL-LR Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLRTop, positionURTop]}
                      name={'Line LR-UR Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionURTop, positionULTop]}
                      name={'Line UR-UL Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionULTop, positionLLTop]}
                      name={'Line UL-LL Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line
                    points={[positionLLBot, positionLRBot]}
                    name={'Line LL-LR Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionLRBot, positionURBot]}
                    name={'Line LR-UR Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionURBot, positionULBot]}
                    name={'Line UR-UL Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionULBot, positionLLBot]}
                    name={'Line UL-LL Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line
                    points={[positionLLTop, positionLLBot]}
                    name={'Line LL-LL Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionLRTop, positionLRBot]}
                    name={'Line LR-LR Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionULTop, positionULBot]}
                    name={'Line UL-UL Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionURTop, positionURBot]}
                    name={'Line UR-UR Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
            </>

            {/* draw handles */}
            {selected &&
            <>
                <Sphere ref={handleLLTopRef}
                        name={'Handle LL Top'}
                        args={[0.1, 6, 6]}
                        position={positionLLTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleULTopRef}
                        name={'Handle UL Top'}
                        args={[0.1, 6, 6]}
                        position={positionULTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleLRTopRef}
                        name={'Handle LR Top'}
                        args={[0.1, 6, 6]}
                        position={positionLRTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleURTopRef}
                        name={'Handle UR Top'}
                        args={[0.1, 6, 6]}
                        position={positionURTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleLLBotRef}
                        name={'Handle LL Bottom'}
                        args={[0.1, 6, 6]}
                        position={positionLLBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleULBotRef}
                        name={'Handle UL Bottom'}
                        args={[0.1, 6, 6]}
                        position={positionULBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleLRBotRef}
                        name={'Handle LR Bottom'}
                        args={[0.1, 6, 6]}
                        position={positionLRBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleURBotRef}
                        name={'Handle UR Bottom'}
                        args={[0.1, 6, 6]}
                        position={positionURBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
            </>
            }

            {hovered &&
            <textSprite
                name={'Label'}
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
