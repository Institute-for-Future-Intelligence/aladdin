/*
 * @Copyright 2025-2026. Institute for Future Intelligence, Inc.
 */

import { Point2 } from '../models/Point2';
import { Util } from '../Util';

// ================================================================================
// TYPES - Input (from AI response)
// ================================================================================

interface Zone {
  boundary: [number, number][];
  length: [number, number];
  width: [number, number];
  height: [number, number];
  spacing: number;
  coverage: number;
  layout: 'grid' | 'perimeter' | 'cluster';
}

interface River {
  vertices: [number, number][];
}

interface Park {
  vertices: [number, number][];
}

interface Landmark {
  center: [number, number];
  size: [number, number, number];
  rotation?: number;
}

interface RoadNode {
  id: string;
  position: [number, number];
}

interface RoadEdge {
  id: string;
  from: string;
  to: string;
  level: 1 | 2;
  points?: [number, number][];
}

interface RoadNetwork {
  nodes: RoadNode[];
  edges: RoadEdge[];
}

// ================================================================================
// TYPES - Output
// ================================================================================

interface Building {
  center: [number, number];
  size: [number, number, number];
  rotation: number;
  color: string;
  vertices?: [number, number][]; // polygon footprint for non-rectangular corner buildings
}

// Road segment for rendering (position, length, angle format)
interface RoadRenderSegment {
  position: [number, number];
  length: number;
  width: number;
  angle: number;
}

interface Road {
  edgeId: string;
  level: 1 | 2;
  segments: RoadRenderSegment[];
}

// ================================================================================
// TYPES - Internal
// ================================================================================

interface BBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface ZoneSettings {
  boundary: Point2[];
  length: [number, number];
  width: [number, number];
  height: [number, number];
  spacing: number;
  coverage: number;
  color: string;
  layout: 'grid' | 'perimeter' | 'cluster';
}

// Road segment for collision detection (p1, p2 format)
interface RoadSegment {
  p1: [number, number];
  p2: [number, number];
  width: number;
}

// ================================================================================
// CONSTANTS
// ================================================================================

const ROAD_WIDTH: Record<1 | 2, number> = {
  1: 20, // 主干道 (main road)
  2: 10, // 支路 (secondary road)
};

const BUILDING_SETBACK = 3; // gap from road edge to building face
const CORNER_BUILDING_DEPTH = 70; // arm length of corner L-building along each road
const CORNER_WING_WIDTH = 35; // arm width of each L-building arm (perpendicular to road)
const MIN_CORNER_ANGLE = Math.PI / 18; // 10°: skip extremely acute road pairs
const MAX_CORNER_ANGLE = (11 * Math.PI) / 6; // 330°: skip near-full-circle gaps

// ================================================================================
// HELPER FUNCTIONS - Math & Geometry
// ================================================================================

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function angle(p1: [number, number], p2: [number, number]): number {
  return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
}

function distance(a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function normalize(v: Point2): Point2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
}

function pointToSegmentDistance(px: number, py: number, p1: [number, number], p2: [number, number]): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return distance2D(px, py, p1[0], p1[1]);

  let t = ((px - p1[0]) * dx + (py - p1[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const nearX = p1[0] + t * dx;
  const nearY = p1[1] + t * dy;

  return distance2D(px, py, nearX, nearY);
}

// ================================================================================
// HELPER FUNCTIONS - Polygon Operations
// ================================================================================

function calculateBoundingBox(polygon: Point2[]): BBox {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return { minX, maxX, minY, maxY };
}

function getPolygonEdges(polygon: Point2[]): [Point2, Point2][] {
  const edges: [Point2, Point2][] = [];
  for (let i = 0; i < polygon.length; i++) {
    edges.push([polygon[i], polygon[(i + 1) % polygon.length]]);
  }
  return edges;
}

function polygonsOverlap(poly1: Point2[], poly2: Point2[]): boolean {
  for (const v of poly1) {
    if (Util.isPointInside(v.x, v.y, poly2)) return true;
  }
  for (const v of poly2) {
    if (Util.isPointInside(v.x, v.y, poly1)) return true;
  }

  const edges1 = getPolygonEdges(poly1);
  const edges2 = getPolygonEdges(poly2);

  for (const [a1, b1] of edges1) {
    for (const [a2, b2] of edges2) {
      if (Util.lineIntersection(a1, b1, a2, b2)) return true;
    }
  }

  return false;
}

function insetPolygon(polygon: Point2[], dist: number): Point2[] {
  const n = polygon.length;
  if (n < 3) return [];

  // Calculate signed area to determine winding order
  // Positive = counterclockwise, Negative = clockwise
  let signedArea = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    signedArea += polygon[i].x * polygon[j].y;
    signedArea -= polygon[j].x * polygon[i].y;
  }
  // CCW (positive area): normal points outward, need negative dist to go inward
  // CW (negative area): normal points inward, need positive dist to go inward
  const signedDist = signedArea >= 0 ? -dist : dist;

  const result: Point2[] = [];

  for (let i = 0; i < n; i++) {
    const prev = polygon[(i - 1 + n) % n];
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];

    const v1 = normalize({ x: curr.x - prev.x, y: curr.y - prev.y });
    const v2 = normalize({ x: next.x - curr.x, y: next.y - curr.y });

    const n1: Point2 = { x: v1.y, y: -v1.x };
    const n2: Point2 = { x: v2.y, y: -v2.x };

    const bisector = normalize({ x: n1.x + n2.x, y: n1.y + n2.y });

    const dot = n1.x * bisector.x + n1.y * bisector.y;
    const adjustedDist = Math.abs(dot) > 0.001 ? signedDist / dot : signedDist;

    result.push({
      x: curr.x + bisector.x * adjustedDist,
      y: curr.y + bisector.y * adjustedDist,
    });
  }

  return result;
}

function lineToPolygon(p1: [number, number], p2: [number, number], width: number): Point2[] {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return [];

  const nx = (-dy / len) * (width / 2);
  const ny = (dx / len) * (width / 2);

  return [
    { x: p1[0] + nx, y: p1[1] + ny },
    { x: p2[0] + nx, y: p2[1] + ny },
    { x: p2[0] - nx, y: p2[1] - ny },
    { x: p1[0] - nx, y: p1[1] - ny },
  ];
}

