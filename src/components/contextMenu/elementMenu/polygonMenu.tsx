/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Menu } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { PolygonModel } from '../../../models/PolygonModel';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import { ObjectType, PolygonTexture } from '../../../types';
import PolygonLineColorSelection from './polygonLineColorSelection';
import PolygonFillColorSelection from './polygonFillColorSelection';
import PolygonTextureSelection from './polygonTextureSelection';
import SolarPanelLayoutWizard from './solarPanelLayoutWizard';
import PolygonLineStyleSelection from './polygonLineStyleSelection';
import PolygonLineWidthSelection from './polygonLineWidthSelection';
import SolarPanelArrayGaWizard from './solarPanelArrayGaWizard';
import SolarPanelArrayPsoWizard from './solarPanelArrayPsoWizard';

export const PolygonMenu = React.memo(() => {
  const language = useStore(Selector.language);
  const updatePolygonFilledById = useStore(Selector.updatePolygonFilledById);
  const addUndoable = useStore(Selector.addUndoable);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const setApplyCount = useStore(Selector.setApplyCount);

  const polygon = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.Polygon),
  ) as PolygonModel;

  const [lineColorDialogVisible, setLineColorDialogVisible] = useState(false);
  const [lineStyleDialogVisible, setLineStyleDialogVisible] = useState(false);
  const [lineWidthDialogVisible, setLineWidthDialogVisible] = useState(false);
  const [fillColorDialogVisible, setFillColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [solarPanelLayoutWizardVisible, setSolarPanelLayoutWizardVisible] = useState(false);
  const [solarPanelLayoutGaWizardVisible, setSolarPanelLayoutGaWizardVisible] = useState(false);
  const [solarPanelLayoutPsoWizardVisible, setSolarPanelLayoutPsoWizardVisible] = useState(false);
  const lang = { lng: language };

  if (!polygon) return null;

  const editable = !polygon?.locked;

  const togglePolygonFilled = (e: CheckboxChangeEvent) => {
    if (polygon) {
      const undoableCheck = {
        name: 'Fill Polygon',
        timestamp: Date.now(),
        checked: !polygon.filled,
        selectedElementId: polygon.id,
        selectedElementType: ObjectType.Polygon,
        undo: () => {
          updatePolygonFilledById(polygon.id, !undoableCheck.checked);
        },
        redo: () => {
          updatePolygonFilledById(polygon.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updatePolygonFilledById(polygon.id, e.target.checked);
    }
  };

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (
        e.type === ObjectType.Human ||
        e.type === ObjectType.Tree ||
        e.type === ObjectType.Polygon ||
        e.type === ObjectType.Sensor ||
        e.type === ObjectType.SolarPanel
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <Menu.ItemGroup>
      {legalToPaste() && <Paste keyName={'polygon-paste'} />}
      <Copy keyName={'polygon-copy'} />
      {editable && <Cut keyName={'polygon-cut'} />}
      <SubMenu key={'layout'} title={i18n.t('polygonMenu.Layout', lang)} style={{ paddingLeft: '24px' }}>
        {solarPanelLayoutWizardVisible && (
          <SolarPanelLayoutWizard setDialogVisible={setSolarPanelLayoutWizardVisible} />
        )}
        <Menu.Item
          key={'solar-panel-layout'}
          onClick={() => {
            setApplyCount(0);
            setSolarPanelLayoutWizardVisible(true);
          }}
          style={{ paddingLeft: '36px' }}
        >
          {i18n.t('polygonMenu.SolarPanelArrayLayoutParametricDesign', lang)} ...
        </Menu.Item>
        <SubMenu
          key={'solar-panel-layout-ai'}
          title={i18n.t('polygonMenu.SolarPanelArrayLayoutGenerativeDesign', lang)}
          style={{ paddingLeft: '24px' }}
        >
          {solarPanelLayoutGaWizardVisible && (
            <SolarPanelArrayGaWizard setDialogVisible={setSolarPanelLayoutGaWizardVisible} />
          )}
          <Menu.Item
            key={'solar-panel-layout-ga'}
            onClick={() => {
              setApplyCount(0);
              setSolarPanelLayoutGaWizardVisible(true);
            }}
            style={{ paddingLeft: '36px' }}
          >
            {i18n.t('optimizationMenu.GeneticAlgorithm', lang)} ...
          </Menu.Item>
          {solarPanelLayoutPsoWizardVisible && (
            <SolarPanelArrayPsoWizard setDialogVisible={setSolarPanelLayoutPsoWizardVisible} />
          )}
          <Menu.Item
            key={'solar-panel-layout-pso'}
            onClick={() => {
              setApplyCount(0);
              setSolarPanelLayoutPsoWizardVisible(true);
            }}
            style={{ paddingLeft: '36px' }}
          >
            {i18n.t('optimizationMenu.ParticleSwarmOptimization', lang)} ...
          </Menu.Item>
        </SubMenu>
      </SubMenu>
      <Lock keyName={'polygon-lock'} />
      {editable && (
        <Menu.Item key={'polygon-filled'}>
          <Checkbox checked={!!polygon?.filled} onChange={togglePolygonFilled}>
            {i18n.t('polygonMenu.Filled', lang)}
          </Checkbox>
        </Menu.Item>
      )}
      {editable && (
        <>
          {lineColorDialogVisible && <PolygonLineColorSelection setDialogVisible={setLineColorDialogVisible} />}
          <Menu.Item
            key={'polygon-line-color'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLineColorDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.LineColor', lang)} ...
          </Menu.Item>
          {lineStyleDialogVisible && <PolygonLineStyleSelection setDialogVisible={setLineStyleDialogVisible} />}
          <Menu.Item
            key={'polygon-line-style'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLineStyleDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.LineStyle', lang)} ...
          </Menu.Item>
          {lineWidthDialogVisible && <PolygonLineWidthSelection setDialogVisible={setLineWidthDialogVisible} />}
          <Menu.Item
            key={'polygon-line-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLineWidthDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.LineWidth', lang)} ...
          </Menu.Item>
        </>
      )}
      {editable && (!polygon.textureType || polygon.textureType === PolygonTexture.NoTexture) && (
        <>
          {fillColorDialogVisible && <PolygonFillColorSelection setDialogVisible={setFillColorDialogVisible} />}
          <Menu.Item
            key={'polygon-fill-color'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setFillColorDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.FillColor', lang)} ...
          </Menu.Item>
        </>
      )}
      {editable && (
        <>
          {textureDialogVisible && <PolygonTextureSelection setDialogVisible={setTextureDialogVisible} />}
          <Menu.Item
            key={'polygon-texture'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setTextureDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.FillTexture', lang)} ...
          </Menu.Item>
        </>
      )}
    </Menu.ItemGroup>
  );
});
