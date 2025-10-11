/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { PolygonModel } from 'src/models/PolygonModel';
import { useStore } from 'src/stores/common';
import { ObjectType, PolygonTexture } from 'src/types';
import { ContextSubMenu, Copy, Cut, DialogItem, Lock, Paste } from '../../menuItems';
import {
  PolygonFillCheckbox,
  PolygonFontColor,
  PolygonFontOutlineColor,
  PolygonFontOutlineWidth,
  PolygonFontSize,
  PolygonFontStrokeColor,
  PolygonFontStrokeWidth,
  PolygonOutlineCheckbox,
  PolygonShinyCheckbox,
  PolygonText,
} from './polygonMenuItems';
import i18n from 'src/i18n/i18n';
import PolygonLineColorSelection from './polygonLineColorSelection';
import PolygonLineStyleSelection from './polygonLineStyleSelection';
import PolygonLineWidthSelection from './polygonLineWidthSelection';
import PolygonFillColorSelection from './polygonFillColorSelection';
import PolygonTextureSelection from './polygonTextureSelection';
import PolygonOpacityInput from './polygonOpacityInput';
import SolarPanelLayoutWizard from '../solarPanelLayoutWizard';
import SolarPanelArrayGaWizard from '../solarPanelArrayGaWizard';
import SolarPanelArrayPsoWizard from '../solarPanelArrayPsoWizard';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const PolygonMenu = () => {
  const lang = useLanguage();
  const polygon = useContextMenuElement(ObjectType.Polygon) as PolygonModel;
  if (!polygon) return null;

  const editable = !polygon.locked;
  const parent = useStore.getState().getParent(polygon);

  return (
    <>
      {/* polygon-paste */}
      <Paste />

      {/* polygon-copy */}
      <Copy />

      {/* polygon-cut */}
      {editable && <Cut />}

      {/* polygon-lock */}
      <Lock selectedElement={polygon} />

      {editable && (
        <>
          {/* polygon-filled */}
          <PolygonFillCheckbox polygon={polygon} />

          {/* polygon-shiny */}
          {polygon.filled && <PolygonShinyCheckbox polygon={polygon} />}

          {/* polygon-no-outline */}
          <PolygonOutlineCheckbox polygon={polygon} />

          {/* polygon line properties */}
          <DialogItem Dialog={PolygonLineColorSelection}>{i18n.t('polygonMenu.LineColor', lang)} ...</DialogItem>
          <DialogItem Dialog={PolygonLineStyleSelection}>{i18n.t('polygonMenu.LineStyle', lang)} ...</DialogItem>
          <DialogItem Dialog={PolygonLineWidthSelection}>{i18n.t('polygonMenu.LineWidth', lang)} ...</DialogItem>

          {polygon.filled && (
            <>
              {/* polygon-fill-color */}
              {!polygon.textureType || polygon.textureType === PolygonTexture.NoTexture ? (
                <DialogItem Dialog={PolygonFillColorSelection}>{i18n.t('polygonMenu.FillColor', lang)} ...</DialogItem>
              ) : null}

              {/* polygon texture & opacity */}
              <DialogItem Dialog={PolygonTextureSelection}>{i18n.t('polygonMenu.FillTexture', lang)} ...</DialogItem>
              <DialogItem Dialog={PolygonOpacityInput}>{i18n.t('polygonMenu.Opacity', lang)} ...</DialogItem>
            </>
          )}

          {/* polygon layout submenu */}
          {parent && (parent.type === ObjectType.Foundation || parent.type === ObjectType.Cuboid) && (
            <ContextSubMenu label={i18n.t('polygonMenu.Layout', lang)}>
              {/* Solar panel layout wizard */}
              <DialogItem noPadding Dialog={SolarPanelLayoutWizard}>
                {i18n.t('polygonMenu.SolarPanelArrayLayoutParametricDesign', lang)} ...
              </DialogItem>

              {/* Solar panel AI layout */}
              <ContextSubMenu noPadding label={i18n.t('polygonMenu.SolarPanelArrayLayoutGenerativeDesign', lang)}>
                {/* GA */}
                <DialogItem noPadding Dialog={SolarPanelArrayGaWizard}>
                  {i18n.t('optimizationMenu.GeneticAlgorithm', lang)} ...
                </DialogItem>
                {/* PSO */}
                <DialogItem noPadding Dialog={SolarPanelArrayPsoWizard}>
                  {i18n.t('optimizationMenu.ParticleSwarmOptimization', lang)} ...
                </DialogItem>
              </ContextSubMenu>
            </ContextSubMenu>
          )}

          {/* polygon text box submenu */}
          <ContextSubMenu label={i18n.t('polygonMenu.TextBox', lang)}>
            <PolygonText polygon={polygon} />
            <PolygonFontSize polygon={polygon} />
            <PolygonFontColor polygon={polygon} />
            <PolygonFontOutlineColor polygon={polygon} />
            <PolygonFontOutlineWidth polygon={polygon} />
            <PolygonFontStrokeColor polygon={polygon} />
            <PolygonFontStrokeWidth polygon={polygon} />
          </ContextSubMenu>
        </>
      )}
    </>
  );
};

export default PolygonMenu;
