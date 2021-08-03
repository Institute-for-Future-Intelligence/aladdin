/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from "react";
import { DoubleSide, FontLoader, TextGeometryParameters, Vector3 } from "three";
import { useLoader } from "@react-three/fiber";
import { Ring } from "@react-three/drei";
import helvetikerFont from "./fonts/helvetiker_regular.typeface.fnt";

import {WORKSPACE_SIZE} from "./constants";
import { Util } from "./Util";
import {useStore} from "./stores/common";
import {ObjectType} from "./types";

const Grid = () => {

    const grid = useStore((state) => state.grid);
    const enableOrbitController = useStore((state) => state.enableOrbitController);
    const getSelectedElement = useStore((state) => state.getSelectedElement);
    const viewStateGroundImage = useStore((state) => state.viewState.groundImage);
    const rotateHandle = useStore(state => state.rotateHandleType);
    const angle = useStore(state => state.selectedElementAngle);

    const [position, setPosition] = useState<Vector3>();
    const [radius, setRadius] = useState(10);

    useEffect(() => {
        const element = getSelectedElement();
        if(element) {
            const {cx, cy, lx, ly} = element;
            setPosition(new Vector3(cx, 0, -cy));
            setRadius(Math.max(7, Math.sqrt(Math.pow(lx/2, 2) + Math.pow(ly/2, 2)) * 1.5));
        }
        if(!rotateHandle) {
            setPosition(undefined);
        }
    }, [rotateHandle]);

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
                rotateHandle ? 
                (position && <PolarGrid position={position} radius={radius} angle={angle} />) :
                <gridHelper name={"Grid"} args={[WORKSPACE_SIZE, WORKSPACE_SIZE, "gray", "gray"]} />
            )}
        </React.Fragment>
    );
};

const PolarGrid = ({position, radius, angle}: {position: Vector3, radius: number, angle: number}) => {
    
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
        <group position={position}>
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
                    <textGeometry args={[`${Math.abs(Math.floor(_angle/Math.PI*180))}`, textGeometryParams]} />
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
                            <textGeometry args={[`${15*absTimes}`, textGeometryParams]} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    )
}

export default React.memo(Grid);
