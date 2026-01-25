interface Block {
  boundary: [number, number][];
  size: [number, number];
  height: [number, number];
  spacing: number;
  coverage: number;
  layout: 'fill' | 'perimeter' | 'scatter';
}

interface Roads {
  width: number;
  lines: [number, number][][];
}

interface Landmark {
  center: [number, number];
  size: [number, number, number];
  rotation: number;
}

interface Polygon {
  vertices: [number, number][];
}

interface Park extends Polygon {}

interface River extends Polygon {}

interface Building {
  center: [number, number];
  size: [number, number, number];
  rotation: number;
}

interface BBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface RoadMask {
  polygons: [number, number][][];
}

interface BuildingCandidate {
  center: [number, number];
  width: number;
  length: number;
  rotation: number;
}

/**
 * 处理所有河流
 */
export function generateCityRivers(rivers: River[]): River[] {
  const adjustedRivers: River[] = [];

  for (const river of rivers) {
    adjustedRivers.push(river);
  }

  return adjustedRivers;
}

/**
 * 处理所有公园，暂时不调整与道路重叠的公园位置
 */
export function generateCityParks(parks: Park[], roads: Roads): Park[] {
  const adjustedParks: Park[] = [];

  for (const park of parks) {
    // const adjusted = adjustParkPosition(park, roads, adjustedParks);
    adjustedParks.push(park);
  }

  return adjustedParks;
}

export function generateLandmarkBuildings(city: any): Landmark[] {
  const allLandmarks: Landmark[] = [];

  // 处理地标建筑（优先）
  const landmarks: Landmark[] = [];
  for (const lm of city.buildings.landmarks) {
    const landmark: Landmark = { ...lm };

    // 调整地标位置，避开道路
    const adjusted = adjustLandmarkPosition(landmark, city.roads);
    // const adjusted = landmark
    landmarks.push(adjusted);
  }
  allLandmarks.push(...landmarks);

  return allLandmarks;
}

/**
 * 根据布局模式生成建筑
 */
export function generateBlockBuildings(city: any, landmarks: Building[]): Building[] {
  const allBuildings: Building[] = [];

  // 处理所有区块
  for (const block of city.buildings.blocks) {
    const mergedBlock = { ...city.buildings.defaults, ...block };

    // 根据布局模式生成建筑
    let buildings: Building[];
    switch (mergedBlock.layout) {
      case 'perimeter':
        buildings = generatePerimeterBuildings(mergedBlock, city.roads);
        break;
      case 'fill':
        buildings = generateFillBuildings(mergedBlock, city.roads);
        break;
      case 'scatter':
        buildings = generateScatterBuildings(mergedBlock, city.roads);
        break;
      default:
        buildings = generateFillBuildings(mergedBlock, city.roads);
    }

    // 过滤与地标重叠的建筑
    buildings = filterOverlappingWithLandmarks(buildings, [...landmarks, ...allBuildings]);
    // 过滤与公园重叠的建筑
    buildings = filterOverlappingWithParks(buildings, city.parks);

    allBuildings.push(...buildings);
  }

  return allBuildings;
}

