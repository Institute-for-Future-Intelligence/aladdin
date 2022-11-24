/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */
import React, { useEffect, useRef } from 'react';
import { RoofTexture } from 'src/types';
import { useRoofTexture, useTransparent } from './hooks';
import { RoofSegmentProps } from './roofRenderer';
import * as Selector from 'src/stores/selector';
import { useStore } from 'src/stores/common';
import { CanvasTexture, DoubleSide, Float32BufferAttribute, Mesh, Vector3 } from 'three';

export const RoofSegment = ({
  id,
  index,
  segment,
  defaultAngle,
  thickness,
  textureType,
  heatmaps,
  color,
}: {
  id: string;
  index: number;
  segment: RoofSegmentProps;
  defaultAngle: number;
  thickness: number;
  textureType: RoofTexture;
  heatmaps: CanvasTexture[];
  color: string;
}) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const { transparent, opacity } = useTransparent();
  const texture = useRoofTexture(textureType);

  const heatmapMeshRef = useRef<Mesh>(null);

  const { points, angle, length } = segment;
  const [leftRoof, rightRoof, rightRidge, leftRidge] = points;
  const isFlat = Math.abs(leftRoof.z) < 0.1;

  useEffect(() => {
    if (heatmapMeshRef.current) {
      const geo = heatmapMeshRef.current.geometry;
      if (geo) {
        const v10 = new Vector3().subVectors(points[1], points[0]);
        const length10 = v10.length();
        const triangle = points.length === 6;
        const uvs = [];
        v10.normalize();
        const v20 = new Vector3().subVectors(points[2], points[0]);
        if (triangle) {
          // find the position of the top point relative to the first edge point
          const mid = v20.dot(v10) / length10;
          uvs.push(0, 0);
          uvs.push(1, 0);
          uvs.push(mid, 1);
        } else {
          // find the position of the top-left and top-right points relative to the lower-left point
          // the points go anticlockwise
          const v30 = new Vector3().subVectors(points[3], points[0]);
          const topLeft = v30.dot(v10) / length10;
          const topRight = v20.dot(v10) / length10;
          uvs.push(0, 0);
          uvs.push(1, 0);
          uvs.push(topRight, 1);
          uvs.push(topRight, 1);
          uvs.push(topLeft, 1);
          uvs.push(0, 0);
        }
        geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        const positions = new Float32Array(triangle ? 9 : 18);
        const zOffset = thickness + 0.01; // a small number to ensure the surface mesh stay atop
        positions[0] = points[0].x;
        positions[1] = points[0].y;
        positions[2] = points[0].z + zOffset;
        positions[3] = points[1].x;
        positions[4] = points[1].y;
        positions[5] = points[1].z + zOffset;
        positions[6] = points[2].x;
        positions[7] = points[2].y;
        positions[8] = points[2].z + zOffset;
        if (!triangle) {
          positions[9] = points[2].x;
          positions[10] = points[2].y;
          positions[11] = points[2].z + zOffset;
          positions[12] = points[3].x;
          positions[13] = points[3].y;
          positions[14] = points[3].z + zOffset;
          positions[15] = points[0].x;
          positions[16] = points[0].y;
          positions[17] = points[0].z + zOffset;
        }
        // don't call geo.setFromPoints. It doesn't seem to work correctly.
        geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();

        /* bounding rectangle for debugging */
        // const v10 = new Vector3().subVectors(points[1], points[0]);
        // const v20 = new Vector3().subVectors(points[2], points[0]);
        // const v21 = new Vector3().subVectors(points[2], points[1]);
        // // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
        // const length10 = v10.length();
        // const distance = new Vector3().crossVectors(v20, v21).length() / length10;
        // const normal = new Vector3().crossVectors(v20, v21);
        // const side = new Vector3().crossVectors(normal, v10).normalize().multiplyScalar(distance);
        // const p3 = points[0].clone().add(side);
        // const p4 = points[1].clone().add(side);
        // const geo = new BufferGeometry();
        // const positions = new Float32Array(18);
        // positions[0]=points[0].x;
        // positions[1]=points[0].y;
        // positions[2]=points[0].z;
        // positions[3]=points[1].x;
        // positions[4]=points[1].y;
        // positions[5]=points[1].z;
        // positions[6]=p3.x;
        // positions[7]=p3.y;
        // positions[8]=p3.z;
        // positions[9]=p3.x;
        // positions[10]=p3.y;
        // positions[11]=p3.z;
        // positions[12]=points[1].x;
        // positions[13]=points[1].y;
        // positions[14]=points[1].z;
        // positions[15]=p4.x;
        // positions[16]=p4.y;
        // positions[17]=p4.z;
        // geo.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ));
        // geo.computeVertexNormals();
        // v10.normalize();
        // const uvs = [];
        // uvs.push(0, 0);
        // uvs.push(1, 0);
        // uvs.push(0, 1);
        // uvs.push(0, 1);
        // uvs.push(1, 0);
        // uvs.push(1, 1);
        // geo.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ));
      }
    }
  }, [points, thickness, showSolarRadiationHeatmap]);

  const pointsForSingleSide = points.slice(points.length / 2);
  // TODO: There may be a better way to do this, but convex geometry needs at least four points.
  // For triangles, we fool it by duplicating the last point
  if (pointsForSingleSide.length === 3) pointsForSingleSide.push(pointsForSingleSide[2].clone());

  return (
    <>
      <mesh
        ref={heatmapMeshRef}
        castShadow={false}
        receiveShadow={false}
        visible={showSolarRadiationHeatmap}
        position={[0, 0, 0.01]}
      >
        {showSolarRadiationHeatmap && index >= 0 && index < heatmaps.length ? (
          <meshBasicMaterial map={heatmaps[index]} color={'white'} />
        ) : (
          <meshBasicMaterial color={'white'} />
        )}
      </mesh>
      <mesh
        name={`Roof Segment ${index} Surface`}
        uuid={id + '-' + index}
        castShadow={shadowEnabled && !transparent}
        receiveShadow={shadowEnabled}
        userData={{ simulation: true }}
        position={[0, 0, 0.009]}
        visible={!showSolarRadiationHeatmap}
      >
        <convexGeometry args={[pointsForSingleSide, isFlat ? defaultAngle : angle, isFlat ? 1 : length]} />
        <meshStandardMaterial
          map={texture}
          color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
          transparent={transparent}
          opacity={opacity}
          side={DoubleSide}
        />
      </mesh>
      <mesh name={`Roof segment ${index} bulk`} castShadow={false} receiveShadow={false}>
        <convexGeometry args={[points, isFlat ? defaultAngle : angle, isFlat ? 1 : length]} />
        <meshStandardMaterial color={'white'} transparent={transparent} opacity={opacity} />
      </mesh>
    </>
  );
};

export default React.memo(RoofSegment);
