import { Cone, Line } from '@react-three/drei';
import React, { useMemo, useRef } from 'react';
import { Util } from 'src/Util';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_DENSITY_FACTOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  HALF_PI,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from 'src/constants';
import { FoundationModel } from 'src/models/FoundationModel';
import { WallFill, WallModel } from 'src/models/WallModel';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { useDataStore } from 'src/stores/commonData';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import * as Selector from 'src/stores/selector';
import { ObjectType } from 'src/types';
import { Euler, Vector3 } from 'three';

interface HeatFluxProps {
  wallModel: WallModel;
  notBuilding?: boolean;
}

const WallHeatFlux = ({ wallModel, notBuilding }: HeatFluxProps) => {
  const { id, lx, lz } = wallModel;
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
  const hourlyHeatExchangeArrayMap = useDataStore(Selector.hourlyHeatExchangeArrayMap);
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);

  const heatFluxArrowHead = useRef<number>(0);
  const heatFluxArrowEuler = useRef<Euler>();

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
    if (notBuilding) return undefined;
    const heat = hourlyHeatExchangeArrayMap.get(id);
    if (!heat) return undefined;
    const sum = heat.reduce((a, b) => a + b, 0);
    const partial = wallModel.fill === WallFill.Partial && !Util.isPartialWallFull(wallModel);
    const frameVertices = Util.getWallVertices(wallModel, 0);
    const partialWallVertices = partial ? Util.getPartialWallVertices(wallModel, 0) : frameVertices;
    const frameArea = Util.getPolygonArea(frameVertices);
    let area = partial ? Util.getPolygonArea(partialWallVertices) : frameArea;
    if (area === 0) return undefined;
    const windows = getChildrenOfType(ObjectType.Window, id);
    const doors = getChildrenOfType(ObjectType.Door, id);
    if (windows && windows.length > 0) {
      for (const w of windows) {
        // window dimension is relative to the wall
        area -= Util.getWindowArea(w as WindowModel, wallModel);
      }
    }
    if (doors && doors.length > 0) {
      for (const d of doors) {
        // door dimension is relative to the wall
        area -= d.lx * d.lz * wallModel.lx * wallModel.lz;
      }
    }
    const world = useStore.getState().world;
    const cellSize = DEFAULT_HEAT_FLUX_DENSITY_FACTOR * (world.solarRadiationHeatmapGridCellSize ?? 0.5);
    const lz = Util.getHighestPointOfWall(wallModel); // height
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const halfDif = (lz - wallModel.lz) / 2;
    const intensity = (sum / area) * (heatFluxScaleFactor ?? DEFAULT_HEAT_FLUX_SCALE_FACTOR);
    heatFluxArrowHead.current = intensity < 0 ? 1 : 0;
    heatFluxArrowEuler.current = Util.getEuler(
      UNIT_VECTOR_POS_Z,
      UNIT_VECTOR_POS_Y,
      'YXZ',
      Math.sign(intensity) * HALF_PI,
    );
    const vectors: Vector3[][] = [];
    const polygon = partial ? Util.getPartialWallVertices(wallModel, 0) : Util.getWallVertices(wallModel, 0);
    let isWall;
    for (let kx = 0; kx < nx; kx++) {
      for (let kz = 0; kz < nz; kz++) {
        const v: Vector3[] = [];
        const rx = (kx - nx / 2 + 0.5) * dx;
        const rz = (kz - nz / 2 + 0.5) * dz + halfDif;
        if (Util.isPointInside(rx, rz, polygon)) {
          isWall = true;
          if (windows && windows.length > 0) {
            for (const w of windows) {
              if (w.type !== ObjectType.Window) continue;
              const cx = w.cx * wallModel.lx;
              const cz = w.cz * wallModel.lz;
              const hx = (w.lx * wallModel.lx) / 2;
              const hz = (w.lz * wallModel.lz) / 2;
              const win = w as WindowModel;
              if (win.windowType === WindowType.Arched) {
                // TODO: Deal with arched window
                if (rx >= cx - hx && rx < cx + hx && rz >= cz - hz && rz < cz + hz) {
                  isWall = false;
                  break;
                }
              } else {
                if (rx >= cx - hx && rx < cx + hx && rz >= cz - hz && rz < cz + hz) {
                  isWall = false;
                  break;
                }
              }
            }
          }
          if (doors && doors.length > 0) {
            for (const d of doors) {
              const cx = d.cx * lx;
              const cz = d.cz * lz;
              const hx = (d.lx * lx) / 2;
              const hz = (d.lz * lz) / 2;
              // TODO: Deal with arched door
              if (rx >= cx - hx && rx < cx + hx && rz >= cz - hz && rz < cz + hz) {
                isWall = false;
                break;
              }
            }
          }
          if (isWall) {
            if (intensity < 0) {
              v.push(new Vector3(rx, 0, rz));
              v.push(new Vector3(rx, intensity, rz));
            } else {
              v.push(new Vector3(rx, 0, rz));
              v.push(new Vector3(rx, -intensity, rz));
            }
            vectors.push(v);
          }
        }
      }
    }
    return vectors;
  }, [lx, lz, showHeatFluxes, heatFluxScaleFactor, notBuilding]);

  if (!heatFluxes) return null;

  return (
    <>
      {heatFluxes.map((v, index) => (
        <React.Fragment key={index}>
          <Line
            points={v}
            name={'Heat Flux ' + index}
            lineWidth={heatFluxWidth ?? DEFAULT_HEAT_FLUX_WIDTH}
            color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR}
          />
          <Cone
            userData={{ unintersectable: true }}
            position={v[heatFluxArrowHead.current]
              .clone()
              .add(new Vector3(0, heatFluxArrowHead.current === 0 ? -0.1 : 0.1, 0))}
            args={[0.06, 0.2, 4, 1]}
            name={'Normal Vector Arrow Head'}
            rotation={heatFluxArrowEuler.current ?? [0, 0, 0]}
          >
            <meshBasicMaterial attach="material" color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR} />
          </Cone>
        </React.Fragment>
      ))}
    </>
  );
};

export default React.memo(WallHeatFlux);
