/*
 * @Copyright 2024. Institute for Future Intelligence, Inc.
 *
 * Extracts planar pieces from building elements for print-flat layout,
 * analogous to jaladdin's MeshLib.groupByPlanar() / Roof.flatten() approach.
 */

import { Vector3 } from 'three';
import { ElementModel } from 'src/models/ElementModel';
import { WallModel } from 'src/models/WallModel';
import { FoundationModel } from 'src/models/FoundationModel';
import { ObjectType } from 'src/types';

export interface PrintPiece {
  id: string;
  label: string;
  type: 'wall' | 'roof' | 'floor';
  /** 2D polygon vertices in model units (meters), with min bounding box at origin */
  vertices: [number, number][];
  boundWidth: number;
  boundHeight: number;
}

/** Flatten 3D coplanar points into 2D using the plane's local basis vectors. */
export function flattenTo2D(points3D: Vector3[]): [number, number][] {
  if (points3D.length < 3) return [];

  const p0 = points3D[0];
  // U axis: along the first edge
  const u = new Vector3().subVectors(points3D[1], p0).normalize();
  // Normal: perpendicular to the plane
  const edge2 = new Vector3().subVectors(points3D[2], p0);
  const normal = new Vector3().crossVectors(u, edge2).normalize();
  // V axis: perpendicular to U in the plane
  const v = new Vector3().crossVectors(normal, u).normalize();

  const flat: [number, number][] = points3D.map((p) => {
    const diff = new Vector3().subVectors(p, p0);
    return [diff.dot(u), diff.dot(v)];
  });

  // Shift so bounding box starts at (0, 0)
  const xs = flat.map((f) => f[0]);
  const ys = flat.map((f) => f[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return flat.map(([x, y]) => [x - minX, y - minY]);
}

/**
 * Compute the 2D polygon for a wall face (unfolded, head-on view).
 * The wall runs left-to-right at the bottom; heights at each end come from
 * leftRoofHeight / rightRoofHeight when a roof is attached, otherwise lz.
 */
export function extractWallPiece(wall: WallModel, index: number): PrintPiece {
  const dx = wall.rightPoint[0] - wall.leftPoint[0];
  const dy = wall.rightPoint[1] - wall.leftPoint[1];
  const wallLength = Math.sqrt(dx * dx + dy * dy);

  const leftH = wall.leftRoofHeight !== undefined ? wall.leftRoofHeight : wall.lz;
  const rightH = wall.rightRoofHeight !== undefined ? wall.rightRoofHeight : wall.lz;

  // Build the top-edge intermediate points from centerRoofHeight fields.
  // Each field is a flat array [relX0, h0, relX1, h1, ...] where relX is in
  // the wall-centered range [-0.5, 0.5]  (wall.tsx: shape.lineTo(x[0]*lx, x[1]-hy)).
  // Convert to bottom-left origin: x_mine = relX * wallLength + wallLength/2.
  const topMid: [number, number][] = [];
  const addTopMid = (flat: number[] | undefined) => {
    if (!flat) return;
    for (let i = 0; i + 1 < flat.length; i += 2) {
      topMid.push([flat[i] * wallLength + wallLength / 2, flat[i + 1]]);
    }
  };
  addTopMid(wall.centerRightRoofHeight);
  addTopMid(wall.centerRoofHeight);
  addTopMid(wall.centerLeftRoofHeight);
  topMid.sort((a, b) => a[0] - b[0]);

  // Polygon goes: bottom-left → bottom-right → top-right → [center tops, right→left] → top-left
  const vertices: [number, number][] = [
    [0, 0],
    [wallLength, 0],
    [wallLength, rightH],
    ...topMid.slice().reverse(),
    [0, leftH],
  ];

  const boundHeight = Math.max(leftH, rightH, ...topMid.map((p) => p[1]));

  return {
    id: wall.id,
    label: `Wall ${index + 1}`,
    type: 'wall',
    vertices,
    boundWidth: wallLength,
    boundHeight,
  };
}

/**
 * Extract a print piece from 3D roof segment vertices
 * (already in foundation-local coordinates, as stored in roofSegmentVerticesMap).
 */
export function extractRoofSegmentPiece(vertices3D: Vector3[], segmentIndex: number, roofIndex: number): PrintPiece {
  const flat = flattenTo2D(vertices3D);
  const xs = flat.map((f) => f[0]);
  const ys = flat.map((f) => f[1]);
  const boundWidth = Math.max(...xs) - Math.min(...xs);
  const boundHeight = Math.max(...ys) - Math.min(...ys);

  return {
    id: `roof-${roofIndex}-seg-${segmentIndex}`,
    label: `Roof ${roofIndex + 1} / Seg ${segmentIndex + 1}`,
    type: 'roof',
    vertices: flat,
    boundWidth,
    boundHeight,
  };
}

/** Extract a rectangular floor piece for a foundation. */
export function extractFoundationPiece(foundation: FoundationModel, index: number): PrintPiece {
  const w = foundation.lx;
  const h = foundation.ly;
  return {
    id: foundation.id,
    label: `Floor ${index + 1}`,
    type: 'floor',
    vertices: [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h],
    ],
    boundWidth: w,
    boundHeight: h,
  };
}

/**
 * Collect all print pieces for one building (identified by foundationId).
 * Pass in elements from the store and the roofSegmentVerticesMap from commonData.
 */
export function collectBuildingPieces(
  foundationId: string,
  elements: ElementModel[],
  roofSegmentVerticesMap: Map<string, Vector3[][]>,
): PrintPiece[] {
  const pieces: PrintPiece[] = [];

  // Floor
  const foundation = elements.find((e) => e.id === foundationId) as FoundationModel | undefined;
  if (foundation) {
    const foundationIndex = elements.filter((e) => e.type === ObjectType.Foundation).indexOf(foundation);
    pieces.push(extractFoundationPiece(foundation, foundationIndex));
  }

  // Walls
  const walls = elements.filter((e) => e.type === ObjectType.Wall && e.foundationId === foundationId) as WallModel[];
  walls.forEach((wall, i) => {
    pieces.push(extractWallPiece(wall, i));
  });

  // Roof segments
  const roofs = elements.filter(
    (e) =>
      (e.type === ObjectType.Roof ||
        e.type === ObjectType.PyramidRoof ||
        e.type === ObjectType.HipRoof ||
        e.type === ObjectType.GableRoof ||
        e.type === ObjectType.GambrelRoof ||
        e.type === ObjectType.MansardRoof) &&
      e.foundationId === foundationId,
  );

  roofs.forEach((roof, roofIdx) => {
    const segments = roofSegmentVerticesMap.get(roof.id);
    if (!segments) return;
    segments.forEach((segVerts, segIdx) => {
      if (segVerts.length >= 3) {
        pieces.push(extractRoofSegmentPiece(segVerts, segIdx, roofIdx));
      }
    });
  });

  return pieces;
}
