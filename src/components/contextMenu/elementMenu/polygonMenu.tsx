/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { CommonStoreState, useStore } from '../../../stores/common';
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
import PolygonOpacityInput from './polygonOpacityInput';

export const PolygonMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
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
  const [opacityDialogVisible, setOpacityDialogVisible] = useState(false);
  const [solarPanelLayoutWizardVisible, setSolarPanelLayoutWizardVisible] = useState(false);
  const [solarPanelLayoutGaWizardVisible, setSolarPanelLayoutGaWizardVisible] = useState(false);
  const [solarPanelLayoutPsoWizardVisible, setSolarPanelLayoutPsoWizardVisible] = useState(false);
  const lang = { lng: language };

  // be sure to get the updated parent so that this memorized element can move with it
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === polygon?.parentId) {
        return e;
      }
    }
  });

  if (!polygon || !parent) return null;

  const editable = !polygon?.locked;

  const updatePolygonFilledById = (id: string, filled: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).filled = filled;
          break;
        }
      }
    });
  };

  const updatePolygonNoOutlineById = (id: string, noOutline: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).noOutline = noOutline;
          break;
        }
      }
    });
  };

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

  const togglePolygonNoOutline = (e: CheckboxChangeEvent) => {
    if (polygon) {
      const undoableCheck = {
        name: 'No Outline for Polygon',
        timestamp: Date.now(),
        checked: !polygon.noOutline,
        selectedElementId: polygon.id,
        selectedElementType: ObjectType.Polygon,
        undo: () => {
          updatePolygonNoOutlineById(polygon.id, !undoableCheck.checked);
        },
        redo: () => {
          updatePolygonNoOutlineById(polygon.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updatePolygonNoOutlineById(polygon.id, e.target.checked);
    }
  };

  const setFontSize = (fontSize: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === polygon.id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontSize = fontSize;
          }
          break;
        }
      }
    });
  };

  const setFontColor = (fontColor: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === polygon.id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontColor = fontColor;
          }
          break;
        }
      }
    });
  };

  const setText = (text: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === polygon.id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).text = text;
          }
          break;
        }
      }
    });
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
      {(parent?.type === ObjectType.Foundation || parent?.type === ObjectType.Cuboid) && (
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
      )}
      <Lock keyName={'polygon-lock'} />
      {editable && (
        <Menu.Item key={'polygon-filled'}>
          <Checkbox checked={!!polygon?.filled} onChange={togglePolygonFilled}>
            {i18n.t('polygonMenu.Filled', lang)}
          </Checkbox>
        </Menu.Item>
      )}
      {editable && (
        <Menu.Item key={'polygon-no-outline'}>
          <Checkbox checked={!!polygon?.noOutline} onChange={togglePolygonNoOutline}>
            {i18n.t('polygonMenu.NoOutline', lang)}
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
      {editable && polygon.filled && (!polygon.textureType || polygon.textureType === PolygonTexture.NoTexture) && (
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
      {editable && polygon.filled && (
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
      {editable && polygon.filled && (
        <>
          {opacityDialogVisible && <PolygonOpacityInput setDialogVisible={setOpacityDialogVisible} />}
          <Menu.Item
            key={'polygon-opacity'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setOpacityDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.Opacity', lang)} ...
          </Menu.Item>
        </>
      )}

      {editable && (
        <SubMenu key={'polygon-text'} title={i18n.t('polygonMenu.TextBox', lang)} style={{ paddingLeft: '24px' }}>
          {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
          <Menu>
            {/* text */}
            <Menu.Item key={'polygon-text'} style={{ paddingLeft: '36px', marginTop: 10 }}>
              <Input
                addonBefore={i18n.t('word.Text', lang) + ':'}
                value={polygon.text}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
                // onPressEnter={updateLabelText}
                // onBlur={updateLabelText}
              />
            </Menu.Item>
            {/* font size */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'polygon-font-size'}>
              <InputNumber
                addonBefore={i18n.t('word.FontSize', lang) + ':'}
                min={10}
                max={100}
                step={1}
                precision={0}
                value={polygon.fontSize ?? 5}
                onChange={(value) => setFontSize(value)}
              />
            </Menu.Item>
            {/* font color */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'polygon-font-color'}>
              <Input
                addonBefore={i18n.t('word.FontColor', lang) + ':'}
                value={polygon.fontColor ?? 'black'}
                onChange={(e) => setFontColor(e.target.value)}
              />
            </Menu.Item>
          </Menu>
        </SubMenu>
      )}
    </Menu.ItemGroup>
  );
});