function getBoundingBox(polygon: [number, number][]): BBox {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/**
 * 过滤与公园重叠的建筑
 */
function filterOverlappingWithParks(buildings: Building[], parks: Park[]): Building[] {
  if (parks.length === 0) {
    return buildings;
  }

  // 预计算公园矩形
  const parkRects = parks.map((p) => getParkRect(p));

  return buildings.filter((building) => {
    const buildingRect = getBuildingRect({
      center: building.center,
      width: building.size[0],
      length: building.size[1],
      rotation: building.rotation,
    });

    for (const parkRect of parkRects) {
      if (polygonsIntersect(buildingRect, parkRect)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 获取公园的边界框矩形(四个角点)
 */
function getParkRect(park: Park): [number, number][] {
  const bbox = getBoundingBox(park.vertices);
  return [
    [bbox.minX, bbox.minY],
    [bbox.maxX, bbox.minY],
    [bbox.maxX, bbox.maxY],
    [bbox.minX, bbox.maxY],
  ];
}

/**
 * 将线段扩展为指定宽度的矩形
 */
function expandLineToRect(p1: [number, number], p2: [number, number], width: number): [number, number][] {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) return [];

  // 单位法向量
  const nx = -dy / len;
  const ny = dx / len;

  const hw = width / 2;

  // 四个角点
  return [
    [p1[0] + nx * hw, p1[1] + ny * hw],
    [p1[0] - nx * hw, p1[1] - ny * hw],
    [p2[0] - nx * hw, p2[1] - ny * hw],
    [p2[0] + nx * hw, p2[1] + ny * hw],
  ];
}

/**
 * 判断点是否在多边形内（射线法）
 */
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * 将线段裁剪到多边形内部
 */
function clipLineToPolygon(line: [number, number][], polygon: [number, number][]): [number, number][][] {
  const result: [number, number][][] = [];
  let currentSegment: [number, number][] = [];

  for (let i = 0; i < line.length; i++) {
    const point = line[i];
    const inside = pointInPolygon(point, polygon);

    if (inside) {
      if (currentSegment.length === 0 && i > 0) {
        // 从外部进入，计算交点
        const intersection = findEdgeIntersection(line[i - 1], point, polygon);
        if (intersection) currentSegment.push(intersection);
      }
      currentSegment.push(point);
    } else {
      if (currentSegment.length > 0) {
        // 从内部离开，计算交点
        const intersection = findEdgeIntersection(currentSegment[currentSegment.length - 1], point, polygon);
        if (intersection) currentSegment.push(intersection);
        result.push(currentSegment);
        currentSegment = [];
      }
    }
  }

  if (currentSegment.length > 1) {
    result.push(currentSegment);
  }

  return result;
}

/**
 * 计算线段与多边形边界的交点
 * @param p1 线段起点（多边形外部）
 * @param p2 线段终点（多边形内部）
 * @param polygon 多边形顶点数组
 * @returns 交点坐标，如果没有交点则返回null
 */
function findEdgeIntersection(
  p1: [number, number],
  p2: [number, number],
  polygon: [number, number][],
): [number, number] | null {
  let closestIntersection: [number, number] | null = null;
  let minDist = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const e1 = polygon[i];
    const e2 = polygon[(i + 1) % polygon.length];

    const intersection = lineSegmentIntersection(p1, p2, e1, e2);

    if (intersection) {
      const dist = distance(p1, intersection);
      if (dist < minDist) {
        minDist = dist;
        closestIntersection = intersection;
      }
    }
  }

  return closestIntersection;
}

/**
 * 计算两条线段的交点
 * @returns 交点坐标，如果不相交则返回null
 */
function lineSegmentIntersection(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number],
): [number, number] | null {
  const d1x = p2[0] - p1[0];
  const d1y = p2[1] - p1[1];
  const d2x = p4[0] - p3[0];
  const d2y = p4[1] - p3[1];

  const cross = d1x * d2y - d1y * d2x;

  // 平行或共线
  if (Math.abs(cross) < 1e-10) {
    return null;
  }

  const dx = p3[0] - p1[0];
  const dy = p3[1] - p1[1];

  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;

  // 检查交点是否在两条线段上
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [p1[0] + t * d1x, p1[1] + t * d1y];
  }

  return null;
}

/**
 * 从多边形中减去其他多边形（使用多边形布尔运算）
 * 简化实现：使用网格采样法
 */
function subtractPolygons(base: [number, number][], holes: [number, number][][]): [number, number][][] {
  // 实际项目中建议使用成熟的多边形布尔运算库
  // 如：polygon-clipping, clipper-lib, turf.js

  // 简化实现：基于轮廓追踪
  return polygonDifference(base, holes);
}

/**
 * 获取建筑的矩形轮廓（考虑旋转）
 */
function getBuildingRect(c: BuildingCandidate): [number, number][] {
  const hw = c.width / 2;
  const hl = c.length / 2;
  const rad = (c.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // 局部坐标的四个角
  const localCorners: [number, number][] = [
    [-hw, -hl],
    [hw, -hl],
    [hw, hl],
    [-hw, hl],
  ];

  // 旋转并平移到世界坐标
  return localCorners.map(([dx, dy]) => [c.center[0] + dx * cos - dy * sin, c.center[1] + dx * sin + dy * cos]);
}

/**
 * 调整地标位置，避开道路
 */
function adjustLandmarkPosition(landmark: Building, roads: Roads): Building {
  const rect = getBuildingRect({
    center: landmark.center,
    width: landmark.size[0],
    length: landmark.size[1],
    rotation: landmark.rotation,
  });

  // 检查是否与道路重叠
  const roadMask = createRoadMask(roads, getBoundingBox(rect));
  let overlapping = false;

  for (const roadPoly of roadMask.polygons) {
    if (polygonsIntersect(rect, roadPoly)) {
      overlapping = true;
      break;
    }
  }

  if (!overlapping) {
    return landmark;
  }

  // 找到最近的合法位置
  const newCenter = findNearestValidPosition(landmark, roads);

  return {
    ...landmark,
    center: newCenter,
  };
}

function createRoadMask(roads: Roads, bbox: BBox): RoadMask {
  // 将每条道路线段扩展为宽度为roads.width的多边形
  const roadPolygons: any[] = [];

  for (const line of roads.lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const p1 = line[i];
      const p2 = line[i + 1];
      // 沿线段两侧扩展 width/2，生成矩形
      const rect = expandLineToRect(p1, p2, roads.width);
      roadPolygons.push(rect);
    }
  }

  return { polygons: roadPolygons };
}

/**
 * 将多边形投影到轴上
 */
function projectPolygon(polygon: [number, number][], axis: number[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const point of polygon) {
    const dot = point[0] * axis[0] + point[1] * axis[1];
    min = Math.min(min, dot);
    max = Math.max(max, dot);
  }

  return { min, max };
}

/**
 * 判断两个多边形是否相交（SAT分离轴算法）
 */
function polygonsIntersect(polyA: [number, number][], polyB: [number, number][]): boolean {
  const polygons = [polyA, polyB];

  for (const polygon of polygons) {
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;

      // 计算边的法向量（分离轴）
      const edge = [polygon[j][0] - polygon[i][0], polygon[j][1] - polygon[i][1]];
      const axis = [-edge[1], edge[0]];

      // 投影两个多边形到轴上
      const projA = projectPolygon(polyA, axis);
      const projB = projectPolygon(polyB, axis);

      // 如果投影不重叠，则多边形不相交
      if (projA.max < projB.min || projB.max < projA.min) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 寻找最近的不与道路重叠的位置
 */
function findNearestValidPosition(landmark: Building, roads: Roads): [number, number] {
  const [cx, cy] = landmark.center;
  const searchRadius = Math.max(landmark.size[0], landmark.size[1]) * 2;
  const step = 5;

  let bestPosition = landmark.center;
  let minDistance = Infinity;

  // 螺旋搜索
  for (let r = step; r <= searchRadius; r += step) {
    for (let angle = 0; angle < 360; angle += 15) {
      const rad = (angle * Math.PI) / 180;
      const testCenter: [number, number] = [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];

      const testRect = getBuildingRect({
        center: testCenter,
        width: landmark.size[0],
        length: landmark.size[1],
        rotation: landmark.rotation,
      });

      const roadMask = createRoadMask(roads, getBoundingBox(testRect));
      let valid = true;

      for (const roadPoly of roadMask.polygons) {
        if (polygonsIntersect(testRect, roadPoly)) {
          valid = false;
          break;
        }
      }

      if (valid) {
        const dist = distance(landmark.center, testCenter);
        if (dist < minDistance) {
          minDistance = dist;
          bestPosition = testCenter;
        }
      }
    }

    // 找到合法位置后，完成当前半径的搜索再返回
    if (minDistance < Infinity && minDistance <= r) {
      break;
    }
  }

  return bestPosition;
}

/**
 * Perimeter模式：沿道路两侧生成建筑
 */
function generatePerimeterBuildings(block: Block, roads: Roads): Building[] {
  const [buildingW, buildingL] = block.size;
  const candidates: BuildingCandidate[] = [];

  // 1. 收集区块内的道路段
  const roadSegments: [[number, number], [number, number]][] = [];

  for (const line of roads.lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const p1 = line[i];
      const p2 = line[i + 1];

      // 检查线段是否与区块相交
      if (segmentIntersectsPolygon(p1, p2, block.boundary)) {
        roadSegments.push([p1, p2]);
      }
    }
  }

  // 2. 沿每条道路段的两侧生成建筑
  for (const [p1, p2] of roadSegments) {
    const edgeLength = distance(p1, p2);
    const edgeAngle = angle(p1, p2);

    // 道路的法向量（两侧）
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;

    // 建筑中心到道路中心的距离
    const offsetDist = roads.width / 2 + buildingL / 2 + block.spacing;

    // 沿道路放置建筑
    const step = buildingW + block.spacing;
    const count = Math.floor((edgeLength - block.spacing) / step);
    const startOffset = (edgeLength - count * step + block.spacing) / 2;

    for (let j = 0; j < count; j++) {
      const t = (startOffset + j * step + buildingW / 2) / edgeLength;
      const roadPoint = lerp(p1, p2, t);

      // 道路两侧各放一个建筑
      const sides = [1, -1];
      for (const side of sides) {
        const center: [number, number] = [roadPoint[0] + nx * offsetDist * side, roadPoint[1] + ny * offsetDist * side];

        candidates.push({
          center,
          width: buildingW + (Math.random() - 0.5) * buildingW * 0.1,
          length: buildingL + (Math.random() - 0.5) * buildingL * 0.1,
          rotation: edgeAngle,
        });
      }
    }
  }

  // 3. 过滤：必须在区块内
  let filtered = candidates.filter((c) => {
    const corners = getBuildingCorners(c);
    return corners.every((corner) => pointInPolygon(corner, block.boundary));
  });

  // 4. 过滤：不能与道路重叠
  const roadMask = createRoadMask(roads, getBoundingBox(block.boundary));
  filtered = filtered.filter((c) => {
    const rect = getBuildingRect(c);
    for (const roadPoly of roadMask.polygons) {
      if (polygonsIntersect(rect, roadPoly)) {
        return false;
      }
    }
    return true;
  });

  // 5. 过滤：移除互相重叠的建筑
  filtered = removeOverlappingBuildings(filtered);

  // 6. 应用覆盖率
  filtered = applyCoverage(filtered, block);

  // 7. 转换为Building
  return filtered.map((c) => ({
    center: c.center,
    size: [c.width, c.length, randomInRange(block.height)],
    rotation: c.rotation,
  }));
}

/**
 * 检查线段是否与多边形相交或在多边形内
 */
function segmentIntersectsPolygon(p1: [number, number], p2: [number, number], polygon: [number, number][]): boolean {
  // 检查端点是否在多边形内
  if (pointInPolygon(p1, polygon) || pointInPolygon(p2, polygon)) {
    return true;
  }

  // 检查线段是否与多边形边相交
  for (let i = 0; i < polygon.length; i++) {
    const e1 = polygon[i];
    const e2 = polygon[(i + 1) % polygon.length];
    if (lineSegmentIntersection(p1, p2, e1, e2)) {
      return true;
    }
  }

  return false;
}

/**
 * 移除互相重叠的建筑（保留先生成的）
 */
function removeOverlappingBuildings(candidates: BuildingCandidate[]): BuildingCandidate[] {
  const result: BuildingCandidate[] = [];
  const resultRects: [number, number][][] = [];

  for (const c of candidates) {
    const rect = getBuildingRect(c);
    let overlapping = false;

    for (const existingRect of resultRects) {
      if (polygonsIntersect(rect, existingRect)) {
        overlapping = true;
        break;
      }
    }

    if (!overlapping) {
      result.push(c);
      resultRects.push(rect);
    }
  }

  return result;
}

/**
 * 计算多边形面积（Shoelace公式）
 */
function calculatePolygonArea(polygon: [number, number][]): number {
  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i][0] * polygon[j][1];
    area -= polygon[j][0] * polygon[i][1];
  }

  return Math.abs(area) / 2;
}

/**
 * 对小街区应用覆盖率
 */
// function applyCoverageForSubBlock(
//   candidates: BuildingCandidate[],
//   boundary: [number, number][],
//   coverage: number,
// ): BuildingCandidate[] {
//   const blockArea = calculatePolygonArea(boundary);
//   const targetArea = blockArea * coverage;

//   let currentArea = 0;
//   const result: BuildingCandidate[] = [];

//   for (const c of candidates) {
//     const buildingArea = c.width * c.length;
//     if (currentArea + buildingArea <= targetArea) {
//       result.push(c);
//       currentArea += buildingArea;
//     }
//   }

//   return result;
// }

/**
 * Fill模式：沿街排列 + 向内延伸填充
 */
function generateFillBuildings(block: Block, roads: Roads): Building[] {
  const [buildingW, buildingL] = block.size;
  const candidates: BuildingCandidate[] = [];
  const bbox = getBoundingBox(block.boundary);
  const roadMask = createRoadMask(roads, bbox);

  // 1. 收集区块内的道路段及其角度
  const roadSegments: {
    p1: [number, number];
    p2: [number, number];
    angle: number;
    normal: [number, number];
  }[] = [];

  for (const line of roads.lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const p1 = line[i];
      const p2 = line[i + 1];

      if (segmentIntersectsPolygon(p1, p2, block.boundary)) {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.sqrt(dx * dx + dy * dy);

        roadSegments.push({
          p1,
          p2,
          angle: angle(p1, p2),
          normal: [-dy / len, dx / len],
        });
      }
    }
  }

  // 2. 沿每条道路向内延伸填充
  for (const seg of roadSegments) {
    const edgeLength = distance(seg.p1, seg.p2);
    const stepAlong = buildingW + block.spacing; // 沿道路方向步长
    const stepInward = buildingL + block.spacing; // 向内方向步长

    const countAlong = Math.floor((edgeLength - block.spacing) / stepAlong);
    const startOffset = (edgeLength - countAlong * stepAlong + block.spacing) / 2;

    // 计算可以向内延伸多少排
    const maxInwardDist = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
    const maxRows = Math.ceil(maxInwardDist / stepInward);

    // 道路两侧都填充
    const sides = [1, -1];
    for (const side of sides) {
      // 从道路边缘向内逐排填充
      for (let row = 0; row < maxRows; row++) {
        const inwardDist = roads.width / 2 + buildingL / 2 + block.spacing + row * stepInward;

        for (let j = 0; j < countAlong; j++) {
          const t = (startOffset + j * stepAlong + buildingW / 2) / edgeLength;
          const roadPoint = lerp(seg.p1, seg.p2, t);

          const center: [number, number] = [
            roadPoint[0] + seg.normal[0] * inwardDist * side,
            roadPoint[1] + seg.normal[1] * inwardDist * side,
          ];

          candidates.push({
            center,
            width: buildingW + (Math.random() - 0.5) * buildingW * 0.1,
            length: buildingL + (Math.random() - 0.5) * buildingL * 0.1,
            rotation: seg.angle,
          });
        }
      }
    }
  }

  // 3. 过滤和去重
  return filterAndFinalize(candidates, block, roadMask);
}

