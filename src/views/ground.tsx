/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import {Plane} from "@react-three/drei";
import {useStore} from "../stores/common";
import {DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3} from "three";
import {IntersectionPlaneType, MoveHandleType, ObjectType, ResizeHandleType} from "../types";
import {ElementModel} from "../models/elementModel";
import {useThree} from "@react-three/fiber";
import {MOVE_HANDLE_OFFSET} from "../constants";
import {Util} from "../util";

const Ground = () => {

    const setCommonStore = useStore(state => state.set);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const selectNone = useStore(state => state.selectNone);
    const moveHandleType = useStore(state => state.moveHandleType);
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const resizeAnchor = useStore(state => state.resizeAnchor);
    const groundColor = useStore(state => state.groundColor);
    const setElementPosition = useStore(state => state.setElementPosition);
    const setElementSize = useStore(state => state.setElementSize);
    const updateElement = useStore(state => state.updateElementById);
    const [grab, setGrab] = useState<ElementModel | null>(null);
    const {camera, gl: {domElement}} = useThree();
    const groundPlaneRef = useRef<Mesh>();
    const horizontalPlaneRef = useRef<Mesh>();
    const verticalPlaneRef = useRef<Mesh>();
    const ray = useMemo(() => new Raycaster(), []);

    let intersectionPlaneType = IntersectionPlaneType.Ground;
    const intersectionPlanePosition = useMemo(() => new Vector3(), []);
    const intersectionPlaneAngle = useMemo(() => new Euler(), []);
    if (grab) {
        if (moveHandleType === MoveHandleType.Top) {
            intersectionPlaneType = IntersectionPlaneType.Horizontal;
            Util.setVector(intersectionPlanePosition, grab.cx, grab.lz, -grab.cy);
            Util.setEuler(intersectionPlaneAngle, -Math.PI / 2, 0, 0);
        } else if (resizeHandleType === ResizeHandleType.LowerLeftTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            Util.setVector(intersectionPlanePosition, grab.cx - grab.lx / 2, 0, -grab.cy - grab.ly / 2);
            Util.setEuler(intersectionPlaneAngle, 0, 0, 0);
        } else if (resizeHandleType === ResizeHandleType.UpperLeftTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            Util.setVector(intersectionPlanePosition, grab.cx - grab.lx / 2, 0, -grab.cy + grab.ly / 2);
            Util.setEuler(intersectionPlaneAngle, 0, 0, 0);
        } else if (resizeHandleType === ResizeHandleType.LowerRightTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            Util.setVector(intersectionPlanePosition, grab.cx + grab.lx / 2, 0, -grab.cy - grab.ly / 2);
            Util.setEuler(intersectionPlaneAngle, 0, 0, 0);
        } else if (resizeHandleType === ResizeHandleType.UpperRightTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            Util.setVector(intersectionPlanePosition, grab.cx + grab.lx / 2, 0, -grab.cy + grab.ly / 2);
            Util.setEuler(intersectionPlaneAngle, 0, 0, 0);
        }
    }

    return (
        <>
            {grab && intersectionPlaneType === IntersectionPlaneType.Horizontal &&
            <Plane
                ref={horizontalPlaneRef}
                visible={false}
                rotation={intersectionPlaneAngle}
                position={intersectionPlanePosition}
                args={[1000, 1000]}>
                <meshStandardMaterial attach="material" side={DoubleSide} opacity={0.1} color={'white'}/>
            </Plane>
            }
            {grab && intersectionPlaneType === IntersectionPlaneType.Vertical &&
            <Plane
                ref={verticalPlaneRef}
                visible={false}
                rotation={intersectionPlaneAngle}
                position={intersectionPlanePosition}
                args={[1000, 1000]}>
                <meshStandardMaterial attach="material" side={DoubleSide} opacity={0.1} color={'white'}/>
            </Plane>
            }
            <Plane receiveShadow
                   ref={groundPlaneRef}
                   name={'Ground'}
                   rotation={[-Math.PI / 2, 0, 0]}
                   position={[0, -0.01, 0]}
                   args={[10000, 10000]}
                   onContextMenu={(e) => {
                       if (e.intersections.length > 0) {
                           const groundClicked = e.intersections[0].object === groundPlaneRef.current;
                           if (groundClicked) {
                               selectNone();
                               setCommonStore((state) => {
                                   state.clickObjectType = ObjectType.Ground;
                               });
                           }
                       }
                   }}
                   onPointerDown={(e) => {
                       if (e.intersections.length > 0) {
                           const groundClicked = e.intersections[0].object === groundPlaneRef.current;
                           if (groundClicked) {
                               setCommonStore((state) => {
                                   state.clickObjectType = ObjectType.Ground;
                               });
                               selectNone();
                           } else {
                               setGrab(getSelectedElement());
                               setCommonStore((state) => {
                                   state.enableOrbitController = false;
                               });
                           }
                       }
                   }}
                   onPointerUp={(e) => {
                       setGrab(null);
                       setCommonStore((state) => {
                           state.enableOrbitController = true;
                       });
                   }}
                   onPointerMove={(e) => {
                       if (grab && groundPlaneRef && groundPlaneRef.current && grab.type) {
                           const mouse = new Vector2();
                           mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
                           mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
                           ray.setFromCamera(mouse, camera);
                           let intersects;
                           switch (grab.type) {
                               case ObjectType.Sensor:
                                   intersects = ray.intersectObjects([groundPlaneRef.current]);
                                   if (intersects.length > 0) {
                                       const p = intersects[0].point;
                                       setElementPosition(grab.id, p.x, -p.z);
                                   }
                                   break;
                               case ObjectType.Foundation:
                                   intersects = ray.intersectObjects([groundPlaneRef.current]);
                                   if (intersects.length > 0) {
                                       const p = intersects[0].point;
                                       if (moveHandleType) {
                                           switch (moveHandleType) {
                                               case MoveHandleType.Lower:
                                                   setElementPosition(grab.id, p.x, -p.z - grab.ly / 2 - MOVE_HANDLE_OFFSET);
                                                   break;
                                               case MoveHandleType.Upper:
                                                   setElementPosition(grab.id, p.x, -p.z + grab.ly / 2 + MOVE_HANDLE_OFFSET);
                                                   break;
                                               case MoveHandleType.Left:
                                                   setElementPosition(grab.id, p.x + grab.lx / 2 + MOVE_HANDLE_OFFSET, -p.z);
                                                   break;
                                               case MoveHandleType.Right:
                                                   setElementPosition(grab.id, p.x - grab.lx / 2 - MOVE_HANDLE_OFFSET, -p.z);
                                                   break;
                                           }
                                       }
                                       if (resizeHandleType) {
                                           const lx = Math.max(Math.abs(resizeAnchor.x - p.x), 0.5);
                                           const ly = Math.max(Math.abs(resizeAnchor.y - p.z), 0.5);
                                           setElementSize(grab.id, lx, ly);
                                           switch (resizeHandleType) {
                                               case ResizeHandleType.LowerLeft:
                                                   setElementPosition(grab.id, p.x + lx / 2, -p.z - ly / 2);
                                                   break;
                                               case ResizeHandleType.UpperLeft:
                                                   setElementPosition(grab.id, p.x + lx / 2, -p.z + ly / 2);
                                                   break;
                                               case ResizeHandleType.LowerRight:
                                                   setElementPosition(grab.id, p.x - lx / 2, -p.z - ly / 2);
                                                   break;
                                               case ResizeHandleType.UpperRight:
                                                   setElementPosition(grab.id, p.x - lx / 2, -p.z + ly / 2);
                                                   break;
                                           }
                                       }
                                   }
                                   break;
                               case ObjectType.Cuboid:
                                   if (moveHandleType === MoveHandleType.Top && horizontalPlaneRef.current) {
                                       intersects = ray.intersectObjects([horizontalPlaneRef.current]);
                                       if (intersects.length > 0) {
                                           const p = intersects[0].point;
                                           setElementPosition(grab.id, p.x, -p.z);
                                       }
                                   } else if (verticalPlaneRef.current && (
                                       resizeHandleType === ResizeHandleType.LowerLeftTop ||
                                       resizeHandleType === ResizeHandleType.UpperLeftTop ||
                                       resizeHandleType === ResizeHandleType.LowerRightTop ||
                                       resizeHandleType === ResizeHandleType.UpperRightTop)) {
                                       intersects = ray.intersectObjects([verticalPlaneRef.current]);
                                       if (intersects.length > 0) {
                                           const p = intersects[0].point;
                                           updateElement(grab.id, {lz: Math.max(1, p.y)});
                                       }
                                   } else {
                                       intersects = ray.intersectObjects([groundPlaneRef.current]);
                                       if (intersects.length > 0) {
                                           const p = intersects[0].point;
                                           if (moveHandleType) {
                                               switch (moveHandleType) {
                                                   case MoveHandleType.Lower:
                                                       setElementPosition(grab.id, p.x, -p.z - grab.ly / 2 - MOVE_HANDLE_OFFSET);
                                                       break;
                                                   case MoveHandleType.Upper:
                                                       setElementPosition(grab.id, p.x, -p.z + grab.ly / 2 + MOVE_HANDLE_OFFSET);
                                                       break;
                                                   case MoveHandleType.Left:
                                                       setElementPosition(grab.id, p.x + grab.lx / 2 + MOVE_HANDLE_OFFSET, -p.z);
                                                       break;
                                                   case MoveHandleType.Right:
                                                       setElementPosition(grab.id, p.x - grab.lx / 2 - MOVE_HANDLE_OFFSET, -p.z);
                                                       break;
                                               }
                                           }
                                           if (resizeHandleType) {
                                               let lx, ly;
                                               switch (resizeHandleType) {
                                                   case ResizeHandleType.LowerLeft:
                                                       lx = Math.max((grab.cx - p.x) * 2, 0.5);
                                                       ly = Math.max(-(grab.cy + p.z) * 2, 0.5);
                                                       setElementSize(grab.id, lx, ly);
                                                       break;
                                                   case ResizeHandleType.UpperLeft:
                                                       lx = Math.max((grab.cx - p.x) * 2, 0.5);
                                                       ly = Math.max((grab.cy + p.z) * 2, 0.5);
                                                       setElementSize(grab.id, lx, ly);
                                                       break;
                                                   case ResizeHandleType.LowerRight:
                                                       lx = Math.max(-(grab.cx - p.x) * 2, 0.5);
                                                       ly = Math.max(-(grab.cy + p.z) * 2, 0.5);
                                                       setElementSize(grab.id, lx, ly);
                                                       break;
                                                   case ResizeHandleType.UpperRight:
                                                       lx = Math.max(-(grab.cx - p.x) * 2, 0.5);
                                                       ly = Math.max((grab.cy + p.z) * 2, 0.5);
                                                       setElementSize(grab.id, lx, ly);
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
                <meshStandardMaterial attach="material" color={groundColor}/>
            </Plane>
        </>
    )
};

export default Ground;