// ================================================================================
// HELPER FUNCTIONS - Building Operations
// ================================================================================

function getBuildingCorners(
  center: [number, number],
  width: number,
  length: number,
  rotationDegrees: number,
): Point2[] {
  const [cx, cy] = center;
  const hw = width / 2;
  const hl = length / 2;
  const rad = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const localCorners: [number, number][] = [
    [-hw, -hl],
    [hw, -hl],
    [hw, hl],
    [-hw, hl],
  ];

  return localCorners.map(([lx, ly]) => ({
    x: cx + lx * cos - ly * sin,
    y: cy + lx * sin + ly * cos,
  }));
}

function getBuildingPolygon(building: Building): Point2[] {
  if (building.vertices && building.vertices.length >= 3) {
    return building.vertices.map(([x, y]) => ({ x, y }));
  }
  return getBuildingCorners(building.center, building.size[0], building.size[1], building.rotation);
}

function isBuildingInsideBoundary(
  center: [number, number],
  width: number,
  length: number,
  rotationDegrees: number,
  boundary: Point2[],
): boolean {
  const corners = getBuildingCorners(center, width, length, rotationDegrees);
  for (const corner of corners) {
    if (!Util.isPointInside(corner.x, corner.y, boundary)) {
      return false;
    }
  }
  return true;
}

function overlapsWithPolygons(building: Building, polygons: Point2[][]): boolean {
  const buildingPolygon = getBuildingPolygon(building);

  for (const polygon of polygons) {
    if (polygonsOverlap(buildingPolygon, polygon)) {
      return true;
    }
  }
  return false;
}

function applyCoverageConstraint(buildings: Building[], targetArea: number): Building[] {
  const shuffled = [...buildings].sort(() => Math.random() - 0.5);
  const selected: Building[] = [];
  let currentArea = 0;

  for (const building of shuffled) {
    const footprint = building.size[0] * building.size[1];
    if (currentArea + footprint <= targetArea * 1.1) {
      selected.push(building);
      currentArea += footprint;
    }
    if (currentArea >= targetArea) break;
  }

  return selected;
}

function findNearestValidPosition(
  building: Building,
  obstaclePolygons: Point2[][],
  maxSearchRadius: number = 200,
  stepSize: number = 5,
): [number, number] | null {
  const [cx, cy] = building.center;
  const { size, rotation } = building;

  // Check if the original position is valid
  if (!overlapsWithPolygons(building, obstaclePolygons)) {
    return building.center;
  }

  // Spiral search for nearest valid position
  for (let radius = stepSize; radius <= maxSearchRadius; radius += stepSize) {
    const numPoints = Math.max(8, Math.floor((2 * Math.PI * radius) / stepSize));

    for (let i = 0; i < numPoints; i++) {
      const ang = (2 * Math.PI * i) / numPoints;
      const newX = cx + radius * Math.cos(ang);
      const newY = cy + radius * Math.sin(ang);

      const testBuilding: Building = {
        center: [newX, newY],
        size,
        rotation,
        color: building.color,
      };

      if (!overlapsWithPolygons(testBuilding, obstaclePolygons)) {
        return [newX, newY];
      }
    }
  }

  return null;
}

// ================================================================================
// HELPER FUNCTIONS - Road Processing
// ================================================================================

function generateRoadPolygons(roads: RoadNetwork): Point2[][] {
  const polygons: Point2[][] = [];

  if (!roads || !roads.nodes || !roads.edges) return polygons;

  const nodeMap = new Map<string, [number, number]>();
  for (const node of roads.nodes) {
    nodeMap.set(node.id, node.position);
  }

  for (const edge of roads.edges) {
    const fromPos = nodeMap.get(edge.from);
    const toPos = nodeMap.get(edge.to);
    if (!fromPos || !toPos) continue;

    const width = ROAD_WIDTH[edge.level] || 10;
    const path: [number, number][] = [fromPos, ...(edge.points || []), toPos];

    for (let i = 0; i < path.length - 1; i++) {
      const poly = lineToPolygon(path[i], path[i + 1], width);
      if (poly.length > 0) {
        polygons.push(poly);
      }
    }
  }

  return polygons;
}

function getRoadSegments(roads: RoadNetwork): RoadSegment[] {
  const segments: RoadSegment[] = [];

  if (!roads || !roads.nodes || !roads.edges) return segments;

  const nodeMap = new Map<string, [number, number]>();
  for (const node of roads.nodes) {
    nodeMap.set(node.id, node.position);
  }

  for (const edge of roads.edges) {
    const fromPos = nodeMap.get(edge.from);
    const toPos = nodeMap.get(edge.to);
    if (!fromPos || !toPos) continue;

    const width = ROAD_WIDTH[edge.level] || 10;
    const path: [number, number][] = [fromPos, ...(edge.points || []), toPos];

    for (let i = 0; i < path.length - 1; i++) {
      segments.push({
        p1: path[i],
        p2: path[i + 1],
        width,
      });
    }
  }

  return segments;
}

function segmentIntersectsOrNearZone(segment: RoadSegment, boundary: Point2[], margin: number): boolean {
  const { p1, p2 } = segment;

  // Check if segment endpoints are inside the zone
  if (Util.isPointInside(p1[0], p1[1], boundary)) return true;
  if (Util.isPointInside(p2[0], p2[1], boundary)) return true;

  // Check if segment intersects zone boundary
  const edges = getPolygonEdges(boundary);
  for (const [a, b] of edges) {
    if (Util.lineIntersection({ x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] }, a, b)) {
      return true;
    }
  }

  // Check distance from segment to zone centroid
  const bbox = calculateBoundingBox(boundary);
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  const dist = pointToSegmentDistance(cx, cy, p1, p2);

  return dist < margin;
}