/**
 * Scatter模式：沿街排列 + 内部随机散布
 */
function generateScatterBuildings(block: Block, roads: Roads): Building[] {
  const [buildingW, buildingL] = block.size;
  const candidates: BuildingCandidate[] = [];
  const bbox = getBoundingBox(block.boundary);
  const roadMask = createRoadMask(roads, bbox);

  // 1. 沿道路生成沿街建筑（与 Perimeter 类似）
  for (const line of roads.lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const p1 = line[i];
      const p2 = line[i + 1];

      if (!segmentIntersectsPolygon(p1, p2, block.boundary)) {
        continue;
      }

      const edgeLength = distance(p1, p2);
      const edgeAngle = angle(p1, p2);

      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;

      const offsetDist = roads.width / 2 + buildingL / 2 + block.spacing;
      const step = buildingW + block.spacing;
      const count = Math.floor((edgeLength - block.spacing) / step);
      const startOffset = (edgeLength - count * step + block.spacing) / 2;

      for (let j = 0; j < count; j++) {
        const t = (startOffset + j * step + buildingW / 2) / edgeLength;
        const roadPoint = lerp(p1, p2, t);

        const sides = [1, -1];
        for (const side of sides) {
          const center: [number, number] = [
            roadPoint[0] + nx * offsetDist * side,
            roadPoint[1] + ny * offsetDist * side,
          ];

          candidates.push({
            center,
            width: buildingW + (Math.random() - 0.5) * buildingW * 0.1,
            length: buildingL + (Math.random() - 0.5) * buildingL * 0.1,
            rotation: edgeAngle,
          });
        }
      }
    }
  }

  // 2. 内部随机散布（远离道路的区域）
  const innerCandidates = generateInnerScatterCandidates(block, roads, bbox);
  candidates.push(...innerCandidates);

  // 3. 过滤和去重
  return filterAndFinalize(candidates, block, roadMask);
}

