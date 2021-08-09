/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from "react";
import { DoubleSide, Euler, FontLoader, TextGeometryParameters, Vector3 } from "three";
import { useLoader } from "@react-three/fiber";
import { Line, Ring } from "@react-three/drei";
import helvetikerFont from "./fonts/helvetiker_regular.typeface.fnt";

import {WORKSPACE_SIZE} from "./constants";
import { Util } from "./Util";
import {useStore} from "./stores/common";
import {ObjectType, ResizeHandleType} from "./types";
import { ElementModel } from "./models/ElementModel";

const Grid = () => {

    const grid = useStore((state) => state.grid);
    const enableOrbitController = useStore((state) => state.enableOrbitController);
    const getSelectedElement = useStore((state) => state.getSelectedElement);
    const viewStateGroundImage = useStore((state) => state.viewState.groundImage);
    const moveHandleType = useStore(state => state.moveHandleType);
    const rotateHandleType = useStore(state => state.rotateHandleType);
    const resizeHandleType = useStore(state => state.resizeHandleType);

    const [showGrid, setShowGrid] = useState(false);
    const [showScale, setShowScale] = useState(false);
    const element = getSelectedElement();
    
    useEffect(() => {
        if(resizeHandleType) {
            if( resizeHandleType === ResizeHandleType.LowerLeftTop ||
                resizeHandleType === ResizeHandleType.LowerRightTop ||
                resizeHandleType === ResizeHandleType.UpperLeftTop ||
                resizeHandleType === ResizeHandleType.UpperRightTop ) {
                    setShowGrid(false);
                    setShowScale(true);
                }
            else {
                setShowGrid(true);
                setShowScale(false);
            }
        }
        else {
            setShowGrid(false);
            setShowScale(false);
        }
    }, [resizeHandleType])
    
    // only these elements are allowed to be on the ground
    const legalOnGround = () => {
        const type = getSelectedElement()?.type;
        return (
            type === ObjectType.Foundation ||
            type === ObjectType.Cuboid ||
            type === ObjectType.Tree ||
            type === ObjectType.Human
        );
    };

    return (
        <React.Fragment>
            {(grid || !enableOrbitController) && legalOnGround() && !viewStateGroundImage && (
                <>
                    {(showGrid || moveHandleType) && <gridHelper name={"Grid"} args={[WORKSPACE_SIZE, WORKSPACE_SIZE, "gray", "gray"]} />}
                    {rotateHandleType && element && <PolarGrid element={element} />}
                    {showScale && element && <VerticalScale element={element} />}
                </>
            )}
        </React.Fragment>
    );
};

const PolarGrid = ({element}: {element: ElementModel}) => {

    const rotateHandle = useStore(state => state.rotateHandleType);
    const angle = useStore(state => state.selectedElementAngle);

    const [position, setPosition] = useState<Vector3>();
    const [radius, setRadius] = useState<number>(10);

    useEffect(() => {
        if(rotateHandle) {
            const {cx, cy, lx, ly} = element;
            setPosition(new Vector3(cx, 0, -cy));
            setRadius(Math.max(7, Math.sqrt(Math.pow(lx/2, 2) + Math.pow(ly/2, 2)) * 1.5));
        }
    }, [rotateHandle]);
    
    const font = useLoader(FontLoader, helvetikerFont);
    const fontSize = radius * 0.05;
    const textGeometryParams = {
        font: font,
        height: 0.0,
        size: fontSize,
    } as TextGeometryParameters;

    const _angle = angle > Math.PI ? angle - Math.PI * 2 : angle;
    const scale = new Array(25).fill(0);

    const getOffset = (i: number) => {
        if (i === 0) {
            return -fontSize * 0.3;
        }
        else if (i > 0 && i < 7) {
            return -fontSize * 0.8;
        }
        else {
            return -fontSize * 1.2;
        }
    }

    return (
        <>
            {position && 
            <group position={position} name={'Polar Grid'}>
                <polarGridHelper args={[radius, 24, 6]} />
                <Ring
                    args={[radius*0.98, radius, 24, 1, Math.PI/2, _angle]}
                    rotation={[-Util.HALF_PI, 0, 0]}
                >
                    <meshBasicMaterial side={DoubleSide} color={'yellow'} />
                </Ring>

                {/* shown angle */}
                <group rotation={[0, _angle, 0]}>
                    <mesh position={[-0.5, 0, -radius*0.9]} rotation={[-Util.HALF_PI, 0, 0]}>
                        <textGeometry args={[`${Math.abs(Math.floor(_angle/Math.PI*180))}°`, textGeometryParams]} />
                    </mesh>
                </group>

                {/* scale */}
                {scale.map((v, i) => {
                    const times = Math.ceil(i / 2) * (i % 2 === 0 ? 1 : -1);
                    const absTimes = Math.abs(times);
                    const offset = getOffset(absTimes);
                    return (
                        <group key={i} rotation={[0, times*Math.PI/12, 0]}>
                            <mesh position={[offset, 0, -radius*1.05]} rotation={[-Util.HALF_PI, 0, 0]}>
                                <textGeometry args={[`${15*absTimes}°`, textGeometryParams]} />
                            </mesh>
                        </group>
                    );
                })}
            </group>
            }
        </>
    )
}

const VerticalScale = ({element}: {element: ElementModel}) => {

    const getResizeHandlePosition = useStore(state => state.getResizeHandlePosition);
    const getCameraDirection = useStore(state => state.getCameraDirection);
    
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const selectedElementHeight = useStore(state => state.selectedElementHeight);
    
    const [position, setPostion] = useState<Vector3>();
    const [rotation, setRotation] = useState<Euler>();

    const font = useLoader(FontLoader, helvetikerFont);
    const fontSize = 0.4;
    const textGeometryParams = {
        font: font,
        height: 0.0,
        size: fontSize,
    } as TextGeometryParameters;

    useEffect(() => {
        if(resizeHandleType) {
            const handlePos = getResizeHandlePosition(element, resizeHandleType);
            const cameraDir = getCameraDirection();
            setPostion(new Vector3(handlePos.x, 0, handlePos.z));
            setRotation(new Euler(0, Math.atan2(cameraDir.x, cameraDir.z) - Math.PI, 0))
        }
    }, [resizeHandleType]);

    const height = Math.ceil(selectedElementHeight) + 1;
    const shownHeight = selectedElementHeight.toFixed(1);
    const scale = new Array(height+1).fill(0);

    return (
        <>
            {position && rotation &&
            <group position={position} rotation={rotation} name={'Vertical Scale'}>
                <Line points={[[0,0,0], [0,height,0]]} color={'white'} />
                {scale.map((e, i) => {
                    const len = 0.4 + (i % 5 === 0 ? 0.4: 0);
                    const lineWidth = i % 5 === 0 ? 1.5: 0.5;
                    const posL = i > 9 ? -1.7 : -1.5;
                    const posR = i > 9 ? 1 : 1.2;
                    const textGeometry = <textGeometry args={[`${i}`, textGeometryParams]} />;
                    return (
                    <group key={i}>
                        <Line points={[[-len, i, 0], [len, i, 0]]} lineWidth={lineWidth} color={'white'} />
                        <mesh position={[posL, i, 0]}>
                            {textGeometry}
                        </mesh>
                        <mesh position={[posR, i, 0]}>
                            {textGeometry}
                        </mesh>
                        <mesh position={[-0.5, parseFloat(shownHeight)+0.5, 0]}>
                            <textGeometry args={[`${shownHeight}`, textGeometryParams]} />
                        </mesh>
                    </group>
                    );
                })}
            </group>
            }
        </>
    )
}

export default React.memo(Grid);
