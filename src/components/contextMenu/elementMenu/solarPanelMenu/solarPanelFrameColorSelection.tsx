/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { SolarPanelModel } from '../../../../models/SolarPanelModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { CompactPicker } from 'react-color';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const SolarPanelFrameColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const solarPanel = useSelectedElement(ObjectType.SolarPanel) as SolarPanelModel | undefined;

  const [selectedColor, setSelectedColor] = useState<string>(solarPanel?.frameColor ?? 'white');

  const lang = useLanguage();

  const updateSolarPanelFrameColorById = (id: string, frameColor: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
          (e as SolarPanelModel).frameColor = frameColor;
          break;
        }
      }
    });
  };

  const updateSolarPanelFrameColorAboveFoundation = (foundationId: string, frameColor: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          (e as SolarPanelModel).frameColor = frameColor;
        }
      }
    });
  };

  const updateSolarPanelFrameColorOnSurface = (parentId: string, normal: number[] | undefined, frameColor: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          let found;
          if (normal) {
            found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
          } else {
            found = e.parentId === parentId;
          }
          if (found) {
            (e as SolarPanelModel).frameColor = frameColor;
          }
        }
      }
    });
  };

  const updateSolarPanelFrameColorForAll = (frameColor: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          (e as SolarPanelModel).frameColor = frameColor;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, string>, value: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked && map.has(e.id)) {
          (e as SolarPanelModel).frameColor = value;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (frameColor: string) => {
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const sp = e as SolarPanelModel;
            if (sp.frameColor !== frameColor) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.frameColor !== frameColor) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.frameColor !== frameColor) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(solarPanel);
        if (parent) {
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const e of elements) {
              if (
                e.type === ObjectType.SolarPanel &&
                e.parentId === solarPanel.parentId &&
                Util.isIdentical(e.normal, solarPanel.normal) &&
                !e.locked
              ) {
                const sp = e as SolarPanelModel;
                if (sp.frameColor !== frameColor) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (sp.frameColor !== frameColor) {
                  return true;
                }
              }
            }
          }
        }
        break;
      }
      default: {
        if (solarPanel?.frameColor !== frameColor) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const setFrameColor = (value: string) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldFrameColorsSelected = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldFrameColorsSelected.set(elem.id, (elem as SolarPanelModel).frameColor ?? 'white');
          }
        }
        const undoableChangeSelected = {
          name: 'Set Frame Color for Selected Solar Panels',
          timestamp: Date.now(),
          oldValues: oldFrameColorsSelected,
          newValue: value,
          undo: () => {
            for (const [id, fc] of undoableChangeSelected.oldValues.entries()) {
              updateSolarPanelFrameColorById(id, fc as string);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, string>,
              undoableChangeSelected.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldFrameColorsSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldFrameColorsAll = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldFrameColorsAll.set(elem.id, (elem as SolarPanelModel).frameColor ?? 'white');
          }
        }
        const undoableChangeAll = {
          name: 'Set Frame Color for All Solar Panels',
          timestamp: Date.now(),
          oldValues: oldFrameColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, fc] of undoableChangeAll.oldValues.entries()) {
              updateSolarPanelFrameColorById(id, fc as string);
            }
          },
          redo: () => {
            updateSolarPanelFrameColorForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateSolarPanelFrameColorForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (solarPanel.foundationId) {
          const oldFrameColorsAboveFoundation = new Map<string, string>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldFrameColorsAboveFoundation.set(elem.id, (elem as SolarPanelModel).frameColor ?? 'white');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Frame Color for All Solar Panels Above Foundation',
            timestamp: Date.now(),
            oldValues: oldFrameColorsAboveFoundation,
            newValue: value,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, fc] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateSolarPanelFrameColorById(id, fc as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateSolarPanelFrameColorAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateSolarPanelFrameColorAboveFoundation(solarPanel.foundationId, value as string);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(solarPanel);
        if (parent) {
          const oldFrameColorsOnSurface = new Map<string, string>();
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarPanel &&
                elem.parentId === solarPanel.parentId &&
                Util.isIdentical(elem.normal, solarPanel.normal)
              ) {
                oldFrameColorsOnSurface.set(elem.id, (elem as SolarPanelModel).frameColor ?? 'white');
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                oldFrameColorsOnSurface.set(elem.id, (elem as SolarPanelModel).frameColor ?? 'white');
              }
            }
          }
          const normal = isParentCuboid ? solarPanel.normal : undefined;
          const undoableChangeOnSurface = {
            name: 'Set Frame Color for All Solar Panels on Surface',
            timestamp: Date.now(),
            oldValues: oldFrameColorsOnSurface,
            newValue: value,
            groupId: solarPanel.parentId,
            normal: normal,
            undo: () => {
              for (const [id, fc] of undoableChangeOnSurface.oldValues.entries()) {
                updateSolarPanelFrameColorById(id, fc as string);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateSolarPanelFrameColorOnSurface(
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateSolarPanelFrameColorOnSurface(solarPanel.parentId, normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id) as SolarPanelModel;
        const oldFrameColor = sp ? sp.frameColor : solarPanel.frameColor;
        const undoableChange = {
          name: 'Set Frame Color of Selected Solar Panel',
          timestamp: Date.now(),
          oldValue: oldFrameColor,
          newValue: value,
          changedElementId: solarPanel.id,
          changedElementType: solarPanel.type,
          undo: () => {
            updateSolarPanelFrameColorById(solarPanel.id, undoableChange.oldValue as string);
          },
          redo: () => {
            updateSolarPanelFrameColorById(solarPanel.id, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateSolarPanelFrameColorById(solarPanel.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.solarPanelFrameColor = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setFrameColor(selectedColor);
  };

  return (
    <Dialog width={680} title={i18n.t('solarPanelMenu.FrameColor', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={10}>
          <CompactPicker
            color={selectedColor ?? solarPanel?.color ?? 'white'}
            onChangeComplete={(colorResult) => {
              setSelectedColor(colorResult.hex);
            }}
          />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={14}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('solarPanelMenu.OnlyThisSolarPanel', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeOnSurface}>
                {i18n.t('solarPanelMenu.AllSolarPanelsOnSurface', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('solarPanelMenu.AllSolarPanelsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('solarPanelMenu.AllSelectedSolarPanels', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('solarPanelMenu.AllSolarPanels', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default SolarPanelFrameColorSelection;
