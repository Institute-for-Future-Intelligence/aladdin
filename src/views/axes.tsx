/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {BufferGeometry, LineBasicMaterial, Mesh, Vector3} from "three";

export interface AxesProps {
    endPoint?: number,

    [key: string]: any;
}

const Axes = ({
                  endPoint = 1000,
                  ...props
              }: AxesProps) => {
    const mesh = useRef<Mesh>(null!);

    const pointsXAxis = [];
    pointsXAxis.push(new Vector3(-endPoint, 0, 0));
    pointsXAxis.push(new Vector3(endPoint, 0, 0));
    const geometryXAxis = new BufferGeometry().setFromPoints(pointsXAxis);
    const materialXAxis = new LineBasicMaterial({color: 'red', linewidth: 10});

    const pointsYAxis = [];
    pointsYAxis.push(new Vector3(0, -endPoint, 0));
    pointsYAxis.push(new Vector3(0, endPoint, 0));
    const geometryYAxis = new BufferGeometry().setFromPoints(pointsYAxis);
    const materialYAxis = new LineBasicMaterial({color: 'green', linewidth: 10});

    const pointsZAxis = [];
    pointsZAxis.push(new Vector3(0, 0, -endPoint));
    pointsZAxis.push(new Vector3(0, 0, endPoint));
    const geometryZAxis = new BufferGeometry().setFromPoints(pointsZAxis);
    const materialZAxis = new LineBasicMaterial({color: 'blue', linewidth: 10});

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