/**
 * 生成内部随机散布的建筑候选
 */
function generateInnerScatterCandidates(block: Block, roads: Roads, bbox: BBox): BuildingCandidate[] {
  const [buildingW, buildingL] = block.size;
  const candidates: BuildingCandidate[] = [];

  // 估算需要的建筑数量
  const blockArea = calculatePolygonArea(block.boundary);
  const buildingArea = buildingW * buildingL;
  const targetCount = Math.floor(((blockArea * block.coverage) / buildingArea) * 0.5); // 内部只占一半

  // 最小距离（避免与道路和其他建筑太近）
  const minDistFromRoad = roads.width / 2 + buildingL + block.spacing * 2;
  const minDist = Math.max(buildingW, buildingL) + block.spacing;

  // 泊松圆盘采样
  const points = poissonDiskSampling(bbox, minDist, targetCount * 2);

  for (const p of points) {
    // 检查是否远离道路
    const distToRoad = getMinDistanceToRoads(p, roads);
    if (distToRoad < minDistFromRoad) {
      continue;
    }

    candidates.push({
      center: p,
      width: buildingW + (Math.random() - 0.5) * buildingW * 0.2,
      length: buildingL + (Math.random() - 0.5) * buildingL * 0.2,
      rotation: Math.random() * 360,
    });
  }

  return candidates;
}

