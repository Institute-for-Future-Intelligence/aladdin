/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Raycaster, Vector2, Vector3} from "three";
import {useStore} from "../stores/common";
import {FoundationModel} from "../models/foundationModel";
import {useThree} from "@react-three/fiber";

const Foundation = ({
                        id,
                        cx,
                        cy,
                        lx = 1,
                        ly = 1,
                        height = 0.1,
                        color = 'gray',
                        lineColor = 'black',
                        lineWidth = 0.1,
                        selected = false,
                    }: FoundationModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const updateElementById = useStore(state => state.updateElementById);
    const {camera, scene} = useThree();
    const [hovered, setHovered] = useState(false);
    const [grabbed, setGrabbed] = useState(false);
    const baseRef = useRef();
    const handleLLRef = useRef();
    const handleULRef = useRef();
    const handleLRRef = useRef();
    const handleURRef = useRef();

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

    const grabMe = (on: boolean) => {
        setGrabbed(on);
        setCommonStore((state) => {
            state.enableOrbitController = !on;
        });
    };

    return (

        <group name={'Foundation Group'}>

            {/* draw rectangle */}
            <Box castShadow receiveShadow
                 ref={baseRef}
                 name={'Foundation'}
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
                 onPointerDown={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             selectMe();
                             grabMe(true);
                         }
                     }
                 }}
                 onPointerUp={(e) => {
                     grabMe(false);
                 }}
                 onPointerMove={(e) => {
                     if (grabbed) {
                         const mouse = new Vector2();
                         mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                         mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                         const ray = new Raycaster();
                         ray.setFromCamera(mouse, camera);
                         const intersects = ray.intersectObjects(scene.children);
                         if (intersects.length > 0) {
                             const p = intersects[0].point;
                             updateElementById(id, {cx: p.x, cy: -p.z, cz: 0});
                         }
                     }
                 }}
                 args={[lx, height, ly]}
                 position={[cx, height / 2, cy]}>
                <meshStandardMaterial attach="material" color={color}/>
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
                <Line points={[[positionLL.x, 0, positionLL.z], [positionLR.x, 0, positionLR.z]]}
                      name={'Line LL-LR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, 0, positionLR.z], [positionUR.x, 0, positionUR.z]]}
                      name={'Line LR-UR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, 0, positionUR.z], [positionUL.x, 0, positionUL.z]]}
                      name={'Line UR-UL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, 0, positionUL.z], [positionLL.x, 0, positionLL.z]]}
                      name={'Line UL-LL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line points={[[positionLL.x, 0, positionLL.z], [positionLL.x, height, positionLL.z]]}
                      name={'Line LL-LL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, 0, positionLR.z], [positionLR.x, height, positionLR.z]]}
                      name={'Line LR-LR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, 0, positionUL.z], [positionUL.x, height, positionUL.z]]}
                      name={'Line UL-UL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, 0, positionUR.z], [positionUR.x, height, positionUR.z]]}
                      name={'Line UR-UR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
            </>

            {/* draw handles */}
            {selected &&
            <>
                <Sphere ref={handleLLRef}
                        args={[0.1, 6, 6]}
                        name={'Handle LL'}
                        position={positionLL}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleULRef}
                        args={[0.1, 6, 6]}
                        name={'Handle UL'}
                        position={positionUL}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleLRRef}
                        args={[0.1, 6, 6]}
                        name={'Handle LR'}
                        position={positionLR}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleURRef}
                        args={[0.1, 6, 6]}
                        name={'Handle UR'}
                        position={positionUR}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
            </>
            }

            {hovered &&
            <textSprite
                name={'Label'}
                text={'Foundation'}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                scale={[1, 0.2, 0.2]}
                position={[cx, height + 0.2, cy]}
            />
            }

        </group>
    )
};

export default Foundation;
