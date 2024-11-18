/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { DEFAULT_SOLAR_PANEL_SHININESS, SOLAR_PANEL_BLACK_SPECULAR } from 'src/constants';
import * as Selector from '../../stores/selector';
import { Color } from 'three';
import { barTexture } from './texture';

const BarMaterial = () => {
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const solarPanelShininess = useStore(Selector.viewState.solarPanelShininess);

  const renderMaterial = () => {
    if (!barTexture) return null;
    if (orthographic || solarPanelShininess === 0) {
      return <meshStandardMaterial map={barTexture} />;
    }
    return (
      <meshPhongMaterial
        specular={new Color(SOLAR_PANEL_BLACK_SPECULAR)}
        shininess={solarPanelShininess ?? DEFAULT_SOLAR_PANEL_SHININESS}
        map={barTexture}
      />
    );
  };

  return <>{renderMaterial()}</>;
};

export default BarMaterial;