function placeBuildingsAlongRoad(segment: RoadSegment, boundary: Point2[], settings: ZoneSettings): Building[] {
  const buildings: Building[] = [];
  const { p1, p2, width: roadWidth } = segment;

  const [minWidth, maxWidth] = settings.width;
  const [minLength, maxLength] = settings.length;
  const [minHeight, maxHeight] = settings.height;
  const spacing = settings.spacing;

  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const segmentLength = Math.sqrt(dx * dx + dy * dy);
  if (segmentLength === 0) return buildings;

  // Direction along the road
  const dirX = dx / segmentLength;
  const dirY = dy / segmentLength;

  // Perpendicular direction (left side)
  const perpX = -dirY;
  const perpY = dirX;

  // Road angle in degrees
  const roadAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Setback from road center
  const setback = roadWidth / 2 + maxLength / 2 + spacing;

  // Place buildings along both sides of the road
  const sides = [1, -1];

  for (const side of sides) {
    const offsetX = perpX * setback * side;
    const offsetY = perpY * setback * side;

    const buildingsPerSide = Math.floor((segmentLength + spacing) / (maxWidth + spacing));
    if (buildingsPerSide <= 0) continue;

    const actualSpacing = (segmentLength - buildingsPerSide * maxWidth) / (buildingsPerSide + 1);

    for (let i = 0; i < buildingsPerSide; i++) {
      const t = (actualSpacing + maxWidth / 2 + i * (maxWidth + actualSpacing)) / segmentLength;
      const cx = p1[0] + t * dx + offsetX;
      const cy = p1[1] + t * dy + offsetY;

      const bWidth = randomInRange(minWidth, maxWidth);
      const bLength = randomInRange(minLength, maxLength);
      const bHeight = randomInRange(minHeight, maxHeight);

      if (!Util.isPointInside(cx, cy, boundary)) continue;

      if (isBuildingInsideBoundary([cx, cy], bWidth, bLength, roadAngle, boundary)) {
        buildings.push({
          center: [cx, cy],
          size: [bWidth, bLength, bHeight],
          rotation: roadAngle,
          color: settings.color,
        });
      }
    }
  }

  return buildings;
}

// ================================================================================
// CORNER BUILDING GENERATORS
// ================================================================================

interface EdgeAtNode {
  direction: [number, number]; // unit vector pointing AWAY from this node along the road edge
  halfWidth: number;
}

function buildNodeEdgeMap(roads: RoadNetwork): Map<string, EdgeAtNode[]> {
  const nodePos = new Map<string, [number, number]>();
  for (const node of roads.nodes) {
    nodePos.set(node.id, node.position);
  }

  const result = new Map<string, EdgeAtNode[]>();
  for (const node of roads.nodes) {
    result.set(node.id, []);
  }

  for (const edge of roads.edges) {
    const from = nodePos.get(edge.from);
    const to = nodePos.get(edge.to);
    if (!from || !to) continue;

    const halfWidth = ROAD_WIDTH[edge.level] / 2;
    const path: [number, number][] = [from, ...(edge.points ?? []), to];

    // Direction at 'from' node: toward the next path point
    const fd = path[1];
    const fl = path[0];
    const fLen = Math.sqrt((fd[0] - fl[0]) ** 2 + (fd[1] - fl[1]) ** 2);
    if (fLen > 0) {
      result.get(edge.from)!.push({
        direction: [(fd[0] - fl[0]) / fLen, (fd[1] - fl[1]) / fLen],
        halfWidth,
      });
    }

    // Direction at 'to' node: toward the previous path point (away from 'to')
    const last = path.length - 1;
    const td = path[last - 1];
    const tl = path[last];
    const tLen = Math.sqrt((td[0] - tl[0]) ** 2 + (td[1] - tl[1]) ** 2);
    if (tLen > 0) {
      result.get(edge.to)!.push({
        direction: [(td[0] - tl[0]) / tLen, (td[1] - tl[1]) / tLen],
        halfWidth,
      });
    }
  }

  return result;
}

function getCornerPairs(edges: EdgeAtNode[]): Array<[EdgeAtNode, EdgeAtNode]> {
  if (edges.length < 2) return [];

  const sorted = [...edges].sort(
    (a, b) => Math.atan2(a.direction[1], a.direction[0]) - Math.atan2(b.direction[1], b.direction[0]),
  );

  const pairs: Array<[EdgeAtNode, EdgeAtNode]> = [];
  const n = sorted.length;
  for (let i = 0; i < n; i++) {
    const e1 = sorted[i];
    const e2 = sorted[(i + 1) % n];
    let gap = Math.atan2(e2.direction[1], e2.direction[0]) - Math.atan2(e1.direction[1], e1.direction[0]);
    if (gap < 0) gap += 2 * Math.PI;
    if (gap >= MIN_CORNER_ANGLE && gap <= MAX_CORNER_ANGLE) {
      pairs.push([e1, e2]);
    }
  }
  return pairs;
}