/**
 * 计算点到所有道路的最小距离
 */
function getMinDistanceToRoads(point: [number, number], roads: Roads): number {
  let minDist = Infinity;

  for (const line of roads.lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const dist = pointToSegmentDistance(point, line[i], line[i + 1]);
      minDist = Math.min(minDist, dist);
    }
  }

  return minDist;
}

/**
 * 计算点到线段的距离
 */
function pointToSegmentDistance(point: [number, number], p1: [number, number], p2: [number, number]): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return distance(point, p1);
  }

  // 投影参数 t
  let t = ((point[0] - p1[0]) * dx + (point[1] - p1[1]) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  // 最近点
  const closest: [number, number] = [p1[0] + t * dx, p1[1] + t * dy];

  return distance(point, closest);
}

/**
 * 过滤候选建筑并生成最终结果
 */
function filterAndFinalize(candidates: BuildingCandidate[], block: Block, roadMask: RoadMask): Building[] {
  // 1. 过滤：建筑四角必须在区块内
  let filtered = candidates.filter((c) => {
    const corners = getBuildingCorners(c);
    return corners.every((corner) => pointInPolygon(corner, block.boundary));
  });

  // 2. 过滤：不能与道路重叠
  filtered = filtered.filter((c) => {
    const rect = getBuildingRect(c);
    for (const roadPoly of roadMask.polygons) {
      if (polygonsIntersect(rect, roadPoly)) {
        return false;
      }
    }
    return true;
  });

  // 3. 移除互相重叠的建筑
  filtered = removeOverlappingBuildings(filtered);

  // 4. 应用覆盖率
  filtered = applyCoverage(filtered, block);

  // 5. 转换为Building
  return filtered.map((c) => ({
    center: c.center,
    size: [c.width, c.length, randomInRange(block.height)],
    rotation: c.rotation,
  }));
}

