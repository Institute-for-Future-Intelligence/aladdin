/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useSolarPanelHeatmapTexture, useSolarPanelTexture } from './hooks';
import { PvModel } from 'src/models/PvModel';
import {
  DEFAULT_VIEW_SOLAR_PANEL_SHININESS,
  SOLAR_PANEL_BLACK_SPECULAR,
  SOLAR_PANEL_BLUE_SPECULAR,
} from 'src/constants';
import * as Selector from '../../stores/selector';
import { Color, FrontSide } from 'three';
import { useMemo } from 'react';

interface MaterialsProps {
  solarPanel: SolarPanelModel;
  lx: number;
  ly: number;
}

const Materials = ({ solarPanel, lx, ly }: MaterialsProps) => {
  const { id, tiltAngle, pvModelName, orientation, color } = solarPanel;

  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const solarPanelShininess = useStore(Selector.viewState.solarPanelShininess);
  const supportedPvModules = useStore(Selector.supportedPvModules);
  const customPvModules = useStore(Selector.customPvModules);

  const pvModules = useMemo(() => {
    return { ...customPvModules, ...supportedPvModules };
  }, [supportedPvModules, customPvModules]);

  const pvModel = pvModules[pvModelName] as PvModel;

  const texture = useSolarPanelTexture(lx, ly, pvModel, orientation, solarPanel.frameColor, solarPanel.backsheetColor);
  const heatmapTexture = useSolarPanelHeatmapTexture(id);

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
        shininess={solarPanelShininess ?? DEFAULT_VIEW_SOLAR_PANEL_SHININESS}
        side={FrontSide}
        map={texture}
        color={color}
      />
    );
  };

  const renderBotTextureMaterial = () => {
    if (pvModel?.bifacialityFactor === 0 || orthographic || (false && tiltAngle === 0)) {
      return <meshStandardMaterial attach="material-5" color={color} />;
    }
    if (!texture) return null;
    return (
      <meshPhongMaterial
        attach="material-5"
        specular={new Color(pvModel?.color === 'Blue' ? SOLAR_PANEL_BLUE_SPECULAR : SOLAR_PANEL_BLACK_SPECULAR)}
        shininess={solarPanelShininess ?? DEFAULT_VIEW_SOLAR_PANEL_SHININESS}
        side={FrontSide}
        map={texture}
        color={color}
      />
    );
  };

  return (
    <>
      <meshStandardMaterial attach="material-0" color={color} />
      <meshStandardMaterial attach="material-1" color={color} />
      <meshStandardMaterial attach="material-2" color={color} />
      <meshStandardMaterial attach="material-3" color={color} />
      {renderTopTextureMaterial()}
      {renderBotTextureMaterial()}
    </>
  );
};

export default Materials;