function computeCornerLotPolygon(
  nodePos: [number, number],
  e1: EdgeAtNode,
  e2: EdgeAtNode,
  depth: number,
  wingWidth: number,
): [number, number][] | null {
  const setback1 = e1.halfWidth + BUILDING_SETBACK;
  const setback2 = e2.halfWidth + BUILDING_SETBACK;

  // Perpendicular INTO the corner lot:
  // e1 is first in CCW order → left perpendicular (rotate 90° CCW)
  const perp1: [number, number] = [-e1.direction[1], e1.direction[0]];
  // e2 is next in CCW order → right perpendicular (rotate 90° CW)
  const perp2: [number, number] = [e2.direction[1], -e2.direction[0]];

  // Setback line base points
  const base1: Point2 = { x: nodePos[0] + perp1[0] * setback1, y: nodePos[1] + perp1[1] * setback1 };
  const base2: Point2 = { x: nodePos[0] + perp2[0] * setback2, y: nodePos[1] + perp2[1] * setback2 };

  // Extend lines to find inner corner
  const far1: Point2 = { x: base1.x + e1.direction[0] * 2000, y: base1.y + e1.direction[1] * 2000 };
  const far2: Point2 = { x: base2.x + e2.direction[0] * 2000, y: base2.y + e2.direction[1] * 2000 };

  const innerCorner = Util.lineIntersection(base1, far1, base2, far2);
  if (!innerCorner) return null;

  // Reject degenerate cases (near-parallel roads)
  const distToNode = Math.sqrt((innerCorner.x - nodePos[0]) ** 2 + (innerCorner.y - nodePos[1]) ** 2);
  if (distToNode > depth * 3) return null;

  // Compute the CCW angular gap between e1 and e2
  const a1 = Math.atan2(e1.direction[1], e1.direction[0]);
  const a2 = Math.atan2(e2.direction[1], e2.direction[0]);
  let gap = a2 - a1;
  if (gap < 0) gap += 2 * Math.PI;

  const D = depth;
  const W = wingWidth;
  const ic = innerCorner;

  if (gap < Math.PI / 4) {
    // ── Triangle for acute corners (gap < 45°) ──────────────────────────────
    //
    //        F
    //       / \
    //      /   \
    //     A-----B
    //
    // A = ic (road-facing tip), B = ic + e1*D, F = ic + e2*D

    const a: [number, number] = [ic.x, ic.y];
    const b: [number, number] = [ic.x + e1.direction[0] * D, ic.y + e1.direction[1] * D];
    const f: [number, number] = [ic.x + e2.direction[0] * D, ic.y + e2.direction[1] * D];
    return [a, b, f];
  }

  // ── L-shape for wider corners (gap ≥ 45°) ─────────────────────────────────
  // Each arm's sides are perpendicular to its road (perp1 ⊥ e1, perp2 ⊥ e2).
  // The elbow is the intersection of the two outer-edge lines.
  //
  //   F ---- E
  //   |      |  ← sides ⊥ to e2
  //   |      D ---- C
  //   |             |  ← sides ⊥ to e1
  //   A ----------- B

  const a: [number, number] = [ic.x, ic.y];
  const b: [number, number] = [ic.x + e1.direction[0] * D, ic.y + e1.direction[1] * D];
  const c: [number, number] = [b[0] + perp1[0] * W, b[1] + perp1[1] * W];
  const ob1: Point2 = { x: ic.x + perp1[0] * W, y: ic.y + perp1[1] * W };
  const of1: Point2 = { x: ob1.x + e1.direction[0] * 2000, y: ob1.y + e1.direction[1] * 2000 };
  const ob2: Point2 = { x: ic.x + perp2[0] * W, y: ic.y + perp2[1] * W };
  const of2: Point2 = { x: ob2.x + e2.direction[0] * 2000, y: ob2.y + e2.direction[1] * 2000 };
  const elbow = Util.lineIntersection(ob1, of1, ob2, of2);
  if (!elbow) return null;
  const dv: [number, number] = [elbow.x, elbow.y];
  const f: [number, number] = [ic.x + e2.direction[0] * D, ic.y + e2.direction[1] * D];
  const ev: [number, number] = [f[0] + perp2[0] * W, f[1] + perp2[1] * W];

  return [a, b, c, dv, ev, f];
}

function lotPolygonToBuilding(
  lotPolygon: [number, number][],
  height: number,
  color: string,
  zoneBoundary: Point2[],
): Building | null {
  const asPoint2 = lotPolygon.map(([x, y]) => ({ x, y }));
  const inset = insetPolygon(asPoint2, 1.5);
  if (inset.length < 3) return null;

  // All vertices must be inside the zone boundary
  for (const p of inset) {
    if (!Util.isPointInside(p.x, p.y, zoneBoundary)) return null;
  }

  // Compute centroid
  const cx = inset.reduce((s, p) => s + p.x, 0) / inset.length;
  const cy = inset.reduce((s, p) => s + p.y, 0) / inset.length;

  // Bounding box for coverage accounting
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of inset) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return {
    center: [cx, cy],
    size: [maxX - minX, maxY - minY, height],
    rotation: 0,
    color,
    vertices: inset.map((p) => [p.x, p.y] as [number, number]),
  };
}

function findCornerBuildings(
  roads: RoadNetwork,
  zoneBoundary: Point2[],
  height: [number, number],
  color: string,
  obstaclePolygons: Point2[][],
): Building[] {
  if (!roads?.nodes || !roads?.edges) return [];

  const nodePos = new Map<string, [number, number]>();
  for (const node of roads.nodes) {
    nodePos.set(node.id, node.position);
  }

  const nodeEdgeMap = buildNodeEdgeMap(roads);
  const results: Building[] = [];

  // Compute zone bounding box with a margin so nodes on the boundary are included
  const zoneBBox = calculateBoundingBox(zoneBoundary);
  const margin = CORNER_BUILDING_DEPTH;

  for (const node of roads.nodes) {
    const pos = nodePos.get(node.id)!;

    // Broad-phase: skip nodes clearly outside the zone (with margin for boundary nodes)
    if (
      pos[0] < zoneBBox.minX - margin ||
      pos[0] > zoneBBox.maxX + margin ||
      pos[1] < zoneBBox.minY - margin ||
      pos[1] > zoneBBox.maxY + margin
    )
      continue;

    const edges = nodeEdgeMap.get(node.id) ?? [];
    if (edges.length < 2) continue;

    for (const [e1, e2] of getCornerPairs(edges)) {
      const depth = randomInRange(CORNER_BUILDING_DEPTH * 0.8, CORNER_BUILDING_DEPTH * 1.2);
      const wingWidth = randomInRange(CORNER_WING_WIDTH * 0.8, CORNER_WING_WIDTH * 1.2);
      const lotPolygon = computeCornerLotPolygon(pos, e1, e2, depth, wingWidth);
      if (!lotPolygon) continue;

      const bHeight = randomInRange(height[0], height[1]);
      const building = lotPolygonToBuilding(lotPolygon, bHeight, color, zoneBoundary);
      if (!building) continue;

      const poly = getBuildingPolygon(building);

      // Collision check against obstacles and already-placed corner buildings
      if (overlapsWithPolygons(building, obstaclePolygons)) continue;
      if (results.some((r) => polygonsOverlap(poly, getBuildingPolygon(r)))) continue;

      results.push(building);
    }
  }

  return results;
}

// ================================================================================
// LAYOUT GENERATORS
// ================================================================================