/**
 * Fill或Scatter模式：在整个区块内生成，避开道路
 */
function generateFillOrScatterBuildings(block: Block, roads: Roads): Building[] {
  const bbox = getBoundingBox(block.boundary);
  const roadMask = createRoadMask(roads, bbox);

  let candidates: BuildingCandidate[];

  if (block.layout === 'fill') {
    candidates = generateFillCandidates(block, bbox);
  } else {
    candidates = generateScatterCandidates(block, bbox);
  }

  // 过滤：在边界内且不与道路重叠
  candidates = candidates.filter((c) => {
    const corners = getBuildingCorners(c);
    const allInside = corners.every((corner) => pointInPolygon(corner, block.boundary));
    if (!allInside) return false;

    const rect = getBuildingRect(c);
    for (const roadPoly of roadMask.polygons) {
      if (polygonsIntersect(rect, roadPoly)) {
        return false;
      }
    }
    return true;
  });

  // 应用覆盖率
  candidates = applyCoverage(candidates, block);

  return candidates.map((c) => ({
    center: c.center,
    size: [c.width, c.length, randomInRange(block.height)],
    rotation: c.rotation,
  }));
}

function generateFillCandidates(block: Block, bbox: BBox): BuildingCandidate[] {
  const candidates: BuildingCandidate[] = [];
  const [buildingW, buildingL] = block.size;
  const step = Math.max(buildingW, buildingL) + block.spacing;

  for (let x = bbox.minX + buildingW / 2 + block.spacing; x < bbox.maxX - buildingW / 2; x += step) {
    for (let y = bbox.minY + buildingL / 2 + block.spacing; y < bbox.maxY - buildingL / 2; y += step) {
      candidates.push({
        center: [x, y],
        width: buildingW + (Math.random() - 0.5) * buildingW * 0.1,
        length: buildingL + (Math.random() - 0.5) * buildingL * 0.1,
        rotation: 0,
      });
    }
  }

  return candidates;
}

/**
 * 泊松圆盘采样
 * 生成均匀分布的随机点，任意两点间距不小于minDist
 */
function poissonDiskSampling(bbox: BBox, minDist: number, targetCount: number): [number, number][] {
  const cellSize = minDist / Math.sqrt(2);
  const gridWidth = Math.ceil((bbox.maxX - bbox.minX) / cellSize);
  const gridHeight = Math.ceil((bbox.maxY - bbox.minY) / cellSize);

  // 网格存储已放置的点
  const grid: (number | null)[][] = Array(gridWidth)
    .fill(null)
    .map(() => Array(gridHeight).fill(null));

  const points: [number, number][] = [];
  const activeList: [number, number][] = [];

  // 随机初始点
  const firstPoint: [number, number] = [
    bbox.minX + Math.random() * (bbox.maxX - bbox.minX),
    bbox.minY + Math.random() * (bbox.maxY - bbox.minY),
  ];

  points.push(firstPoint);
  activeList.push(firstPoint);
  setGridCell(grid, bbox, cellSize, firstPoint, 0);

  const maxAttempts = 30;

  while (activeList.length > 0 && points.length < targetCount) {
    const randIndex = Math.floor(Math.random() * activeList.length);
    const point = activeList[randIndex];
    let found = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // 在环形区域内随机采样
      const angle = Math.random() * 2 * Math.PI;
      const radius = minDist + Math.random() * minDist;

      const newPoint: [number, number] = [point[0] + radius * Math.cos(angle), point[1] + radius * Math.sin(angle)];

      // 检查边界
      if (newPoint[0] < bbox.minX || newPoint[0] >= bbox.maxX || newPoint[1] < bbox.minY || newPoint[1] >= bbox.maxY) {
        continue;
      }

      // 检查与周围点的距离
      if (isValidPoint(newPoint, grid, bbox, cellSize, minDist, points)) {
        points.push(newPoint);
        activeList.push(newPoint);
        setGridCell(grid, bbox, cellSize, newPoint, points.length - 1);
        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(randIndex, 1);
    }
  }

  return points;
}

