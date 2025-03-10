/*
 * @Copyright 2022-2025. Institute for Future Intelligence, Inc.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GAP_PERCENT,
  HIGHLIGHT_HANDLE_COLOR,
  MARGIN_PERCENT,
  Operation,
  RESOLUTION,
  SOLAR_PANEL_CELL_COLOR_BLACK,
  SOLAR_PANEL_CELL_COLOR_BLUE,
} from 'src/constants';
import { PvModel } from 'src/models/PvModel';
import { useStore } from 'src/stores/common';
import { Orientation } from 'src/types';
import { Util } from 'src/Util';
import { CanvasTexture, RepeatWrapping } from 'three';
import * as Selector from '../../stores/selector';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import { ThreeEvent, useThree } from '@react-three/fiber';

export const useInnerState = <T,>(val: T) => {
  const [_val, setVal] = useState<T>(val);
  useEffect(() => {
    if (val !== _val) {
      setVal(val);
    }
  }, [val]);
  return [_val, setVal] as [T, React.Dispatch<React.SetStateAction<T>>];
};

export const useHandle = (handleColor: string, cursorStyle: string) => {
  const { gl } = useThree();
  const [_color, setColor] = useState(handleColor);

  const pointerDownRef = useRef(false);
  const hoveredRef = useRef(false);

  useEffect(() => {
    const handlePointerUp = () => {
      if (!pointerDownRef.current) return;
      pointerDownRef.current = false;
      if (!hoveredRef.current) {
        setColor(handleColor);
        gl.domElement.style.cursor = 'default';
      }
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const _onPointerDown = () => {
    pointerDownRef.current = true;
    // bug: don't know why pointer down would reset cursor style to default?
    setTimeout(() => {
      gl.domElement.style.cursor = cursorStyle;
    }, 10);
  };

  const _onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) {
      hoveredRef.current = false;
      setColor(handleColor);
      gl.domElement.style.cursor = 'default';
    } else {
      hoveredRef.current = true;
      setColor(HIGHLIGHT_HANDLE_COLOR);
      gl.domElement.style.cursor = cursorStyle;
    }
  };

  const _onPointerLeave = () => {
    hoveredRef.current = false;
    if (!pointerDownRef.current) {
      setColor(handleColor);
      gl.domElement.style.cursor = 'default';
    }
  };

  return { _color, _onPointerDown, _onPointerMove, _onPointerLeave };
};

export const useMaterialSize = (lx: number, ly: number) => {
  const [materialLx, setMaterialLx] = useState(lx);
  const [materialLy, setMaterialLy] = useState(ly);

  useEffect(() => {
    setMaterialLx(lx);
    setMaterialLy(ly);
  }, [lx, ly]);

  const setMaterialSize = (operation: Operation, distance: number) => {
    if (operation === Operation.ResizeX) {
      if (distance !== materialLx) {
        setMaterialLx(Math.abs(distance));
      }
    } else {
      if (distance !== materialLy) {
        setMaterialLy(Math.abs(distance));
      }
    }
  };

  return { materialLx, materialLy, setMaterialSize };
};

export const useSolarPanelHeatmapTexture = (id: string) => {
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      const heatmap = useDataStore.getState().getHeatmap(id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  return heatmapTexture;
};

export const useSolarPanelTexture = (
  lx: number,
  ly: number,
  pvModel: PvModel,
  orientation: Orientation,
  customizedFrameColor?: string | undefined,
  customizedBacksheetColor?: string | undefined,
) => {
  const frameColor =
    customizedFrameColor ??
    (pvModel?.color === 'Black' && pvModel?.cellType === 'Monocrystalline' ? 'silver' : 'white');
  const backsheetColor = customizedBacksheetColor ?? 'gray';

  const canvasTexture = useMemo(() => {
    if (!pvModel) return null;
    const { cellType, length, width, m, n, color } = pvModel;
    if (orientation === Orientation.portrait) {
      return drawSolarPanelCanvasTexture(cellType, width, length, n, m, color, frameColor, backsheetColor);
    } else {
      return drawSolarPanelCanvasTexture(cellType, length, width, m, n, color, frameColor, backsheetColor);
    }
  }, [pvModel, orientation, frameColor, backsheetColor]);

  const [texture, setTexture] = useState<CanvasTexture | null>(canvasTexture);

  useEffect(() => {
    if (canvasTexture && pvModel) {
      const { length, width } = pvModel;
      const nx = Math.max(1, Math.round(lx / (orientation === Orientation.landscape ? length : width)));
      const ny = Math.max(1, Math.round(ly / (orientation === Orientation.landscape ? width : length)));
      canvasTexture.repeat.set(nx, ny);
      canvasTexture.wrapS = canvasTexture.wrapT = RepeatWrapping;
      setTexture(canvasTexture.clone());
    }
  }, [canvasTexture, lx, ly]);

  return texture;
};

const drawSolarPanelCanvasTexture = (
  cellType: string,
  length: number, // x
  width: number, // y
  m: number,
  n: number,
  color: string,
  frameColor: string,
  backsheetColor: string,
) => {
  length *= RESOLUTION;
  width *= RESOLUTION;

  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  [canvas.width, canvas.height] = [length, width];

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, length, width);

    const margin = Math.max(length, width) * MARGIN_PERCENT;
    ctx.fillStyle = backsheetColor;
    ctx.fillRect(margin, margin, length - 2 * margin, width - 2 * margin);

    // cell color
    ctx.fillStyle = color === 'Black' ? SOLAR_PANEL_CELL_COLOR_BLACK : SOLAR_PANEL_CELL_COLOR_BLUE;

    if (cellType === 'Thin Film') {
      const padding = margin * 0.6;
      ctx.fillRect(padding, padding, length - padding * 2, width - padding * 2);
    } else {
      const gap = Math.max(length, width) * GAP_PERCENT;
      const padding = margin + gap;
      const cellSizeX = (length - padding * 2 - gap * (m - 1)) / m;
      const cellSizeY = (width - padding * 2 - gap * (n - 1)) / n;
      const offsetX = cellSizeX * 0.1;
      const offsetY = cellSizeY * 0.1;
      if (cellType === 'Monocrystalline') {
        for (let i = 0; i < n; i++) {
          const y = padding + (cellSizeY + gap) * i;
          for (let j = 0; j < m; j++) {
            const x = padding + (cellSizeX + gap) * j;
            ctx.beginPath();
            ctx.moveTo(x, y + offsetY);
            ctx.lineTo(x, y + cellSizeY - offsetY);
            ctx.lineTo(x + offsetX, y + cellSizeY);
            ctx.lineTo(x + cellSizeX - offsetX, y + cellSizeY);
            ctx.lineTo(x + cellSizeX, y + cellSizeY - offsetY);
            ctx.lineTo(x + cellSizeX, y + offsetY);
            ctx.lineTo(x + cellSizeX - offsetX, y);
            ctx.lineTo(x + offsetX, y);
            ctx.closePath();
            ctx.fill();
          }
        }
      } else if (cellType === 'Polycrystalline') {
        for (let i = 0; i < n; i++) {
          const y = padding + (cellSizeY + gap) * i;
          for (let j = 0; j < m; j++) {
            const x = padding + (cellSizeX + gap) * j;
            ctx.fillRect(x, y, cellSizeX, cellSizeY);
          }
        }
      }
    }
  }

  return new CanvasTexture(canvas);
};