function generateGridLayout(settings: ZoneSettings, roadSegments: RoadSegment[]): Building[] {
  const buildings: Building[] = [];
  const bbox = calculateBoundingBox(settings.boundary);
  const zoneMargin = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);

  // Step 1: Place buildings along roads first
  for (const segment of roadSegments) {
    if (segmentIntersectsOrNearZone(segment, settings.boundary, zoneMargin)) {
      const roadBuildings = placeBuildingsAlongRoad(segment, settings.boundary, settings);
      buildings.push(...roadBuildings);
    }
  }

  // Remove overlapping road-aligned buildings
  const roadAlignedBuildings: Building[] = [];
  for (const building of buildings) {
    const buildingPoly = getBuildingPolygon(building);
    let overlaps = false;

    for (const existing of roadAlignedBuildings) {
      const existingPoly = getBuildingPolygon(existing);
      if (polygonsOverlap(buildingPoly, existingPoly)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      roadAlignedBuildings.push(building);
    }
  }

  // Step 2: Fill interior with grid layout
  const [minWidth, maxWidth] = settings.width;
  const [minLength, maxLength] = settings.length;
  const [minHeight, maxHeight] = settings.height;
  const spacing = settings.spacing;

  const stepX = maxWidth + spacing;
  const stepY = maxLength + spacing;

  const startX = bbox.minX + maxWidth / 2 + spacing / 2;
  const startY = bbox.minY + maxLength / 2 + spacing / 2;

  // Convert road-aligned buildings to polygons for collision detection
  const roadBuildingPolygons: Point2[][] = roadAlignedBuildings.map(getBuildingPolygon);

  const gridBuildings: Building[] = [];
  for (let x = startX; x < bbox.maxX - maxWidth / 2; x += stepX) {
    for (let y = startY; y < bbox.maxY - maxLength / 2; y += stepY) {
      const width = randomInRange(minWidth, maxWidth);
      const length = randomInRange(minLength, maxLength);
      const height = randomInRange(minHeight, maxHeight);

      if (!isBuildingInsideBoundary([x, y], width, length, 0, settings.boundary)) {
        continue;
      }

      const testBuilding: Building = {
        center: [x, y],
        size: [width, length, height],
        rotation: 0,
        color: settings.color,
      };

      // Check overlap with road-aligned buildings
      if (overlapsWithPolygons(testBuilding, roadBuildingPolygons)) {
        continue;
      }

      // Check overlap with other grid buildings
      const testPoly = getBuildingPolygon(testBuilding);
      let overlapsGrid = false;
      for (const existing of gridBuildings) {
        const existingPoly = getBuildingPolygon(existing);
        if (polygonsOverlap(testPoly, existingPoly)) {
          overlapsGrid = true;
          break;
        }
      }

      if (!overlapsGrid) {
        gridBuildings.push(testBuilding);
      }
    }
  }

  return [...roadAlignedBuildings, ...gridBuildings];
}

function generatePerimeterLayout(settings: ZoneSettings, roadSegments: RoadSegment[]): Building[] {
  const buildings: Building[] = [];
  const bbox = calculateBoundingBox(settings.boundary);
  const zoneMargin = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);

  // Step 1: Place buildings along roads first
  for (const segment of roadSegments) {
    if (segmentIntersectsOrNearZone(segment, settings.boundary, zoneMargin)) {
      const roadBuildings = placeBuildingsAlongRoad(segment, settings.boundary, settings);
      buildings.push(...roadBuildings);
    }
  }

  // Remove overlapping road-aligned buildings
  const roadAlignedBuildings: Building[] = [];
  for (const building of buildings) {
    const buildingPoly = getBuildingPolygon(building);
    let overlaps = false;

    for (const existing of roadAlignedBuildings) {
      const existingPoly = getBuildingPolygon(existing);
      if (polygonsOverlap(buildingPoly, existingPoly)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      roadAlignedBuildings.push(building);
    }
  }

  // Step 2: Generate multiple inner rings of buildings
  const [minWidth, maxWidth] = settings.width;
  const [minLength, maxLength] = settings.length;
  const [minHeight, maxHeight] = settings.height;
  const spacing = settings.spacing;

  // Convert road-aligned buildings to polygons for collision detection
  const roadBuildingPolygons: Point2[][] = roadAlignedBuildings.map(getBuildingPolygon);

  const allInnerBuildings: Building[] = [];

  // Ring spacing: building depth + gap between rings
  const ringSpacing = maxLength * 2 + spacing * 2;

  // Generate 1 inner ring (total 2 rings including road-aligned)
  const insetDistance = ringSpacing;
  const innerBoundary = insetPolygon(settings.boundary, insetDistance);

  if (innerBoundary.length >= 3) {
    // Convert existing inner buildings to polygons for collision detection
    const existingPolygons: Point2[][] = [...roadBuildingPolygons];

    // Place buildings along each edge of this ring's boundary
    for (let i = 0; i < innerBoundary.length; i++) {
      const p1 = innerBoundary[i];
      const p2 = innerBoundary[(i + 1) % innerBoundary.length];

      const edgeLength = distance2D(p1.x, p1.y, p2.x, p2.y);
      const edgeAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const edgeAngleDegrees = (edgeAngle * 180) / Math.PI;

      const buildingsPerEdge = Math.floor((edgeLength + spacing) / (maxWidth + spacing));
      if (buildingsPerEdge <= 0) continue;

      const actualSpacing = (edgeLength - buildingsPerEdge * maxWidth) / (buildingsPerEdge + 1);

      for (let j = 0; j < buildingsPerEdge; j++) {
        const t = (actualSpacing + maxWidth / 2 + j * (maxWidth + actualSpacing)) / edgeLength;
        const cx = p1.x + t * (p2.x - p1.x);
        const cy = p1.y + t * (p2.y - p1.y);

        const width = randomInRange(minWidth, maxWidth);
        const length = randomInRange(minLength, maxLength);
        const height = randomInRange(minHeight, maxHeight);

        // Check if inside original boundary
        if (!isBuildingInsideBoundary([cx, cy], width, length, edgeAngleDegrees, settings.boundary)) {
          continue;
        }

        const testBuilding: Building = {
          center: [cx, cy],
          size: [width, length, height],
          rotation: edgeAngleDegrees,
          color: settings.color,
        };

        // Check overlap with all existing buildings
        if (overlapsWithPolygons(testBuilding, existingPolygons)) {
          continue;
        }

        // Check overlap with other buildings in current ring
        const testPoly = getBuildingPolygon(testBuilding);
        let overlapsOther = false;
        for (const existing of allInnerBuildings) {
          const existingPoly = getBuildingPolygon(existing);
          if (polygonsOverlap(testPoly, existingPoly)) {
            overlapsOther = true;
            break;
          }
        }

        if (!overlapsOther) {
          allInnerBuildings.push(testBuilding);
        }
      }
    }
  }

  // Step 3: Fill remaining center space with one large building
  // Inset from the inner ring boundary, not the original zone boundary
  const centerBoundary = innerBoundary.length >= 3 ? insetPolygon(innerBoundary, ringSpacing) : [];

  if (centerBoundary.length >= 3) {
    // Calculate centroid of the center boundary
    let centroidX = 0;
    let centroidY = 0;
    for (const p of centerBoundary) {
      centroidX += p.x;
      centroidY += p.y;
    }
    centroidX /= centerBoundary.length;
    centroidY /= centerBoundary.length;

    // Calculate the maximum size that fits in the center boundary
    // Find minimum distance from centroid to any edge
    let minDistToEdge = Infinity;
    for (let i = 0; i < centerBoundary.length; i++) {
      const p1 = centerBoundary[i];
      const p2 = centerBoundary[(i + 1) % centerBoundary.length];
      const dist = pointToSegmentDistance(centroidX, centroidY, [p1.x, p1.y], [p2.x, p2.y]);
      minDistToEdge = Math.min(minDistToEdge, dist);
    }

    // Leave some margin
    const margin = spacing;
    const maxCenterSize = (minDistToEdge - margin) * 2;

    if (maxCenterSize >= minWidth && maxCenterSize >= minLength) {
      const centerWidth = Math.min(maxCenterSize, maxWidth * 2);
      const centerLength = Math.min(maxCenterSize, maxLength * 2);
      const centerHeight = randomInRange(minHeight, maxHeight);

      const centerBuilding: Building = {
        center: [centroidX, centroidY],
        size: [centerWidth, centerLength, centerHeight],
        rotation: 0,
        color: settings.color,
      };

      // Check if the center building doesn't overlap with existing buildings
      const allExistingPolygons: Point2[][] = [...roadBuildingPolygons, ...allInnerBuildings.map(getBuildingPolygon)];

      if (!overlapsWithPolygons(centerBuilding, allExistingPolygons)) {
        allInnerBuildings.push(centerBuilding);
      }
    }
  }

  return [...roadAlignedBuildings, ...allInnerBuildings];
}