function setGridCell(
  grid: (number | null)[][],
  bbox: BBox,
  cellSize: number,
  point: [number, number],
  index: number,
): void {
  const gx = Math.floor((point[0] - bbox.minX) / cellSize);
  const gy = Math.floor((point[1] - bbox.minY) / cellSize);
  if (gx >= 0 && gx < grid.length && gy >= 0 && gy < grid[0].length) {
    grid[gx][gy] = index;
  }
}

function isValidPoint(
  point: [number, number],
  grid: (number | null)[][],
  bbox: BBox,
  cellSize: number,
  minDist: number,
  points: [number, number][],
): boolean {
  const gx = Math.floor((point[0] - bbox.minX) / cellSize);
  const gy = Math.floor((point[1] - bbox.minY) / cellSize);

  // 检查周围5x5网格
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const nx = gx + dx;
      const ny = gy + dy;

      if (nx < 0 || nx >= grid.length || ny < 0 || ny >= grid[0].length) {
        continue;
      }

      const idx = grid[nx][ny];
      if (idx !== null) {
        const neighbor = points[idx];
        const dist = Math.sqrt((point[0] - neighbor[0]) ** 2 + (point[1] - neighbor[1]) ** 2);
        if (dist < minDist) {
          return false;
        }
      }
    }
  }

  return true;
}

function generateScatterCandidates(block: Block, bbox: BBox): BuildingCandidate[] {
  const [buildingW, buildingL] = block.size;
  const blockArea = calculatePolygonArea(block.boundary);
  const buildingArea = buildingW * buildingL;
  const targetCount = Math.floor(((blockArea * block.coverage) / buildingArea) * 1.5); // 多生成一些，后面会过滤

  const minDist = Math.max(buildingW, buildingL) + block.spacing;
  const points = poissonDiskSampling(bbox, minDist, targetCount);

  return points.map((p) => ({
    center: p,
    width: buildingW + (Math.random() - 0.5) * buildingW * 0.2,
    length: buildingL + (Math.random() - 0.5) * buildingL * 0.2,
    rotation: Math.random() * 360,
  }));
}

/**
 * 过滤与地标重叠的普通建筑
 */
