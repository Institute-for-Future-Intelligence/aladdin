/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import * as THREE from "three";

export interface AxesProps {
    endPoint?: number,

    [key: string]: any;
}

const Axes = ({
                  endPoint = 1000,
                  ...props
              }: AxesProps) => {
    const mesh = useRef<THREE.Mesh>(null!);

    const pointsXAxis = [];
    pointsXAxis.push(new THREE.Vector3(-endPoint, 0, 0));
    pointsXAxis.push(new THREE.Vector3(endPoint, 0, 0));
    const geometryXAxis = new THREE.BufferGeometry().setFromPoints(pointsXAxis);
    const materialXAxis = new THREE.LineBasicMaterial({color: 'red', linewidth: 10});

    const pointsYAxis = [];
    pointsYAxis.push(new THREE.Vector3(0, -endPoint, 0));
    pointsYAxis.push(new THREE.Vector3(0, endPoint, 0));
    const geometryYAxis = new THREE.BufferGeometry().setFromPoints(pointsYAxis);
    const materialYAxis = new THREE.LineBasicMaterial({color: 'green', linewidth: 10});

    const pointsZAxis = [];
    pointsZAxis.push(new THREE.Vector3(0, 0, -endPoint));
    pointsZAxis.push(new THREE.Vector3(0, 0, endPoint));
    const geometryZAxis = new THREE.BufferGeometry().setFromPoints(pointsZAxis);
    const materialZAxis = new THREE.LineBasicMaterial({color: 'blue', linewidth: 10});

    return (
        <mesh
            {...props}
            ref={mesh}
        >
            <lineSegments args={[geometryXAxis, materialXAxis]}/>
            <lineSegments args={[geometryYAxis, materialYAxis]}/>
            <lineSegments args={[geometryZAxis, materialZAxis]}/>
        </mesh>
    )
};

export default Axes;
