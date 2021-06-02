/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {Util} from "../util";
import {useEffect, useMemo, useState} from "react";
import {
    BufferAttribute,
    BufferGeometry,
    Color,
    DoubleSide,
    Euler,
    MeshBasicMaterial,
    Plane,
    SphereGeometry,
    Vector3
} from "three";

export interface HeliodonProps {
    date: Date;
    latitude: number;

    [key: string]: any;
}

const TILT_ANGLE = 23.45 / 180.0 * Math.PI;
const HOUR_DIVISIONS = 96;
const BASE_DIVISIONS = 72;
const DECLINATION_DIVISIONS = 12;
const r = 5;

const computeDeclinationAngle = (date: Date) => {
    const days = Math.floor((date.getTime()
        - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return TILT_ANGLE * Math.sin(Util.TWO_PI * (284 + days) / 365.25);
};

const computeHourAngle = (date: Date) => {
    const minutes = date.getHours() * 60 + date.getMinutes() - 12 * 60;
    return minutes / (12.0 * 60.0) * Math.PI;
}

const computeSunLocation = (hourAngle: number,
                            declinationAngle: number,
                            observerLatitude: number) => {
    const altitudeAngle = Math.asin(
        Math.sin(declinationAngle) * Math.sin(observerLatitude) +
        Math.cos(declinationAngle) * Math.cos(hourAngle) * Math.cos(observerLatitude)
    );
    const xAzm = Math.sin(hourAngle) * Math.cos(declinationAngle);
    const yAzm = Math.cos(observerLatitude) * Math.sin(declinationAngle)
        - Math.cos(hourAngle) * Math.cos(declinationAngle) * Math.sin(observerLatitude);
    const azimuthAngle = Math.atan2(yAzm, xAzm);
    const coords = new Vector3(r, azimuthAngle, altitudeAngle);
    Util.sphericalToCartesianZ(coords);
    // reverse the x so that sun moves from east to west
    coords.setX(-coords.x);
    return coords;
};

const Heliodon = ({
                      date = new Date(),
                      latitude = 42 / 180.0 * Math.PI,
                      ...props
                  }: HeliodonProps) => {

    const [declinationAngle, setDeclinationAngle] = useState<number>(0);
    const [hourAngle, setHouseAngle] = useState<number>(0);

    useEffect(() => {
        return () => {
            // remove listeners if any
        }
    }, []);

    const [basePositions, baseNormals, baseColors, tickPoints] = useMemo(() => {
        const basePoints: Vector3[] = [];
        const tickPoints: Vector3[] = [];
        const step = Math.PI * 2 / BASE_DIVISIONS;
        let counter = 0;
        for (let angle = 0; angle < Util.TWO_PI + step / 2.0; angle += step) {
            const trimedAngle = Math.min(angle, Util.TWO_PI);
            let width = 0.3;
            // TODO: This is inefficient. We should use indexed buffer to share vertices
            basePoints.push(Util.sphericalToCartesianZ(new Vector3(r, trimedAngle, 0)));
            basePoints.push(Util.sphericalToCartesianZ(new Vector3(r + width, trimedAngle, 0)));
            basePoints.push(Util.sphericalToCartesianZ(new Vector3(r, trimedAngle + step, 0)));
            basePoints.push(Util.sphericalToCartesianZ(new Vector3(r + width, trimedAngle, 0)));
            basePoints.push(Util.sphericalToCartesianZ(new Vector3(r + width, trimedAngle + step, 0)));
            basePoints.push(Util.sphericalToCartesianZ(new Vector3(r, trimedAngle + step, 0)));
            let p;
            if (Util.TWO_PI - trimedAngle > Util.ZERO_TOLERANCE) {
                width = counter % 3 === 0 ? 0.5 : 0.3;
                p = new Vector3(r, trimedAngle, 0);
                p.z = 0.002;
                tickPoints.push(Util.sphericalToCartesianZ(p));
                p = new Vector3(r + width, trimedAngle, 0);
                p.z = 0.002;
                tickPoints.push(Util.sphericalToCartesianZ(p));
            }
            counter++;
        }

        // attributes
        const length = basePoints.length * 3;
        const basePositions = new Float32Array(length);
        const baseNormals = new Float32Array(length);
        const baseColors = new Float32Array(length);

        for (let i = 0; i < basePoints.length; i++) {
            const j = i * 3;
            basePositions[j] = basePoints[i].x;
            basePositions[j + 1] = basePoints[i].y;
            basePositions[j + 2] = basePoints[i].z;
            baseNormals[j] = 0;
            baseNormals[j + 1] = 1;
            baseNormals[j + 2] = 0;
            const c = (Math.floor(i / 18)) % 2 === 0 ? 0.2 : 1.0;
            baseColors[j] = c;
            baseColors[j + 1] = c;
            baseColors[j + 2] = c;
        }

        return [basePositions, baseNormals, baseColors, tickPoints];
    }, []);

    const sunPathPoints = useMemo(() => {
        const step = Util.TWO_PI / HOUR_DIVISIONS;
        const points = [];
        for (let hourAngle = -Math.PI; hourAngle < Math.PI + step / 2.0; hourAngle += step) {
            const v = computeSunLocation(hourAngle, declinationAngle, latitude);
            if (v.z > -0.3) {
                points.push(v);
            }
        }
        return points;
    }, [latitude, date]);

    const sunPosition = useMemo(() => {
        setHouseAngle(computeHourAngle(date));
        setDeclinationAngle(computeDeclinationAngle(date));
        return computeSunLocation(hourAngle, declinationAngle, latitude);
    }, [latitude, date]);

    const sunbeltGeometry = useMemo(() => {
        const declinationStep = 2.0 * TILT_ANGLE / DECLINATION_DIVISIONS;
        const hourStep = Util.TWO_PI / HOUR_DIVISIONS;
        const geometry = new BufferGeometry();
        let verticesCount = 0;
        const vertices: Vector3[] = [];
        const indices = [];
        for (let declinationAngle = -TILT_ANGLE; declinationAngle < TILT_ANGLE - declinationStep / 2.0; declinationAngle += declinationStep) {
            for (let hourAngle = -Math.PI; hourAngle < Math.PI - hourStep / 2.0; hourAngle += hourStep) {
                let hourAngle2 = hourAngle + hourStep;
                let declinationAngle2 = declinationAngle + declinationStep;
                if (hourAngle2 > Math.PI) {
                    hourAngle2 = Math.PI;
                }
                if (declinationAngle2 > TILT_ANGLE) {
                    declinationAngle2 = TILT_ANGLE;
                }
                const v1 = computeSunLocation(hourAngle, declinationAngle, latitude);
                const v2 = computeSunLocation(hourAngle2, declinationAngle, latitude);
                const v3 = computeSunLocation(hourAngle2, declinationAngle2, latitude);
                const v4 = computeSunLocation(hourAngle, declinationAngle2, latitude);
                if (v1.z >= 0 || v2.z >= 0 || v3.z >= 0 || v4.z >= 0) {
                    vertices.push(v1, v2, v3, v4);
                    indices.push(verticesCount);
                    indices.push(verticesCount + 1);
                    indices.push(verticesCount + 2);
                    indices.push(verticesCount);
                    indices.push(verticesCount + 2);
                    indices.push(verticesCount + 3);
                    verticesCount += 4;
                }
            }
        }
        geometry.setFromPoints(vertices);
        geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));
        return geometry;
    }, [latitude]);

    return (
        <mesh rotation={new Euler(-Math.PI / 2, 0, 0)}>
            {/* draw base */}
            <mesh>
                <bufferGeometry attach='geometry'>
                    <bufferAttribute
                        attachObject={["attributes", "position"]}
                        count={basePositions.length / 3}
                        array={basePositions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attachObject={["attributes", "normal"]}
                        count={baseNormals.length / 3}
                        array={baseNormals}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attachObject={["attributes", "color"]}
                        count={baseColors.length / 3}
                        array={baseColors}
                        itemSize={3}
                    />
                </bufferGeometry>
                <meshBasicMaterial side={DoubleSide}
                                   vertexColors={true}
                                   polygonOffset={true}
                                   polygonOffsetFactor={-0.7}
                                   polygonOffsetUnits={-2}/>
            </mesh>
            <lineSegments
                args={[new BufferGeometry().setFromPoints(tickPoints),
                    new MeshBasicMaterial({color: 0x000000})]}/>
            {/* draw sun path*/}
            <mesh>
                <lineSegments
                    args={[new BufferGeometry().setFromPoints(sunPathPoints),
                        new MeshBasicMaterial({
                                color: new Color(1, 1, 0),
                                clippingPlanes: [new Plane(Util.UNIT_VECTOR_POS_Y, 0)]
                            }
                        )]}/>
                <mesh
                    args={[sunbeltGeometry,
                        new MeshBasicMaterial({
                            side: DoubleSide,
                            color: new Color(1, 1, 0),
                            transparent: true,
                            opacity: 0.5,
                            clippingPlanes: [new Plane(Util.UNIT_VECTOR_POS_Y, 0)]
                        })
                    ]}/>
                <mesh
                    position={sunPosition}
                    args={[new SphereGeometry(0.25, 20, 20),
                        new MeshBasicMaterial({color: 0xffffff00})
                    ]}/>
            </mesh>
        </mesh>
    );

};

export default Heliodon;