function generateClusterLayout(settings: ZoneSettings, roadSegments: RoadSegment[]): Building[] {
  const buildings: Building[] = [];
  const bbox = calculateBoundingBox(settings.boundary);
  const zoneMargin = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);

  // Step 1: Place buildings along roads first
  for (const segment of roadSegments) {
    if (segmentIntersectsOrNearZone(segment, settings.boundary, zoneMargin)) {
      const roadBuildings = placeBuildingsAlongRoad(segment, settings.boundary, settings);
      buildings.push(...roadBuildings);
    }
  }

  // Remove overlapping road-aligned buildings
  const roadAlignedBuildings: Building[] = [];
  for (const building of buildings) {
    const buildingPoly = getBuildingPolygon(building);
    let overlaps = false;

    for (const existing of roadAlignedBuildings) {
      const existingPoly = getBuildingPolygon(existing);
      if (polygonsOverlap(buildingPoly, existingPoly)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      roadAlignedBuildings.push(building);
    }
  }

  // Step 2: Fill interior with cluster layout using Poisson disk sampling
  const [minWidth, maxWidth] = settings.width;
  const [minLength, maxLength] = settings.length;
  const [minHeight, maxHeight] = settings.height;
  const spacing = settings.spacing;

  // Convert road-aligned buildings to polygons for collision detection
  const roadBuildingPolygons: Point2[][] = roadAlignedBuildings.map(getBuildingPolygon);

  const minDist = Math.max(maxWidth, maxLength) + spacing;
  const cellSize = minDist / Math.SQRT2;
  const gridWidth = Math.ceil((bbox.maxX - bbox.minX) / cellSize);
  const gridHeight = Math.ceil((bbox.maxY - bbox.minY) / cellSize);

  const grid: number[][] = Array(gridWidth)
    .fill(null)
    .map(() => Array(gridHeight).fill(-1));
  const points: [number, number][] = [];
  const activeList: number[] = [];

  const toGrid = (x: number, y: number): [number, number] => [
    Math.floor((x - bbox.minX) / cellSize),
    Math.floor((y - bbox.minY) / cellSize),
  ];

  // Helper to check if a point is too close to road-aligned buildings
  const isTooCloseToRoadBuildings = (x: number, y: number): boolean => {
    for (const poly of roadBuildingPolygons) {
      // Check if point is inside the building polygon
      if (Util.isPointInside(x, y, poly)) return true;

      // Check distance to building edges
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        const dist = pointToSegmentDistance(x, y, [p1.x, p1.y], [p2.x, p2.y]);
        if (dist < minDist / 2) return true;
      }
    }
    return false;
  };

  // Find initial point that doesn't overlap with road-aligned buildings
  let initialPoint: [number, number] | null = null;
  for (let attempt = 0; attempt < 100; attempt++) {
    const x = bbox.minX + Math.random() * (bbox.maxX - bbox.minX);
    const y = bbox.minY + Math.random() * (bbox.maxY - bbox.minY);
    if (Util.isPointInside(x, y, settings.boundary) && !isTooCloseToRoadBuildings(x, y)) {
      initialPoint = [x, y];
      break;
    }
  }

  if (initialPoint) {
    points.push(initialPoint);
    activeList.push(0);
    const [gx, gy] = toGrid(initialPoint[0], initialPoint[1]);
    if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
      grid[gx][gy] = 0;
    }
  }

  const k = 30;

  while (activeList.length > 0) {
    const randomIndex = Math.floor(Math.random() * activeList.length);
    const pointIndex = activeList[randomIndex];
    const [px, py] = points[pointIndex];

    let found = false;
    for (let attempt = 0; attempt < k; attempt++) {
      const ang = Math.random() * 2 * Math.PI;
      const radius = minDist + Math.random() * minDist;
      const newX = px + radius * Math.cos(ang);
      const newY = py + radius * Math.sin(ang);

      if (!Util.isPointInside(newX, newY, settings.boundary)) continue;
      if (isTooCloseToRoadBuildings(newX, newY)) continue;

      const [gx, gy] = toGrid(newX, newY);
      if (gx < 0 || gx >= gridWidth || gy < 0 || gy >= gridHeight) continue;

      let valid = true;
      for (let dx = -2; dx <= 2 && valid; dx++) {
        for (let dy = -2; dy <= 2 && valid; dy++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
            const neighborIdx = grid[nx][ny];
            if (neighborIdx !== -1) {
              const [npx, npy] = points[neighborIdx];
              if (distance2D(newX, newY, npx, npy) < minDist) {
                valid = false;
              }
            }
          }
        }
      }

      if (valid) {
        points.push([newX, newY]);
        const newIdx = points.length - 1;
        activeList.push(newIdx);
        grid[gx][gy] = newIdx;
        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(randomIndex, 1);
    }
  }

  const clusterBuildings: Building[] = [];
  for (const [x, y] of points) {
    const rotation = Math.random() * 360;
    const width = randomInRange(minWidth, maxWidth);
    const length = randomInRange(minLength, maxLength);
    const height = randomInRange(minHeight, maxHeight);

    if (!isBuildingInsideBoundary([x, y], width, length, rotation, settings.boundary)) {
      continue;
    }

    const testBuilding: Building = {
      center: [x, y],
      size: [width, length, height],
      rotation,
      color: settings.color,
    };

    // Check overlap with road-aligned buildings
    if (overlapsWithPolygons(testBuilding, roadBuildingPolygons)) {
      continue;
    }

    clusterBuildings.push(testBuilding);
  }

  return [...roadAlignedBuildings, ...clusterBuildings];
}

