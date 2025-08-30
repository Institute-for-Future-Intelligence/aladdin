/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { DEFAULT_VIEW_SOLAR_PANEL_SHININESS, SOLAR_PANEL_BLACK_SPECULAR, Operation } from 'src/constants';
import * as Selector from '../../stores/selector';
import { Color, Side } from 'three';
import { useMaterialSize, useSolarPanelHeatmapTexture } from '../solarPanel/hooks';
import { forwardRef, useImperativeHandle } from 'react';
import { useWaterHeaterPanelTexture } from './texture';
import React from 'react';

interface MaterialsProps {
  id: string;
  lx: number;
  ly: number;
  side: Side;
}

export interface MaterialRefProps {
  update: (lx: number | undefined, ly?: number | undefined) => void;
}

const PanelMaterial = React.memo(
  forwardRef(({ id, lx, ly, side }: MaterialsProps, ref) => {
    const { materialLx, materialLy, setMaterialSize } = useMaterialSize(lx, ly);

    const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
    const orthographic = useStore(Selector.viewState.orthographic) ?? false;
    const solarPanelShininess = useStore(Selector.viewState.solarPanelShininess);

    const texture = useWaterHeaterPanelTexture(materialLx, materialLy);
    const heatmapTexture = useSolarPanelHeatmapTexture(id);

    const renderMaterial = () => {
      if (showSolarRadiationHeatmap && heatmapTexture) {
        return <meshBasicMaterial map={heatmapTexture} side={side} />;
      }
      if (!texture) return null;
      if (orthographic || solarPanelShininess === 0) {
        return <meshStandardMaterial map={texture} side={side} transparent={true} />;
      }
      return (
        <meshPhongMaterial
          specular={new Color(SOLAR_PANEL_BLACK_SPECULAR)}
          shininess={solarPanelShininess ?? DEFAULT_VIEW_SOLAR_PANEL_SHININESS}
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

    return <>{renderMaterial()}</>;
  }),
);

export default PanelMaterial;
