/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useMemo, useRef, useState} from "react";
import {Plane} from "@react-three/drei";
import {useStore} from "../stores/common";
import {DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3} from "three";
import {IntersectionPlaneType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType} from "../types";
import {ElementModel} from "../models/ElementModel";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {MOVE_HANDLE_OFFSET, MOVE_HANDLE_RADIUS} from "../constants";
import {Util} from "../Util";

const Ground = () => {

    const setCommonStore = useStore(state => state.set);
    const groundModel = useStore(state => state.world.ground);
    const viewState = useStore(state => state.viewState);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const selectNone = useStore(state => state.selectNone);
    const objectTypeToAdd = useStore(state => state.objectTypeToAdd);
    const moveHandleType = useStore(state => state.moveHandleType);
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const rotateHandleType = useStore(state => state.rotateHandleType);
    const resizeAnchor = useStore(state => state.resizeAnchor);
    const setElementPosition = useStore(state => state.setElementPosition);
    const setElementSize = useStore(state => state.setElementSize);
    const setElementRotation = useStore(state => state.setElementRotation);
    const updateElement = useStore(state => state.updateElementById);
    const addElement = useStore(state => state.addElement);
    const getCameraDirection = useStore(state => state.getCameraDirection);
    const getResizeHandlePosition = useStore(state => state.getResizeHandlePosition);
    const {camera, gl: {domElement}} = useThree();
    const groundPlaneRef = useRef<Mesh>();
    const intersectionPlaneRef = useRef<Mesh>();
    const grabRef = useRef<ElementModel | null>(null);

    useEffect(() => {
        window.addEventListener('pointerup', handlePointerUp);
        return (() => {
            window.removeEventListener('pointerup', handlePointerUp);
        })
    }, [])

    const ray = useMemo(() => new Raycaster(), []);
    const cosAngle = useMemo(() => {
        if (grabRef.current) {
            return Math.cos(grabRef.current.rotation[2]);
        }
        return 1;
    }, [grabRef.current?.rotation]);
    const sinAngle = useMemo(() => {
        if (grabRef.current) {
            return Math.sin(grabRef.current.rotation[2]);
        }
        return 0;
    }, [grabRef.current?.rotation]);
    
    let intersectionPlaneType = IntersectionPlaneType.Ground;
    const intersectionPlanePosition = useMemo(() => new Vector3(), []);
    const intersectionPlaneAngle = useMemo(() => new Euler(), []);

    if (grabRef.current) {
        if (moveHandleType === MoveHandleType.Top) {
            intersectionPlaneType = IntersectionPlaneType.Horizontal;
            intersectionPlanePosition.set(
                grabRef.current.cx,
                grabRef.current.lz + MOVE_HANDLE_OFFSET,
                -grabRef.current.cy
            );
            intersectionPlaneAngle.set(-Util.HALF_PI, 0, 0);
        } else if (
            moveHandleType === MoveHandleType.Left ||
            moveHandleType === MoveHandleType.Right ||
            moveHandleType === MoveHandleType.Lower ||
            moveHandleType === MoveHandleType.Upper ||
            resizeHandleType === ResizeHandleType.LowerLeft ||
            resizeHandleType === ResizeHandleType.UpperLeft ||
            resizeHandleType === ResizeHandleType.LowerRight ||
            resizeHandleType === ResizeHandleType.UpperRight ||
            rotateHandleType === RotateHandleType.Lower ||
            rotateHandleType === RotateHandleType.Upper) {
            intersectionPlaneType = IntersectionPlaneType.Horizontal;
            intersectionPlanePosition.set(
                grabRef.current.cx,
                MOVE_HANDLE_RADIUS,
                -grabRef.current.cy
            );
            intersectionPlaneAngle.set(-Util.HALF_PI, 0, 0);
        } else if (resizeHandleType) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            const handlePosition = getResizeHandlePosition(grabRef.current, resizeHandleType);
            const cameraPostion = getCameraDirection();
            const rotation = Math.atan2(cameraPostion.x, cameraPostion.z);
            intersectionPlanePosition.set(handlePosition.x, 0, handlePosition.z);
            intersectionPlaneAngle.set(0, rotation, 0);
        } 
    }

    const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
        if (e.intersections.length > 0) {
            const groundClicked = e.intersections[0].object === groundPlaneRef.current;
            if (groundClicked) {
                selectNone();
                setCommonStore((state) => {
                    state.pastePoint.copy(e.intersections[0].point);
                    state.clickObjectType = ObjectType.Ground;
                    state.pasteNormal = Util.UNIT_VECTOR_POS_Y;
                });
            }
        }
    };

    const handlePointerUp = () => {
        grabRef.current = null;
        setCommonStore((state) => {
            state.moveHandleType = null;
            state.resizeHandleType = null;
            state.rotateHandleType = null;
            state.enableOrbitController = true;
        });
    };

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (e.button === 2) return; // ignore right-click
        if (e.intersections.length > 0) {
            const groundClicked = e.intersections[0].object === groundPlaneRef.current;
            if (groundClicked) {
                setCommonStore((state) => {
                    state.clickObjectType = ObjectType.Ground;
                });
                selectNone();
                if (legalOnGround(objectTypeToAdd)) {
                    addElement(groundModel, e.intersections[0].point);
                    setCommonStore(state => {
                        state.objectTypeToAdd = ObjectType.None;
                    });
                }
            } else {
                const selectedElement = getSelectedElement();
                if (selectedElement) {
                    if (legalOnGround(selectedElement.type as ObjectType)) {
                        grabRef.current = selectedElement;
                        if (selectedElement.type !== ObjectType.Foundation &&
                            selectedElement.type !== ObjectType.Cuboid) {
                            setCommonStore((state) => {
                                state.enableOrbitController = false;
                            });
                        }
                    }
                }
            }
        }
    };

    const handleGroudPointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
            const mouse = new Vector2();
            mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
            mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
            ray.setFromCamera(mouse, camera);
            let intersects;
            switch (grabRef.current.type) {
                case ObjectType.Human:
                case ObjectType.Tree:
                    if (groundPlaneRef.current) {
                        intersects = ray.intersectObjects([groundPlaneRef.current]);
                        if (intersects.length > 0) {
                            const p = intersects[0].point;
                            setElementPosition(grabRef.current.id, p.x, -p.z);
                        }
                    }
                    break;
                case ObjectType.Foundation:
                    if (intersectionPlaneRef.current) {
                        intersects = ray.intersectObjects([intersectionPlaneRef.current]);
                        if (intersects.length > 0) {
                            const p = intersects[0].point;
                            if (moveHandleType) {
                                 handleMove(p);
                            } else if (resizeHandleType) {
                                 handleResize(p);
                            } else if (rotateHandleType) {
                                 handleRotate(p);
                            }
                        }
                    }
                    break;
                case ObjectType.Cuboid:
                    if (intersectionPlaneRef.current) {
                        if (intersectionPlaneType === IntersectionPlaneType.Horizontal) {
                            intersects = ray.intersectObjects([intersectionPlaneRef.current]);
                            if (intersects.length > 0) {
                                const p = intersects[0].point;
                                if (moveHandleType) {
                                    if (moveHandleType === MoveHandleType.Top) {
                                        setElementPosition(grabRef.current.id, p.x, -p.z);
                                    } else {
                                         handleMove(p);
                                    }
                                } else if (resizeHandleType) {
                                     handleResize(p);
                                } else if (rotateHandleType) {
                                     handleRotate(p);
                                }
                            }
                        } 
                    }
                    break;
            }
        }
    }

    const handleIntersectionPointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
            const mouse = new Vector2();
            mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
            mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
            ray.setFromCamera(mouse, camera);
            let intersects;
            if (grabRef.current.type === ObjectType.Cuboid && 
                intersectionPlaneRef.current &&
                intersectionPlaneType === IntersectionPlaneType.Vertical) {
                if (
                    resizeHandleType === ResizeHandleType.LowerLeftTop ||
                    resizeHandleType === ResizeHandleType.UpperLeftTop ||
                    resizeHandleType === ResizeHandleType.LowerRightTop ||
                    resizeHandleType === ResizeHandleType.UpperRightTop) {
                    intersects = ray.intersectObjects([intersectionPlaneRef.current]);
                    if (intersects.length > 0) {
                        const p = intersects[0].point;
                        updateElement(grabRef.current.id, {lz: Math.max(1, p.y)});
                    }
                }
            }
        }
    }

    // only these elements are allowed to be on the ground
    const legalOnGround = (type: ObjectType) => {
        return (
            type === ObjectType.Foundation ||
            type === ObjectType.Cuboid ||
            type === ObjectType.Tree ||
            type === ObjectType.Human
        );
    };

    const handleResize = (p: Vector3) => {
        const P = new Vector2(p.x, p.z);
        const R = resizeAnchor.distanceTo(P);
        const angle = Math.atan2(P.x-resizeAnchor.x, P.y-resizeAnchor.y) - grabRef.current!.rotation[2];
        const lx = Math.abs(R * Math.sin(angle));
        const ly = Math.abs(R * Math.cos(angle));
        const c = new Vector2().addVectors(P, resizeAnchor).divideScalar(2);
        setElementSize(grabRef.current!.id, lx, ly);
        setElementPosition(grabRef.current!.id, c.x, -c.y);
    }

    const handleRotate = (p: Vector3) => {
        const element = getSelectedElement();
        if(element) {
            const {cx, cy} = element;
            const rotation = Math.atan2(cx - p.x, -cy - p.z) + (rotateHandleType === RotateHandleType.Lower ? 0 : Math.PI);
            setElementRotation(grabRef.current!.id, 0, 0, rotation);
        }
    }

    const handleMove = (p: Vector3) => {
        let x0, y0;
        const hx = grabRef.current!.lx / 2 + MOVE_HANDLE_OFFSET;
        const hy = grabRef.current!.ly / 2 + MOVE_HANDLE_OFFSET;
        switch (moveHandleType) {
            case MoveHandleType.Lower:
                x0 = p.x + sinAngle * hy;
                y0 = -p.z - cosAngle * hy;
                setElementPosition(grabRef.current!.id, x0, y0);
                break;
            case MoveHandleType.Upper:
                x0 = p.x - sinAngle * hy;
                y0 = -p.z + cosAngle * hy;
                setElementPosition(grabRef.current!.id, x0, y0);
                break;
            case MoveHandleType.Left:
                x0 = p.x + cosAngle * hx;
                y0 = -p.z + sinAngle * hx;
                setElementPosition(grabRef.current!.id, x0, y0);
                break;
            case MoveHandleType.Right:
                x0 = p.x - cosAngle * hx;
                y0 = -p.z - sinAngle * hx;
                setElementPosition(grabRef.current!.id, x0, y0);
                break;
        }
    }

    return (
        <>
            {grabRef.current && intersectionPlaneType !== IntersectionPlaneType.Ground &&
            <Plane
                ref={intersectionPlaneRef}
                visible={false}
                name={'Groud Intersection Plane'}
                rotation={intersectionPlaneAngle}
                position={intersectionPlanePosition}
                args={[1000, 1000]}
                onPointerMove={handleIntersectionPointerMove}
            >
                <meshStandardMaterial side={DoubleSide}/>
            </Plane>
            }
            <Plane receiveShadow={viewState.shadowEnabled}
                   ref={groundPlaneRef}
                   name={'Ground'}
                   rotation={[-Util.HALF_PI, 0, 0]}
                   position={[0, 0, 0]}
                   args={[10000, 10000]}
                   renderOrder={-2}
                   onContextMenu={handleContextMenu}
                   onPointerDown={handlePointerDown}
                   onPointerMove={handleGroudPointerMove}
            >
                <meshStandardMaterial depthTest={false} color={viewState.groundColor}/>
            </Plane>
        </>
    )
};

export default React.memo(Ground);