// ================================================================================
// ROAD GENERATION FOR RENDERING
// ================================================================================

function generateSegment(start: [number, number], end: [number, number], width: number): RoadRenderSegment {
  return {
    position: midpoint(start, end),
    length: distance(start, end),
    width,
    angle: angle(start, end),
  };
}

function generateRoad(edge: RoadEdge, nodeMap: Map<string, RoadNode>): Road {
  const fromNode = nodeMap.get(edge.from);
  const toNode = nodeMap.get(edge.to);

  if (!fromNode || !toNode) {
    throw new Error(`Invalid edge: ${edge.id}`);
  }

  const width = ROAD_WIDTH[edge.level];
  const path: [number, number][] = [fromNode.position, ...(edge.points || []), toNode.position];

  const segments: RoadRenderSegment[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    segments.push(generateSegment(path[i], path[i + 1], width));
  }

  return {
    edgeId: edge.id,
    level: edge.level,
    segments,
  };
}

// ================================================================================
// EXPORTS
// ================================================================================

export function generateRoads(network: RoadNetwork): Road[] {
  const nodeMap = new Map<string, RoadNode>();
  for (const node of network.nodes) {
    nodeMap.set(node.id, node);
  }

  return network.edges.map((edge) => generateRoad(edge, nodeMap));
}

