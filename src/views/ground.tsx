/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import {Plane} from "@react-three/drei";
import {useStore} from "../stores/common";
import {DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3} from "three";
import {IntersectionPlaneType, MoveHandleType, ObjectType, ResizeHandleType} from "../types";
import {ElementModel} from "../models/ElementModel";
import {useThree} from "@react-three/fiber";
import {MOVE_HANDLE_OFFSET, MOVE_HANDLE_RADIUS} from "../constants";
import {Util} from "../Util";

export interface GroundProps {
    objectTypeToAdd: ObjectType;
    setObjectTypeToAdd: (objectTypeToAdd: ObjectType) => void;
}

const Ground = ({
                    objectTypeToAdd = ObjectType.None,
                    setObjectTypeToAdd
                }: GroundProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const selectNone = useStore(state => state.selectNone);
    const moveHandleType = useStore(state => state.moveHandleType);
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const resizeAnchor = useStore(state => state.resizeAnchor);
    const setElementPosition = useStore(state => state.setElementPosition);
    const setElementSize = useStore(state => state.setElementSize);
    const updateElement = useStore(state => state.updateElementById);
    const addElement = useStore(state => state.addElement);
    const [grab, setGrab] = useState<ElementModel | null>(null);
    const {camera, gl: {domElement}} = useThree();
    const groundPlaneRef = useRef<Mesh>();
    const intersectionPlaneRef = useRef<Mesh>();

    const ray = useMemo(() => new Raycaster(), []);
    const cosAngle = useMemo(() => {
        if (grab) {
            return Math.cos(grab.rotation[1]);
        }
        return 1;
    }, [grab?.rotation]);
    const sinAngle = useMemo(() => {
        if (grab) {
            return Math.sin(grab.rotation[1]);
        }
        return 0;
    }, [grab?.rotation]);

    let intersectionPlaneType = IntersectionPlaneType.Ground;
    const intersectionPlanePosition = useMemo(() => new Vector3(), []);
    const intersectionPlaneAngle = useMemo(() => new Euler(), []);
    if (grab) {
        if (moveHandleType === MoveHandleType.Top) {
            intersectionPlaneType = IntersectionPlaneType.Horizontal;
            Util.setVector(intersectionPlanePosition, grab.cx, grab.lz + MOVE_HANDLE_OFFSET, -grab.cy);
            Util.setEuler(intersectionPlaneAngle, -Math.PI / 2, 0, 0);
        } else if (
            moveHandleType === MoveHandleType.Left || moveHandleType === MoveHandleType.Right ||
            moveHandleType === MoveHandleType.Lower || moveHandleType === MoveHandleType.Upper ||
            resizeHandleType === ResizeHandleType.LowerLeft || resizeHandleType === ResizeHandleType.UpperLeft ||
            resizeHandleType === ResizeHandleType.LowerRight || resizeHandleType === ResizeHandleType.UpperRight) {
            intersectionPlaneType = IntersectionPlaneType.Horizontal;
            Util.setVector(intersectionPlanePosition, grab.cx, MOVE_HANDLE_RADIUS, -grab.cy);
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
            {grab && intersectionPlaneType !== IntersectionPlaneType.Ground &&
            <Plane
                ref={intersectionPlaneRef}
                visible={false}
                rotation={intersectionPlaneAngle}
                position={intersectionPlanePosition}
                args={[1000, 1000]}>
                <meshStandardMaterial attach="material" side={DoubleSide} opacity={0.1} color={'white'}/>
            </Plane>
            }
            <Plane receiveShadow={viewState.shadowEnabled}
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
                                   Util.copyVector(state.pastePoint, e.intersections[0].point);
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
                               if (objectTypeToAdd !== ObjectType.None) {
                                   addElement(objectTypeToAdd, e.intersections[0].point);
                                   setObjectTypeToAdd(ObjectType.None);
                               }
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
                       if (grab && grab.type && !grab.locked) {
                           const mouse = new Vector2();
                           mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
                           mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
                           ray.setFromCamera(mouse, camera);
                           let intersects;
                           switch (grab.type) {
                               case ObjectType.Human:
                               case ObjectType.Tree:
                               case ObjectType.Sensor:
                                   if (groundPlaneRef.current) {
                                       intersects = ray.intersectObjects([groundPlaneRef.current]);
                                       if (intersects.length > 0) {
                                           const p = intersects[0].point;
                                           setElementPosition(grab.id, p.x, -p.z);
                                       }
                                   }
                                   break;
                               case ObjectType.Foundation:
                                   if (intersectionPlaneRef.current) {
                                       intersects = ray.intersectObjects([intersectionPlaneRef.current]);
                                       if (intersects.length > 0) {
                                           const p = intersects[0].point;
                                           if (moveHandleType) {
                                               let x0, y0;
                                               const hx = grab.lx / 2 + MOVE_HANDLE_OFFSET;
                                               const hy = grab.ly / 2 + MOVE_HANDLE_OFFSET;
                                               switch (moveHandleType) {
                                                   case MoveHandleType.Lower:
                                                       x0 = p.x + sinAngle * hy;
                                                       y0 = -p.z - cosAngle * hy;
                                                       setElementPosition(grab.id, x0, y0);
                                                       break;
                                                   case MoveHandleType.Upper:
                                                       x0 = p.x - sinAngle * hy;
                                                       y0 = -p.z + cosAngle * hy;
                                                       setElementPosition(grab.id, x0, y0);
                                                       break;
                                                   case MoveHandleType.Left:
                                                       x0 = p.x + cosAngle * hx;
                                                       y0 = -p.z + sinAngle * hx;
                                                       setElementPosition(grab.id, x0, y0);
                                                       break;
                                                   case MoveHandleType.Right:
                                                       x0 = p.x - cosAngle * hx;
                                                       y0 = -p.z - sinAngle * hx;
                                                       setElementPosition(grab.id, x0, y0);
                                                       break;
                                               }
                                           }
                                           if (resizeHandleType) {
                                               const lx = Math.abs(resizeAnchor.x - p.x);
                                               const ly = Math.abs(resizeAnchor.y - p.z);
                                               const dx = Math.abs(lx * cosAngle - ly * sinAngle) / 2;
                                               const dy = Math.abs(lx * sinAngle + ly * cosAngle) / 2;
                                               setElementSize(grab.id, lx, ly);
                                               switch (resizeHandleType) {
                                                   case ResizeHandleType.LowerLeft:
                                                       setElementPosition(grab.id, p.x + dx, -p.z - dy);
                                                       break;
                                                   case ResizeHandleType.UpperLeft:
                                                       setElementPosition(grab.id, p.x + dx, -p.z + dy);
                                                       break;
                                                   case ResizeHandleType.LowerRight:
                                                       setElementPosition(grab.id, p.x - dx, -p.z - dy);
                                                       break;
                                                   case ResizeHandleType.UpperRight:
                                                       setElementPosition(grab.id, p.x - dx, -p.z + dy);
                                                       break;
                                               }
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
                                                       setElementPosition(grab.id, p.x, -p.z);
                                                   } else {
                                                       let x0, y0;
                                                       const hx = grab.lx / 2 + MOVE_HANDLE_OFFSET;
                                                       const hy = grab.ly / 2 + MOVE_HANDLE_OFFSET;
                                                       switch (moveHandleType) {
                                                           case MoveHandleType.Lower:
                                                               x0 = p.x + sinAngle * hy;
                                                               y0 = -p.z - cosAngle * hy;
                                                               setElementPosition(grab.id, x0, y0);
                                                               break;
                                                           case MoveHandleType.Upper:
                                                               x0 = p.x - sinAngle * hy;
                                                               y0 = -p.z + cosAngle * hy;
                                                               setElementPosition(grab.id, x0, y0);
                                                               break;
                                                           case MoveHandleType.Left:
                                                               x0 = p.x + cosAngle * hx;
                                                               y0 = -p.z + sinAngle * hx;
                                                               setElementPosition(grab.id, x0, y0);
                                                               break;
                                                           case MoveHandleType.Right:
                                                               x0 = p.x - cosAngle * hx;
                                                               y0 = -p.z - sinAngle * hx;
                                                               setElementPosition(grab.id, x0, y0);
                                                               break;
                                                       }
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
                                       } else if (intersectionPlaneType === IntersectionPlaneType.Vertical) {
                                           if (
                                               resizeHandleType === ResizeHandleType.LowerLeftTop ||
                                               resizeHandleType === ResizeHandleType.UpperLeftTop ||
                                               resizeHandleType === ResizeHandleType.LowerRightTop ||
                                               resizeHandleType === ResizeHandleType.UpperRightTop) {
                                               intersects = ray.intersectObjects([intersectionPlaneRef.current]);
                                               if (intersects.length > 0) {
                                                   const p = intersects[0].point;
                                                   updateElement(grab.id, {lz: Math.max(1, p.y)});
                                               }
                                           }
                                       }
                                   }
                                   break;
                           }
                       }
                   }}
            >
                <meshStandardMaterial attach="material" color={viewState.groundColor}/>
            </Plane>
        </>
    )
};

export default Ground;
