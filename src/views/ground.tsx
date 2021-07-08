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

const Ground = () => {

    const setCommonStore = useStore(state => state.set);
    const groundModel = useStore(state => state.world.ground);
    const viewState = useStore(state => state.viewState);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const selectNone = useStore(state => state.selectNone);
    const objectTypeToAdd = useStore(state => state.objectTypeToAdd);
    const moveHandleType = useStore(state => state.moveHandleType);
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const resizeAnchor = useStore(state => state.resizeAnchor);
    const setElementPosition = useStore(state => state.setElementPosition);
    const setElementSize = useStore(state => state.setElementSize);
    const updateElement = useStore(state => state.updateElementById);
    const addElement = useStore(state => state.addElement);
    const {camera, gl: {domElement}} = useThree();
    const groundPlaneRef = useRef<Mesh>();
    const intersectionPlaneRef = useRef<Mesh>();
    const grabRef = useRef<ElementModel | null>(null);

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
            Util.setVector(intersectionPlanePosition, grabRef.current.cx, grabRef.current.lz + MOVE_HANDLE_OFFSET, -grabRef.current.cy);
            Util.setEuler(intersectionPlaneAngle, -Math.PI / 2, 0, 0);
        } else if (
            moveHandleType === MoveHandleType.Left || moveHandleType === MoveHandleType.Right ||
            moveHandleType === MoveHandleType.Lower || moveHandleType === MoveHandleType.Upper ||
            resizeHandleType === ResizeHandleType.LowerLeft || resizeHandleType === ResizeHandleType.UpperLeft ||
            resizeHandleType === ResizeHandleType.LowerRight || resizeHandleType === ResizeHandleType.UpperRight) {
            intersectionPlaneType = IntersectionPlaneType.Horizontal;
            Util.setVector(intersectionPlanePosition, grabRef.current.cx, MOVE_HANDLE_RADIUS, -grabRef.current.cy);
            Util.setEuler(intersectionPlaneAngle, -Math.PI / 2, 0, 0);
        } else if (resizeHandleType === ResizeHandleType.LowerLeftTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            Util.setVector(intersectionPlanePosition,
                grabRef.current.cx - grabRef.current.lx / 2, 0, -grabRef.current.cy - grabRef.current.ly / 2);
            Util.setEuler(intersectionPlaneAngle, 0, 0, 0);
        } else if (resizeHandleType === ResizeHandleType.UpperLeftTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            Util.setVector(intersectionPlanePosition,
                grabRef.current.cx - grabRef.current.lx / 2, 0, -grabRef.current.cy + grabRef.current.ly / 2);
            Util.setEuler(intersectionPlaneAngle, 0, 0, 0);
        } else if (resizeHandleType === ResizeHandleType.LowerRightTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            Util.setVector(intersectionPlanePosition,
                grabRef.current.cx + grabRef.current.lx / 2, 0, -grabRef.current.cy - grabRef.current.ly / 2);
            Util.setEuler(intersectionPlaneAngle, 0, 0, 0);
        } else if (resizeHandleType === ResizeHandleType.UpperRightTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            Util.setVector(intersectionPlanePosition,
                grabRef.current.cx + grabRef.current.lx / 2, 0, -grabRef.current.cy + grabRef.current.ly / 2);
            Util.setEuler(intersectionPlaneAngle, 0, 0, 0);
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

    return (
        <>
            {grabRef.current && intersectionPlaneType !== IntersectionPlaneType.Ground &&
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
                                   state.pasteNormal = Util.UNIT_VECTOR_POS_Y;
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
                                       setCommonStore((state) => {
                                           state.enableOrbitController = false;
                                       });
                                   }
                               }
                           }
                       }
                   }}
                   onPointerUp={(e) => {
                       grabRef.current = null;
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
                                               let x0, y0;
                                               const hx = grabRef.current.lx / 2 + MOVE_HANDLE_OFFSET;
                                               const hy = grabRef.current.ly / 2 + MOVE_HANDLE_OFFSET;
                                               switch (moveHandleType) {
                                                   case MoveHandleType.Lower:
                                                       x0 = p.x + sinAngle * hy;
                                                       y0 = -p.z - cosAngle * hy;
                                                       setElementPosition(grabRef.current.id, x0, y0);
                                                       break;
                                                   case MoveHandleType.Upper:
                                                       x0 = p.x - sinAngle * hy;
                                                       y0 = -p.z + cosAngle * hy;
                                                       setElementPosition(grabRef.current.id, x0, y0);
                                                       break;
                                                   case MoveHandleType.Left:
                                                       x0 = p.x + cosAngle * hx;
                                                       y0 = -p.z + sinAngle * hx;
                                                       setElementPosition(grabRef.current.id, x0, y0);
                                                       break;
                                                   case MoveHandleType.Right:
                                                       x0 = p.x - cosAngle * hx;
                                                       y0 = -p.z - sinAngle * hx;
                                                       setElementPosition(grabRef.current.id, x0, y0);
                                                       break;
                                               }
                                           }
                                           if (resizeHandleType) {
                                               const lx = Math.abs(resizeAnchor.x - p.x);
                                               const ly = Math.abs(resizeAnchor.y - p.z);
                                               const dx = Math.abs(lx * cosAngle - ly * sinAngle) / 2;
                                               const dy = Math.abs(lx * sinAngle + ly * cosAngle) / 2;
                                               setElementSize(grabRef.current.id, lx, ly);
                                               switch (resizeHandleType) {
                                                   case ResizeHandleType.LowerLeft:
                                                       setElementPosition(grabRef.current.id, p.x + dx, -p.z - dy);
                                                       break;
                                                   case ResizeHandleType.UpperLeft:
                                                       setElementPosition(grabRef.current.id, p.x + dx, -p.z + dy);
                                                       break;
                                                   case ResizeHandleType.LowerRight:
                                                       setElementPosition(grabRef.current.id, p.x - dx, -p.z - dy);
                                                       break;
                                                   case ResizeHandleType.UpperRight:
                                                       setElementPosition(grabRef.current.id, p.x - dx, -p.z + dy);
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
                                                       setElementPosition(grabRef.current.id, p.x, -p.z);
                                                   } else {
                                                       let x0, y0;
                                                       const hx = grabRef.current.lx / 2 + MOVE_HANDLE_OFFSET;
                                                       const hy = grabRef.current.ly / 2 + MOVE_HANDLE_OFFSET;
                                                       switch (moveHandleType) {
                                                           case MoveHandleType.Lower:
                                                               x0 = p.x + sinAngle * hy;
                                                               y0 = -p.z - cosAngle * hy;
                                                               setElementPosition(grabRef.current.id, x0, y0);
                                                               break;
                                                           case MoveHandleType.Upper:
                                                               x0 = p.x - sinAngle * hy;
                                                               y0 = -p.z + cosAngle * hy;
                                                               setElementPosition(grabRef.current.id, x0, y0);
                                                               break;
                                                           case MoveHandleType.Left:
                                                               x0 = p.x + cosAngle * hx;
                                                               y0 = -p.z + sinAngle * hx;
                                                               setElementPosition(grabRef.current.id, x0, y0);
                                                               break;
                                                           case MoveHandleType.Right:
                                                               x0 = p.x - cosAngle * hx;
                                                               y0 = -p.z - sinAngle * hx;
                                                               setElementPosition(grabRef.current.id, x0, y0);
                                                               break;
                                                       }
                                                   }
                                               }
                                               if (resizeHandleType) {
                                                   const lx = Math.max(Math.abs(resizeAnchor.x - p.x), 0.5);
                                                   const ly = Math.max(Math.abs(resizeAnchor.y - p.z), 0.5);
                                                   setElementSize(grabRef.current.id, lx, ly);
                                                   switch (resizeHandleType) {
                                                       case ResizeHandleType.LowerLeft:
                                                           setElementPosition(grabRef.current.id, p.x + lx / 2, -p.z - ly / 2);
                                                           break;
                                                       case ResizeHandleType.UpperLeft:
                                                           setElementPosition(grabRef.current.id, p.x + lx / 2, -p.z + ly / 2);
                                                           break;
                                                       case ResizeHandleType.LowerRight:
                                                           setElementPosition(grabRef.current.id, p.x - lx / 2, -p.z - ly / 2);
                                                           break;
                                                       case ResizeHandleType.UpperRight:
                                                           setElementPosition(grabRef.current.id, p.x - lx / 2, -p.z + ly / 2);
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
                                                   updateElement(grabRef.current.id, {lz: Math.max(1, p.y)});
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

export default React.memo(Ground);
