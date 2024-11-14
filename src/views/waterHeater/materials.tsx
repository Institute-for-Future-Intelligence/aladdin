/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { PvModel } from 'src/models/PvModel';
import { DEFAULT_SOLAR_PANEL_SHININESS, SOLAR_PANEL_BLACK_SPECULAR, SOLAR_PANEL_BLUE_SPECULAR } from 'src/constants';
import * as Selector from '../../stores/selector';
import { Color, FrontSide } from 'three';
import { Orientation } from 'src/types';
import { useMaterialSize, useSolarPanelTexture } from '../solarPanel/hooks';
import { forwardRef, useImperativeHandle } from 'react';
import { Operation } from '../solarPanel/refSolarPanel';

interface MaterialsProps {
  lx: number;
  ly: number;
  color: string;
}

export interface MaterialRefProps {
  update: (lx: number | undefined, ly?: number | undefined) => void;
}

const Materials = forwardRef(({ lx, ly, color }: MaterialsProps, ref) => {
  const { materialLx, materialLy, setMaterialSize } = useMaterialSize(lx, ly);

  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const solarPanelShininess = useStore(Selector.viewState.solarPanelShininess);

  const pvModelName = 'SPR-X21-335-BLK';
  const pvModel = useStore.getState().pvModules[pvModelName] as PvModel;
  const orientation = Orientation.portrait;

  const texture = useSolarPanelTexture(materialLx, materialLy, pvModel, orientation);
  // const heatmapTexture = useSolarPanelHeatmapTexture(id);
  const heatmapTexture = null;

  const renderTopTextureMaterial = () => {
    if (showSolarRadiationHeatmap && heatmapTexture) {
      return <meshBasicMaterial attach="material-4" map={heatmapTexture} />;
    }
    if (!texture) return null;
    if (orthographic || solarPanelShininess === 0) {
      return <meshStandardMaterial attach="material-4" map={texture} color={color} />;
    }
    return (
      <meshPhongMaterial
        attach="material-4"
        specular={new Color(pvModel?.color === 'Blue' ? SOLAR_PANEL_BLUE_SPECULAR : SOLAR_PANEL_BLACK_SPECULAR)}
        shininess={solarPanelShininess ?? DEFAULT_SOLAR_PANEL_SHININESS}
        side={FrontSide}
        map={texture}
        color={color}
      />
    );
  };

  useImperativeHandle(ref, () => ({
    update(lx: number | undefined, ly: number | undefined) {
      if (lx !== undefined) {
        setMaterialSize(Operation.ResizeX, lx);
      }
      if (ly !== undefined) {
        setMaterialSize(Operation.ResizeY, ly);
      }
    },
  }));

  return (
    <>
      <meshStandardMaterial attach="material-0" color={color} />
      <meshStandardMaterial attach="material-1" color={color} />
      <meshStandardMaterial attach="material-2" color={color} />
      <meshStandardMaterial attach="material-3" color={color} />
      {renderTopTextureMaterial()}
      <meshStandardMaterial attach="material-5" color={color} />
    </>
  );
});

export default Materials;
