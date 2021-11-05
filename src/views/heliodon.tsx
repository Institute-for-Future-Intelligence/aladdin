/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Util } from '../Util';
import React, { useEffect, useMemo, useState } from 'react';
import { BufferAttribute, BufferGeometry, DoubleSide, Euler, Plane, Vector3 } from 'three';
import { computeDeclinationAngle, computeHourAngle, computeSunLocation, TILT_ANGLE } from '../analysis/sunTools';
import { Line, Plane as Drei_Plane } from '@react-three/drei';
import { useStore } from '../stores/common';

export interface HeliodonProps {
  [key: string]: any;
}

const HOUR_DIVISIONS = 96;
const BASE_DIVISIONS = 72;
const DECLINATION_DIVISIONS = 12;

const Heliodon = ({}: HeliodonProps) => {
  const worldLatitude = useStore((state) => state.world.latitude);
  const dateString = useStore((state) => state.world.date);
  const aabb = useStore((state) => state.aabb);
  const radius = useStore((state) => state.heliodonRadius);
  const heliodon = useStore((state) => state.viewState.heliodon);
  const setRadius = useStore((state) => state.setHeliodonRadius);
  const setSunlightDirection = useStore((state) => state.setSunlightDirection);

  const [hourAngle, setHourAngle] = useState<number>(0);
  const [declinationAngle, setDeclinationAngle] = useState<number>(0);
  const [latitude, setLatitude] = useState<number>(Util.toRadians(42));

  useEffect(() => {
    setLatitude(Util.toRadians(worldLatitude));
  }, [worldLatitude]);

  useEffect(() => {
    const date = new Date(dateString);
    setHourAngle(computeHourAngle(date));
    setDeclinationAngle(computeDeclinationAngle(date));
  }, [dateString]);

  useEffect(() => {
    const min = aabb.min;
    const max = aabb.max;
    let r = Math.abs(min.x);
    if (r < Math.abs(min.y)) r = Math.abs(min.y);
    if (r < Math.abs(min.z)) r = Math.abs(min.z);
    if (r < Math.abs(max.x)) r = Math.abs(max.x);
    if (r < Math.abs(max.y)) r = Math.abs(max.y);
    if (r < Math.abs(max.z)) r = Math.abs(max.z);
    if (!isNaN(r) && isFinite(r)) {
      // have to round this, otherwise the result is different even if nothing moved.
      setRadius(Math.round(Math.max(10, r * 1.25))); // make it 25% larger than the bounding box
    }
  }, [aabb]);

  useEffect(() => {
    setSunlightDirection(computeSunLocation(radius, hourAngle, declinationAngle, Util.toRadians(worldLatitude)));
  }, [worldLatitude, hourAngle, declinationAngle, radius]);

  const nRibLines = 5;

  const [baseGeometry, lineGeometry] = useMemo(() => {
    const baseGeometry = new BufferGeometry();
    const lineGeometry = new BufferGeometry();
    const basePoints: Vector3[] = [];
    const tickPoints: Vector3[] = [];
    const step = Util.TWO_PI / BASE_DIVISIONS;
    let counter = 0;
    for (let angle = 0; angle < Util.TWO_PI + step / 2.0; angle += step) {
      const theta = Math.min(angle, Util.TWO_PI);
      let width = 0.05 * radius;
      // TODO: This is inefficient. We should use indexed buffer to share vertices
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius, theta, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius + width, theta, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius, theta + step, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius + width, theta, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius + width, theta + step, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius, theta + step, 0)));
      let p;
      if (Util.TWO_PI - theta > Util.ZERO_TOLERANCE) {
        width = 0.05 * radius + (counter % 3 === 0 ? 0.2 : 0);
        p = new Vector3(radius, theta, 0);
        p.z = 0.002;
        tickPoints.push(Util.sphericalToCartesianZ(p));
        p = new Vector3(radius + width, theta, 0);
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
      const c = Math.floor(i / 18) % 2 === 0 ? 0.2 : 1.0;
      baseColors[j] = c;
      baseColors[j + 1] = c;
      baseColors[j + 2] = c;
    }

    baseGeometry.setAttribute('position', new BufferAttribute(basePositions, 3));
    baseGeometry.setAttribute('normal', new BufferAttribute(baseNormals, 3));
    baseGeometry.setAttribute('color', new BufferAttribute(baseColors, 3));
    lineGeometry.setFromPoints(tickPoints);

    return [baseGeometry, lineGeometry];
  }, [radius]);

  const sunPathPoints = useMemo(() => {
    const step = Util.TWO_PI / HOUR_DIVISIONS;
    const points = [];
    for (let h = -Math.PI; h < Math.PI + step / 2.0; h += step) {
      const v = computeSunLocation(radius, h, declinationAngle, latitude);
      if (v.z > -0.1) {
        points.push(v);
      }
    }
    return points;
  }, [latitude, radius, declinationAngle]);

  const getSunPathPointsByDate = (d: number) => {
    const step = Util.TWO_PI / HOUR_DIVISIONS;
    const points = [];
    for (let h = -Math.PI; h < Math.PI + step / 2.0; h += step) {
      const v = computeSunLocation(radius, h, d, latitude);
      if (v.z > -0.1) {
        points.push(v);
      }
    }
    return points;
  };

  const pointArraySunPaths = useMemo(() => {
    const dMin = computeDeclinationAngle(new Date(2021, 11, 22));
    const dMax = computeDeclinationAngle(new Date(2021, 5, 22));
    const delta = (dMax - dMin) / nRibLines;
    const arr = [];
    for (let i = 0; i <= nRibLines; i++) {
      arr.push(getSunPathPointsByDate(dMin + i * delta));
    }
    return arr;
  }, [latitude, radius]);

  const sunPosition = useMemo(() => {
    return computeSunLocation(radius, hourAngle, declinationAngle, latitude);
  }, [latitude, declinationAngle, hourAngle, radius]);

  const sunbeltGeometry = useMemo(() => {
    const declinationStep = (2.0 * TILT_ANGLE) / DECLINATION_DIVISIONS;
    const hourStep = Util.TWO_PI / HOUR_DIVISIONS;
    const geometry = new BufferGeometry();
    let verticesCount = 0;
    const vertices: Vector3[] = [];
    const indices = [];
    for (let d = -TILT_ANGLE; d < TILT_ANGLE - declinationStep / 2.0; d += declinationStep) {
      for (let h = -Math.PI; h < Math.PI - hourStep / 2.0; h += hourStep) {
        let h2 = h + hourStep;
        let d2 = d + declinationStep;
        if (h2 > Math.PI) {
          h2 = Math.PI;
        }
        if (d2 > TILT_ANGLE) {
          d2 = TILT_ANGLE;
        }
        const v1 = computeSunLocation(radius, h, d, latitude);
        const v2 = computeSunLocation(radius, h2, d, latitude);
        const v3 = computeSunLocation(radius, h2, d2, latitude);
        const v4 = computeSunLocation(radius, h, d2, latitude);
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
  }, [latitude, radius]);

  return (
    <React.Fragment>
      {heliodon && (
        <group>
          <mesh rotation={new Euler(0, 0, 0)} name={'Heliodon'}>
            {/* draw base */}
            <mesh>
              <bufferGeometry {...baseGeometry} />
              <meshBasicMaterial
                side={DoubleSide}
                vertexColors
                polygonOffset
                polygonOffsetFactor={-0.7}
                polygonOffsetUnits={-2}
              />
            </mesh>
            <lineSegments>
              <bufferGeometry {...lineGeometry} />
              <meshBasicMaterial color={0x000000} />
            </lineSegments>
            {/* draw sun path*/}
            <mesh>
              {sunPathPoints.length > 3 && <Line lineWidth={2} points={sunPathPoints} color={'yellow'} />}
              {pointArraySunPaths
                .filter((a) => a.length > 3)
                .map((a, index) => {
                  return (
                    <Line
                      key={index}
                      opacity={index === 0 || index === nRibLines ? 1 : 0.5}
                      lineWidth={index === 0 || index === nRibLines ? 1 : 0.5}
                      points={a}
                      color={'#999'}
                    />
                  );
                })}
              <mesh args={[sunbeltGeometry]}>
                <meshBasicMaterial
                  side={DoubleSide}
                  color={[1, 1, 0]}
                  transparent
                  opacity={0.5}
                  clippingPlanes={[new Plane(Util.UNIT_VECTOR_POS_Y, 0)]}
                />
              </mesh>
              <mesh position={sunPosition}>
                <sphereGeometry args={[0.05 * radius, 10, 10]} />
                <meshBasicMaterial color={0xffffff00} />
              </mesh>
            </mesh>
          </mesh>
          {/* use this plane to hide the uneven edge */}
          <Drei_Plane args={[10000, 10000]} renderOrder={-1}>
            <meshBasicMaterial transparent={true} opacity={0} />
          </Drei_Plane>
        </group>
      )}
    </React.Fragment>
  );
};

export default React.memo(Heliodon);