export function generateBuildings(city: any, processedLandmarks?: Building[]): Building[] {
  const buildings: Building[] = [];
  const zones = city.zones || [];

  const parkPolygons: Point2[][] = (city.parks || []).map((p: Park) =>
    p.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
  );

  const riverPolygons: Point2[][] = (city.rivers || []).map((r: River) =>
    r.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
  );

  const roadPolygons: Point2[][] = generateRoadPolygons(city.roads);
  const roadSegments: RoadSegment[] = getRoadSegments(city.roads);

  const landmarkPolygons: Point2[][] = processedLandmarks
    ? processedLandmarks.map((lm: Building) => getBuildingCorners(lm.center, lm.size[0], lm.size[1], lm.rotation))
    : (city.landmarks || []).map((lm: Landmark) =>
        getBuildingCorners(lm.center, lm.size[0], lm.size[1], lm.rotation ?? 0),
      );

  for (const zone of zones) {
    if (!zone.boundary || zone.boundary.length < 3) continue;

    const settings: ZoneSettings = {
      boundary: zone.boundary.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
      length: zone.length ?? [20, 30],
      width: zone.width ?? [15, 25],
      height: zone.height ?? [20, 50],
      spacing: zone.spacing ?? 5,
      coverage: zone.coverage ?? 0.6,
      layout: zone.layout ?? 'grid',
      color: zone.color ?? 'grey',
    };

    const zoneArea = Math.abs(Util.getPolygonArea(settings.boundary));
    const targetArea = zoneArea * settings.coverage;

    const baseObstacles: Point2[][] = [...parkPolygons, ...riverPolygons, ...roadPolygons, ...landmarkPolygons];

    // Generate corner buildings first so regular layout avoids their lots
    const cornerBuildings = findCornerBuildings(
      city.roads,
      settings.boundary,
      settings.height,
      settings.color,
      baseObstacles,
    );
    const cornerBuildingPolygons = cornerBuildings.map(getBuildingPolygon);

    let candidates: Building[];
    switch (settings.layout) {
      case 'grid':
        candidates = generateGridLayout(settings, roadSegments);
        break;
      case 'perimeter':
        candidates = generatePerimeterLayout(settings, roadSegments);
        break;
      case 'cluster':
        candidates = generateClusterLayout(settings, roadSegments);
        break;
      default:
        candidates = generateGridLayout(settings, roadSegments);
    }

    const validBuildings = candidates.filter(
      (b) =>
        !overlapsWithPolygons(b, parkPolygons) &&
        !overlapsWithPolygons(b, riverPolygons) &&
        !overlapsWithPolygons(b, roadPolygons) &&
        !overlapsWithPolygons(b, landmarkPolygons) &&
        !overlapsWithPolygons(b, cornerBuildingPolygons),
    );

    const cornerArea = cornerBuildings.reduce((s, b) => s + b.size[0] * b.size[1], 0);
    const selectedRegular = applyCoverageConstraint(validBuildings, Math.max(0, targetArea - cornerArea));
    const selectedBuildings = [...cornerBuildings, ...selectedRegular];

    for (const building of selectedBuildings) {
      const buildingPoly = getBuildingPolygon(building);
      let overlaps = false;

      for (const existing of buildings) {
        const existingPoly = getBuildingPolygon(existing);
        if (polygonsOverlap(buildingPoly, existingPoly)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        buildings.push(building);
      }
    }
  }

  return buildings;
}

export function generateCityRivers(rivers: River[]): River[] {
  return rivers || [];
}

export function generateCityParks(parks: Park[]): Park[] {
  return parks || [];
}

export interface TreeInstance {
  center: [number, number];
  type: 'park' | 'street';
}

export function generateTrees(
  parks: Park[],
  roads?: RoadNetwork,
  buildings?: Building[],
  rivers?: River[],
): TreeInstance[] {
  const trees: TreeInstance[] = [];
  const treeSpacing = 8; // minimum distance between trees

  // Generate road polygons for collision detection (used by park trees)
  const roadPolygons: Point2[][] = roads ? generateRoadPolygons(roads) : [];

  // Generate river polygons for collision detection
  const riverPolygons: Point2[][] = (rivers || []).map((r) =>
    r.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
  );

  // Helper to check if a position is too close to existing trees
  const isTooCloseToTrees = (x: number, y: number, minDist: number): boolean => {
    for (const tree of trees) {
      if (distance2D(x, y, tree.center[0], tree.center[1]) < minDist) {
        return true;
      }
    }
    return false;
  };

  // Helper to check if a position is on a road
  const isOnRoad = (x: number, y: number): boolean => {
    for (const poly of roadPolygons) {
      if (Util.isPointInside(x, y, poly)) {
        return true;
      }
    }
    return false;
  };

  // Helper to check if a position is in a river
  const isInRiver = (x: number, y: number): boolean => {
    for (const poly of riverPolygons) {
      if (Util.isPointInside(x, y, poly)) {
        return true;
      }
    }
    return false;
  };

  // ---- Park trees ----
  if (parks && parks.length > 0) {
    for (const park of parks) {
      if (!park.vertices || park.vertices.length < 3) continue;

      const polygon: Point2[] = park.vertices.map((v) => ({ x: v[0], y: v[1] }));

      // Inset the polygon slightly so trees aren't right on the edge
      const innerPolygon = insetPolygon(polygon, 3);
      if (innerPolygon.length < 3) continue;

      const innerBbox = calculateBoundingBox(innerPolygon);

      // Calculate park area to determine tree count
      const area = Math.abs(Util.getPolygonArea(polygon));
      const treeDensity = 0.003; // trees per square meter
      const targetTreeCount = Math.max(3, Math.floor(area * treeDensity));

      let placed = 0;
      let attempts = 0;
      const maxAttempts = targetTreeCount * 10;

      while (placed < targetTreeCount && attempts < maxAttempts) {
        attempts++;

        const x = randomInRange(innerBbox.minX, innerBbox.maxX);
        const y = randomInRange(innerBbox.minY, innerBbox.maxY);

        if (!Util.isPointInside(x, y, innerPolygon)) continue;

        // Skip if on a road or in a river
        if (isOnRoad(x, y)) continue;
        if (isInRiver(x, y)) continue;

        if (!isTooCloseToTrees(x, y, treeSpacing)) {
          trees.push({ center: [x, y], type: 'park' });
          placed++;
        }
      }
    }
  }

  // ---- Street trees (along main roads, level 1) ----
  if (roads && roads.nodes && roads.edges) {
    const streetTreeSpacing = 20; // distance between street trees along road
    const roadSetback = 0.5; // distance from road edge to tree center

    const nodeMap = new Map<string, [number, number]>();
    for (const node of roads.nodes) {
      nodeMap.set(node.id, node.position);
    }

    // Build obstacle polygons from buildings for collision avoidance
    const buildingPolygons: Point2[][] = (buildings || []).map((b) =>
      getBuildingCorners(b.center, b.size[0], b.size[1], b.rotation),
    );

    // Park polygons to avoid placing street trees inside parks
    const parkPolygons: Point2[][] = (parks || []).map((p) =>
      p.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
    );

    for (const edge of roads.edges) {
      if (edge.level !== 1) continue; // only main roads

      const fromPos = nodeMap.get(edge.from);
      const toPos = nodeMap.get(edge.to);
      if (!fromPos || !toPos) continue;

      const roadWidth = ROAD_WIDTH[edge.level];
      const path: [number, number][] = [fromPos, ...(edge.points || []), toPos];

      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        const segLen = distance(p1, p2);
        if (segLen < streetTreeSpacing) continue;

        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const dirX = dx / segLen;
        const dirY = dy / segLen;

        // Perpendicular direction
        const perpX = -dirY;
        const perpY = dirX;

        // Offset from road center to tree position
        const treeOffset = roadWidth / 2 + roadSetback;

        // Place trees along both sides
        const numTrees = Math.floor(segLen / streetTreeSpacing);
        const startOffset = (segLen - (numTrees - 1) * streetTreeSpacing) / 2;

        for (let j = 0; j < numTrees; j++) {
          const t = startOffset + j * streetTreeSpacing;
          const baseX = p1[0] + dirX * t;
          const baseY = p1[1] + dirY * t;

          for (const side of [1, -1]) {
            const tx = baseX + perpX * treeOffset * side;
            const ty = baseY + perpY * treeOffset * side;

            // Skip if too close to existing trees
            if (isTooCloseToTrees(tx, ty, treeSpacing)) continue;

            // Skip if inside a park (park already has its own trees)
            let insidePark = false;
            for (const poly of parkPolygons) {
              if (Util.isPointInside(tx, ty, poly)) {
                insidePark = true;
                break;
              }
            }
            if (insidePark) continue;

            // Skip if overlapping with a building
            let insideBuilding = false;
            for (const poly of buildingPolygons) {
              if (Util.isPointInside(tx, ty, poly)) {
                insideBuilding = true;
                break;
              }
            }
            if (insideBuilding) continue;

            // Skip if on another road or in a river
            if (isOnRoad(tx, ty)) continue;
            if (isInRiver(tx, ty)) continue;

            trees.push({ center: [tx, ty], type: 'street' });
          }
        }
      }
    }
  }

  return trees;
}

export function generateLandmarkBuildings(city: any): Building[] {
  const landmarks: Landmark[] = city.landmarks || [];

  const parkPolygons: Point2[][] = (city.parks || []).map((p: Park) =>
    p.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
  );

  const riverPolygons: Point2[][] = (city.rivers || []).map((r: River) =>
    r.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
  );

  const roadPolygons: Point2[][] = generateRoadPolygons(city.roads);

  const allObstacles: Point2[][] = [...parkPolygons, ...riverPolygons, ...roadPolygons];

  const buildings: Building[] = [];
  for (const lm of landmarks) {
    const building: Building = {
      center: lm.center,
      size: lm.size,
      rotation: lm.rotation ?? 0,
      color: 'grey',
    };

    const validPosition = findNearestValidPosition(building, allObstacles);

    if (validPosition) {
      buildings.push({
        center: validPosition,
        size: lm.size,
        rotation: lm.rotation ?? 0,
        color: 'grey',
      });
    }
  }

  return buildings;
}
