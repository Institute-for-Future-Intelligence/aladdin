/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import GlowImage from '../resources/glow.png';

import { Util } from '../Util';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  EllipseCurve,
  Euler,
  Plane,
  Vector3,
} from 'three';
import { FontLoader, TextGeometryParameters } from 'three/examples/jsm/Addons';
import {
  computeDeclinationAngle,
  computeHourAngleAtMinute,
  computeSunLocation,
  computeSunriseAndSunsetInMinutes,
  TILT_ANGLE,
} from '../analysis/sunTools';
import { Line, Plane as DreiPlane, useTexture } from '@react-three/drei';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { useLoader } from '@react-three/fiber';
//@ts-expect-error ignore
import helvetikerFont from '../assets/helvetiker_regular.typeface.fnt';
import { HALF_PI, TWO_PI, UNIT_VECTOR_POS_Y, UNIT_VECTOR_POS_Z, ZERO_TOLERANCE } from '../constants';

const HOUR_DIVISIONS = 48;
const BASE_DIVISIONS = 72;
const DECLINATION_DIVISIONS = 12;

interface HeliodonProps {
  date: Date;
  hourAngle: number;
  declinationAngle: number;
  worldLatitude: number;
}

const Heliodon = React.memo(({ date, hourAngle, declinationAngle, worldLatitude }: HeliodonProps) => {
  const radius = useStore(Selector.sceneRadius);
  const showSunAngles = useStore(Selector.viewState.showSunAngles);
  const showAzimuthAngle = useStore(Selector.viewState.showAzimuthAngle) ?? true;
  const showElevationAngle = useStore(Selector.viewState.showElevationAngle) ?? true;
  const showZenithAngle = useStore(Selector.viewState.showZenithAngle) ?? true;

  const [latitude, setLatitude] = useState<number>(Util.toRadians(42));
  const glowTexture = useTexture(GlowImage);

  const angleArcRadius = Math.max(2, radius * 0.2);
  const angleLabelHeight = Math.max(0.4, radius * 0.025);
  const font = useLoader(FontLoader, helvetikerFont);
  const fontSize = radius * 0.05;
  const textGeometryParams = {
    font: font,
    height: 0,
    size: fontSize,
  } as TextGeometryParameters;

  const nLabels = 6;
  const tickLabels = new Array(2 * nLabels + 1).fill(0);

  const getOffset = (i: number) => {
    if (i === 0) {
      return -fontSize * 0.3;
    } else if (i > 0 && i < 7) {
      return -fontSize * 0.8;
    } else {
      return -fontSize * 1.2;
    }
  };

  useEffect(() => {
    setLatitude(Util.toRadians(worldLatitude));
  }, [worldLatitude]);

  const nRibLines = 6;

  const [baseGeometry, lineGeometry] = useMemo(() => {
    const baseGeometry = new BufferGeometry();
    const lineGeometry = new BufferGeometry();
    const basePoints: Vector3[] = [];
    const tickPoints: Vector3[] = [];
    const step = TWO_PI / BASE_DIVISIONS;
    let counter = 0;
    for (let angle = 0; angle < TWO_PI + step / 2.0; angle += step) {
      const theta = Math.min(angle, TWO_PI);
      let width = 0.05 * radius;
      // TODO: This is inefficient. We should use indexed buffer to share vertices
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius, theta, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius + width, theta, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius, theta + step, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius + width, theta, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius + width, theta + step, 0)));
      basePoints.push(Util.sphericalToCartesianZ(new Vector3(radius, theta + step, 0)));
      let p;
      if (TWO_PI - theta > ZERO_TOLERANCE) {
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
    const points = [];
    const sunMinutes = computeSunriseAndSunsetInMinutes(date, Util.toDegrees(latitude));
    const min = computeHourAngleAtMinute(sunMinutes.sunrise);
    const max = computeHourAngleAtMinute(sunMinutes.sunset);
    const step = (max - min) / HOUR_DIVISIONS;
    for (let h = min; h < max + step / 2; h += step) {
      const v = computeSunLocation(radius, h, declinationAngle, latitude);
      if (v.z > -0.01) {
        points.push(v);
      }
    }
    return points;
  }, [date, latitude, radius, declinationAngle]);

  const getSunPathPointsByDate = (day: Date) => {
    const decline = computeDeclinationAngle(day);
    const points = [];
    const sunMinutes = computeSunriseAndSunsetInMinutes(day, Util.toDegrees(latitude));
    const min = computeHourAngleAtMinute(sunMinutes.sunrise);
    const max = computeHourAngleAtMinute(sunMinutes.sunset);
    const step = (max - min) / HOUR_DIVISIONS;
    for (let h = min; h < max + step / 2; h += step) {
      const v = computeSunLocation(radius, h, decline, latitude);
      if (v.z > -0.01) {
        points.push(v);
      }
    }
    return points;
  };

  const pointArraySunPaths = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= nRibLines; i++) {
      const day = new Date(2021, i === 0 ? 11 : i - 1, 22);
      arr.push(getSunPathPointsByDate(day));
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, radius]);

  const sunPosition = useMemo(() => {
    return computeSunLocation(radius, hourAngle, declinationAngle, latitude);
  }, [latitude, declinationAngle, hourAngle, radius]);

  const sunDirection = useMemo(() => {
    return sunPosition.clone().normalize();
  }, [sunPosition]);

  const sunDirectionOnGround = useMemo(() => {
    return new Vector3(sunPosition.x, sunPosition.y, 0).normalize();
  }, [sunPosition]);

  const elevationAngle = useMemo(() => {
    return Math.asin(sunPosition.z / sunPosition.length());
  }, [sunPosition]);

  const elevationAngleArcPoints = useMemo(() => {
    const curve = new EllipseCurve(0, 0, angleArcRadius, angleArcRadius, 0, elevationAngle, false, 0);
    const points = curve.getPoints(25);
    const points3D = new Array<Vector3>();
    for (const p of points) {
      points3D.push(new Vector3(p.x, p.y, 0));
    }
    return points3D;
  }, [elevationAngle, sunPosition, angleArcRadius]);

  const zenithAngle = useMemo(() => {
    return Math.acos(sunPosition.z / sunPosition.length());
  }, [sunPosition]);

  const zenithAngleArcPoints = useMemo(() => {
    const curve = new EllipseCurve(0, 0, angleArcRadius * 0.8, angleArcRadius * 0.8, elevationAngle, HALF_PI, false, 0);
    const points = curve.getPoints(25);
    const points3D = new Array<Vector3>();
    for (const p of points) {
      points3D.push(new Vector3(p.x, p.y, 0));
    }
    return points3D;
  }, [zenithAngle, sunPosition, angleArcRadius, elevationAngle]);

  const azimuthAngle = useMemo(() => {
    const a = Math.acos(sunPosition.y / Math.hypot(sunPosition.x, sunPosition.y));
    return sunPosition.x > 0 ? -a : a;
  }, [sunPosition]);

  const azimuthAngleArcPoints = useMemo(() => {
    const curve = new EllipseCurve(
      0,
      0,
      angleArcRadius * 1.2,
      angleArcRadius * 1.2,
      HALF_PI,
      HALF_PI + azimuthAngle,
      sunPosition.x > 0,
      0,
    );
    const points = curve.getPoints(50);
    const points3D = new Array<Vector3>();
    for (const p of points) {
      points3D.push(new Vector3(p.x, p.y, 0));
    }
    return points3D;
  }, [azimuthAngle, sunPosition, angleArcRadius]);

  const sunbeltGeometry = useMemo(() => {
    const declinationStep = (2.0 * TILT_ANGLE) / DECLINATION_DIVISIONS;
    const hourStep = TWO_PI / HOUR_DIVISIONS;
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

  const sunRadius = 0.05 * radius;
  const haloRadius = 2 + 5 * sunRadius;

  return (
    <group>
      {tickLabels.map((v, i) => {
        let times = Math.ceil(i / 2) * (i % 2 === 0 ? 1 : -1);
        if (times === -nLabels) times = nLabels;
        const offset = getOffset(Math.abs(times));
        return (
          <group key={i} rotation={[HALF_PI, (times * Math.PI) / nLabels, 0]}>
            <mesh position={[offset, 0, -radius * 1.1]} rotation={[-HALF_PI, 0, 0]}>
              <textGeometry args={[`${-(180 / nLabels) * times}°`, textGeometryParams]} />
              <meshStandardMaterial attach="material" color={'lightGray'} />
            </mesh>
          </group>
        );
      })}
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
              depthWrite={false} // sprites will not be visible without this setting
              clippingPlanes={[new Plane(UNIT_VECTOR_POS_Y, 0)]}
            />
          </mesh>
          {/* simple glow effect to create a halo */}
          <mesh position={sunPosition}>
            <sprite scale={[haloRadius, haloRadius, haloRadius]}>
              <spriteMaterial
                map={glowTexture}
                transparent={false}
                color={0xffffff}
                blending={AdditiveBlending}
                depthWrite={false} // this must be set to hide the rectangle of the texture image
              />
            </sprite>
          </mesh>
          <mesh position={sunPosition}>
            <sphereGeometry args={[sunRadius, 10, 10]} />
            <meshBasicMaterial color={'white'} />
          </mesh>
        </mesh>
      </mesh>
      {/* use this plane to hide the uneven edge */}
      <DreiPlane args={[10000, 10000]} renderOrder={-1} userData={{ unintersectable: true }}>
        <meshBasicMaterial transparent={true} opacity={0} />
      </DreiPlane>
      {showSunAngles && sunPosition.z > 0 && (
        <>
          <Line
            userData={{ unintersectable: true }}
            points={[
              [0, 0, 0],
              [sunPosition.x, sunPosition.y, sunPosition.z],
            ]}
            name={'Line from origin to sun'}
            lineWidth={0.5}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[
              [0, 0, 0],
              [sunPosition.x, sunPosition.y, 0],
            ]}
            name={'Line from origin to sun projection on ground'}
            lineWidth={0.5}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[
              [sunPosition.x, sunPosition.y, 0],
              [sunPosition.x, sunPosition.y, sunPosition.z],
            ]}
            name={'Line from sun projection on ground to sun'}
            lineWidth={0.5}
            color={'white'}
          />
          {showElevationAngle && (
            <>
              <Line
                userData={{ unintersectable: true }}
                linewidth={0.5}
                points={elevationAngleArcPoints}
                position={[0, 0, 0]}
                rotation={new Euler(HALF_PI, 0, HALF_PI + azimuthAngle, 'ZXY')}
                color={'white'}
                name={'Elevation Angle Arc'}
              />
              <textSprite
                userData={{ unintersectable: true }}
                name={'Elevation Angle'}
                backgroundColor={'indigo'}
                text={Util.toDegrees(elevationAngle).toFixed(0) + '°'}
                fontSize={80}
                fontFace={'Times Roman'}
                textHeight={angleLabelHeight}
                position={sunDirection
                  .clone()
                  .multiplyScalar(angleArcRadius)
                  .add(sunDirectionOnGround.clone().multiplyScalar(angleArcRadius))
                  .multiplyScalar(0.65)}
              />
            </>
          )}
          {showZenithAngle && (
            <>
              <Line
                userData={{ unintersectable: true }}
                linewidth={0.5}
                points={zenithAngleArcPoints}
                position={[0, 0, 0]}
                rotation={new Euler(HALF_PI, 0, HALF_PI + azimuthAngle, 'ZXY')}
                color={'white'}
                name={'Zenith Angle Arc'}
              />
              <textSprite
                userData={{ unintersectable: true }}
                name={'Zenith Angle'}
                backgroundColor={'navy'}
                text={Util.toDegrees(zenithAngle).toFixed(0) + '°'}
                fontSize={80}
                fontFace={'Times Roman'}
                textHeight={angleLabelHeight}
                position={sunDirection
                  .clone()
                  .multiplyScalar(angleArcRadius)
                  .add(UNIT_VECTOR_POS_Z.clone().multiplyScalar(angleArcRadius))
                  .multiplyScalar(0.57)}
              />
            </>
          )}
          {showAzimuthAngle && (
            <>
              <Line
                userData={{ unintersectable: true }}
                linewidth={0.5}
                points={azimuthAngleArcPoints}
                position={[0, 0, 0]}
                color={'white'}
                name={'Azimuth Angle Arc'}
              />
              <textSprite
                userData={{ unintersectable: true }}
                name={'Azimuth Angle'}
                backgroundColor={'firebrick'}
                // force -180 degrees to become 180 degrees
                text={
                  Util.toDegrees(Math.abs(azimuthAngle - Math.PI) < 0.000001 ? azimuthAngle : -azimuthAngle).toFixed(
                    0,
                  ) + '°'
                }
                fontSize={80}
                fontFace={'Times Roman'}
                textHeight={angleLabelHeight}
                position={sunDirectionOnGround
                  .clone()
                  .multiplyScalar(angleArcRadius)
                  .add(UNIT_VECTOR_POS_Y.clone().multiplyScalar(angleArcRadius))
                  .multiplyScalar(1.1)
                  .add(new Vector3(0, 0, angleLabelHeight / 2))}
              />
            </>
          )}
        </>
      )}
    </group>
  );
});

export default Heliodon;
