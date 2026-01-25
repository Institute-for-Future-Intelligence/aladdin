/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import * as Selector from '../stores/selector';
import { useTranslation } from 'react-i18next';
import { AudioOutlined, AudioMutedOutlined, WarningOutlined } from '@ant-design/icons';
import { getFunctions, httpsCallable } from 'firebase/functions';
import GenaiImage from '../assets/genai.png';
import { Audio } from 'react-loader-spinner';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import i18n from 'src/i18n/i18n';
import useSpeechToText, { ResultType } from 'react-hook-speech-to-text';
import { showError } from 'src/helpers';
import { app } from 'src/firebase';
import { CuboidTexture, FoundationTexture, ObjectType } from 'src/types';
import { GenAIUtil } from 'src/panels/GenAIUtil';
import { updateGenerateBuildingPrompt } from 'src/cloudProjectUtil';
import { Util } from '../Util';
import { AI_MODELS_NAME } from 'functions/src/callSolarPowerTowerAI';
import { callUrbanDesignClaudeAI } from 'functions/src/callUrbanDesignAI';
import { FoundationModel } from 'src/models/FoundationModel';
import { CuboidModel } from 'src/models/CuboidModel';
import { PolygonCuboidModel } from 'src/models/PolygonCuboidModel';
import short from 'short-uuid';
import * as Constants from '../constants';
import {
  generateBlockBuildings,
  generateCityParks,
  generateCityRivers,
  generateLandmarkBuildings,
} from './generateUrbanDesignCity';
import { Color } from 'three';

interface BBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface BuildingCandidate {
  center: [number, number];
  width: number;
  length: number;
  rotation: number;
}

interface RoadMask {
  polygons: [number, number][][];
}

// 输入：区块定义
interface Block {
  boundary: [number, number][]; // 多边形顶点
  size: [number, number]; // [width, length]
  height: [number, number]; // [min, max]
  spacing: number;
  coverage: number; // 0-1
  layout: 'fill' | 'perimeter' | 'scatter';
}

// 输入：道路数据
interface Roads {
  width: number;
  lines: [number, number][][];
}

// 输出：建筑立方体
interface Building {
  center: [number, number];
  size: [number, number, number]; // [width, length, height]
  rotation: number;
}

export interface GenerateUrbanDesignProps {
  setDialogVisible: (visible: boolean) => void;
  isDialogVisible: () => boolean;
}

const { TextArea } = Input;

