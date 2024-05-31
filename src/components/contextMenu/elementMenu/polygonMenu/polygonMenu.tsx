/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { PolygonModel } from 'src/models/PolygonModel';
import { useStore } from 'src/stores/common';
import { ObjectType, PolygonTexture } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem, Paste } from '../../menuItems';
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

export const createPolygonMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Polygon) return { items };

  const polygon = selectedElement as PolygonModel;
  const parent = useStore.getState().getParent(polygon);

  const lang = { lng: useStore.getState().language };
  const editable = !polygon.locked;

  items.push({
    key: 'polygon-paste',
    label: <Paste />,
  });

  items.push({
    key: 'polygon-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'polygon-cut',
      label: <Cut />,
    });
  }

  if (parent && (parent.type === ObjectType.Foundation || parent.type === ObjectType.Cuboid)) {
    items.push({
      key: 'polygon-layout-submenu',
      label: <MenuItem>{i18n.t('polygonMenu.Layout', lang)}</MenuItem>,
      children: [
        {
          key: 'solar-panel-layout-wizard',
          label: (
            <DialogItem noPadding Dialog={SolarPanelLayoutWizard}>
              {i18n.t('polygonMenu.SolarPanelArrayLayoutParametricDesign', lang)} ...
            </DialogItem>
          ),
        },
        {
          key: 'solar-panel-layout-ai',
          label: <MenuItem noPadding>{i18n.t('polygonMenu.SolarPanelArrayLayoutGenerativeDesign', lang)}</MenuItem>,
          children: [
            {
              key: 'solar-panel-layout-ga',
              label: (
                <DialogItem noPadding Dialog={SolarPanelArrayGaWizard}>
                  {i18n.t('optimizationMenu.GeneticAlgorithm', lang)} ...
                </DialogItem>
              ),
            },
            {
              key: 'solar-panel-layout-pso',
              label: (
                <DialogItem noPadding Dialog={SolarPanelArrayPsoWizard}>
                  {i18n.t('optimizationMenu.ParticleSwarmOptimization', lang)} ...
                </DialogItem>
              ),
            },
          ],
        },
      ],
    });
  }

  items.push({
    key: 'polygon-lock',
    label: <Lock selectedElement={polygon} />,
  });

  if (editable) {
    items.push({
      key: 'polygon-filled',
      label: <PolygonFillCheckbox polygon={polygon} />,
    });

    if (polygon.filled) {
      items.push({
        key: 'polygon-shiny',
        label: <PolygonShinyCheckbox polygon={polygon} />,
      });
    }

    items.push({
      key: 'polygon-no-outline',
      label: <PolygonOutlineCheckbox polygon={polygon} />,
    });
  }

  if (editable) {
    items.push(
      {
        key: 'polygon-line-color',
        label: <DialogItem Dialog={PolygonLineColorSelection}>{i18n.t('polygonMenu.LineColor', lang)} ...</DialogItem>,
      },
      {
        key: 'polygon-line-style',
        label: <DialogItem Dialog={PolygonLineStyleSelection}>{i18n.t('polygonMenu.LineStyle', lang)} ...</DialogItem>,
      },
      {
        key: 'polygon-line-width',
        label: <DialogItem Dialog={PolygonLineWidthSelection}>{i18n.t('polygonMenu.LineWidth', lang)} ...</DialogItem>,
      },
    );

    if (polygon.filled) {
      if (!polygon.textureType || polygon.textureType === PolygonTexture.NoTexture) {
        items.push({
          key: 'polygon-fill-color',
          label: (
            <DialogItem Dialog={PolygonFillColorSelection}>{i18n.t('polygonMenu.FillColor', lang)} ...</DialogItem>
          ),
        });
      }

      items.push(
        {
          key: 'polygon-texture',
          label: (
            <DialogItem Dialog={PolygonTextureSelection}>{i18n.t('polygonMenu.FillTexture', lang)} ...</DialogItem>
          ),
        },
        {
          key: 'polygon-opacity',
          label: <DialogItem Dialog={PolygonOpacityInput}>{i18n.t('polygonMenu.Opacity', lang)} ...</DialogItem>,
        },
      );
    }

    items.push({
      key: 'polygon-text-box',
      label: <MenuItem>{i18n.t('polygonMenu.TextBox', lang)}</MenuItem>,
      children: [
        {
          key: 'polygon-text',
          label: <PolygonText polygon={polygon} />,
        },
        {
          key: 'polygon-font-size',
          label: <PolygonFontSize polygon={polygon} />,
        },
        {
          key: 'polygon-font-color',
          label: <PolygonFontColor polygon={polygon} />,
        },
        {
          key: 'polygon-font-outline-color',
          label: <PolygonFontOutlineColor polygon={polygon} />,
        },
        {
          key: 'polygon-font-outline-width',
          label: <PolygonFontOutlineWidth polygon={polygon} />,
        },
        {
          key: 'polygon-font-stroke-color',
          label: <PolygonFontStrokeColor polygon={polygon} />,
        },
        {
          key: 'polygon-font-stroke-width',
          label: <PolygonFontStrokeWidth polygon={polygon} />,
        },
      ],
    });
  }

  return { items } as MenuProps;
};
