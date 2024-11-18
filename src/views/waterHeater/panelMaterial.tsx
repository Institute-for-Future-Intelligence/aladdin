/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { DEFAULT_SOLAR_PANEL_SHININESS, SOLAR_PANEL_BLACK_SPECULAR, SOLAR_PANEL_BLUE_SPECULAR } from 'src/constants';
import * as Selector from '../../stores/selector';
import { Color, Side } from 'three';
import { useMaterialSize } from '../solarPanel/hooks';
import { forwardRef, useImperativeHandle } from 'react';
import { Operation } from '../solarPanel/refSolarPanel';
import { useWaterHeaterPanelTexture } from './texture';

interface MaterialsProps {
  lx: number;
  ly: number;
  side: Side;
}

export interface MaterialRefProps {
  update: (lx: number | undefined, ly?: number | undefined) => void;
}

const PanelMaterial = forwardRef(({ lx, ly, side }: MaterialsProps, ref) => {
  const { materialLx, materialLy, setMaterialSize } = useMaterialSize(lx, ly);

  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const solarPanelShininess = useStore(Selector.viewState.solarPanelShininess);

  const texture = useWaterHeaterPanelTexture(materialLx, materialLy);
  // const heatmapTexture = useSolarPanelHeatmapTexture(id);
  const heatmapTexture = null;

  const renderTopTextureMaterial = () => {
    if (showSolarRadiationHeatmap && heatmapTexture) {
      return <meshBasicMaterial map={heatmapTexture} />;
    }
    if (!texture) return null;
    if (orthographic || solarPanelShininess === 0) {
      return <meshStandardMaterial map={texture} side={side} transparent={true} />;
    }
    return (
      <meshPhongMaterial
        specular={new Color(SOLAR_PANEL_BLACK_SPECULAR)}
        shininess={solarPanelShininess ?? DEFAULT_SOLAR_PANEL_SHININESS}
        side={side}
        map={texture}
        transparent={true}
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

  return <>{renderTopTextureMaterial()}</>;
});

export default PanelMaterial;
