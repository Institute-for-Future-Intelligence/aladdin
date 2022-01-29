/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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

export const PolygonMenu = () => {
  const language = useStore(Selector.language);
  const polygon = useStore(Selector.selectedElement) as PolygonModel;
  const updatePolygonFilledById = useStore(Selector.updatePolygonFilledById);
  const addUndoable = useStore(Selector.addUndoable);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [lineColorDialogVisible, setLineColorDialogVisible] = useState(false);
  const [lineStyleDialogVisible, setLineStyleDialogVisible] = useState(false);
  const [lineWidthDialogVisible, setLineWidthDialogVisible] = useState(false);
  const [fillColorDialogVisible, setFillColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [solarPanelLayoutWizardVisible, setSolarPanelLayoutWizardVisible] = useState(false);
  const lang = { lng: language };

  const togglePolygonFilled = (e: CheckboxChangeEvent) => {
    if (polygon) {
      const undoableCheck = {
        name: 'Fill Polygon',
        timestamp: Date.now(),
        checked: !polygon.filled,
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

  const editable = !polygon?.locked;

  return (
    polygon && (
      <>
        {legalToPaste() && <Paste keyName={'polygon-paste'} />}
        <Copy keyName={'polygon-copy'} />
        {editable && <Cut keyName={'polygon-cut'} />}
        <SubMenu key={'layout'} title={i18n.t('polygonMenu.Layout', lang)} style={{ paddingLeft: '24px' }}>
          <SolarPanelLayoutWizard
            dialogVisible={solarPanelLayoutWizardVisible}
            setDialogVisible={setSolarPanelLayoutWizardVisible}
          />
          <Menu.Item
            key={'solar-panel-layout'}
            onClick={() => {
              setApplyCount(0);
              setSolarPanelLayoutWizardVisible(true);
            }}
            style={{ paddingLeft: '36px' }}
          >
            {i18n.t('polygonMenu.SolarPanelArrayLayout', lang)} ...
          </Menu.Item>
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
            <PolygonLineColorSelection
              dialogVisible={lineColorDialogVisible}
              setDialogVisible={setLineColorDialogVisible}
            />
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
            <PolygonLineStyleSelection
              dialogVisible={lineStyleDialogVisible}
              setDialogVisible={setLineStyleDialogVisible}
            />
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
            <PolygonLineWidthSelection
              dialogVisible={lineWidthDialogVisible}
              setDialogVisible={setLineWidthDialogVisible}
            />
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
            <PolygonFillColorSelection
              dialogVisible={fillColorDialogVisible}
              setDialogVisible={setFillColorDialogVisible}
            />
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
            <PolygonTextureSelection dialogVisible={textureDialogVisible} setDialogVisible={setTextureDialogVisible} />
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
      </>
    )
  );
};