function filterOverlappingWithLandmarks(buildings: Building[], landmarks: Landmark[]): Building[] {
  if (landmarks.length === 0) {
    return buildings;
  }

  // 预计算地标矩形
  const landmarkRects = landmarks.map((lm) =>
    getBuildingRect({
      center: lm.center,
      width: lm.size[0],
      length: lm.size[1],
      rotation: lm.rotation,
    }),
  );

  return buildings.filter((building) => {
    const buildingRect = getBuildingRect({
      center: building.center,
      width: building.size[0],
      length: building.size[1],
      rotation: building.rotation,
    });

    for (const landmarkRect of landmarkRects) {
      if (polygonsIntersect(buildingRect, landmarkRect)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 多边形差集运算
 * 生产环境建议使用 polygon-clipping 或 clipper 库
 */
function polygonDifference(subject: [number, number][], clips: [number, number][][]): [number, number][][] {
  // 简化实现：使用网格法识别连通区域
  const bbox = getBoundingBox(subject);
  const gridSize = 5; // 网格精度

  const gridW = Math.ceil((bbox.maxX - bbox.minX) / gridSize);
  const gridH = Math.ceil((bbox.maxY - bbox.minY) / gridSize);

  // 标记网格：0=外部，1=内部可用，2=被道路占用
  const grid: number[][] = Array(gridW)
    .fill(null)
    .map(() => Array(gridH).fill(0));

  for (let i = 0; i < gridW; i++) {
    for (let j = 0; j < gridH; j++) {
      const x = bbox.minX + (i + 0.5) * gridSize;
      const y = bbox.minY + (j + 0.5) * gridSize;
      const point: [number, number] = [x, y];

      if (!pointInPolygon(point, subject)) {
        grid[i][j] = 0;
        continue;
      }

      let inClip = false;
      for (const clip of clips) {
        if (pointInPolygon(point, clip)) {
          inClip = true;
          break;
        }
      }

      grid[i][j] = inClip ? 2 : 1;
    }
  }

  // 使用洪水填充找到连通区域，然后提取轮廓
  const regions = findConnectedRegions(grid, gridW, gridH);

  // 将网格区域转换回多边形
  return regions.map((region) => gridRegionToPolygon(region, bbox, gridSize));
}

/**
 * 洪水填充找连通区域
 */
function findConnectedRegions(grid: number[][], width: number, height: number): [number, number][][] {
  const visited: boolean[][] = Array(width)
    .fill(null)
    .map(() => Array(height).fill(false));
  const regions: [number, number][][] = [];

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (grid[i][j] === 1 && !visited[i][j]) {
        const region: [number, number][] = [];
        const queue: [number, number][] = [[i, j]];

        while (queue.length > 0) {
          const [ci, cj] = queue.shift()!;
          if (ci < 0 || ci >= width || cj < 0 || cj >= height) continue;
          if (visited[ci][cj] || grid[ci][cj] !== 1) continue;

          visited[ci][cj] = true;
          region.push([ci, cj]);

          queue.push([ci + 1, cj], [ci - 1, cj], [ci, cj + 1], [ci, cj - 1]);
        }

        if (region.length > 0) {
          regions.push(region);
        }
      }
    }
  }

  return regions;
}

/**
 * 将网格区域转换为多边形轮廓
 */
function gridRegionToPolygon(region: [number, number][], bbox: BBox, gridSize: number): [number, number][] {
  // 使用 Marching Squares 算法提取轮廓
  // 简化：返回凸包或边界框

  const points = region.map(
    ([i, j]) => [bbox.minX + (i + 0.5) * gridSize, bbox.minY + (j + 0.5) * gridSize] as [number, number],
  );

  return convexHull(points);
}

/**
 * 计算凸包（Graham扫描法）
 */
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;

  // 找最低点
  let start = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i][1] < points[start][1] || (points[i][1] === points[start][1] && points[i][0] < points[start][0])) {
      start = i;
    }
  }
  [points[0], points[start]] = [points[start], points[0]];

  const pivot = points[0];

  // 按极角排序
  points.slice(1).sort((a, b) => {
    const angleA = Math.atan2(a[1] - pivot[1], a[0] - pivot[0]);
    const angleB = Math.atan2(b[1] - pivot[1], b[0] - pivot[0]);
    return angleA - angleB;
  });

  const hull: [number, number][] = [points[0], points[1]];

  for (let i = 2; i < points.length; i++) {
    while (hull.length > 1 && crossProduct(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0) {
      hull.pop();
    }
    hull.push(points[i]);
  }

  return hull;
}

function crossProduct(o: [number, number], a: [number, number], b: [number, number]): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/**
 * 数组随机打乱（Fisher-Yates算法）
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function applyCoverage(candidates: BuildingCandidate[], block: Block): BuildingCandidate[] {
  const blockArea = calculatePolygonArea(block.boundary);
  const targetArea = blockArea * block.coverage;

  let currentArea = 0;
  const result: BuildingCandidate[] = [];

  // 随机打乱顺序后按覆盖率截取
  shuffle(candidates);

  for (const c of candidates) {
    const buildingArea = c.width * c.length;
    if (currentArea + buildingArea <= targetArea) {
      result.push(c);
      currentArea += buildingArea;
    }
  }

  return result;
}

// 随机范围
function randomInRange([min, max]: [number, number]): number {
  return min + Math.random() * (max - min);
}

// 随机变化（±10%）
function randomVariance(): number {
  return (Math.random() - 0.5) * 0.2;
}

// 两点距离
function distance(p1: [number, number], p2: [number, number]): number {
  return Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
}

// 线性插值
function lerp(p1: [number, number], p2: [number, number], t: number): [number, number] {
  return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
}

// 计算角度
function angle(p1: [number, number], p2: [number, number]): number {
  return (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;
}

// 获取建筑四角坐标
function getBuildingCorners(c: BuildingCandidate): [number, number][] {
  const hw = c.width / 2;
  const hl = c.length / 2;
  const rad = (c.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners = [
    [-hw, -hl],
    [hw, -hl],
    [hw, hl],
    [-hw, hl],
  ];

  return corners.map(([dx, dy]) => [c.center[0] + dx * cos - dy * sin, c.center[1] + dx * sin + dy * cos]);
}