const GenerateUrbanDesignModal = React.memo(({ setDialogVisible, isDialogVisible }: GenerateUrbanDesignProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  // const reasoningEffort = useStore(Selector.reasoningEffort) ?? 'medium';
  const generateUrbanDesignPrompt =
    useStore(Selector.generateUrbanDesignPrompt) ?? 'Generate a city plan like Manhattan.';
  const setGenerating = usePrimitiveStore(Selector.setGenerating);
  const setChanged = usePrimitiveStore(Selector.setChanged);

  // const aIModel = useStore(Selector.aIModel) ?? AI_MODELS_NAME['Claude Opus-4.5'];
  const aIModel = AI_MODELS_NAME['Claude Opus-4.5'];
  const [prompt, setPrompt] = useState<string>('Generate Urban Design');
  const [listening, setListening] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  } as DraggableBounds);

  const dragRef = useRef<HTMLDivElement | null>(null);

  const { t } = useTranslation();
  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  useEffect(() => {
    setPrompt(generateUrbanDesignPrompt);
  }, [generateUrbanDesignPrompt]);

  const createInput = () => {
    const input = [];
    const designs = useStore.getState().projectState.designs;
    if (!useStore.getState().projectState.independentPrompt && designs && designs.length > 0) {
      for (const d of designs) {
        if (d.prompt && d.data) {
          input.push({ role: 'user', content: d.prompt });
          input.push({ role: 'assistant', content: d.data });
        }
      }
    }
    // add a period at the end of the prompt to avoid misunderstanding
    input.push({
      role: 'user',
      content: prompt.trim(),
    });
    return input;
  };

  const processResult = (text: string) => {
    // const json = JSON.parse(text);

    // console.log('prompt:', prompt);
    // console.log('raw:', JSON.parse(text).elements);

    // const jsonElements = json.elements;

    // console.log('validated:', jsonElements);
    // console.log('thinking:', json.thinking);

    // useStore.getState().set((state) => {
    //   let [minX, maxX] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
    //   let [minY, maxY] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
    //   if (jsonElements.length > 0) {
    //     state.elements = [];
    //     for (const e of jsonElements) {
    //       switch (e.type) {
    //         case ObjectType.Foundation: {
    //           const [cx, cy] = e.center ?? [0, 0];
    //           const [lx, ly, lz] = e.size ?? [10, 10, 0.1];
    //           minX = Math.min(minX, cx - lx / 2);
    //           maxX = Math.max(maxX, cx + lx / 2);
    //           minY = Math.min(minY, cy - ly / 2);
    //           maxY = Math.max(maxY, cy + ly / 2);
    //           const foundation = {
    //             id: short.generate() as string,
    //             parentId: Constants.GROUND_ID,
    //             type: ObjectType.Foundation,
    //             cx,
    //             cy,
    //             cz: lz / 2,
    //             lx,
    //             ly,
    //             lz,
    //             rotation: [0, 0, Util.toRadians(e.rotation ?? 0)],
    //             normal: [0, 0, 1],
    //             color: '#808080',
    //             textureType: FoundationTexture.NoTexture,
    //           } as FoundationModel;
    //           state.elements.push(foundation);
    //           break;
    //         }
    //         case ObjectType.Cuboid: {
    //           const [cx, cy] = e.center ?? [0, 0];
    //           const [lx, ly, lz] = e.size ?? [10, 10, 1];
    //           minX = Math.min(minX, cx - lx / 2);
    //           maxX = Math.max(maxX, cx + lx / 2);
    //           minY = Math.min(minY, cy - ly / 2);
    //           maxY = Math.max(maxY, cy + ly / 2);
    //           const cuboid = {
    //             id: short.generate() as string,
    //             parentId: Constants.GROUND_ID,
    //             type: ObjectType.Cuboid,
    //             cx,
    //             cy,
    //             cz: lz / 2,
    //             lx,
    //             ly,
    //             lz,
    //             rotation: [0, 0, Util.toRadians(e.rotation ?? 0)],
    //             normal: [0, 0, 1],
    //             color: '#808080',
    //             faceColors: new Array(6).fill(Constants.DEFAULT_CUBOID_COLOR),
    //             textureTypes: new Array(6).fill(CuboidTexture.NoTexture),
    //           } as CuboidModel;
    //           state.elements.push(cuboid);
    //           break;
    //         }
    //       }
    //     }
    //   }

    //   console.log('bounding', minX, maxX, minY, maxY);
    //   const panCenter = [(minX + maxX) / 2, (minY + maxY) / 2, 0];
    //   const l = Math.max(maxX - minX, maxY - minY) * 1.5;
    //   state.viewState.cameraPosition = [panCenter[0] - l, panCenter[1] - l, l / 2];
    //   state.viewState.panCenter = [...panCenter];
    //   state.cameraChangeFlag = !state.cameraChangeFlag;
    // });

    processCity(text);
  };

  /**
   * 获取边的内向法线单位向量
   */
  function getNormalInward(p1: [number, number], p2: [number, number], polygon: [number, number][]): [number, number] {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.sqrt(dx * dx + dy * dy);

    // 两个可能的法向量
    const n1: [number, number] = [-dy / len, dx / len];
    const n2: [number, number] = [dy / len, -dx / len];

    // 边的中点
    const mid: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

    // 测试哪个方向指向内部
    const testPoint1: [number, number] = [mid[0] + n1[0] * 0.1, mid[1] + n1[1] * 0.1];
    const testPoint2: [number, number] = [mid[0] + n2[0] * 0.1, mid[1] + n2[1] * 0.1];

    if (pointInPolygon(testPoint1, polygon)) {
      return n1;
    }
    return n2;
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
        if (
          newPoint[0] < bbox.minX ||
          newPoint[0] >= bbox.maxX ||
          newPoint[1] < bbox.minY ||
          newPoint[1] >= bbox.maxY
        ) {
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
   * 数组随机打乱（Fisher-Yates算法）
   */
  function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

  function generateFillLayout(block: Block, bbox: BBox): BuildingCandidate[] {
    const candidates: BuildingCandidate[] = [];
    const [buildingW, buildingL] = block.size;
    const step = Math.max(buildingW, buildingL) + block.spacing;

    // 网格遍历
    for (let x = bbox.minX + buildingW / 2; x < bbox.maxX; x += step) {
      for (let y = bbox.minY + buildingL / 2; y < bbox.maxY; y += step) {
        candidates.push({
          center: [x, y],
          width: buildingW + randomVariance(),
          length: buildingL + randomVariance(),
          rotation: 0,
        });
      }
    }

    return candidates;
  }

  function generatePerimeterLayout(block: Block, bbox: BBox): BuildingCandidate[] {
    const candidates: BuildingCandidate[] = [];
    const [buildingW, buildingL] = block.size;
    const boundary = block.boundary;

    // 沿边界多边形的每条边放置建筑
    for (let i = 0; i < boundary.length; i++) {
      const p1 = boundary[i];
      const p2 = boundary[(i + 1) % boundary.length];

      // 计算边的方向和长度
      const edgeLength = distance(p1, p2);
      const edgeAngle = angle(p1, p2);

      // 沿边放置建筑
      const step = buildingW + block.spacing;
      const count = Math.floor(edgeLength / step);

      for (let j = 0; j < count; j++) {
        const t = ((j + 0.5) * step) / edgeLength;
        const center = lerp(p1, p2, t);

        // 建筑向内偏移
        const inward = getNormalInward(p1, p2, boundary);
        const offset = buildingL / 2 + block.spacing;

        candidates.push({
          center: [center[0] + inward[0] * offset, center[1] + inward[1] * offset],
          width: buildingW,
          length: buildingL,
          rotation: edgeAngle, // 建筑朝向与边平行
        });
      }
    }

    return candidates;
  }

  function generateScatterLayout(block: Block, bbox: BBox): BuildingCandidate[] {
    const candidates: BuildingCandidate[] = [];
    const [buildingW, buildingL] = block.size;

    // 估算建筑数量
    const blockArea = calculatePolygonArea(block.boundary);
    const buildingArea = buildingW * buildingL;
    const targetCount = Math.floor((blockArea * block.coverage) / buildingArea);

    // 随机放置，使用泊松圆盘采样避免重叠
    const minDist = Math.max(buildingW, buildingL) + block.spacing;
    const points = poissonDiskSampling(bbox, minDist, targetCount);

    for (const p of points) {
      candidates.push({
        center: p,
        width: buildingW + randomVariance(),
        length: buildingL + randomVariance(),
        rotation: Math.random() * 360, // 随机朝向
      });
    }

    return candidates;
  }

  function isInsidePolygon(candidate: BuildingCandidate, polygon: [number, number][]): boolean {
    // 检查建筑四个角点是否都在多边形内
    const corners = getBuildingCorners(candidate);
    return corners.every((corner) => pointInPolygon(corner, polygon));
  }

  function isOverlappingRoad(candidate: BuildingCandidate, roadMask: RoadMask): boolean {
    const buildingRect = getBuildingRect(candidate);

    for (const roadPoly of roadMask.polygons) {
      if (polygonsIntersect(buildingRect, roadPoly)) {
        return true;
      }
    }

    return false;
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

  function generateBuildings(block: Block, roads: Roads): Building[] {
    // 1. 计算区块包围盒
    const bbox = getBoundingBox(block.boundary);

    // 2. 生成道路遮罩区域
    const roadMask = createRoadMask(roads, bbox);

    // 3. 根据布局模式生成候选位置
    let candidates: BuildingCandidate[];
    console.log('layout', block.layout);
    switch (block.layout) {
      case 'fill':
        candidates = generateFillLayout(block, bbox);
        break;
      case 'perimeter':
        candidates = generatePerimeterLayout(block, bbox);
        break;
      case 'scatter':
        candidates = generateScatterLayout(block, bbox);
        break;
    }

    // 4. 过滤：移除超出边界或与道路重叠的建筑
    candidates = candidates.filter((c) => isInsidePolygon(c, block.boundary) && !isOverlappingRoad(c, roadMask));

    // 5. 根据覆盖率裁剪数量
    candidates = applyCoverage(candidates, block);

    // 6. 生成最终建筑数据
    return candidates.map((c) => ({
      center: c.center,
      size: [c.width, c.length, randomInRange(block.height)],
      rotation: c.rotation,
    }));
  }

  function getRandomColor() {
    const color = new Color(Math.random(), Math.random(), Math.random());
    return '#' + color.getHexString();
  }

  function getRandomGreenColor() {
    const color = new Color();

    const h = 0.29 + Math.random() * 0.11; // 色相：0.25-0.4（绿色范围）
    const s = 0.5 + Math.random() * 0.5; // 饱和度：0.5-1.0
    const l = 0.3 + Math.random() * 0.4; // 亮度：0.3-0.7

    color.setHSL(h, s, l);
    return '#' + color.getHexString();
  }

  function getRandomBlueColor() {
    const color = new Color();

    const h = 0.52 + Math.random() * 0.08; // 色相：0.52-0.60（蓝色范围）
    const s = 0.6 + Math.random() * 0.4; // 饱和度：0.6-1.0
    const l = 0.4 + Math.random() * 0.3; // 亮度：0.4-0.7

    color.setHSL(h, s, l);
    return '#' + color.getHexString();
  }

  const processCity = (text: string) => {
    const json = JSON.parse(text);

    console.log('raw', JSON.parse(text).city);
    console.log('thinking', json.thinking);

    const city = json.city;
    const roads = city.roads;
    const width = roads.width;

    useStore.getState().set((state) => {
      state.elements = [];

      // generate rivers
      if (city.rivers && city.rivers.length > 0) {
        const rivers = generateCityRivers(city.rivers);
        for (const river of rivers) {
          const polygonCuboid = {
            id: short.generate() as string,
            type: ObjectType.PolygonCuboid,
            vertices: river.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
            height: 0.5,
            color: 'blue',
            transparency: 0.3,
          } as PolygonCuboidModel;
          state.elements.push(polygonCuboid);
        }
      }

      // generate roads
      for (const points of roads.lines) {
        for (let i = 1; i < points.length; i++) {
          const start = points[i - 1];
          const end = points[i];

          const center = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
          const rotation = Math.atan2(end[1] - start[1], end[0] - start[0]);
          const dist = Math.hypot(start[0] - end[0], start[1] - end[1]);

          const foundation = {
            id: short.generate() as string,
            parentId: Constants.GROUND_ID,
            type: ObjectType.Foundation,
            cx: center[0],
            cy: center[1],
            cz: 0.5,
            lx: dist,
            ly: width,
            lz: 1,
            rotation: [0, 0, rotation],
            normal: [0, 0, 1],
            color: '#808080',
            textureType: FoundationTexture.NoTexture,
          } as FoundationModel;
          state.elements.push(foundation);
        }
      }

      // // show boundaries
      // let cz = 10;
      // for (const block of city.buildings.blocks) {
      //   const boundary = block.boundary;
      //   const color = getRandomColor();
      //   for (let i = 0; i < boundary.length; i++) {
      //     const start = boundary[i];
      //     const end = boundary[(i + 1) % boundary.length];

      //     const center = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      //     const rotation = Math.atan2(end[1] - start[1], end[0] - start[0]);
      //     const dist = Math.hypot(start[0] - end[0], start[1] - end[1]);

      //     const foundation = {
      //       id: short.generate() as string,
      //       parentId: Constants.GROUND_ID,
      //       type: ObjectType.Foundation,
      //       cx: center[0],
      //       cy: center[1],
      //       cz: cz,
      //       lx: dist,
      //       ly: 5,
      //       lz: 5,
      //       rotation: [0, 0, rotation],
      //       normal: [0, 0, 1],
      //       color: color,
      //       textureType: FoundationTexture.NoTexture,
      //     } as FoundationModel;
      //     state.elements.push(foundation);
      //   }
      //   cz += 5;
      // }

      /** generate parks */
      const parks = generateCityParks(city.parks, roads);
      for (const park of parks) {
        const polygonCuboid = {
          id: short.generate() as string,
          type: ObjectType.PolygonCuboid,
          vertices: park.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
          height: 0.5,
          color: getRandomGreenColor(),
          transparency: 0,
        } as PolygonCuboidModel;
        state.elements.push(polygonCuboid);
      }

      /** generate landmarks */
      const landmarks = generateLandmarkBuildings(city);
      for (const landmark of landmarks) {
        const [cx, cy] = landmark.center;
        const [lx, ly, lz] = landmark.size;

        const color = getRandomColor();
        const cuboid = {
          id: short.generate() as string,
          parentId: Constants.GROUND_ID,
          type: ObjectType.Cuboid,
          cx,
          cy,
          cz: lz / 2,
          lx,
          ly,
          lz,
          rotation: [0, 0, Util.toRadians(landmark.rotation ?? 0)],
          normal: [0, 0, 1],
          color: color,
          faceColors: new Array(6).fill(color),
          textureTypes: new Array(6).fill(CuboidTexture.NoTexture),
        } as CuboidModel;
        state.elements.push(cuboid);
      }

      /** generate block buildings */
      const buildings = generateBlockBuildings(city, landmarks);
      for (const building of buildings) {
        const [cx, cy] = building.center;
        const [lx, ly, lz] = building.size;

        const cuboid = {
          id: short.generate() as string,
          parentId: Constants.GROUND_ID,
          type: ObjectType.Cuboid,
          cx,
          cy,
          cz: lz / 2,
          lx,
          ly,
          lz,
          rotation: [0, 0, Util.toRadians(building.rotation ?? 0)],
          normal: [0, 0, 1],
          color: '#808080',
          faceColors: new Array(6).fill(Constants.DEFAULT_CUBOID_COLOR),
          textureTypes: new Array(6).fill(CuboidTexture.NoTexture),
          instanced: true,
        } as CuboidModel;
        state.elements.push(cuboid);
      }
    });
  };

  const callFromFirebaseFunction = async () => {
    try {
      const functions = getFunctions(app, 'us-east4');
      const callAI = httpsCallable(functions, 'callAI', { timeout: 300000 });
      const input = createInput();
      console.log('calling...', input); // for debugging
      const res = (await callAI({
        text: input,
        type: 'urban',
        undefined,
        aIModel,
      })) as any;
      return res.data.text;
    } catch (e) {
      console.log(e);
      showError('' + e, 10);
      return null;
    }
  };

  const callFromBrowser = async () => {
    try {
      const input = createInput();

      if (aIModel === AI_MODELS_NAME['OpenAI o4-mini']) {
        // console.log('calling OpenAI...', input); // for debugging
        // const response = await callUrbanDesignOpenAI(
        //   import.meta.env.VITE_AZURE_API_KEY,
        //   input as [],
        //   true,
        //   reasoningEffort,
        // );
        // const result = response.choices[0].message.content;
        // console.log('OpenAI response:', response);
        // return result;
      } else if (aIModel === AI_MODELS_NAME['Claude Opus-4.5']) {
        console.log('calling Claude...', input); // for debugging
        const response = await callUrbanDesignClaudeAI(import.meta.env.VITE_CLAUDE_API_KEY, input as [], true);
        const result = (response.content[0] as any).text;
        console.log('Claude response:', response);
        return result;
      }
    } catch (e) {
      console.log(e);
      showError('' + e, 10);
      return null;
    }
  };

  const generate = async () => {
    if (import.meta.env.PROD) {
      return await callFromFirebaseFunction();
    } else {
      return await callFromBrowser();
    }
  };

  const handleGenerativeAI = async () => {
    setGenerating(true);
    try {
      const result = await generate();

      // Manhattan
      // const result = `{"thinking":"Manhattan is a long narrow island with a distinctive grid pattern. Key features: 1) Regular grid of streets running east-west and avenues running north-south, 2) Broadway cutting diagonally, 3) Central Park as a large rectangle, 4) Downtown area (southern tip) with more irregular streets, 5) Midtown with tallest skyscrapers, 6) Financial district downtown, 7) Various neighborhoods with different building densities. I'll create: elongated shape roughly 1500x2000, grid pattern with numbered streets, diagonal Broadway, Central Park in upper-middle, tall buildings in midtown and downtown, shorter buildings in residential areas.","city":{"roads":{"width":12,"lines":[[[750,-1000],[-750,-1000],[-750,1000],[750,1000],[750,-1000]],[[-750,-800],[750,-800]],[[-750,-600],[750,-600]],[[-750,-400],[750,-400]],[[-750,-200],[750,-200]],[[-750,0],[750,0]],[[-750,200],[750,200]],[[-750,400],[750,400]],[[-750,600],[750,600]],[[-750,800],[750,800]],[[-500,-1000],[-500,1000]],[[-250,-1000],[-250,1000]],[[0,-1000],[0,1000]],[[250,-1000],[250,1000]],[[500,-1000],[500,1000]],[[-750,-1000],[500,600],[750,1000]],[[-750,-950],[-600,-1000]],[[-750,-850],[-500,-1000]],[[-600,-800],[-400,-1000]],[[-400,-600],[-200,-1000]]]},"buildings":{"defaults":{"size":[25,30],"height":[15,40],"spacing":3,"layout":"fill","coverage":0.7},"blocks":[{"boundary":[[-750,-1000],[750,-1000],[750,-600],[-750,-600]],"height":[40,120],"coverage":0.8},{"boundary":[[-750,-600],[750,-600],[750,-200],[-750,-200]],"height":[60,180],"coverage":0.85},{"boundary":[[-750,-200],[750,-200],[750,200],[-300,200],[-300,600],[-750,600]],"height":[20,50],"coverage":0.6},{"boundary":[[300,200],[750,200],[750,600],[300,600]],"height":[25,60],"coverage":0.65},{"boundary":[[-750,600],[750,600],[750,1000],[-750,1000]],"height":[12,35],"coverage":0.55}],"landmarks":[{"center":[150,-450],"size":[60,60,320],"rotation":0},{"center":[-100,-350],"size":[55,55,280],"rotation":15},{"center":[380,-500],"size":[50,50,250],"rotation":0},{"center":[-350,-750],"size":[45,70,200],"rotation":0},{"center":[500,-850],"size":[40,55,180],"rotation":12},{"center":[-200,-900],"size":[50,50,150],"rotation":0},{"center":[0,-150],"size":[80,60,220],"rotation":0}]},"parks":[{"center":[0,400],"size":[500,350],"rotation":0},{"center":[600,850],"size":[120,200],"rotation":0},{"center":[-600,-950],"size":[80,60],"rotation":0}]}}`
      // Barcelona
      // const result = `{"thinking":"Barcelona is known for its distinctive Example district with the famous grid pattern designed by Ildefons Cerdà, featuring chamfered corners (octagonal blocks). The city also has the old Gothic Quarter with narrow winding streets, Las Ramblas as a main boulevard, Diagonal Avenue cutting across, and landmarks like Sagrada Familia. Let me create a layout that captures these elements: 1) Eixample grid with chamfered blocks, 2) Old town irregular pattern, 3) Major avenues like Diagonal and Gran Via, 4) Parks like Ciutadella, 5) Landmarks scattered asymmetrically.","city":{"roads":{"width":20,"lines":[[[750,-1000],[750,1000]],[[-750,-1000],[-750,1000]],[[450,-1000],[450,1000]],[[150,-1000],[150,1000]],[[-150,-1000],[-150,1000]],[[-450,-1000],[-450,1000]],[[-750,-700],[750,-700]],[[-750,-400],[750,-400]],[[-750,-100],[750,-100]],[[-750,200],[750,200]],[[-750,500],[750,500]],[[-750,800],[750,800]],[[-750,-1000],[750,1000]],[[-750,1000],[750,-1000]],[[-100,-1000],[-100,-600],[-50,-550],[50,-550],[100,-600],[100,-750],[50,-800],[-50,-800],[-100,-750],[-100,-1000]],[[-250,-600],[-150,-500],[150,-500],[250,-600]],[[0,-100],[0,200]],[[0,200],[-200,200],[-300,300],[-300,600]],[[0,200],[200,200],[300,300],[300,600]]]},"buildings":{"defaults":{"size":[25,25],"height":[20,35],"spacing":8,"layout":"fill","coverage":0.7},"blocks":[{"boundary":[[-750,-1000],[750,-1000],[750,-400],[-750,-400]],"size":[12,12],"height":[15,25],"spacing":4,"layout":"fill","coverage":0.8},{"boundary":[[-750,-400],[750,-400],[750,1000],[-750,1000]],"size":[28,28],"height":[22,40],"spacing":10,"layout":"perimeter","coverage":0.65},{"boundary":[[-200,-200],[200,-200],[200,100],[-200,100]],"height":[30,55],"spacing":6,"coverage":0.75},{"boundary":[[-750,600],[-450,600],[-450,1000],[-750,1000]],"height":[15,22],"spacing":12,"layout":"scatter","coverage":0.4},{"boundary":[[450,-400],[750,-400],[750,200],[450,200]],"height":[40,70],"spacing":8,"coverage":0.6}],"landmarks":[{"center":[380,650],"size":[60,80,170],"rotation":45},{"center":[-520,-750],"size":[80,100,45],"rotation":12},{"center":[180,-650],"size":[50,50,95],"rotation":0},{"center":[-350,350],"size":[40,60,85],"rotation":-30},{"center":[600,-150],"size":[55,55,110],"rotation":22}]},"parks":[{"center":[-550,750],"size":[300,350],"rotation":0},{"center":[550,850],"size":[200,250],"rotation":15},{"center":[0,-750],"size":[150,200],"rotation":0},{"center":[-300,-200],"size":[120,180],"rotation":-10}]}}`
      // Paris
      // const result = `{"thinking":"The user wants a Paris-like city. Paris is characterized by: 1) Radial road pattern emanating from central points like Arc de Triomphe, 2) Haussmann-style boulevards, 3) The Seine river cutting through, 4) Uniform mid-rise buildings (5-7 stories, ~20-25m), 5) Notable landmarks like Eiffel Tower, Arc de Triomphe, Notre Dame, 6) Parks like Tuileries, Luxembourg Gardens, 7) Circular plazas with radiating avenues. I'll create: - A central circular plaza (like Place de l'Étoile) with radiating boulevards - A river (Seine) represented by a wide road/gap - Grid-like blocks in some areas mixed with radial patterns - Uniform building heights in most areas (Haussmann style ~20-25m) - A few landmarks (Eiffel Tower area, a cathedral, monuments) - Parks (Tuileries-like, Luxembourg-like)","city":{"roads":{"width":25,"lines":[[[0,-200],[0,800]],[[0,-200],[0,-900]],[[0,-200],[400,100]],[[0,-200],[-400,100]],[[0,-200],[500,-500]],[[0,-200],[-500,-500]],[[0,-200],[300,-600]],[[0,-200],[-300,-600]],[[0,-200],[600,-300]],[[0,-200],[-600,-300]],[[0,-200],[200,300]],[[0,-200],[-200,300]],[[-700,400],[700,400]],[[-700,0],[700,0]],[[-700,-400],[700,-400]],[[-700,-700],[700,-700]],[[-700,700],[700,700]],[[-500,-900],[-500,800]],[[500,-900],[500,800]],[[-250,-900],[-250,800]],[[250,-900],[250,800]],[[-700,200],[-200,200],[-100,250],[100,250],[200,200],[700,200]],[[-700,550],[-200,550],[-50,600],[50,600],[200,550],[700,550]],[[150,-200],[150,-200],[212,-130],[240,-50],[225,30],[170,90],[90,125],[0,140],[-90,125],[-170,90],[-225,30],[-240,-50],[-212,-130],[-150,-200]]]},"buildings":{"defaults":{"size":[20,25],"height":[18,25],"spacing":3,"layout":"perimeter","coverage":0.75},"blocks":[{"boundary":[[-700,-900],[-500,-900],[-500,-700],[-700,-700]],"height":[15,22],"coverage":0.7},{"boundary":[[-500,-900],[-250,-900],[-250,-700],[-500,-700]],"height":[18,25],"coverage":0.75},{"boundary":[[-250,-900],[0,-900],[0,-700],[-250,-700]],"height":[20,28],"coverage":0.8},{"boundary":[[0,-900],[250,-900],[250,-700],[0,-700]],"height":[20,28],"coverage":0.8},{"boundary":[[250,-900],[500,-900],[500,-700],[250,-700]],"height":[18,25],"coverage":0.75},{"boundary":[[500,-900],[700,-900],[700,-700],[500,-700]],"height":[15,22],"coverage":0.7},{"boundary":[[-700,-700],[-300,-700],[-300,-400],[-700,-400]],"height":[18,24],"coverage":0.72},{"boundary":[[300,-700],[700,-700],[700,-400],[300,-400]],"height":[18,24],"coverage":0.72},{"boundary":[[-700,-400],[-300,-400],[-400,100],[-700,0]],"height":[20,26],"coverage":0.78},{"boundary":[[300,-400],[700,-400],[700,0],[400,100]],"height":[20,26],"coverage":0.78},{"boundary":[[-700,400],[-500,400],[-500,800],[-700,800]],"height":[15,20],"spacing":5,"coverage":0.6},{"boundary":[[500,400],[700,400],[700,800],[500,800]],"height":[15,20],"spacing":5,"coverage":0.6},{"boundary":[[-500,550],[-200,550],[-200,800],[-500,800]],"height":[12,18],"coverage":0.55},{"boundary":[[200,550],[500,550],[500,800],[200,800]],"height":[12,18],"coverage":0.55}],"landmarks":[{"center":[-450,280],"size":[25,25,320],"rotation":0},{"center":[0,-200],"size":[60,60,50],"rotation":45},{"center":[350,-550],"size":[80,45,70],"rotation":15},{"center":[-280,700],"size":[50,90,45],"rotation":-5}]},"parks":[{"center":[-50,470],"size":[280,120],"rotation":0},{"center":[420,680],"size":[140,180],"rotation":10},{"center":[-550,-550],"size":[100,120],"rotation":-8},{"center":[0,750],"size":[350,80],"rotation":0}]}}`
      // London
      // const result = `{"thinking":"London is characterized by: 1) Organic, medieval street pattern in the center (City of London), 2) The Thames River curving through the city, 3) Mix of historic low-rise and modern skyscrapers in the financial district, 4) Grand boulevards and squares (Trafalgar, Parliament Square), 5) Large royal parks (Hyde Park, Regent's Park, St James's Park), 6) Distinct neighborhoods with varying densities, 7) The Shard, Gherkin, and other iconic towers clustered in specific areas. I'll create: curved roads following the Thames, organic winding streets in old city core, more regular grids in newer areas, several large parks, and landmark skyscrapers in the financial district.","city":{"roads":{"width":12,"lines":[[[750,-1000],[750,1000]],[[-750,-1000],[-750,1000]],[[0,-1000],[0,1000]],[[-750,-400],[750,-400]],[[-750,0],[750,0]],[[-750,400],[750,400]],[[-750,800],[750,800]],[[-750,-800],[750,-800]],[[-750,-200],[-400,-200],[-200,-50],[100,-50],[300,-150],[500,-150],[750,-200]],[[-750,200],[-400,200],[-100,250],[200,300],[450,250],[750,200]],[[375,-1000],[375,1000]],[[-375,-1000],[-375,1000]],[[-750,600],[750,600]],[[-750,-600],[750,-600]],[[200,-400],[200,0]],[[-200,-400],[-200,0]],[[500,0],[500,400]],[[-500,0],[-500,400]],[[-300,-800],[-250,-600],[-200,-400]],[[300,-800],[350,-600],[400,-400]],[[-600,400],[-550,600],[-500,800]],[[100,400],[150,600],[200,800]],[[600,400],[550,600],[500,800]],[[-750,-1000],[750,-1000]],[[-750,1000],[750,1000]]]},"buildings":{"defaults":{"size":[25,30],"height":[15,40],"spacing":8,"layout":"fill","coverage":0.55},"blocks":[{"boundary":[[-200,-250],[200,-250],[200,100],[-200,100]],"height":[80,180],"coverage":0.65},{"boundary":[[-400,-600],[400,-600],[400,-250],[-400,-250]],"height":[20,50],"spacing":10,"coverage":0.5},{"boundary":[[-750,-800],[-400,-800],[-400,-400],[-750,-400]],"height":[12,30],"coverage":0.45},{"boundary":[[400,-800],[750,-800],[750,-400],[400,-400]],"height":[12,30],"coverage":0.45},{"boundary":[[-750,450],[750,450],[750,1000],[-750,1000]],"height":[10,25],"spacing":12,"coverage":0.4},{"boundary":[[-750,-1000],[-500,-1000],[-500,-800],[-750,-800]],"height":[25,60],"coverage":0.5},{"boundary":[[500,-1000],[750,-1000],[750,-800],[500,-800]],"height":[25,60],"coverage":0.5}],"landmarks":[{"center":[50,-100],"size":[45,45,310],"rotation":15},{"center":[-120,-180],"size":[55,55,180],"rotation":0},{"center":[150,-50],"size":[40,40,160],"rotation":45},{"center":[-50,50],"size":[50,50,140],"rotation":30},{"center":[100,-220],"size":[35,35,120],"rotation":10},{"center":[0,700],"size":[80,40,100],"rotation":0},{"center":[400,-500],"size":[60,60,85],"rotation":22}]},"parks":[{"center":[-550,100],"size":[300,350],"rotation":5},{"center":[550,650],"size":[250,200],"rotation":-8},{"center":[-200,700],"size":[200,180],"rotation":0},{"center":[300,300],"size":[180,220],"rotation":12}]}}`
      // Chicago
      // const result = `{"thinking":"Chicago is known for its grid-based street layout, lakefront (Lake Michigan on the east), downtown Loop area with skyscrapers, diverse neighborhoods, and the Chicago River running through it. Key features: 1) Strong grid pattern with major arterial roads, 2) Downtown Loop area with tall buildings, 3) Lake Michigan shoreline on the east, 4) Chicago River with branches, 5) Grant Park and Millennium Park along the lakefront, 6) Neighborhoods radiating from downtown with decreasing building heights, 7) Industrial areas to the south and west. I'll create a city with these characteristics.","city":{"roads":{"width":20,"lines":[[[750,1000],[750,-1000]],[[-750,1000],[-750,-1000]],[[0,1000],[0,-1000]],[[375,1000],[375,-1000]],[[-375,1000],[-375,-1000]],[[-750,750],[750,750]],[[-750,375],[750,375]],[[-750,0],[750,0]],[[-750,-375],[750,-375]],[[-750,-750],[750,-750]],[[-750,500],[750,500]],[[-750,250],[750,250]],[[-750,-250],[750,-250]],[[-750,-500],[750,-500]],[[200,200],[350,50],[400,-150],[300,-350]],[[-100,150],[-200,-100],[-150,-300]],[[750,200],[600,100],[500,-100],[550,-350],[750,-400]],[[500,800],[550,600],[480,400]],[[-400,700],[-500,500],[-450,300]],[[100,600],[200,400],[150,200],[250,0]],[[-200,500],[-100,300],[-150,100]],[[300,300],[450,150],[400,0],[500,-200]],[[-300,200],[-400,0],[-350,-200]],[[-750,900],[750,900]],[[-750,-900],[750,-900]]]},"buildings":{"defaults":{"size":[25,30],"height":[15,45],"spacing":8,"layout":"fill","coverage":0.55},"blocks":[{"boundary":[[-300,400],[300,400],[300,-400],[-300,-400]],"height":[80,220],"coverage":0.7},{"boundary":[[-500,600],[500,600],[500,400],[-500,400]],"height":[40,100],"coverage":0.6},{"boundary":[[-500,-400],[500,-400],[500,-600],[-500,-600]],"height":[40,100],"coverage":0.6},{"boundary":[[500,400],[750,400],[750,-400],[500,-400]],"height":[25,60],"coverage":0.5},{"boundary":[[-750,400],[-500,400],[-500,-400],[-750,-400]],"height":[25,60],"coverage":0.5},{"boundary":[[-750,1000],[750,1000],[750,600],[-750,600]],"height":[12,35],"coverage":0.45},{"boundary":[[-750,-600],[750,-600],[750,-1000],[-750,-1000]],"height":[10,30],"coverage":0.4}],"landmarks":[{"center":[50,100],"size":[60,60,280],"rotation":0},{"center":[-120,-80],"size":[55,55,250],"rotation":15},{"center":[180,-150],"size":[50,50,230],"rotation":-10},{"center":[-80,200],"size":[45,50,200],"rotation":5},{"center":[200,50],"size":[40,45,180],"rotation":-20},{"center":[-200,100],"size":[42,48,175],"rotation":12},{"center":[80,-250],"size":[38,42,160],"rotation":-8},{"center":[-150,-220],"size":[35,40,150],"rotation":25}]},"parks":[{"center":[650,0],"size":[180,700],"rotation":0},{"center":[0,550],"size":[250,80],"rotation":0},{"center":[-550,650],"size":[150,120],"rotation":15},{"center":[400,-700],"size":[200,150],"rotation":-10},{"center":[-400,-750],"size":[180,130],"rotation":5}]}}`

      // test
      // const result = ``;
      // const result = `{"thinking":"Manhattan is a dense urban grid with a distinctive layout. Key features: 1) Grid pattern streets running north-south (avenues) and east-west (streets), 2) Broadway cutting diagonally, 3) Central Park as a large rectangular green space, 4) Dense high-rise buildings especially in Midtown and Financial District, 5) Lower density in residential areas. I'll create a elongated island shape with the characteristic grid, Central Park in the upper-middle section, and varying building heights - tallest in Midtown and Financial District areas.","city":{"roads":{"width":15,"lines":[[[-700,-1000],[-700,1000]],[[-500,-1000],[-500,1000]],[[-300,-1000],[-300,1000]],[[-100,-1000],[-100,1000]],[[100,-1000],[100,1000]],[[300,-1000],[300,1000]],[[500,-1000],[500,1000]],[[700,-1000],[700,1000]],[[-750,-900],[750,-900]],[[-750,-700],[750,-700]],[[-750,-500],[750,-500]],[[-750,-300],[750,-300]],[[-750,-100],[750,-100]],[[-750,100],[750,100]],[[-750,300],[750,300]],[[-750,500],[750,500]],[[-750,700],[750,700]],[[-750,900],[750,900]],[[-700,-1000],[-400,200],[100,600],[500,1000]],[[-600,-800],[-600,-600],[-400,-600],[-400,-400],[-200,-400],[-200,-200]],[[400,400],[400,600],[200,600],[200,800]]]},"buildings":{"defaults":{"size":[40,40],"height":[30,80],"spacing":8,"layout":"fill","coverage":0.75},"blocks":[{"boundary":[[-700,-1000],[700,-1000],[700,-500],[-700,-500]],"height":[80,250],"coverage":0.85},{"boundary":[[-700,-500],[700,-500],[700,-100],[-700,-100]],"height":[50,150],"coverage":0.8},{"boundary":[[-700,-100],[700,-100],[700,100],[-300,100],[-300,500],[-700,500]],"height":[40,100],"coverage":0.7},{"boundary":[[300,-100],[700,-100],[700,500],[300,500]],"height":[40,100],"coverage":0.7},{"boundary":[[-700,500],[700,500],[700,1000],[-700,1000]],"height":[25,60],"coverage":0.65}],"landmarks":[{"center":[50,-750],"size":[60,60,320],"rotation":0},{"center":[-200,-700],"size":[50,50,280],"rotation":15},{"center":[300,-650],"size":[45,45,260],"rotation":-10},{"center":[-400,-800],"size":[55,55,240],"rotation":5},{"center":[150,-600],"size":[50,60,220],"rotation":0},{"center":[-100,-350],"size":[70,50,180],"rotation":0},{"center":[250,-300],"size":[55,55,160],"rotation":12},{"center":[-350,-250],"size":[45,60,150],"rotation":-8}]},"parks":[{"vertices":[[-300,100],[300,100],[300,500],[-300,500]]},{"vertices":[[-650,750],[-450,750],[-450,850],[-650,850]]},{"vertices":[[400,600],[550,600],[550,750],[400,750]]}]}}`;

      if (result) {
        processResult(result);
        useStore.getState().set((state) => {
          state.genAIData = {
            aIModel: aIModel,
            prompt: prompt.trim(),
            data: result,
          };
        });
        setTimeout(() => {
          usePrimitiveStore.getState().set((state) => {
            state.curateDesignToProjectFlag = true;
            state.genAIModelCreated = true;
          });
        }, 1500);
      }
    } finally {
      setGenerating(false);
    }
  };

  const { error, interimResult, results, setResults, startSpeechToText, stopSpeechToText } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  const speechToText = useMemo(() => {
    let s = '';
    for (const result of results) {
      s += (result as ResultType).transcript;
    }
    if (interimResult) s += interimResult;
    return s;
  }, [results]);

  useEffect(() => {
    if (speechToText !== '') setPrompt(speechToText);
  }, [speechToText]);

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  const onOk = async () => {
    setCommonStore((state) => {
      state.projectState.generateUrbanDesignPrompt = prompt;
    });
    handleGenerativeAI().then(() => {
      setChanged(true);
      const userid = useStore.getState().user.uid;
      const projectTitle = useStore.getState().projectState.title;
      if (userid && projectTitle) updateGenerateBuildingPrompt(userid, projectTitle, prompt);
    });
    close();
  };

  const onCancel = () => {
    setPrompt(generateUrbanDesignPrompt);
    close();
  };

  const close = () => {
    setDialogVisible(false);
    setListening(false);
    stopSpeechToText();
  };

  const onClear = () => {
    setPrompt('');
    setResults([]);
  };

  return (
    <Modal
      width={650}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          <img src={GenaiImage} width={'16px'} alt={'genai'} /> {t('projectPanel.GenerateUrbanDesign', lang)}
        </div>
      }
      open={isDialogVisible()}
      footer={[
        <Button key="Cancel" onClick={onCancel}>
          {t('word.Cancel', lang)}
        </Button>,
        <Button key="Clear" onClick={onClear}>
          {t('word.Clear', lang)}
        </Button>,
        <Button key="OK" type="primary" onClick={onOk} disabled={prompt === ''}>
          {t('word.OK', lang)}
        </Button>,
      ]}
      onCancel={onCancel}
      modalRender={(modal) => (
        <Draggable
          nodeRef={dragRef}
          disabled={!dragEnabled}
          bounds={bounds}
          onStart={(event, uiData) => onStart(event, uiData)}
        >
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      <Space direction={'vertical'} style={{ width: '100%', paddingBottom: '10px', paddingTop: '10px' }}>
        <Space>
          {i18n.t('projectPanel.WhatUrbanDesignDoYouWant', lang)}
          {!error && (
            <>
              {listening ? (
                <>
                  <AudioOutlined
                    style={{ paddingLeft: '2px' }}
                    onClick={() => {
                      setListening(false);
                      stopSpeechToText();
                    }}
                  />
                  <Audio width={12} height={16} />
                  {i18n.t('projectPanel.Listening', lang)}
                </>
              ) : (
                <AudioMutedOutlined
                  style={{ paddingLeft: '2px' }}
                  onClick={() => {
                    setListening(true);
                    startSpeechToText().catch((e) => {
                      showError('Error: ' + e.toString());
                    });
                  }}
                />
              )}
            </>
          )}
        </Space>
        <TextArea
          disabled={listening}
          rows={6}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
          }}
        />
        <Space>
          {/* {t('projectPanel.ReasoningEffort', lang) + ':'}
          <Select
            value={reasoningEffort}
            style={{ width: '100px', marginRight: '10px' }}
            onChange={(value) => {
              setCommonStore((state) => {
                state.projectState.reasoningEffort = value;
              });
            }}
            options={[
              { value: 'low', label: t('word.Low', lang) },
              { value: 'medium', label: t('word.Medium', lang) },
              { value: 'high', label: t('word.High', lang) },
            ]}
          /> */}
          {t('projectPanel.AIModel', lang) + ':'}
          <Select
            value={aIModel}
            style={{ width: '150px', marginRight: '10px' }}
            onChange={(value) => {
              setCommonStore((state) => {
                state.projectState.aIModel = value;
              });
            }}
            options={[
              // { value: AI_MODELS_NAME['OpenAI o4-mini'], label: 'OpenAI o4-mini' },
              { value: AI_MODELS_NAME['Claude Opus-4.5'], label: 'Claude Opus-4.5' },
            ]}
          />
        </Space>

        <span style={{ fontSize: '12px' }}>
          <WarningOutlined /> {t('message.GeneratingUrbanDesignMayTakeAWhile', lang)}
        </span>
      </Space>
    </Modal>
  );
});

export default GenerateUrbanDesignModal;
