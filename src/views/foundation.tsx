/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import {Box, Line, Sphere, Plane} from "@react-three/drei";
import {Mesh, Raycaster, Vector2, Vector3} from "three";
import {useStore} from "../stores/common";
import {FoundationModel} from "../models/FoundationModel";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {ActionType, MoveHandleType, ObjectType, Orientation, ResizeHandleType, RotateHandleType} from "../types";
import {
    HIGHLIGHT_HANDLE_COLOR,
    MOVE_HANDLE_COLOR_1,
    MOVE_HANDLE_COLOR_2,
    MOVE_HANDLE_OFFSET,
    MOVE_HANDLE_RADIUS,
    RESIZE_HANDLE_COLOR,
    RESIZE_HANDLE_SIZE
} from "../constants";
import {Util} from "../Util";
import {ElementModel} from "../models/ElementModel";
import {SolarPanelModel} from "../models/SolarPanelModel";
import RotateHandle from "../components/rotateHandle";

const Foundation = ({
                        id,
                        cx,
                        cy,
                        lx = 1,
                        ly = 1,
                        lz = 0.1,
                        rotation = [0, 0, 0],
                        color = 'gray',
                        lineColor = 'black',
                        lineWidth = 0.2,
                        locked = false,
                        selected = false,
                    }: FoundationModel) => {

    cy = -cy; // we want positive y to point north
    const maxLxLy = Math.max(lx, ly);

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const moveHandleType = useStore(state => state.moveHandleType);
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const rotateHandleType = useStore(state => state.rotateHandleType);
    const resizeAnchor = useStore(state => state.resizeAnchor);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const getElementById = useStore(state => state.getElementById);
    const objectTypeToAdd = useStore(state => state.objectTypeToAdd);
    const addElement = useStore(state => state.addElement);
    const setElementPosition = useStore(state => state.setElementPosition);
    const setElementSize = useStore(state => state.setElementSize);
    const selectMe = useStore(state => state.selectMe);

    const {camera, gl: {domElement}} = useThree();
    const [hovered, setHovered] = useState(false);
    const [hoveredResizeHandleLL, setHoveredResizeHandleLL] = useState(false);
    const [hoveredResizeHandleUL, setHoveredResizeHandleUL] = useState(false);
    const [hoveredResizeHandleLR, setHoveredResizeHandleLR] = useState(false);
    const [hoveredResizeHandleUR, setHoveredResizeHandleUR] = useState(false);
    const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
    const [showGrid, setShowGrid] = useState<boolean>(false);
    const baseRef = useRef<Mesh>();
    const grabRef = useRef<ElementModel | null>(null);
    const resizeHandleLLRef = useRef<Mesh>();
    const resizeHandleULRef = useRef<Mesh>();
    const resizeHandleLRRef = useRef<Mesh>();
    const resizeHandleURRef = useRef<Mesh>();
    const moveHandleLowerRef = useRef<Mesh>();
    const moveHandleUpperRef = useRef<Mesh>();
    const moveHandleLeftRef = useRef<Mesh>();
    const moveHandleRightRef = useRef<Mesh>();
    const rotationHandleURef = useRef<Mesh>();
    const rotationHandleLRef = useRef<Mesh>();
    const ray = useMemo(() => new Raycaster(), []);

    const elementModel = getElementById(id);
    const wireframe = true;
    const handleLift = MOVE_HANDLE_RADIUS / 2;
    const hx = lx / 2;
    const hy = ly / 2;
    const hz = lz / 2;
    const positionLL = useMemo(() => new Vector3(-hx, hz, -hy), [hx, hy, hz]);
    const positionUL = useMemo(() => new Vector3(-hx, hz, hy), [hx, hy, hz]);
    const positionLR = useMemo(() => new Vector3(hx, hz, -hy), [hx, hy, hz]);
    const positionUR = useMemo(() => new Vector3(hx, hz, hy), [hx, hy, hz]);

    // const cosAngle = useMemo(() => {
    //     return Math.cos(rotation[2]);
    // }, [rotation]);
    // const sinAngle = useMemo(() => {
    //     return Math.sin(rotation[2]);
    // }, [rotation]);

    const hoverHandle = (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
        if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === e.eventObject;
            if (intersected) {
                setHoveredHandle(handle);
                if ( // unfortunately, I cannot find a way to tell the type of an enum variable
                    handle === MoveHandleType.Upper ||
                    handle === MoveHandleType.Lower ||
                    handle === MoveHandleType.Left ||
                    handle === MoveHandleType.Right ||
                    handle === RotateHandleType.Lower ||
                    handle === RotateHandleType.Upper
                ) {
                    domElement.style.cursor = 'move';
                } else {
                    domElement.style.cursor = 'pointer';
                }
                switch (handle) {
                    case ResizeHandleType.LowerLeft:
                        setHoveredResizeHandleLL(true);
                        break;
                    case ResizeHandleType.UpperLeft:
                        setHoveredResizeHandleUL(true);
                        break;
                    case ResizeHandleType.LowerRight:
                        setHoveredResizeHandleLR(true);
                        break;
                    case ResizeHandleType.UpperRight:
                        setHoveredResizeHandleUR(true);
                        break;
                }
            }
        }
    };

    const noHoverHandle = () => {
        setHoveredHandle(null);
        setHoveredResizeHandleLL(false);
        setHoveredResizeHandleUL(false);
        setHoveredResizeHandleLR(false);
        setHoveredResizeHandleUR(false);
        domElement.style.cursor = 'default';
    };

    // only these elements are allowed to be on the foundation
    const legalOnFoundation = (type: ObjectType) => {
        return (
            type === ObjectType.Sensor ||
            type === ObjectType.SolarPanel
        );
    };

    const wireframeColor = viewState.groundImage ? 'white' : lineColor;
    const wireframeWidth = viewState.groundImage ? lineWidth * 2 : lineWidth;
    const ratio = Math.max(1, Math.max(lx, ly) / 8);
    const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
    const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;

    return (

        <group name={'Foundation Group ' + id}
               position={[cx, hz, cy]}
               rotation={Util.getEulerInView(rotation)}>

            {/* draw rectangle */}
            <Box castShadow={viewState.shadowEnabled}
                 receiveShadow={viewState.shadowEnabled}
                 uuid={id}
                 userData={{aabb: true}}
                 ref={baseRef}
                 name={'Foundation'}
                 args={[lx, lz, ly]}
                 onContextMenu={(e) => {
                     selectMe(id, e, ActionType.Select);
                     setCommonStore((state) => {
                         state.pastePoint.copy(e.intersections[0].point);
                         state.clickObjectType = ObjectType.Foundation;
                         state.pasteNormal = Util.UNIT_VECTOR_POS_Y;
                     });
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
                     if (e.button === 2) return; // ignore right-click
                     selectMe(id, e, ActionType.Select);
                     const selectedElement = getSelectedElement();
                     if (selectedElement?.id === id) {
                         // no child of this foundation is clicked
                         if (legalOnFoundation(objectTypeToAdd) && elementModel) {
                             setShowGrid(true);
                             addElement(elementModel, e.intersections[0].point);
                             setCommonStore(state => {
                                 state.objectTypeToAdd = ObjectType.None;
                             });
                         }
                     } else {
                         // a child of this foundation is clicked
                         if (selectedElement) {
                             if (legalOnFoundation(selectedElement.type as ObjectType)) {
                                 setShowGrid(true);
                                 grabRef.current = selectedElement;
                                 setCommonStore((state) => {
                                     state.enableOrbitController = false;
                                 });
                             }
                         }
                     }
                 }}
                 onPointerUp={(e) => {
                     grabRef.current = null;
                     setShowGrid(false);
                     setCommonStore((state) => {
                         state.enableOrbitController = true;
                     });
                 }}
                 onPointerMove={(e) => {
                     if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
                         const mouse = new Vector2();
                         mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
                         mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
                         ray.setFromCamera(mouse, camera);
                         let intersects;
                         switch (grabRef.current.type) {
                             case ObjectType.Sensor:
                                 if (baseRef.current) {
                                     intersects = ray.intersectObjects([baseRef.current]);
                                     if (intersects.length > 0) {
                                         let p = Util.viewToModel(intersects[0].point);
                                         if (elementModel) {
                                             p = Util.relativeCoordinates(p.x, p.y, p.z, elementModel);
                                         }
                                         setElementPosition(grabRef.current.id, p.x, p.y);
                                     }
                                 }
                                 break;
                             case ObjectType.SolarPanel:
                                 if (baseRef.current) {
                                     const solarPanel = grabRef.current as SolarPanelModel;
                                     intersects = ray.intersectObjects([baseRef.current]);
                                     if (intersects.length > 0) {
                                         let p = intersects[0].point;
                                         if (moveHandleType) {
                                             p = Util.viewToModel(p);
                                             if (elementModel) {
                                                 p = Util.relativeCoordinates(p.x, p.y, p.z, elementModel);
                                             }
                                             setElementPosition(solarPanel.id, p.x, p.y);
                                         } else if (resizeHandleType) {
                                             switch (resizeHandleType) {
                                                 case ResizeHandleType.Lower:
                                                     let dyl = Math.abs(resizeAnchor.y - p.z);
                                                     if (solarPanel.orientation === Orientation.portrait) {
                                                         const ny = Math.max(1, Math.round(dyl / solarPanel.pvModel.length));
                                                         dyl = ny * solarPanel.pvModel.length;
                                                     } else {
                                                         const ny = Math.max(1, Math.round(dyl / solarPanel.pvModel.width));
                                                         dyl = ny * solarPanel.pvModel.width;
                                                     }
                                                     setElementSize(solarPanel.id, solarPanel.lx, dyl);
                                                     setElementPosition(solarPanel.id, solarPanel.cx, (-p.z - dyl / 2 + cy) / ly);
                                                     break;
                                                 case ResizeHandleType.Upper:
                                                     let dyu = Math.abs(resizeAnchor.y - p.z);
                                                     if (solarPanel.orientation === Orientation.portrait) {
                                                         const ny = Math.max(1, Math.round(dyu / solarPanel.pvModel.length));
                                                         dyu = ny * solarPanel.pvModel.length;
                                                     } else {
                                                         const ny = Math.max(1, Math.round(dyu / solarPanel.pvModel.width));
                                                         dyu = ny * solarPanel.pvModel.width;
                                                     }
                                                     setElementSize(solarPanel.id, solarPanel.lx, dyu);
                                                     setElementPosition(solarPanel.id, solarPanel.cx, (-p.z + dyu / 2 + cy) / ly);
                                                     break;
                                                 case ResizeHandleType.Left:
                                                     let dxl = Math.abs(resizeAnchor.x - p.x);
                                                     if (solarPanel.orientation === Orientation.portrait) {
                                                         const nx = Math.max(1, Math.round(dxl / solarPanel.pvModel.width));
                                                         dxl = nx * solarPanel.pvModel.width;
                                                     } else {
                                                         const nx = Math.max(1, Math.round(dxl / solarPanel.pvModel.length));
                                                         dxl = nx * solarPanel.pvModel.length;
                                                     }
                                                     setElementSize(solarPanel.id, dxl, solarPanel.ly);
                                                     setElementPosition(solarPanel.id, (p.x + dxl / 2 - cx) / lx, solarPanel.cy);
                                                     break;
                                                 case ResizeHandleType.Right:
                                                     let dxr = Math.abs(resizeAnchor.x - p.x);
                                                     if (solarPanel.orientation === Orientation.portrait) {
                                                         const nx = Math.max(1, Math.round(dxr / solarPanel.pvModel.width));
                                                         dxr = nx * solarPanel.pvModel.width;
                                                     } else {
                                                         const nx = Math.max(1, Math.round(dxr / solarPanel.pvModel.length));
                                                         dxr = nx * solarPanel.pvModel.length;
                                                     }
                                                     setElementSize(solarPanel.id, dxr, solarPanel.ly);
                                                     setElementPosition(solarPanel.id, (p.x - dxr / 2 - cx) / lx, solarPanel.cy);
                                                     break;
                                             }
                                         }
                                     }
                                 }
                                 break;
                         }
                     }
                 }}
            >
                <meshStandardMaterial attach="material"
                                      color={color}
                                      transparent={viewState.groundImage}
                                      opacity={viewState.groundImage ? 0.25 : 1}/>
            </Box>

            {showGrid && !viewState.groundImage &&
            <gridHelper name={'Foundation Grid'}
                        position={[0, lz, 0]}
                        scale={[lx / maxLxLy, 1, ly / maxLxLy]}
                        args={[maxLxLy, 50, 'gray', 'gray']}/>
            }

            {(wireframe && !selected) &&
            <>
                {/* draw wireframe lines upper face */}
                <Line points={[positionLL, positionLR]}
                      name={'Line LL-LR Upper Face'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
                <Line points={[positionLR, positionUR]}
                      name={'Line LR-UR Upper Face'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
                <Line points={[positionUR, positionUL]}
                      name={'Line UR-UL Upper Face'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
                <Line points={[positionUL, positionLL]}
                      name={'Line UL-LL Upper Face'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>

                {/* draw wireframe lines lower face */}
                <Line points={[[positionLL.x, -hz, positionLL.z], [positionLR.x, -hz, positionLR.z]]}
                      name={'Line LL-LR Lower Face'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
                <Line points={[[positionLR.x, -hz, positionLR.z], [positionUR.x, -hz, positionUR.z]]}
                      name={'Line LR-UR Lower Face'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
                <Line points={[[positionUR.x, -hz, positionUR.z], [positionUL.x, -hz, positionUL.z]]}
                      name={'Line UR-UL Lower Face'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
                <Line points={[[positionUL.x, -hz, positionUL.z], [positionLL.x, -hz, positionLL.z]]}
                      name={'Line UL-LL Lower Face'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>

                {/* draw wireframe vertical lines */}
                <Line points={[[positionLL.x, -hz, positionLL.z], positionLL]}
                      name={'Line LL-LL Vertical'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
                <Line points={[[positionLR.x, -hz, positionLR.z], positionLR]}
                      name={'Line LR-LR Vertical'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
                <Line points={[[positionUL.x, -hz, positionUL.z], positionUL]}
                      name={'Line UL-UL Vertical'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
                <Line points={[[positionUR.x, -hz, positionUR.z], positionUR]}
                      name={'Line UR-UR Vertical'}
                      lineWidth={wireframeWidth}
                      color={wireframeColor}/>
            </>
            }

            {/* draw handles */}
            {selected && !locked &&
            <>
                {/* resize handles */}
                <Box ref={resizeHandleLLRef}
                     position={[positionLL.x, 0, positionLL.z]}
                     args={[resizeHandleSize, lz * 1.2, resizeHandleSize]}
                     name={ResizeHandleType.LowerLeft}
                     onPointerDown={(e) => {
                         selectMe(id, e, ActionType.Resize);
                         if(resizeHandleLLRef.current) {
                             setCommonStore(state => {
                                const anchor = resizeHandleLLRef.current!.localToWorld(new Vector3(lx, 0, ly));
                                state.resizeAnchor.set(anchor.x, anchor.z);
                             });
                         }
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerLeft);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerLeft ||
                            resizeHandleType === ResizeHandleType.LowerLeft ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleULRef}
                     position={[positionUL.x, 0, positionUL.z]}
                     args={[resizeHandleSize, lz * 1.2, resizeHandleSize]}
                     name={ResizeHandleType.UpperLeft}
                     onPointerDown={(e) => {
                         selectMe(id, e, ActionType.Resize);
                         if(resizeHandleULRef.current) {
                            setCommonStore(state => {
                               const anchor = resizeHandleULRef.current!.localToWorld(new Vector3(lx, 0, -ly));
                               state.resizeAnchor.set(anchor.x, anchor.z);
                            });
                        }
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperLeft);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperLeft ||
                            resizeHandleType === ResizeHandleType.UpperLeft ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleLRRef}
                     position={[positionLR.x, 0, positionLR.z]}
                     args={[resizeHandleSize, lz * 1.2, resizeHandleSize]}
                     name={ResizeHandleType.LowerRight}
                     onPointerDown={(e) => {
                         selectMe(id, e, ActionType.Resize);
                         if(resizeHandleLRRef.current) {
                            setCommonStore(state => {
                               const anchor = resizeHandleLRRef.current!.localToWorld(new Vector3(-lx, 0, ly));
                               state.resizeAnchor.set(anchor.x, anchor.z);
                            });
                        }
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerRight);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerRight ||
                            resizeHandleType === ResizeHandleType.LowerRight ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleURRef}
                     position={[positionUR.x, 0, positionUR.z]}
                     args={[resizeHandleSize, lz * 1.2, resizeHandleSize]}
                     name={ResizeHandleType.UpperRight}
                     onPointerDown={(e) => {
                         selectMe(id, e, ActionType.Resize);
                         if(resizeHandleURRef.current) {
                            setCommonStore(state => {
                               const anchor = resizeHandleURRef.current!.localToWorld(new Vector3(-lx, 0, -ly));
                               state.resizeAnchor.set(anchor.x, anchor.z);
                            });
                        }
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperRight);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperRight ||
                            resizeHandleType === ResizeHandleType.UpperRight ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>

                {/* move handles */}
                <Sphere ref={moveHandleLowerRef}
                        args={[moveHandleSize, 6, 6]}
                        position={[0, handleLift, -hy - MOVE_HANDLE_OFFSET]}
                        name={MoveHandleType.Lower}
                        onPointerDown={(e) => {
                            selectMe(id, e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Lower);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Lower ||
                            moveHandleType === MoveHandleType.Lower ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR_2
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleUpperRef}
                        args={[moveHandleSize, 6, 6]}
                        position={[0, handleLift, hy + MOVE_HANDLE_OFFSET]}
                        name={MoveHandleType.Upper}
                        onPointerDown={(e) => {
                            selectMe(id, e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Upper);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Upper ||
                            moveHandleType === MoveHandleType.Upper ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR_2
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleLeftRef}
                        args={[moveHandleSize, 6, 6]}
                        position={[-hx - MOVE_HANDLE_OFFSET, handleLift, 0]}
                        name={MoveHandleType.Left}
                        onPointerDown={(e) => {
                            selectMe(id, e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Left);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Left ||
                            moveHandleType === MoveHandleType.Left ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR_1
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleRightRef}
                        args={[moveHandleSize, 6, 6]}
                        position={[hx + MOVE_HANDLE_OFFSET, handleLift, 0]}
                        name={MoveHandleType.Right}
                        onPointerDown={(e) => {
                            selectMe(id, e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Right);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Right ||
                            moveHandleType === MoveHandleType.Right ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR_1
                        }
                    />
                </Sphere>
            
                {/* rotation handle */}
                <group ref={rotationHandleLRef}
                    position={[0, 0, Math.min(-1.2*hy, -hy-0.75)]}
                    scale={ratio}
                    name={RotateHandleType.Lower}
                >
                    <RotateHandle color={
                        hoveredHandle === RotateHandleType.Lower || 
                        rotateHandleType === RotateHandleType.Lower ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR} 
                    />
                    <Plane name={RotateHandleType.Lower} args={[0.35, 0.35]} rotation={[-Math.PI/2, 0, 0]}
                        visible={false}
                        onPointerDown={(e) => {
                            selectMe(id, e, ActionType.Rotate);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, RotateHandleType.Lower);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                    />
                </group>
                <group ref={rotationHandleURef}
                    position={[0, 0, Math.max(1.2*hy, hy+0.75)]}
                    scale={ratio}
                    name={RotateHandleType.Upper}
                >
                    <RotateHandle color={
                        hoveredHandle === RotateHandleType.Upper || 
                        rotateHandleType === RotateHandleType.Upper ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR} 
                    />
                    <Plane name={RotateHandleType.Upper} args={[0.35, 0.35]} rotation={[-Math.PI/2, 0, 0]}
                        visible={false}
                        onPointerDown={(e) => {
                            selectMe(id, e, ActionType.Rotate);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, RotateHandleType.Upper);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                    />
                </group>
            </>
            }

            {(hovered && !selected) && <textSprite
                name={'Label'}
                text={'Foundation'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[0, hz + 0.2, 0]}/>
            }
            {!locked && hoveredResizeHandleLL && <textSprite
                name={'Label'}
                text={'LL'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[-hx, hz + 0.2, -hy]}/>
            }
            {!locked && hoveredResizeHandleUL && <textSprite
                name={'Label'}
                text={'UL'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[-hx, hz + 0.2, hy]}/>
            }
            {!locked && hoveredResizeHandleLR && <textSprite
                name={'Label'}
                text={'LR'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[hx, hz + 0.2, -hy]}/>
            }
            {!locked && hoveredResizeHandleUR && <textSprite
                name={'Label'}
                text={'UR'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[hx, hz + 0.2, hy]}/>
            }

        </group>
    )
};

export default React.memo(Foundation);
